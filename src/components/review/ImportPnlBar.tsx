import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet, Upload, ClipboardPaste, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import {
  AccountMappingModal,
  AccountMapping,
  ParsedAccount,
  PFCategory,
} from "./AccountMappingModal";

interface ImportedData {
  revenue: number | null;
  netProfit: number | null;
  cogs: number | null;
  expenses: number | null;
  ownerPay: number | null;
  taxPaid?: number | null;
}

interface ImportPnlBarProps {
  reviewId: string;
  clientId: string;
  onImport: (data: ImportedData) => void;
}

interface CategoryDefault {
  keyword: string;
  pl_category: string | null;
  pf_category: PFCategory;
  priority: number;
}

// Keywords that commonly need manual review (may contain owner compensation)
const REVIEW_FLAG_KEYWORDS = [
  "professional fee",
  "contractor",
  "consultant",
  "distribution",
  "1099",
  "management fee",
  "advisory",
];

// Helper to extract number from a string
const extractNumber = (text: string): number | null => {
  const match = text.match(/\(?\$?\s*([\d,]+\.?\d*)\)?/);
  if (match) {
    const numStr = match[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    if (text.includes("(") && text.includes(")")) {
      return -num;
    }
    return num;
  }
  return null;
};

// Detection function using cached defaults from database
function detectPFCategory(
  accountName: string,
  defaults: CategoryDefault[]
): { category: PFCategory; confidence: "high" | "low"; needsReview?: string } {
  const name = accountName.toLowerCase();

  // Check against keywords in priority order (already sorted by priority DESC)
  for (const def of defaults) {
    if (name.includes(def.keyword.toLowerCase())) {
      // High priority (90+) = high confidence
      const confidence = def.priority >= 90 ? "high" : "low";
      
      // Check if this needs special review flagging
      let needsReview: string | undefined;
      if (def.pf_category !== "owner_pay") {
        for (const flagKeyword of REVIEW_FLAG_KEYWORDS) {
          if (name.includes(flagKeyword)) {
            needsReview = "This may contain owner compensation - please verify";
            break;
          }
        }
      }
      
      return { category: def.pf_category, confidence, needsReview };
    }
  }

  // Check for review flag keywords even if no match found
  let needsReview: string | undefined;
  for (const flagKeyword of REVIEW_FLAG_KEYWORDS) {
    if (name.includes(flagKeyword)) {
      needsReview = "This may contain owner compensation - please verify";
      break;
    }
  }

  // Default to opex if no match
  return { category: "opex", confidence: "low", needsReview };
}

// Parse line items from CSV/text
function parseLineItems(text: string, defaults: CategoryDefault[]): ParsedAccount[] {
  const accounts: ParsedAccount[] = [];
  const lines = text.split("\n");
  const isCSV = lines.some((line) => line.split(",").length > 3);

  let currentParent: string | undefined;
  let sortOrder = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    let accountName: string;
    let amount: number | null = null;

    if (isCSV) {
      const cells = line.split(",");
      accountName = cells[0]?.trim() || "";
      for (let i = cells.length - 1; i >= 1; i--) {
        const cell = cells[i].trim();
        if (cell) {
          amount = extractNumber(cell);
          if (amount !== null) break;
        }
      }
    } else {
      const parts = line.split(/[:\t]+/);
      accountName = parts[0]?.trim() || "";
      if (parts.length > 1) {
        amount = extractNumber(parts.slice(1).join(""));
      }
    }

    if (!accountName) continue;

    const isHeader = amount === null && !accountName.toLowerCase().startsWith("total");
    const isSubtotal = accountName.toLowerCase().startsWith("total ");

    if (isHeader) {
      currentParent = accountName;
      continue;
    }

    if (isSubtotal) {
      currentParent = undefined;
      continue;
    }

    if (amount !== null) {
      const detection = detectPFCategory(accountName, defaults);
      accounts.push({
        accountName,
        amount,
        parentAccount: currentParent,
        suggestedCategory: detection.category,
        confidence: detection.confidence,
        needsReview: detection.needsReview,
        sortOrder: sortOrder++,
      });
    }
  }

  return accounts;
}

// Parse line items from Excel workbook
function parseLineItemsFromWorkbook(workbook: XLSX.WorkBook, defaults: CategoryDefault[]): ParsedAccount[] {
  const accounts: ParsedAccount[] = [];
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  const data: unknown[][] = rawData as unknown[][];

  if (data.length === 0) return accounts;

  let totalColIndex = -1;
  let headerRowIndex = -1;

  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    for (let j = row.length - 1; j >= 0; j--) {
      const cell = String(row[j] || "").toLowerCase().trim();
      if (cell === "total" || cell === "ytd" || cell === "year to date" || cell === "ytd total") {
        totalColIndex = j;
        headerRowIndex = i;
        break;
      }
    }
    if (totalColIndex >= 0) break;
  }

  if (totalColIndex === -1) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      for (let j = row.length - 1; j >= 0; j--) {
        const cell = row[j];
        if (cell !== undefined && cell !== null && cell !== "") {
          const num = extractNumber(String(cell));
          if (num !== null) {
            totalColIndex = j;
            break;
          }
        }
      }
      if (totalColIndex >= 0) break;
    }
  }

  let currentParent: string | undefined;
  let sortOrder = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const label = String(row[0] || "").trim();
    if (!label) continue;

    let value: number | null = null;
    if (totalColIndex >= 0 && row[totalColIndex] !== undefined) {
      value = extractNumber(String(row[totalColIndex]));
    }
    if (value === null) {
      for (let j = row.length - 1; j >= 1; j--) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== "") {
          value = extractNumber(String(row[j]));
          if (value !== null) break;
        }
      }
    }

    const isHeader = value === null && !label.toLowerCase().startsWith("total");
    const isSubtotal = label.toLowerCase().startsWith("total ");

    if (isHeader) {
      currentParent = label;
      continue;
    }

    if (isSubtotal) {
      currentParent = undefined;
      continue;
    }

    if (value !== null) {
      const detection = detectPFCategory(label, defaults);
      accounts.push({
        accountName: label,
        amount: value,
        parentAccount: currentParent,
        suggestedCategory: detection.category,
        confidence: detection.confidence,
        needsReview: detection.needsReview,
        sortOrder: sortOrder++,
      });
    }
  }

  if (accounts.length === 0) {
    const csvText = XLSX.utils.sheet_to_csv(firstSheet);
    return parseLineItems(csvText, defaults);
  }

  return accounts;
}

// Calculate totals from mappings using new categories
function calculateTotalsFromMappings(mappings: AccountMapping[]): ImportedData {
  const totals = {
    gross_revenue: 0,
    materials_subs: 0,
    owner_pay: 0,
    tax: 0,
    opex: 0,
    exclude: 0,
  };

  mappings.forEach((mapping) => {
    if (mapping.pfCategory === "exclude") {
      totals.exclude += mapping.amount;
      return;
    }
    totals[mapping.pfCategory] += mapping.amount;
  });

  const realRevenue = totals.gross_revenue - Math.abs(totals.materials_subs);

  const result: ImportedData = {
    revenue: totals.gross_revenue,
    cogs: Math.abs(totals.materials_subs),
    ownerPay: Math.abs(totals.owner_pay),
    taxPaid: Math.abs(totals.tax),
    expenses: Math.abs(totals.opex) + Math.abs(totals.materials_subs) + Math.abs(totals.owner_pay) + Math.abs(totals.tax),
    netProfit: realRevenue - Math.abs(totals.opex) - Math.abs(totals.owner_pay) - Math.abs(totals.tax),
  };

  return result;
}

export const ImportPnlBar = ({ reviewId, clientId, onImport }: ImportPnlBarProps) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccount[]>([]);
  const [previousMappings, setPreviousMappings] = useState<Map<string, PFCategory>>(new Map());
  const [categoryDefaults, setCategoryDefaults] = useState<CategoryDefault[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load category defaults from database
  const loadCategoryDefaults = async (): Promise<CategoryDefault[]> => {
    if (categoryDefaults.length > 0) {
      return categoryDefaults;
    }

    setIsLoadingDefaults(true);
    try {
      const { data, error } = await supabase
        .from("pf_category_defaults")
        .select("keyword, pl_category, pf_category, priority")
        .order("priority", { ascending: false });

      if (error) {
        console.error("Error loading category defaults:", error);
        return [];
      }

      const defaults = (data || []) as CategoryDefault[];
      setCategoryDefaults(defaults);
      return defaults;
    } catch (err) {
      console.error("Error loading category defaults:", err);
      return [];
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  // Load previous mappings for this client
  useEffect(() => {
    const loadPreviousMappings = async () => {
      if (!clientId) return;

      try {
        const { data, error } = await supabase
          .from("client_account_defaults")
          .select("account_name, pf_category")
          .eq("client_id", clientId);

        if (error) {
          console.error("Error loading previous mappings:", error);
          return;
        }

        if (data && data.length > 0) {
          const map = new Map<string, PFCategory>();
          data.forEach((row) => {
            map.set(row.account_name, row.pf_category as PFCategory);
          });
          setPreviousMappings(map);
        }
      } catch (err) {
        console.error("Error loading previous mappings:", err);
      }
    };

    loadPreviousMappings();
  }, [clientId]);

  const handleParsePastedData = async () => {
    if (!pastedText.trim()) {
      toast({
        title: "Error",
        description: "Please paste some P&L data first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Load defaults from database
      const defaults = await loadCategoryDefaults();
      const accounts = parseLineItems(pastedText, defaults);

      if (accounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find any line items. Please check the format.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setParsedAccounts(accounts);
      setShowPasteModal(false);
      setShowMappingModal(true);

      const lowConfidence = accounts.filter((a) => a.confidence === "low").length;
      const needsReview = accounts.filter((a) => a.needsReview).length;
      
      let description = "Review the category mappings below";
      if (needsReview > 0) {
        description = `${needsReview} accounts flagged for review`;
      } else if (lowConfidence > 0) {
        description = `${lowConfidence} accounts need your attention`;
      }
      
      toast({
        title: `Found ${accounts.length} accounts`,
        description,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse P&L data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Load defaults from database first
      const defaults = await loadCategoryDefaults();
      
      const extension = file.name.split(".").pop()?.toLowerCase();
      let accounts: ParsedAccount[];

      if (extension === "xlsx" || extension === "xls") {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        accounts = parseLineItemsFromWorkbook(workbook, defaults);
      } else {
        const text = await file.text();
        accounts = parseLineItems(text, defaults);
      }

      if (accounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find any line items. Please check the file format.",
          variant: "destructive",
        });
        return;
      }

      setParsedAccounts(accounts);
      setShowMappingModal(true);

      const lowConfidence = accounts.filter((a) => a.confidence === "low").length;
      const needsReview = accounts.filter((a) => a.needsReview).length;
      
      let description = "Review the category mappings below";
      if (needsReview > 0) {
        description = `${needsReview} accounts flagged for review`;
      } else if (lowConfidence > 0) {
        description = `${lowConfidence} accounts need your attention`;
      }
      
      toast({
        title: `Found ${accounts.length} accounts`,
        description,
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyMappings = async (mappings: AccountMapping[]) => {
    setIsSavingMappings(true);

    try {
      // Delete existing mappings for this review
      await supabase
        .from("review_account_mappings")
        .delete()
        .eq("review_id", reviewId);

      // Insert new mappings
      const insertData = mappings.map((m) => ({
        review_id: reviewId,
        account_name: m.accountName,
        amount: m.amount,
        pf_category: m.pfCategory,
        parent_account: m.parentAccount || null,
        sort_order: m.sortOrder,
      }));

      const { error: insertError } = await supabase
        .from("review_account_mappings")
        .insert(insertData);

      if (insertError) {
        console.error("Error saving mappings:", insertError);
      }

      // Save modified mappings to client defaults for future imports
      const modifiedMappings = mappings.filter((m) => m.wasModified);
      if (modifiedMappings.length > 0 && clientId) {
        for (const mapping of modifiedMappings) {
          await supabase
            .from("client_account_defaults")
            .upsert(
              {
                client_id: clientId,
                account_name: mapping.accountName,
                pf_category: mapping.pfCategory,
              },
              { onConflict: "client_id,account_name" }
            );
        }
      }

      // Calculate totals from mappings
      const data = calculateTotalsFromMappings(mappings);

      // Build success message
      const found: string[] = [];
      if (data.revenue) found.push(`Revenue ${formatCurrency(data.revenue)}`);
      if (data.cogs) found.push(`COGS ${formatCurrency(data.cogs)}`);
      if (data.ownerPay) found.push(`Owner Pay ${formatCurrency(data.ownerPay)}`);
      if (data.taxPaid) found.push(`Tax ${formatCurrency(data.taxPaid)}`);

      onImport(data);
      setShowMappingModal(false);
      setParsedAccounts([]);
      setPastedText("");

      toast({
        title: "✓ Imported from mapped accounts",
        description: found.join(", "),
      });
    } catch (error) {
      console.error("Error applying mappings:", error);
      toast({
        title: "Error",
        description: "Failed to apply mappings",
        variant: "destructive",
      });
    } finally {
      setIsSavingMappings(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <div className="bg-[#f0f9ff] border-l-4 border-blue-500 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-slate-700">Import from P&L</span>
          {previousMappings.size > 0 && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {previousMappings.size} remembered
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
            onClick={() => setShowPasteModal(true)}
          >
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isLoadingDefaults}
          >
            {isProcessing || isLoadingDefaults ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Paste Modal */}
      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import P&L Data</DialogTitle>
            <DialogDescription>
              Paste your P&L report text below. We'll extract the line items and
              let you map them to Profit First categories.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your P&L report here...

Example:
Total Income: $450,000
Cost of Goods Sold: $120,000
Owner's Pay: $85,000
Payroll Taxes: $12,000
Rent: $24,000
Utilities: $6,000
Net Income: $85,000"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: QuickBooks P&L, Excel exports, CSV
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleParsePastedData} disabled={isProcessing || isLoadingDefaults}>
              {isProcessing || isLoadingDefaults ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLoadingDefaults ? "Loading..." : "Processing..."}
                </>
              ) : (
                "Parse & Map Accounts"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Mapping Modal */}
      <AccountMappingModal
        open={showMappingModal}
        onOpenChange={setShowMappingModal}
        accounts={parsedAccounts}
        onApply={handleApplyMappings}
        isProcessing={isSavingMappings}
        previousMappings={previousMappings}
      />
    </>
  );
};
