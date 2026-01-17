import { useState, useRef } from "react";
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
  suggestCategory,
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
  onImport: (data: ImportedData) => void;
}

// Helper to extract number from a string
const extractNumber = (text: string): number | null => {
  // Match numbers with optional $ and commas, including negative numbers in parentheses
  const match = text.match(/\(?\$?\s*([\d,]+\.?\d*)\)?/);
  if (match) {
    const numStr = match[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    // Check if it was a negative number in parentheses
    if (text.includes("(") && text.includes(")")) {
      return -num;
    }
    return num;
  }
  return null;
};

// Parse line items from CSV/text
function parseLineItems(text: string): ParsedAccount[] {
  const accounts: ParsedAccount[] = [];
  const lines = text.split("\n");

  // Detect if this is CSV format (has commas separating values)
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

      // Get the last numeric value (Total column)
      for (let i = cells.length - 1; i >= 1; i--) {
        const cell = cells[i].trim();
        if (cell) {
          amount = extractNumber(cell);
          if (amount !== null) break;
        }
      }
    } else {
      // Plain text format - look for patterns like "Account Name: $1,234"
      const parts = line.split(/[:\t]+/);
      accountName = parts[0]?.trim() || "";
      if (parts.length > 1) {
        amount = extractNumber(parts.slice(1).join(""));
      }
    }

    if (!accountName) continue;

    // Detect parent accounts (typically headers without amounts or with "Total" prefix)
    const isHeader = amount === null && !accountName.toLowerCase().startsWith("total");
    const isSubtotal = accountName.toLowerCase().startsWith("total ");

    if (isHeader) {
      currentParent = accountName;
      continue;
    }

    if (isSubtotal) {
      // Skip subtotals but clear parent
      currentParent = undefined;
      continue;
    }

    if (amount !== null) {
      accounts.push({
        accountName,
        amount,
        parentAccount: currentParent,
        suggestedCategory: suggestCategory(accountName, currentParent),
        sortOrder: sortOrder++,
      });
    }
  }

  return accounts;
}

// Parse line items from Excel workbook
function parseLineItemsFromWorkbook(workbook: XLSX.WorkBook): ParsedAccount[] {
  const accounts: ParsedAccount[] = [];
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  const data: unknown[][] = rawData as unknown[][];

  if (data.length === 0) return accounts;

  // Find header row and identify "Total" column (usually last numeric column)
  let totalColIndex = -1;
  let headerRowIndex = -1;

  // Look for header row (first row with text that looks like column headers)
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    // Check if this row has column headers like "Total", "YTD", month names, etc.
    for (let j = row.length - 1; j >= 0; j--) {
      const cell = String(row[j] || "").toLowerCase().trim();
      if (
        cell === "total" ||
        cell === "ytd" ||
        cell === "year to date" ||
        cell === "ytd total"
      ) {
        totalColIndex = j;
        headerRowIndex = i;
        break;
      }
    }
    if (totalColIndex >= 0) break;
  }

  // If no "Total" header found, use the last column as fallback
  if (totalColIndex === -1) {
    // Find the rightmost column with numeric data
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

  // Now scan rows for financial line items
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const label = String(row[0] || "").trim();
    if (!label) continue;

    // Get value from total column, or fallback to last non-empty cell
    let value: number | null = null;
    if (totalColIndex >= 0 && row[totalColIndex] !== undefined) {
      value = extractNumber(String(row[totalColIndex]));
    }
    if (value === null) {
      // Fallback: find last numeric value in the row
      for (let j = row.length - 1; j >= 1; j--) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== "") {
          value = extractNumber(String(row[j]));
          if (value !== null) break;
        }
      }
    }

    // Detect parent accounts (headers without amounts)
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
      accounts.push({
        accountName: label,
        amount: value,
        parentAccount: currentParent,
        suggestedCategory: suggestCategory(label, currentParent),
        sortOrder: sortOrder++,
      });
    }
  }

  // Fallback to CSV parsing if no accounts found
  if (accounts.length === 0) {
    const csvText = XLSX.utils.sheet_to_csv(firstSheet);
    return parseLineItems(csvText);
  }

  return accounts;
}

// Calculate totals from mappings
function calculateTotalsFromMappings(mappings: AccountMapping[]): ImportedData {
  const result: ImportedData = {
    revenue: 0,
    netProfit: null,
    cogs: 0,
    expenses: 0,
    ownerPay: 0,
    taxPaid: 0,
  };

  mappings.forEach((mapping) => {
    if (mapping.pfCategory === "exclude") return;

    switch (mapping.pfCategory) {
      case "revenue":
        result.revenue = (result.revenue || 0) + mapping.amount;
        break;
      case "cogs":
        result.cogs = (result.cogs || 0) + Math.abs(mapping.amount);
        break;
      case "owner_pay":
        result.ownerPay = (result.ownerPay || 0) + Math.abs(mapping.amount);
        break;
      case "tax":
        result.taxPaid = (result.taxPaid || 0) + Math.abs(mapping.amount);
        break;
      case "opex":
        result.expenses = (result.expenses || 0) + Math.abs(mapping.amount);
        break;
      case "profit":
        result.netProfit = (result.netProfit || 0) + mapping.amount;
        break;
    }
  });

  // Calculate net profit if not directly mapped
  // Net Profit = Revenue - COGS - OpEx - Owner Pay - Tax
  if (result.netProfit === null || result.netProfit === 0) {
    const revenue = result.revenue || 0;
    const cogs = result.cogs || 0;
    const expenses = result.expenses || 0;
    const ownerPay = result.ownerPay || 0;
    const tax = result.taxPaid || 0;
    result.netProfit = revenue - cogs - expenses - ownerPay - tax;
  }

  // Total expenses includes OpEx + Owner Pay + Tax (for the form)
  const totalExpenses =
    (result.expenses || 0) + (result.ownerPay || 0) + (result.taxPaid || 0);
  result.expenses = totalExpenses;

  return result;
}

export const ImportPnlBar = ({ reviewId, onImport }: ImportPnlBarProps) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccount[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParsePastedData = () => {
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
      const accounts = parseLineItems(pastedText);

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

      toast({
        title: `Found ${accounts.length} accounts`,
        description: "Review the category mappings below",
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let accounts: ParsedAccount[];

      if (extension === "xlsx" || extension === "xls") {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        accounts = parseLineItemsFromWorkbook(workbook);
      } else {
        // Handle text/csv files
        const text = await file.text();
        accounts = parseLineItems(text);
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

      toast({
        title: `Found ${accounts.length} accounts`,
        description: "Review the category mappings below",
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
      // Reset file input
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
        toast({
          title: "Warning",
          description: "Mappings applied but could not be saved for future reference",
          variant: "destructive",
        });
      }

      // Calculate totals from mappings
      const data = calculateTotalsFromMappings(mappings);

      // Build success message
      const found: string[] = [];
      if (data.revenue) found.push(`Revenue ${formatCurrency(data.revenue)}`);
      if (data.netProfit) found.push(`Net Profit ${formatCurrency(data.netProfit)}`);
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
            disabled={isProcessing}
          >
            {isProcessing ? (
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
            <Button onClick={handleParsePastedData} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
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
      />
    </>
  );
};
