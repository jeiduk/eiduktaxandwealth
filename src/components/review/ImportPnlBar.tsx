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

interface ImportedData {
  revenue: number | null;
  netProfit: number | null;
  cogs: number | null;
  expenses: number | null;
  ownerPay: number | null;
}

interface ImportPnlBarProps {
  onImport: (data: ImportedData) => void;
}

// Helper to extract number from a string
const extractNumber = (text: string): number | null => {
  // Match numbers with optional $ and commas, including negative numbers in parentheses
  const match = text.match(/\(?\$?\s*([\d,]+\.?\d*)\)?/);
  if (match) {
    const numStr = match[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    // Check if it was a negative number in parentheses
    if (text.includes('(') && text.includes(')')) {
      return -num;
    }
    return num;
  }
  return null;
};

// Helper to extract the last number from a CSV row (the Total column)
const extractLastNumber = (line: string): number | null => {
  // Split by comma and find the last non-empty cell
  const cells = line.split(',');
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i].trim();
    if (cell) {
      const num = extractNumber(cell);
      if (num !== null) {
        return num;
      }
    }
  }
  return null;
};

function extractFinancials(text: string): ImportedData {
  const result: ImportedData = {
    revenue: null,
    netProfit: null,
    cogs: null,
    expenses: null,
    ownerPay: null,
  };

  const lines = text.split('\n');
  
  // Detect if this is CSV format (has commas separating values)
  const isCSV = lines.some(line => line.split(',').length > 3);
  const getNumber = isCSV ? extractLastNumber : extractNumber;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Revenue patterns - map from Gross Profit
    if (!result.revenue && (
      lower.includes('gross profit') ||
      lower.includes('total for income') ||
      lower.includes('total income') ||
      lower.includes('gross revenue') ||
      lower.includes('total revenue')
    )) {
      result.revenue = getNumber(line);
    }

    // Net Profit patterns - map from Net Operating Income
    if (!result.netProfit && (
      lower.includes('net operating income') ||
      lower.includes('net ordinary income') ||
      lower.includes('net income') ||
      lower.includes('net profit')
    )) {
      result.netProfit = getNumber(line);
    }

    // COGS patterns - look for "Total for Cost of Goods Sold"
    if (!result.cogs && (
      lower.includes('total for cost of goods sold') ||
      lower.includes('cost of goods sold') ||
      lower.includes('cost of sales') ||
      lower.includes('cogs')
    )) {
      result.cogs = getNumber(line);
    }

    // Expenses patterns - look for "Total for Expenses"
    if (!result.expenses && (
      lower.includes('total for expenses') ||
      lower.includes('total expenses') ||
      lower.includes('total operating expenses')
    )) {
      result.expenses = getNumber(line);
    }

    // Owner Pay / Personal Draw patterns
    if (!result.ownerPay && (
      lower.includes('owner pay') ||
      lower.includes('owner\'s pay') ||
      lower.includes('owners pay') ||
      lower.includes('personal draw') ||
      lower.includes('owner draw') ||
      lower.includes('owner\'s draw') ||
      lower.includes('owners draw') ||
      lower.includes('shareholder distribution') ||
      lower.includes('officer compensation') ||
      lower.includes('owner compensation')
    )) {
      result.ownerPay = getNumber(line);
    }
  }

  return result;
}

// Extract financials from Excel with Total column fallback
function extractFinancialsFromWorkbook(workbook: XLSX.WorkBook): ImportedData {
  const result: ImportedData = {
    revenue: null,
    netProfit: null,
    cogs: null,
    expenses: null,
    ownerPay: null,
  };

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  const data: unknown[][] = rawData as unknown[][];
  
  if (data.length === 0) return result;

  // Find header row and identify "Total" column (usually last numeric column)
  let totalColIndex = -1;
  let headerRowIndex = -1;
  
  // Look for header row (first row with text that looks like column headers)
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Check if this row has column headers like "Total", "YTD", month names, etc.
    for (let j = row.length - 1; j >= 0; j--) {
      const cell = String(row[j] || '').toLowerCase().trim();
      if (cell === 'total' || cell === 'ytd' || cell === 'year to date' || cell === 'ytd total') {
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
        if (cell !== undefined && cell !== null && cell !== '') {
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

  // Now scan rows for financial line items
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const label = String(row[0] || '').toLowerCase().trim();
    
    // Get value from total column, or fallback to last non-empty cell
    let value: number | null = null;
    if (totalColIndex >= 0 && row[totalColIndex] !== undefined) {
      value = extractNumber(String(row[totalColIndex]));
    }
    if (value === null) {
      // Fallback: find last numeric value in the row
      for (let j = row.length - 1; j >= 1; j--) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
          value = extractNumber(String(row[j]));
          if (value !== null) break;
        }
      }
    }

    if (value === null) continue;

    // Revenue patterns - map from Gross Profit
    if (!result.revenue && (
      label.includes('gross profit') ||
      label.includes('total income') ||
      label.includes('gross revenue') ||
      label.includes('total revenue')
    )) {
      result.revenue = value;
    }

    // Net Profit patterns - map from Net Operating Income
    if (!result.netProfit && (
      label.includes('net operating income') ||
      label.includes('net ordinary income') ||
      label.includes('net income') ||
      label.includes('net profit')
    )) {
      result.netProfit = value;
    }

    // COGS patterns
    if (!result.cogs && (
      label.includes('cost of goods sold') ||
      label.includes('cost of sales') ||
      label === 'cogs'
    )) {
      result.cogs = value;
    }

    // Expenses patterns
    if (!result.expenses && (
      label.includes('total expenses') ||
      label.includes('total operating expenses')
    )) {
      result.expenses = value;
    }

    // Owner Pay patterns
    if (!result.ownerPay && (
      label.includes('owner pay') ||
      label.includes('owner\'s pay') ||
      label.includes('owners pay') ||
      label.includes('personal draw') ||
      label.includes('owner draw') ||
      label.includes('owner\'s draw') ||
      label.includes('owners draw') ||
      label.includes('shareholder distribution') ||
      label.includes('officer compensation') ||
      label.includes('owner compensation')
    )) {
      result.ownerPay = value;
    }
  }

  // If Excel parsing didn't find data, fallback to CSV text parsing
  if (!result.revenue && !result.netProfit && !result.cogs && !result.expenses && !result.ownerPay) {
    const csvText = XLSX.utils.sheet_to_csv(firstSheet);
    return extractFinancials(csvText);
  }

  return result;
}

export const ImportPnlBar = ({ onImport }: ImportPnlBarProps) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportData = () => {
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
      const data = extractFinancials(pastedText);
      
      // Check if we found anything
      if (!data.revenue && !data.netProfit && !data.cogs && !data.expenses && !data.ownerPay) {
        toast({
          title: "No Data Found",
          description: "Could not find financial data. Please check the format.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Build success message
      const found: string[] = [];
      if (data.revenue) found.push(`Revenue ${formatCurrency(data.revenue)}`);
      if (data.netProfit) found.push(`Net Profit ${formatCurrency(data.netProfit)}`);
      if (data.cogs) found.push(`COGS ${formatCurrency(data.cogs)}`);
      if (data.expenses) found.push(`Expenses ${formatCurrency(data.expenses)}`);
      if (data.ownerPay) found.push(`Owner Pay ${formatCurrency(data.ownerPay)}`);

      onImport(data);
      setShowPasteModal(false);
      setPastedText("");
      
      toast({
        title: "✓ Imported",
        description: found.join(", "),
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
      const extension = file.name.split('.').pop()?.toLowerCase();
      let data: ImportedData;

      if (extension === 'xlsx' || extension === 'xls') {
        // Handle Excel files with smart column detection
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        data = extractFinancialsFromWorkbook(workbook);
      } else {
        // Handle text/csv files
        const text = await file.text();
        data = extractFinancials(text);
      }

      if (!data.revenue && !data.netProfit && !data.cogs && !data.expenses && !data.ownerPay) {
        toast({
          title: "No Data Found",
          description: "Could not find financial data in the file. Please check the format.",
          variant: "destructive",
        });
        return;
      }

      // Build success message
      const found: string[] = [];
      if (data.revenue) found.push(`Revenue ${formatCurrency(data.revenue)}`);
      if (data.netProfit) found.push(`Net Profit ${formatCurrency(data.netProfit)}`);
      if (data.cogs) found.push(`COGS ${formatCurrency(data.cogs)}`);
      if (data.expenses) found.push(`Expenses ${formatCurrency(data.expenses)}`);
      if (data.ownerPay) found.push(`Owner Pay ${formatCurrency(data.ownerPay)}`);

      onImport(data);
      
      toast({
        title: "✓ Imported from file",
        description: found.join(", "),
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

      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import P&L Data</DialogTitle>
            <DialogDescription>
              Paste your P&L report text below. We'll extract the key financial metrics automatically.
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
Total Expenses: $245,000
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
            <Button onClick={handleImportData} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Import Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
