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
}

interface ImportPnlBarProps {
  onImport: (data: ImportedData) => void;
}

function extractFinancials(text: string): ImportedData {
  const result: ImportedData = {
    revenue: null,
    netProfit: null,
    cogs: null,
    expenses: null,
  };

  const lines = text.split('\n');

  // Helper to extract number from line
  const extractNumber = (line: string): number | null => {
    // Match numbers with optional $ and commas, including negative numbers in parentheses
    const match = line.match(/\(?\$?\s*([\d,]+\.?\d*)\)?/);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      // Check if it was a negative number in parentheses
      if (line.includes('(') && line.includes(')')) {
        return -num;
      }
      return num;
    }
    return null;
  };

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Revenue patterns
    if (!result.revenue && (
      lower.includes('total income') ||
      lower.includes('gross revenue') ||
      lower.includes('total revenue') ||
      (lower.includes('revenue') && !lower.includes('net'))
    )) {
      result.revenue = extractNumber(line);
    }

    // Net Profit patterns
    if (!result.netProfit && (
      lower.includes('net income') ||
      lower.includes('net profit') ||
      lower.includes('net ordinary income') ||
      lower.includes('net operating income')
    )) {
      result.netProfit = extractNumber(line);
    }

    // COGS patterns
    if (!result.cogs && (
      lower.includes('cost of goods sold') ||
      lower.includes('cost of sales') ||
      lower.includes('cogs')
    )) {
      result.cogs = extractNumber(line);
    }

    // Expenses patterns
    if (!result.expenses && (
      lower.includes('total expenses') ||
      lower.includes('total operating expenses')
    )) {
      result.expenses = extractNumber(line);
    }
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
      if (!data.revenue && !data.netProfit && !data.cogs && !data.expenses) {
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
      let text = "";

      if (extension === 'xlsx' || extension === 'xls') {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
        // Handle text/csv files
        text = await file.text();
      }

      const data = extractFinancials(text);

      if (!data.revenue && !data.netProfit && !data.cogs && !data.expenses) {
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
