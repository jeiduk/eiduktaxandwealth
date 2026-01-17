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

// Patterns to exclude total/subtotal rows to avoid double-counting
const EXCLUDE_TOTAL_PATTERNS = [
  /^total/i,
  /^subtotal/i,
  /^net income/i,
  /^net profit/i,
  /^net loss/i,
  /^gross profit/i,
  /^gross margin/i,
  /^operating income/i,
  /^operating expense total/i,
  /^ebitda/i,
  /^ebit/i,
  /total income/i,
  /total expense/i,
  /total cost/i,
  /total revenue/i,
  /total cogs/i,
  /net ordinary income/i,
];

// Patterns to skip header/metadata rows
const SKIP_METADATA_PATTERNS = [
  /^["']?[A-Za-z\s]+→/,           // "Client Name →" pattern
  /january|february|march|april|may|june|july|august|september|october|november|december/i,  // Date ranges
  /^\d{4}$/,                       // Just a year
  /^Q[1-4]\s*\d{4}/i,             // Quarter labels like "Q1 2025"
  /profit\s*(and|&)\s*loss/i,     // Report title
  /balance sheet/i,
  /^date$/i,
  /^period$/i,
  /^report$/i,
  /^prepared/i,
  /^as of/i,
  /^page\s*\d/i,                  // Page numbers
  /^accrual basis/i,              // Accounting method
  /^cash basis/i,
  /^\s*$|^[-=]+$/,                // Empty or separator lines
];

// Check if an account name is a total/subtotal row
function isTotalRow(accountName: string): boolean {
  const trimmed = accountName.trim();
  return EXCLUDE_TOTAL_PATTERNS.some(pattern => pattern.test(trimmed));
}

// Check if a row is metadata/header that should be skipped
function isMetadataRow(text: string): boolean {
  if (!text || text.trim().length < 2) return true;
  const trimmed = text.trim();
  return SKIP_METADATA_PATTERNS.some(pattern => pattern.test(trimmed));
}

// Check for duplicate accounts and merge or flag them
function deduplicateAccounts(accounts: ParsedAccount[]): { 
  unique: ParsedAccount[]; 
  duplicates: ParsedAccount[] 
} {
  const seen = new Map<string, ParsedAccount>();
  const duplicates: ParsedAccount[] = [];
  
  for (const account of accounts) {
    const key = `${account.accountName.toLowerCase().trim()}|${account.amount}`;
    if (seen.has(key)) {
      duplicates.push(account);
    } else {
      seen.set(key, account);
    }
  }
  
  return { unique: Array.from(seen.values()), duplicates };
}

// Amount column detection types
type AmountColumnConfig = {
  type: 'total' | 'sum_months' | 'single' | 'last_numeric';
  columns: number[];
  description: string;
};

// Month patterns for detecting month columns
const MONTH_PATTERNS = [
  /^jan/i, /^feb/i, /^mar/i, /^apr/i, /^may/i, /^jun/i,
  /^jul/i, /^aug/i, /^sep/i, /^oct/i, /^nov/i, /^dec/i
];

// Find the account name column in headers
function findAccountColumn(headers: string[]): number {
  const headerLower = headers.map(h => String(h || "").toLowerCase().trim());
  
  // Look for explicit account/name column
  const accountIndex = headerLower.findIndex(h => 
    h === 'account' || h === 'description' || h === 'name' || 
    h === 'category' || h === 'account name' || h === 'line item' ||
    h === 'expense' || h === 'income'
  );
  
  if (accountIndex !== -1) return accountIndex;
  
  // Default to first column
  return 0;
}

// Find the amount column(s) based on header analysis
function findAmountColumn(headers: string[]): AmountColumnConfig {
  const headerLower = headers.map(h => String(h || "").toLowerCase().trim());
  
  // Priority 1: Look for Total/YTD/Annual column
  const totalIndex = headerLower.findIndex(h => 
    h === 'total' || h === 'ytd' || h === 'annual' || 
    h === 'year total' || h === 'ytd total' || h === 'year to date' ||
    h === 'ytd amount' || h === 'total amount'
  );
  
  if (totalIndex !== -1) {
    return { 
      type: 'total', 
      columns: [totalIndex],
      description: `Using '${headers[totalIndex]}' column for amounts`
    };
  }
  
  // Priority 2: Look for month columns and sum them
  const monthColumns: number[] = [];
  headers.forEach((h, i) => {
    const headerStr = String(h || "").trim();
    if (MONTH_PATTERNS.some(p => p.test(headerStr))) {
      monthColumns.push(i);
    }
  });
  
  if (monthColumns.length > 0) {
    const monthCount = monthColumns.length;
    return { 
      type: 'sum_months', 
      columns: monthColumns,
      description: `Summing ${monthCount} month column${monthCount > 1 ? 's' : ''}`
    };
  }
  
  // Priority 3: Look for single Amount/Balance column
  const amountIndex = headerLower.findIndex(h => 
    h === 'amount' || h === 'balance' || h === 'value' || 
    h === 'debit' || h === 'credit' || h === 'net'
  );
  
  if (amountIndex !== -1) {
    return { 
      type: 'single', 
      columns: [amountIndex],
      description: `Using '${headers[amountIndex]}' column`
    };
  }
  
  // Default: use last column (often the total in reports)
  return { 
    type: 'last_numeric', 
    columns: [headers.length - 1],
    description: 'Using last column for amounts'
  };
}

// Get amount from a row based on the column config
function getAmountFromRow(row: unknown[], config: AmountColumnConfig): number | null {
  if (config.type === 'sum_months') {
    // Sum all month columns
    let sum = 0;
    let hasValue = false;
    for (const colIndex of config.columns) {
      const cellValue = row[colIndex];
      if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
        const num = extractNumber(String(cellValue));
        if (num !== null) {
          sum += num;
          hasValue = true;
        }
      }
    }
    return hasValue ? sum : null;
  }
  
  // For total, single, or last_numeric - use the specified column
  const colIndex = config.columns[0];
  const cellValue = row[colIndex];
  if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
    return extractNumber(String(cellValue));
  }
  
  return null;
}

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
    
    // Skip metadata/header rows (client name, dates, report titles)
    if (isMetadataRow(accountName)) continue;

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

// Result type for parsing with metadata
interface ParseResult {
  accounts: ParsedAccount[];
  amountColumnDescription: string;
}

// Parse line items from Excel workbook with smart column detection
function parseLineItemsFromWorkbook(workbook: XLSX.WorkBook, defaults: CategoryDefault[]): ParseResult {
  const accounts: ParsedAccount[] = [];
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  const data: unknown[][] = rawData as unknown[][];

  if (data.length === 0) return { accounts, amountColumnDescription: '' };

  // Find header row (first row with column-like content)
  let headerRowIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const rowStrings = row.map(cell => String(cell || "").trim());
    const headerLower = rowStrings.map(s => s.toLowerCase());
    
    // Check if this looks like a header row (has Total/YTD, months, or Amount column)
    const hasTotal = headerLower.some(h => 
      h === 'total' || h === 'ytd' || h === 'annual' || 
      h === 'year total' || h === 'ytd total' || h === 'year to date'
    );
    const hasMonths = headerLower.some(h => MONTH_PATTERNS.some(p => p.test(h)));
    const hasAmountCol = headerLower.some(h => 
      h === 'amount' || h === 'balance' || h === 'value' ||
      h === 'account' || h === 'description'
    );
    
    if (hasTotal || hasMonths || hasAmountCol) {
      headerRowIndex = i;
      headers = rowStrings;
      break;
    }
  }
  
  // If no header found, try to detect from first data rows
  if (headerRowIndex === -1) {
    // Use first row as potential header or just start from row 0
    headerRowIndex = 0;
    headers = data[0]?.map(cell => String(cell || "")) || [];
  }
  
  // Detect column configuration
  const accountColIndex = findAccountColumn(headers);
  const amountConfig = findAmountColumn(headers);
  
  let currentParent: string | undefined;
  let sortOrder = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const label = String(row[accountColIndex] || "").trim();
    if (!label) continue;
    
    // Skip metadata/header rows (client name, dates, report titles)
    if (isMetadataRow(label)) continue;

    // Get amount using the detected column config
    let value = getAmountFromRow(row, amountConfig);
    
    // Fallback: if no value from config, try last numeric column
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
    const csvAccounts = parseLineItems(csvText, defaults);
    return { accounts: csvAccounts, amountColumnDescription: 'Parsed as CSV' };
  }

  return { accounts, amountColumnDescription: amountConfig.description };
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
  const [excludedAccounts, setExcludedAccounts] = useState<ParsedAccount[]>([]);
  const [duplicateAccounts, setDuplicateAccounts] = useState<ParsedAccount[]>([]);
  const [amountColumnDescription, setAmountColumnDescription] = useState("");
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
      const allAccounts = parseLineItems(pastedText, defaults);

      if (allAccounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find any line items. Please check the format.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Filter out total/subtotal rows to avoid double-counting
      const lineItems = allAccounts.filter(acc => !isTotalRow(acc.accountName));
      const excluded = allAccounts.filter(acc => isTotalRow(acc.accountName));
      
      // Deduplicate accounts with same name and amount
      const { unique, duplicates } = deduplicateAccounts(lineItems);

      setParsedAccounts(unique);
      setExcludedAccounts(excluded);
      setDuplicateAccounts(duplicates);
      setShowPasteModal(false);
      setShowMappingModal(true);

      const lowConfidence = unique.filter((a) => a.confidence === "low").length;
      const needsReview = unique.filter((a) => a.needsReview).length;
      
      let description = "Review the category mappings below";
      const notes: string[] = [];
      if (excluded.length > 0) notes.push(`${excluded.length} totals excluded`);
      if (duplicates.length > 0) notes.push(`${duplicates.length} duplicates merged`);
      if (needsReview > 0) notes.push(`${needsReview} flagged for review`);
      else if (lowConfidence > 0) notes.push(`${lowConfidence} need attention`);
      if (notes.length > 0) description = notes.join(", ");
      
      toast({
        title: `Found ${unique.length} line items`,
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
      let allAccounts: ParsedAccount[];
      let columnDescription = "";

      if (extension === "xlsx" || extension === "xls") {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const result = parseLineItemsFromWorkbook(workbook, defaults);
        allAccounts = result.accounts;
        columnDescription = result.amountColumnDescription;
      } else {
        const text = await file.text();
        allAccounts = parseLineItems(text, defaults);
        columnDescription = "Parsed as text/CSV";
      }

      if (allAccounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find any line items. Please check the file format.",
          variant: "destructive",
        });
        return;
      }

      // Filter out total/subtotal rows to avoid double-counting
      const lineItems = allAccounts.filter(acc => !isTotalRow(acc.accountName));
      const excluded = allAccounts.filter(acc => isTotalRow(acc.accountName));
      
      // Deduplicate accounts with same name and amount
      const { unique, duplicates } = deduplicateAccounts(lineItems);

      setParsedAccounts(unique);
      setExcludedAccounts(excluded);
      setDuplicateAccounts(duplicates);
      setAmountColumnDescription(columnDescription);
      setShowMappingModal(true);

      const lowConfidence = unique.filter((a) => a.confidence === "low").length;
      const needsReview = unique.filter((a) => a.needsReview).length;
      
      let description = columnDescription || "Review the category mappings below";
      const notes: string[] = [];
      if (excluded.length > 0) notes.push(`${excluded.length} totals excluded`);
      if (duplicates.length > 0) notes.push(`${duplicates.length} duplicates merged`);
      if (needsReview > 0) notes.push(`${needsReview} flagged for review`);
      else if (lowConfidence > 0) notes.push(`${lowConfidence} need attention`);
      if (notes.length > 0) description = `${columnDescription}. ${notes.join(", ")}`;
      
      toast({
        title: `Found ${unique.length} line items`,
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
      setExcludedAccounts([]);
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
        excludedAccounts={excludedAccounts}
        duplicateAccounts={duplicateAccounts}
        amountColumnDescription={amountColumnDescription}
        onApply={handleApplyMappings}
        isProcessing={isSavingMappings}
        previousMappings={previousMappings}
      />
    </>
  );
};
