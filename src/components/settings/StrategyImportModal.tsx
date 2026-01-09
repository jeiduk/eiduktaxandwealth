import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

interface StrategyRow {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation?: string;
  description?: string;
  typical_savings_low?: number;
  typical_savings_high?: number;
}

interface ParsedRow extends StrategyRow {
  _status: "new" | "update" | "error";
  _error?: string;
  _existingId?: number;
}

interface StrategyImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const REQUIRED_COLUMNS = ["id", "name", "phase", "phase_name"];
const ALL_COLUMNS = [
  "id",
  "name",
  "phase",
  "phase_name",
  "irc_citation",
  "description",
  "typical_savings_low",
  "typical_savings_high",
];

export const StrategyImportModal = ({
  open,
  onOpenChange,
  onImportComplete,
}: StrategyImportModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [pasteData, setPasteData] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const resetModal = () => {
    setStep("upload");
    setParsedData([]);
    setPasteData("");
    setImporting(false);
    setImportProgress({ done: 0, total: 0 });
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: 1,
        name: "Example Strategy",
        phase: "entity-structure",
        phase_name: "Entity Structure",
        irc_citation: "IRC §162",
        description: "Description of the strategy",
        typical_savings_low: 5000,
        typical_savings_high: 15000,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Strategies");
    XLSX.writeFile(wb, "strategy_template.xlsx");
  };

  const parseJSONData = (data: string): Record<string, string>[] | null => {
    try {
      const parsed = JSON.parse(data);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map((item: any) => {
        const normalized: Record<string, string> = {};
        Object.keys(item).forEach((key) => {
          normalized[key.toLowerCase().replace(/\s+/g, "_")] = String(item[key] ?? "");
        });
        return normalized;
      });
    } catch {
      return null;
    }
  };

  const parseCSVData = (data: string): Record<string, string>[] => {
    const lines = data.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t]/);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const validateAndEnrichRows = async (
    rawRows: Record<string, string>[]
  ): Promise<ParsedRow[]> => {
    // Fetch existing strategies
    const { data: existingStrategies } = await supabase
      .from("strategies")
      .select("id, name");

    const existingMap = new Map(
      existingStrategies?.map((s) => [s.id, s]) || []
    );

    return rawRows.map((raw) => {
      const id = parseInt(raw.id, 10);
      const row: ParsedRow = {
        id,
        name: raw.name || "",
        phase: raw.phase || "",
        phase_name: raw.phase_name || "",
        irc_citation: raw.irc_citation || undefined,
        description: raw.description || undefined,
        typical_savings_low: raw.typical_savings_low
          ? parseInt(raw.typical_savings_low, 10)
          : undefined,
        typical_savings_high: raw.typical_savings_high
          ? parseInt(raw.typical_savings_high, 10)
          : undefined,
        _status: "new",
      };

      // Validate required fields
      const missingFields = REQUIRED_COLUMNS.filter(
        (col) => !raw[col] || raw[col].trim() === ""
      );

      if (missingFields.length > 0) {
        row._status = "error";
        row._error = `Missing: ${missingFields.join(", ")}`;
        return row;
      }

      if (isNaN(id)) {
        row._status = "error";
        row._error = "Invalid ID";
        return row;
      }

      // Check if updating existing
      if (existingMap.has(id)) {
        row._status = "update";
        row._existingId = id;
      }

      return row;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Normalize column names
        const normalizedData = jsonData.map((row: any) => {
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            normalized[key.toLowerCase().replace(/\s+/g, "_")] = String(
              row[key]
            );
          });
          return normalized;
        });

        const enriched = await validateAndEnrichRows(normalizedData);
        setParsedData(enriched);
        setStep("preview");
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Please ensure the file is a valid CSV or Excel file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasteImport = async () => {
    if (!pasteData.trim()) {
      toast({
        title: "No data",
        description: "Please paste JSON or CSV data first",
        variant: "destructive",
      });
      return;
    }

    // Try JSON first, then CSV
    let rawRows: Record<string, string>[] | null = null;
    const trimmedData = pasteData.trim();
    
    if (trimmedData.startsWith("[") || trimmedData.startsWith("{")) {
      rawRows = parseJSONData(trimmedData);
    }
    
    if (!rawRows || rawRows.length === 0) {
      rawRows = parseCSVData(pasteData);
    }

    if (!rawRows || rawRows.length === 0) {
      toast({
        title: "Invalid data",
        description: "Could not parse the pasted data as JSON or CSV",
        variant: "destructive",
      });
      return;
    }

    const enriched = await validateAndEnrichRows(rawRows);
    setParsedData(enriched);
    setStep("preview");
  };

  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r._status !== "error");
    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "Please fix errors before importing",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setStep("importing");
    setImportProgress({ done: 0, total: validRows.length });

    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const strategyData = {
          id: row.id,
          name: row.name,
          phase: row.phase,
          phase_name: row.phase_name,
          irc_citation: row.irc_citation || null,
          description: row.description || null,
          typical_savings_low: row.typical_savings_low || null,
          typical_savings_high: row.typical_savings_high || null,
        };

        const { error } = await supabase
          .from("strategies")
          .upsert(strategyData, { onConflict: "id" });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error importing row:", row.id, error);
        errorCount++;
      }

      setImportProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setImporting(false);

    if (errorCount === 0) {
      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} strategies`,
      });
    } else {
      toast({
        title: "Import completed with errors",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: "destructive",
      });
    }

    onImportComplete();
    handleClose();
  };

  const stats = {
    total: parsedData.length,
    new: parsedData.filter((r) => r._status === "new").length,
    update: parsedData.filter((r) => r._status === "update").length,
    error: parsedData.filter((r) => r._status === "error").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Strategies
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to add or update tax strategies
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File (CSV or Excel)</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or paste data
                </span>
              </div>
            </div>

            {/* Paste Area */}
            <div className="space-y-2">
              <Label>Paste CSV Data</Label>
              <Textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder={'Paste JSON array or CSV data here...\n\n[{"id": 1, "name": "Strategy Name", "phase": 1, ...}]\n\nOR\n\nid,name,phase,phase_name,...'}
                className="min-h-[150px] font-mono text-sm"
              />
              <Button
                onClick={handlePasteImport}
                disabled={!pasteData.trim()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Parse Pasted Data
              </Button>
            </div>

            {/* Column Info */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-md">
              <p className="font-medium">Required columns: id, name, phase, phase_name</p>
              <p>Optional: irc_citation, description, typical_savings_low, typical_savings_high</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 py-4">
            {/* Stats */}
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-1">
                Total: {stats.total}
              </Badge>
              <Badge variant="default" className="gap-1 bg-emerald-500">
                <CheckCircle className="h-3 w-3" />
                New: {stats.new}
              </Badge>
              <Badge variant="default" className="gap-1 bg-blue-500">
                Update: {stats.update}
              </Badge>
              {stats.error > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Errors: {stats.error}
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Status</TableHead>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>IRC</TableHead>
                    <TableHead className="w-[100px]">Savings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        row._status === "error" ? "bg-red-50" : undefined
                      }
                    >
                      <TableCell>
                        {row._status === "new" && (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-600"
                          >
                            New
                          </Badge>
                        )}
                        {row._status === "update" && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-600"
                          >
                            Update
                          </Badge>
                        )}
                        {row._status === "error" && (
                          <Badge variant="destructive" className="text-xs">
                            {row._error}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{row.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-sm">{row.phase_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.irc_citation || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.typical_savings_low && row.typical_savings_high
                          ? `$${row.typical_savings_low.toLocaleString()}-$${row.typical_savings_high.toLocaleString()}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetModal}>
                <X className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleImport}
                disabled={stats.total === stats.error}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {stats.total - stats.error} Strategies
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Importing strategies...</p>
              <p className="text-sm text-muted-foreground">
                {importProgress.done} of {importProgress.total} complete
              </p>
            </div>
            <div className="w-full max-w-xs bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${(importProgress.done / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
