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
  monthCount?: number | null;
  monthCountDetected?: number | null;
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
  /^net operating income/i,
  /^net other income/i,
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

// Clean account name by removing prefixes like "Client Name →"
function cleanAccountName(name: string): string {
  let cleaned = name.trim();
  
  // Remove everything before "→" if present (e.g., "Eatontown Elite Care Center → Patient Fees")
  if (cleaned.includes("→")) {
    const parts = cleaned.split("→");
    cleaned = parts[parts.length - 1].trim();
  }
  
  // Also handle ">" arrow variant
  if (cleaned.includes(">") && !cleaned.match(/[<>=]/g)?.length) {
    const parts = cleaned.split(">");
    if (parts.length === 2 && parts[0].length > 10) {
      // Only split if first part looks like a long prefix
      cleaned = parts[1].trim();
    }
  }
  
  return cleaned;
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
        const num = extractNumber(cellValue);
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
    return extractNumber(cellValue);
  }
  
  return null;
}

// Helper to parse amount from any value (handles commas, currency symbols, parentheses)
// Returns a detailed breakdown to support debugging.
type AmountParseSteps = {
  raw: unknown;
  cleaned: string;
  parsed: number | null;
  isNegativeParen: boolean;
};

function parseAmountSteps(value: unknown): AmountParseSteps {
  // If already a number, return it directly
  if (typeof value === "number") {
    return {
      raw: value,
      cleaned: String(value),
      parsed: Number.isFinite(value) ? value : null,
      isNegativeParen: false,
    };
  }

  if (value === null || value === undefined) {
    return { raw: value, cleaned: "", parsed: null, isNegativeParen: false };
  }

  let str = String(value).trim();
  if (!str) {
    return { raw: value, cleaned: "", parsed: null, isNegativeParen: false };
  }

  // Remove currency symbols and spaces
  str = str.replace(/[$€£¥]/g, "");
  str = str.replace(/\s+/g, "");

  // Handle parentheses as negative: (1,234) → -1234
  const isNegativeParen = str.startsWith("(") && str.endsWith(")");
  if (isNegativeParen) {
    str = str.slice(1, -1);
  }

  // Remove commas from numbers: 711,777 → 711777
  str = str.replace(/,/g, "");

  // Remove any remaining non-numeric characters except decimal point and minus
  str = str.replace(/[^0-9.\-]/g, "");

  // If we have no digits left, treat as non-numeric
  if (!/[0-9]/.test(str)) {
    return { raw: value, cleaned: str, parsed: null, isNegativeParen };
  }

  const num = parseFloat(str);
  if (Number.isNaN(num)) {
    return { raw: value, cleaned: str, parsed: null, isNegativeParen };
  }

  return { raw: value, cleaned: str, parsed: isNegativeParen ? -num : num, isNegativeParen };
}

function parseAmount(value: unknown): number {
  const steps = parseAmountSteps(value);
  return steps.parsed ?? 0;
}

function logAmountParse(label: string, rawValue: unknown, context: Record<string, unknown>) {
  const steps = parseAmountSteps(rawValue);
  console.groupCollapsed(`[P&L Import Debug] Amount parse: ${label}`);
  console.log("raw:", rawValue);
  console.log("cleaned:", steps.cleaned);
  console.log("parsed:", steps.parsed);
  console.log("context:", context);
  console.groupEnd();
  return steps;
}

const extractNumber = (value: unknown): number | null => {
  return parseAmountSteps(value).parsed;
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

// Parse a CSV line properly handling quoted fields
// "Patient Fees","711,777" → ["Patient Fees", "711,777"]
// Patient Fees,711,777 → ["Patient Fees", "711", "777"] then we merge numeric tails
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      // Start of quoted field
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // End of quoted field
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

// Check if a string looks like a pure numeric fragment (just digits, possibly with leading zeros)
function isNumericFragment(str: string): boolean {
  const trimmed = str.trim();
  // Match pure digits (possibly with leading/trailing spaces), like "777" or "000"
  return /^\d+$/.test(trimmed);
}

// Merge split numeric columns caused by commas inside numbers
// ["Patient Fees", "711", "777"] → ["Patient Fees", "711777"]
// ["Rent", "1", "234", "567"] → ["Rent", "1234567"]
function mergeNumericTails(cells: string[]): string[] {
  if (cells.length < 3) return cells;
  
  const result: string[] = [];
  let i = 0;
  
  while (i < cells.length) {
    const cell = cells[i];
    
    // Check if this starts a numeric sequence that got split
    // Look for pattern: starts with digit or $, followed by pure numeric fragments
    const looksLikeNumericStart = /^[$€£¥\s]*[\d(]/.test(cell.trim()) || 
                                   /^\(?\d/.test(cell.trim());
    
    if (looksLikeNumericStart && i + 1 < cells.length && isNumericFragment(cells[i + 1])) {
      // This looks like a split number, merge consecutive numeric fragments
      let merged = cell;
      let j = i + 1;
      
      while (j < cells.length && isNumericFragment(cells[j])) {
        merged += cells[j]; // No comma - they're actually part of the same number
        j++;
      }
      
      result.push(merged);
      i = j;
    } else {
      result.push(cell);
      i++;
    }
  }
  
  return result;
}

// Smart CSV line parser that handles both quoted fields and merges split numbers
function smartParseCSVLine(line: string, debugEnabled = false): string[] {
  // First, try proper CSV parsing (handles quoted fields)
  const parsed = parseCSVLine(line);
  
  // Then, detect and merge any numeric fragments that got split
  const merged = mergeNumericTails(parsed);
  
  if (debugEnabled && merged.length !== parsed.length) {
    console.log("[CSV Parser] Merged split numbers:", { original: parsed, merged });
  }
  
  return merged;
}

// Parse line items from CSV/text
function parseLineItems(
  text: string,
  defaults: CategoryDefault[],
  debugEnabled = false
): ParseResult {
  const accounts: ParsedAccount[] = [];
  const lines = text.split("\n");
  const isCSV = lines.some((line) => line.split(",").length > 3);

  // Debug preview (raw) – before any processing
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  const previewLines = nonEmptyLines.slice(0, 3);

  const parseRow = (line: string) =>
    isCSV ? smartParseCSVLine(line, debugEnabled) : line.split(/[:\t]+/);

  // Use smart CSV parsing that handles quoted fields and merges split numbers
  const previewSplitRows = previewLines.map(parseRow);
  const maxColumnsInPreview = previewSplitRows.reduce(
    (max, r) => Math.max(max, r.length),
    0
  );

  // Detect the header row and month columns by scanning the first chunk of non-empty rows.
  // This is necessary because many exports include report titles/date ranges above the real header.
  const headerScanLines = nonEmptyLines.slice(0, Math.min(nonEmptyLines.length, 60));
  const headerScanRows = headerScanLines.map(parseRow);

  let headerRowIndex = 0;
  let headerRow = previewSplitRows[0] || [];
  let monthColumnsDetected: number[] = [];
  let uniqueMonthCountDetected = 0;

  headerScanRows.forEach((row, idx) => {
    const monthCols: number[] = [];
    const uniqueMonths = new Set<number>();

    row.forEach((cell, colIdx) => {
      const headerStr = String(cell || "").trim();
      const monthIdx = MONTH_PATTERNS.findIndex((p) => p.test(headerStr));
      if (monthIdx !== -1) {
        monthCols.push(colIdx);
        uniqueMonths.add(monthIdx);
      }
    });

    const uniqueCount = uniqueMonths.size;

    // Tie-breaker: prefer rows that also include a Total/YTD column label
    const hasTotal = row.some((cell) => {
      const v = String(cell || "").toLowerCase().trim();
      return (
        v === "total" ||
        v === "ytd" ||
        v === "annual" ||
        v === "year total" ||
        v === "ytd total" ||
        v === "year to date"
      );
    });

    const isBetter =
      uniqueCount > uniqueMonthCountDetected ||
      (uniqueCount === uniqueMonthCountDetected && hasTotal && uniqueCount > 0);

    if (isBetter) {
      headerRowIndex = idx;
      headerRow = row;
      monthColumnsDetected = monthCols;
      uniqueMonthCountDetected = uniqueCount;
    }
  });

  const debug: PnlImportDebug = {
    source: "text",
    detectedHeaders: headerRow.map((c) => String(c ?? "").trim()),
    headerRowIndex,
    columnsInHeader: headerRow.length,
    maxColumnsInPreview,
    previewRows: previewSplitRows as unknown[][],
    csvPreview: isCSV
      ? {
          firstLines: previewLines,
          splitRows: previewSplitRows.map((r) => r.map((c) => String(c))),
        }
      : undefined,
  };

  let currentParent: string | undefined;
  let sortOrder = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    let rawAccountName: string;
    let amount: number | null = null;

    if (isCSV) {
      // Use smart CSV parsing
      const cells = smartParseCSVLine(line, debugEnabled);
      rawAccountName = cells[0]?.trim() || "";

      const isPatientFeesLine =
        debugEnabled && line.toLowerCase().includes("patient fees");

      if (isPatientFeesLine) {
        console.groupCollapsed("[P&L Import Debug] Patient Fees (CSV/text) raw row");
        console.log("raw line:", line);
        console.log("cells (after smart parse):", cells);
        console.log("cells.length:", cells.length);
        console.groupEnd();
        debug.patientFees = {
          rawRowIndex: -1,
          rawRow: cells,
          rawAccountCell: cells[0],
          cleanedAccount: cleanAccountName(String(cells[0] || "")),
          amountCells: {
            "last-non-empty":
              cells
                .slice(1)
                .reverse()
                .find((c) => String(c).trim().length > 0) ?? null,
          },
          amountParse: undefined,
        };
      }

      for (let i = cells.length - 1; i >= 1; i--) {
        const cell = cells[i].trim();
        if (cell) {
          const parsed = extractNumber(cell);
          if (isPatientFeesLine) {
            logAmountParse("CSV candidate cell", cell, {
              cellIndex: i,
              rawAccountName,
            });
          }
          amount = parsed;
          if (amount !== null) break;
        }
      }

      // If we captured Patient Fees debug above, also store the chosen cell parse
      if (
        debugEnabled &&
        line.toLowerCase().includes("patient fees") &&
        debug.patientFees
      ) {
        const chosenCell =
          cells
            .slice(1)
            .reverse()
            .find((c) => String(c).trim().length > 0) ?? null;
        if (chosenCell !== null) {
          const steps = parseAmountSteps(chosenCell);
          debug.patientFees.amountCells = {
            ...debug.patientFees.amountCells,
            chosenCell,
          };
          debug.patientFees.amountParse = {
            raw: chosenCell,
            cleaned: steps.cleaned,
            parsed: steps.parsed,
          };
        }
      }
    } else {
      const parts = line.split(/[:\t]+/);
      rawAccountName = parts[0]?.trim() || "";
      if (parts.length > 1) {
        const rawAmountValue = parts.slice(1).join("");
        amount = extractNumber(rawAmountValue);
        if (debugEnabled && rawAccountName.toLowerCase().includes("patient fees")) {
          logAmountParse("Text/tab amount", rawAmountValue, { rawAccountName });
        }
      }
    }

    if (!rawAccountName) continue;

    // Skip metadata/header rows (client name, dates, report titles)
    if (isMetadataRow(rawAccountName)) continue;

    // Clean the account name (remove prefixes like "Client Name →")
    const accountName = cleanAccountName(rawAccountName);

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

  // Month count is based on unique detected month columns in the header (Jan–Dec), even if a Total column exists.
  const monthCount = uniqueMonthCountDetected > 0 ? uniqueMonthCountDetected : undefined;

  return {
    accounts,
    amountColumnDescription: isCSV
      ? "Parsed as text/CSV (with smart comma handling)"
      : "Parsed as text",
    monthCount,
    debug,
  };
}

// Debug payload for P&L parsing (raw view before processing)
type PnlImportDebug = {
  source: "workbook" | "text";
  detectedHeaders: string[];
  headerRowIndex?: number;
  columnsInHeader?: number;
  maxColumnsInPreview?: number;
  accountColumnIndex?: number;
  amountConfig?: AmountColumnConfig;
  previewRows: unknown[][];
  csvPreview?: {
    firstLines: string[];
    splitRows: string[][];
  };
  patientFees?: {
    rawRowIndex: number;
    rawRow: unknown[];
    rawAccountCell: unknown;
    cleanedAccount: string;
    amountCells: Record<string, unknown>;
    amountParse?: {
      raw: unknown;
      cleaned: string;
      parsed: number | null;
    };
  };
};

// Result type for parsing with metadata
interface ParseResult {
  accounts: ParsedAccount[];
  amountColumnDescription: string;
  monthCount?: number;
  debug?: PnlImportDebug;
}

// Parse line items from Excel workbook with smart column detection
function parseLineItemsFromWorkbook(
  workbook: XLSX.WorkBook,
  defaults: CategoryDefault[],
  debugEnabled = false
): ParseResult {
  const accounts: ParsedAccount[] = [];
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  const data: unknown[][] = rawData as unknown[][];

  if (data.length === 0) {
    return {
      accounts,
      amountColumnDescription: "",
      debug: {
        source: "workbook",
        detectedHeaders: [],
        previewRows: [],
      },
    };
  }

  // Find header row (first row with column-like content)
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const rowStrings = row.map((cell) => String(cell || "").trim());
    const headerLower = rowStrings.map((s) => s.toLowerCase());

    // Check if this looks like a header row (has Total/YTD, months, or Amount column)
    const hasTotal = headerLower.some(
      (h) =>
        h === "total" ||
        h === "ytd" ||
        h === "annual" ||
        h === "year total" ||
        h === "ytd total" ||
        h === "year to date"
    );
    const hasMonths = headerLower.some((h) => MONTH_PATTERNS.some((p) => p.test(h)));
    const hasAmountCol = headerLower.some(
      (h) =>
        h === "amount" ||
        h === "balance" ||
        h === "value" ||
        h === "account" ||
        h === "description"
    );

    if (hasTotal || hasMonths || hasAmountCol) {
      headerRowIndex = i;
      headers = rowStrings;
      break;
    }
  }

  // If no header found, try to detect from first data rows
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    headers = data[0]?.map((cell) => String(cell || "")) || [];
  }

  // Detect column configuration
  const accountColIndex = findAccountColumn(headers);
  const amountConfig = findAmountColumn(headers);

  const previewRows = [
    data[headerRowIndex] || [],
    data[headerRowIndex + 1] || [],
    data[headerRowIndex + 2] || [],
    data[headerRowIndex + 3] || [],
  ] as unknown[][];

  const maxColumnsInPreview = previewRows.reduce(
    (max, r) => Math.max(max, r?.length ?? 0),
    0
  );

  const debug: PnlImportDebug = {
    source: "workbook",
    detectedHeaders: headers.map((h) => String(h ?? "").trim()),
    headerRowIndex,
    columnsInHeader: headers.length,
    maxColumnsInPreview,
    accountColumnIndex: accountColIndex,
    amountConfig,
    previewRows,
  };

  if (debugEnabled) {
    console.groupCollapsed("[P&L Import Debug] Workbook structure detected");
    console.log("headerRowIndex:", headerRowIndex);
    console.log("headers:", headers);
    console.log("accountColIndex:", accountColIndex);
    console.log("amountConfig:", amountConfig);
    console.log("previewRows:", previewRows);
    console.groupEnd();
  }

  let currentParent: string | undefined;
  let sortOrder = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const rawLabel = String(row[accountColIndex] || "").trim();
    if (!rawLabel) continue;

    // Capture the raw Patient Fees row before any processing
    if (debugEnabled) {
      const rowText = row.map((c) => String(c ?? "")).join("|").toLowerCase();
      if (rowText.includes("patient fees")) {
        const cleanedAccount = cleanAccountName(rawLabel);

        const amountCells: Record<string, unknown> = {};
        if (amountConfig.type === "sum_months") {
          amountConfig.columns.forEach((colIdx) => {
            amountCells[headers[colIdx] || String(colIdx)] = row[colIdx];
          });
        } else {
          const colIdx = amountConfig.columns[0];
          amountCells[headers[colIdx] || String(colIdx)] = row[colIdx];
        }

        const primaryAmountCell =
          amountConfig.type === "sum_months"
            ? row[amountConfig.columns[0]]
            : row[amountConfig.columns[0]];
        const steps = parseAmountSteps(primaryAmountCell);

        debug.patientFees = {
          rawRowIndex: i,
          rawRow: row,
          rawAccountCell: row[accountColIndex],
          cleanedAccount,
          amountCells,
          amountParse: {
            raw: primaryAmountCell,
            cleaned: steps.cleaned,
            parsed: steps.parsed,
          },
        };

        console.groupCollapsed("[P&L Import Debug] Patient Fees (workbook) raw row");
        console.log("raw row:", row);
        console.log("account cell (raw):", row[accountColIndex]);
        console.log("account cell (cleaned):", cleanedAccount);
        console.log("amount cells (raw):", amountCells);
        logAmountParse("workbook primary amount cell", primaryAmountCell, {
          header: headers[amountConfig.columns[0]] ?? amountConfig.columns[0],
          rowIndex: i,
        });
        console.groupEnd();
      }
    }

    // Skip metadata/header rows (client name, dates, report titles)
    if (isMetadataRow(rawLabel)) continue;

    // Clean the account name (remove prefixes like "Client Name →")
    const label = cleanAccountName(rawLabel);
    if (!label) continue;

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
    const csvResult = parseLineItems(csvText, defaults, debugEnabled);
    return {
      accounts: csvResult.accounts,
      amountColumnDescription: "Parsed as CSV",
      monthCount: csvResult.monthCount,
      debug: csvResult.debug,
    };
  }

  // Month count should be based on detected month columns in the header (Jan–Dec),
  // even when we use a Total/YTD column for the actual amounts.
  const uniqueMonths = new Set<number>();
  headers.forEach((h) => {
    const headerStr = String(h || "").trim();
    const monthIdx = MONTH_PATTERNS.findIndex((p) => p.test(headerStr));
    if (monthIdx !== -1) uniqueMonths.add(monthIdx);
  });
  const monthCount = uniqueMonths.size > 0 ? uniqueMonths.size : undefined;

  return { accounts, amountColumnDescription: amountConfig.description, monthCount, debug };
}

// Calculate totals from mappings using new categories
function calculateTotalsFromMappings(mappings: AccountMapping[], monthCount?: number | null): ImportedData {
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
    monthCount: monthCount ?? null,
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
  const [detectedMonthCount, setDetectedMonthCount] = useState<number | null>(null);
  const [detectedHeaderRowIndex, setDetectedHeaderRowIndex] = useState<number | null>(null);
  const [previousMappings, setPreviousMappings] = useState<Map<string, PFCategory>>(new Map());
  const [showViewMappingsModal, setShowViewMappingsModal] = useState(false);
  const [viewMappingsAccounts, setViewMappingsAccounts] = useState<ParsedAccount[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [categoryDefaults, setCategoryDefaults] = useState<CategoryDefault[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(import.meta.env.DEV);
  const [parseDebug, setParseDebug] = useState<PnlImportDebug | null>(null);
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

  // Load and view existing mappings
  const handleViewMappings = async () => {
    setIsLoadingMappings(true);
    try {
      const { data, error } = await supabase
        .from("review_account_mappings")
        .select("account_name, amount, pf_category, parent_account, sort_order")
        .eq("review_id", reviewId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error loading mappings:", error);
        toast({
          title: "Error",
          description: "Failed to load mappings",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No mappings found",
          description: "Import a P&L first to create mappings",
        });
        return;
      }

      // Convert to ParsedAccount format for the modal
      const accounts: ParsedAccount[] = data.map((row) => ({
        accountName: row.account_name,
        amount: row.amount,
        parentAccount: row.parent_account || undefined,
        suggestedCategory: row.pf_category as PFCategory,
        confidence: "high" as const,
        needsReview: undefined,
        sortOrder: row.sort_order,
      }));

      setViewMappingsAccounts(accounts);
      setShowViewMappingsModal(true);
    } catch (err) {
      console.error("Error loading mappings:", err);
      toast({
        title: "Error",
        description: "Failed to load mappings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMappings(false);
    }
  };

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
      const result = parseLineItems(pastedText, defaults, showDebugPanel);
      const allAccounts = result.accounts;

      setAmountColumnDescription(result.amountColumnDescription);
      setDetectedMonthCount(result.monthCount ?? null);
      setDetectedHeaderRowIndex(result.debug?.headerRowIndex ?? null);
      setParseDebug(result.debug ?? null);

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
      const lineItems = allAccounts.filter((acc) => !isTotalRow(acc.accountName));
      const excluded = allAccounts.filter((acc) => isTotalRow(acc.accountName));

      // Deduplicate accounts with same name and amount
      const { unique, duplicates } = deduplicateAccounts(lineItems);

      setParsedAccounts(unique);
      setExcludedAccounts(excluded);
      setDuplicateAccounts(duplicates);
      setShowPasteModal(false);
      setShowMappingModal(true);

      const lowConfidence = unique.filter((a) => a.confidence === "low").length;
      const needsReview = unique.filter((a) => a.needsReview).length;

      let description = result.amountColumnDescription || "Review the category mappings below";
      const notes: string[] = [];
      if (excluded.length > 0) notes.push(`${excluded.length} totals excluded`);
      if (duplicates.length > 0) notes.push(`${duplicates.length} duplicates merged`);
      if (needsReview > 0) notes.push(`${needsReview} flagged for review`);
      else if (lowConfidence > 0) notes.push(`${lowConfidence} need attention`);
      if (notes.length > 0) description = `${description}. ${notes.join(", ")}`;

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
      let debugPayload: PnlImportDebug | undefined;
      let monthCount: number | undefined;

      if (extension === "xlsx" || extension === "xls") {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const result = parseLineItemsFromWorkbook(workbook, defaults, showDebugPanel);
        allAccounts = result.accounts;
        columnDescription = result.amountColumnDescription;
        debugPayload = result.debug;
        monthCount = result.monthCount;
      } else {
        const text = await file.text();
        const result = parseLineItems(text, defaults, showDebugPanel);
        allAccounts = result.accounts;
        columnDescription = result.amountColumnDescription;
        debugPayload = result.debug;
        monthCount = result.monthCount;
      }

      setParseDebug(debugPayload ?? null);
      setDetectedMonthCount(monthCount ?? null);
      setDetectedHeaderRowIndex(debugPayload?.headerRowIndex ?? null);

      if (allAccounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find any line items. Please check the file format.",
          variant: "destructive",
        });
        return;
      }

      // Filter out total/subtotal rows to avoid double-counting
      const lineItems = allAccounts.filter((acc) => !isTotalRow(acc.accountName));
      const excluded = allAccounts.filter((acc) => isTotalRow(acc.accountName));

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

      // Calculate totals from mappings (pass month count for monthly average calculation)
      const data = calculateTotalsFromMappings(mappings, detectedMonthCount);

      // Build success message
      const found: string[] = [];
      if (data.revenue) found.push(`Revenue ${formatCurrency(data.revenue)}`);
      if (data.cogs) found.push(`COGS ${formatCurrency(data.cogs)}`);
      if (data.ownerPay) found.push(`Owner Pay ${formatCurrency(data.ownerPay)}`);
      if (data.taxPaid) found.push(`Tax ${formatCurrency(data.taxPaid)}`);
      if (data.monthCount) found.push(`${data.monthCount} months detected`);

      // Pass both monthCount and monthCountDetected (same value on initial import)
      onImport({ ...data, monthCountDetected: detectedMonthCount });
      setShowMappingModal(false);
      setParsedAccounts([]);
      setExcludedAccounts([]);
      setDetectedMonthCount(null);
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
        <div className="flex gap-2 flex-wrap">
          {import.meta.env.DEV && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground"
              onClick={() => setShowDebugPanel((s) => !s)}
            >
              {showDebugPanel ? "Hide debug" : "Debug"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-slate-400 text-slate-600 hover:bg-slate-50"
            onClick={handleViewMappings}
            disabled={isLoadingMappings}
          >
            {isLoadingMappings ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            View Mappings
          </Button>
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

      {/* Debug Panel toggle button (always visible) */}
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebugPanel((prev) => !prev)}
          className="text-xs text-muted-foreground"
        >
          {showDebugPanel ? "Hide Debug Panel" : "Show Debug Panel"}
        </Button>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="mt-2 rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">P&L Import Debug</div>
            <div className="text-muted-foreground">
              Upload a file / paste data to populate.
            </div>
          </div>

          {parseDebug && (
            <div className="mt-3 grid gap-4">
              <div className="grid gap-1">
                <div className="font-medium">Raw headers detected</div>
                <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                  {JSON.stringify(parseDebug.detectedHeaders, null, 2)}
                </pre>
              </div>

              <div className="grid gap-1">
                <div className="font-medium">Columns</div>
                <div className="text-muted-foreground">
                  header columns: {parseDebug.columnsInHeader ?? parseDebug.detectedHeaders.length}
                  {typeof parseDebug.maxColumnsInPreview === "number"
                    ? ` • max columns (preview rows): ${parseDebug.maxColumnsInPreview}`
                    : ""}
                </div>
              </div>

              {parseDebug.amountConfig && (
                <div className="grid gap-1">
                  <div className="font-medium">Detected amount columns</div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                    {JSON.stringify(
                      {
                        type: parseDebug.amountConfig.type,
                        columns: parseDebug.amountConfig.columns,
                        description: parseDebug.amountConfig.description,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              <div className="grid gap-1">
                <div className="font-medium">First 3 raw rows (before processing)</div>
                <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                  {JSON.stringify(parseDebug.previewRows, null, 2)}
                </pre>
              </div>

              {parseDebug.patientFees && (
                <div className="grid gap-1">
                  <div className="font-medium">Raw parsed row for “Patient Fees”</div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                    {JSON.stringify(parseDebug.patientFees, null, 2)}
                  </pre>
                </div>
              )}

              {parseDebug.csvPreview && (
                <div className="grid gap-1">
                  <div className="font-medium">CSV preview (raw lines + split)</div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                    {JSON.stringify(parseDebug.csvPreview, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
        detectedMonthCount={detectedMonthCount}
        headerRowIndex={detectedHeaderRowIndex}
        onApply={handleApplyMappings}
        isProcessing={isSavingMappings}
        previousMappings={previousMappings}
      />

      {/* View Mappings Modal (read-only) */}
      <AccountMappingModal
        open={showViewMappingsModal}
        onOpenChange={setShowViewMappingsModal}
        accounts={viewMappingsAccounts}
        excludedAccounts={[]}
        duplicateAccounts={[]}
        amountColumnDescription="Saved mappings"
        onApply={() => setShowViewMappingsModal(false)}
        isProcessing={false}
        previousMappings={new Map()}
        readOnly
      />
    </>
  );
};
