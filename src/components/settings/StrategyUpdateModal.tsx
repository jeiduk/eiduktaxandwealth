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
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";

// All updatable columns (id is required for matching)
const UPDATABLE_COLUMNS = [
  "id",
  "strategy_number",
  "name",
  "phase",
  "phase_name",
  "irc_citation",
  "irc_sections",
  "description",
  "what_it_is",
  "client_overview",
  "implementation",
  "forms_required",
  "risk_level",
  "irs_scrutiny",
  "tier",
  "typical_savings_low",
  "typical_savings_high",
  "savings_low",
  "savings_high",
  "tool_name",
  "tool_url",
  "documents",
];

interface ParsedRow {
  id: number;
  changes: Record<string, any>;
  _status: "update" | "not_found" | "no_changes" | "error";
  _error?: string;
  _existingName?: string;
}

interface StrategyUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateComplete: () => void;
}

export const StrategyUpdateModal = ({
  open,
  onOpenChange,
  onUpdateComplete,
}: StrategyUpdateModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "updating">("upload");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [pasteData, setPasteData] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ done: 0, total: 0 });
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  const resetModal = () => {
    setStep("upload");
    setParsedData([]);
    setPasteData("");
    setUpdating(false);
    setUpdateProgress({ done: 0, total: 0 });
    setDetectedColumns([]);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const downloadFullExport = async () => {
    const { data: strategies } = await supabase
      .from("strategies")
      .select("*")
      .order("id");

    if (!strategies) return;

    // Create worksheet with all columns
    const ws = XLSX.utils.json_to_sheet(
      strategies.map((s) => ({
        id: s.id,
        strategy_number: s.strategy_number || "",
        name: s.name,
        phase: s.phase,
        phase_name: s.phase_name,
        irc_citation: s.irc_citation || "",
        irc_sections: s.irc_sections || "",
        description: s.description || "",
        what_it_is: s.what_it_is || "",
        client_overview: s.client_overview || "",
        implementation: s.implementation || "",
        forms_required: s.forms_required || "",
        risk_level: s.risk_level || "",
        irs_scrutiny: s.irs_scrutiny ? "true" : "",
        tier: s.tier || "",
        typical_savings_low: s.typical_savings_low || "",
        typical_savings_high: s.typical_savings_high || "",
        savings_low: s.savings_low || "",
        savings_high: s.savings_high || "",
        tool_name: s.tool_name || "",
        tool_url: s.tool_url || "",
        documents: s.documents ? JSON.stringify(s.documents) : "",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Strategies");
    XLSX.writeFile(wb, "strategies-full-export.xlsx");

    toast({
      title: "Export complete",
      description: "Full strategy export downloaded",
    });
  };

  const parseValue = (value: any, column: string): any => {
    if (value === undefined || value === null || value === "") {
      return undefined; // Will be skipped during update
    }

    const strValue = String(value).trim();
    if (strValue === "") return undefined;

    // Handle numeric columns
    if (
      ["typical_savings_low", "typical_savings_high", "savings_low", "savings_high"].includes(column)
    ) {
      const num = parseInt(strValue.replace(/[$,]/g, ""), 10);
      return isNaN(num) ? undefined : num;
    }

    // Handle boolean columns
    if (column === "irs_scrutiny") {
      return strValue.toLowerCase() === "true" || strValue === "1";
    }

    // Handle JSON columns
    if (column === "documents") {
      try {
        return JSON.parse(strValue);
      } catch {
        return undefined;
      }
    }

    return strValue;
  };

  const validateAndEnrichRows = async (
    rawRows: Record<string, any>[],
    columns: string[]
  ): Promise<ParsedRow[]> => {
    // Fetch existing strategies
    const { data: existingStrategies } = await supabase
      .from("strategies")
      .select("id, name");

    const existingMap = new Map(
      existingStrategies?.map((s) => [s.id, s.name]) || []
    );

    return rawRows.map((raw) => {
      const id = parseInt(String(raw.id), 10);

      if (isNaN(id)) {
        return {
          id: 0,
          changes: {},
          _status: "error" as const,
          _error: "Invalid or missing ID",
        };
      }

      if (!existingMap.has(id)) {
        return {
          id,
          changes: {},
          _status: "not_found" as const,
          _error: `Strategy #${id} not found`,
        };
      }

      // Build changes object - only include non-empty values
      const changes: Record<string, any> = {};
      columns.forEach((col) => {
        if (col === "id") return; // Skip id column
        const value = parseValue(raw[col], col);
        if (value !== undefined) {
          changes[col] = value;
        }
      });

      if (Object.keys(changes).length === 0) {
        return {
          id,
          changes: {},
          _status: "no_changes" as const,
          _existingName: existingMap.get(id),
        };
      }

      return {
        id,
        changes,
        _status: "update" as const,
        _existingName: existingMap.get(id),
      };
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

        if (jsonData.length === 0) {
          toast({
            title: "Empty file",
            description: "The file contains no data rows",
            variant: "destructive",
          });
          return;
        }

        // Normalize column names and detect which columns are present
        const firstRow = jsonData[0] as Record<string, any>;
        const columnMap: Record<string, string> = {};
        Object.keys(firstRow).forEach((key) => {
          const normalized = key.toLowerCase().replace(/\s+/g, "_");
          if (UPDATABLE_COLUMNS.includes(normalized)) {
            columnMap[key] = normalized;
          }
        });

        const detectedCols = Object.values(columnMap);
        if (!detectedCols.includes("id")) {
          toast({
            title: "Missing ID column",
            description: "The file must have an 'id' column to match strategies",
            variant: "destructive",
          });
          return;
        }

        setDetectedColumns(detectedCols.filter((c) => c !== "id"));

        const normalizedData = jsonData.map((row: any) => {
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const normalizedKey = columnMap[key];
            if (normalizedKey) {
              normalized[normalizedKey] = row[key];
            }
          });
          return normalized;
        });

        const enriched = await validateAndEnrichRows(normalizedData, detectedCols);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasteImport = async () => {
    if (!pasteData.trim()) {
      toast({
        title: "No data",
        description: "Please paste data first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try parsing as CSV
      const lines = pasteData.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("Not enough rows");
      }

      const headers = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      
      if (!headers.includes("id")) {
        toast({
          title: "Missing ID column",
          description: "Data must have an 'id' column to match strategies",
          variant: "destructive",
        });
        return;
      }

      const validHeaders = headers.filter((h) => UPDATABLE_COLUMNS.includes(h));
      setDetectedColumns(validHeaders.filter((c) => c !== "id"));

      const rows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,\t]/);
        const row: Record<string, any> = {};
        headers.forEach((header, idx) => {
          if (UPDATABLE_COLUMNS.includes(header)) {
            row[header] = values[idx]?.trim() || "";
          }
        });
        if (row.id) rows.push(row);
      }

      const enriched = await validateAndEnrichRows(rows, validHeaders);
      setParsedData(enriched);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Could not parse the pasted data",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    const validRows = parsedData.filter((r) => r._status === "update");
    if (validRows.length === 0) {
      toast({
        title: "No updates",
        description: "No valid rows to update",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    setStep("updating");
    setUpdateProgress({ done: 0, total: validRows.length });

    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const { error } = await supabase
          .from("strategies")
          .update(row.changes)
          .eq("id", row.id);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error updating strategy:", row.id, error);
        errorCount++;
      }

      setUpdateProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setUpdating(false);

    if (errorCount === 0) {
      toast({
        title: "Update complete",
        description: `Successfully updated ${successCount} strategies`,
      });
    } else {
      toast({
        title: "Update completed with errors",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: "destructive",
      });
    }

    onUpdateComplete();
    handleClose();
  };

  const stats = {
    total: parsedData.length,
    update: parsedData.filter((r) => r._status === "update").length,
    notFound: parsedData.filter((r) => r._status === "not_found").length,
    noChanges: parsedData.filter((r) => r._status === "no_changes").length,
    error: parsedData.filter((r) => r._status === "error").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Update Strategies
          </DialogTitle>
          <DialogDescription>
            Import a file to update existing strategies. Only non-empty cells will be updated.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            {/* Export first */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Recommended: Export first, then edit
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Export all strategies to Excel, make your changes, then re-import.
                    Only columns with data will be updated.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={downloadFullExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Strategies
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Updated File (CSV or Excel)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
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
              <Label>Paste CSV/TSV Data</Label>
              <Textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Paste data with headers. Must include 'id' column.\n\nid,what_it_is,tool_name,tool_url\n1,Updated description,Calculator,https://..."
                className="min-h-[120px] font-mono text-sm"
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

            {/* Supported columns */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
              <p className="font-medium mb-1">Supported columns:</p>
              <p className="break-words">
                {UPDATABLE_COLUMNS.join(", ")}
              </p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 py-4">
            {/* Detected columns */}
            <div className="text-sm">
              <span className="font-medium">Columns to update: </span>
              <span className="text-muted-foreground">
                {detectedColumns.join(", ") || "None"}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1">
                Total: {stats.total}
              </Badge>
              {stats.update > 0 && (
                <Badge variant="default" className="gap-1 bg-blue-500">
                  <CheckCircle className="h-3 w-3" />
                  Will Update: {stats.update}
                </Badge>
              )}
              {stats.noChanges > 0 && (
                <Badge variant="secondary" className="gap-1">
                  No Changes: {stats.noChanges}
                </Badge>
              )}
              {stats.notFound > 0 && (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Not Found: {stats.notFound}
                </Badge>
              )}
              {stats.error > 0 && (
                <Badge variant="destructive" className="gap-1">
                  Errors: {stats.error}
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        row._status === "error" || row._status === "not_found"
                          ? "bg-red-50 dark:bg-red-950/20"
                          : row._status === "no_changes"
                          ? "bg-muted/50"
                          : undefined
                      }
                    >
                      <TableCell>
                        {row._status === "update" && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Update
                          </Badge>
                        )}
                        {row._status === "no_changes" && (
                          <Badge variant="secondary">Skip</Badge>
                        )}
                        {row._status === "not_found" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Not Found
                          </Badge>
                        )}
                        {row._status === "error" && (
                          <Badge variant="destructive">{row._error}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{row.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row._existingName || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                        {row._status === "update" ? (
                          <span className="truncate block">
                            {Object.keys(row.changes).join(", ")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetModal}>
                Back
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={stats.update === 0}
              >
                Update {stats.update} Strategies
              </Button>
            </div>
          </div>
        )}

        {step === "updating" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">
              Updating strategies...
            </p>
            <p className="text-muted-foreground">
              {updateProgress.done} of {updateProgress.total}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
