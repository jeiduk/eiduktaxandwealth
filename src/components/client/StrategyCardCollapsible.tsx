import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Clock, 
  Circle, 
  X, 
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

// Strategy tool configurations
const STRATEGY_TOOLS: Record<number, { toolName: string; toolPath: string }> = {
  1: { toolName: "Reasonable Comp Calculator", toolPath: "reasonable-comp" },
  2: { toolName: "Entity Comparison Tool", toolPath: "entity-comparison" },
  3: { toolName: "Basis Tracker", toolPath: "basis-tracker" },
  // Add more strategies as needed
};

// Document checklist by strategy
const STRATEGY_DOCUMENTS: Record<number, { name: string; required: boolean }[]> = {
  1: [
    { name: "Compensation Study", required: true },
    { name: "Job Description", required: true },
    { name: "Board Resolution", required: false },
  ],
  2: [
    { name: "Entity Formation Docs", required: true },
    { name: "Operating Agreement", required: true },
  ],
  3: [
    { name: "Basis Schedule", required: true },
    { name: "Prior Year Returns", required: false },
  ],
  // Add more as needed
};

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
}

interface ClientStrategy {
  id: string;
  client_id: string;
  strategy_id: number;
  status: string;
  deduction_amount: number | null;
  notes: string | null;
  tax_savings: number | null;
  review_id: string | null;
}

interface StrategyCardCollapsibleProps {
  strategy: Strategy;
  clientStrategy: ClientStrategy | undefined;
  phaseColor: string;
  taxRate: number;
  deductionInput: string;
  onStatusChange: (strategyId: number, status: string) => void;
  onDeductionChange: (strategyId: number, value: string) => void;
  onDeductionBlur: (strategyId: number, value: string) => void;
  onRemove: (strategyId: number) => void;
}

const TOOLS_BASE_URL = "https://tools.eiduktaxandwealth.com";

export const StrategyCardCollapsible = ({
  strategy,
  clientStrategy,
  phaseColor,
  taxRate,
  deductionInput,
  onStatusChange,
  onDeductionChange,
  onDeductionBlur,
  onRemove,
}: StrategyCardCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const status = clientStrategy?.status || "not_started";
  const deduction = clientStrategy?.deduction_amount || 0;
  const taxSavings = Math.round(deduction * taxRate);
  
  const toolConfig = STRATEGY_TOOLS[strategy.id];
  const documents = STRATEGY_DOCUMENTS[strategy.id] || [];

  const formatSavingsRange = () => {
    const low = strategy.typical_savings_low;
    const high = strategy.typical_savings_high;
    
    if (!low && !high) return null;
    
    const formatK = (num: number) => {
      if (num >= 1000) {
        return `$${Math.round(num / 1000)}k`;
      }
      return `$${num}`;
    };
    
    if (low && high) {
      return `${formatK(low)}-${formatK(high)}`;
    }
    if (low) return `${formatK(low)}+`;
    if (high) return `Up to ${formatK(high)}`;
    return null;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "complete":
        return { 
          label: "Complete", 
          icon: Check, 
          className: "bg-emerald-100 text-emerald-700 border-emerald-200" 
        };
      case "in_progress":
        return { 
          label: "In Progress", 
          icon: Clock, 
          className: "bg-amber-100 text-amber-700 border-amber-200" 
        };
      case "not_applicable":
        return { 
          label: "N/A", 
          icon: X, 
          className: "bg-red-100 text-red-700 border-red-200" 
        };
      default:
        return { 
          label: "Not Started", 
          icon: Circle, 
          className: "bg-gray-100 text-gray-600 border-gray-200" 
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const savingsRange = formatSavingsRange();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Simulate document completion status (in real app, this would come from data)
  const getDocumentStatus = (docName: string) => {
    // For demo purposes, mark some as complete based on strategy status
    if (status === "complete") return "complete";
    if (status === "in_progress") {
      return docName.includes("Study") || docName.includes("Schedule") ? "complete" : "pending";
    }
    return "pending";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className="bg-card border rounded-lg overflow-hidden transition-shadow hover:shadow-md"
        style={{ borderLeftWidth: "4px", borderLeftColor: phaseColor }}
      >
        {/* Collapsed Row */}
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors">
            {/* Strategy Number */}
            <span 
              className="font-bold text-sm shrink-0 w-8"
              style={{ color: phaseColor }}
            >
              #{strategy.id}
            </span>
            
            {/* Strategy Name */}
            <span className="font-semibold text-sm flex-1 truncate uppercase tracking-wide">
              {strategy.name}
            </span>
            
            {/* Savings Range */}
            {savingsRange && (
              <span className="text-sm text-muted-foreground shrink-0 hidden sm:block">
                {savingsRange}
              </span>
            )}
            
            {/* Status Badge */}
            <Badge 
              variant="outline" 
              className={cn("shrink-0 gap-1", statusConfig.className)}
            >
              <statusConfig.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
            </Badge>
            
            {/* Expand/Collapse Icon */}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-4">
            {/* Status & Actions Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Dropdown */}
              <Select
                value={status}
                onValueChange={(value) => onStatusChange(strategy.id, value)}
              >
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3.5 w-3.5" />
                      Not Started
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="complete">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5" />
                      Complete
                    </div>
                  </SelectItem>
                  <SelectItem value="not_applicable">
                    <div className="flex items-center gap-2">
                      <X className="h-3.5 w-3.5" />
                      N/A
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Tool Link */}
              {toolConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  asChild
                >
                  <a 
                    href={`${TOOLS_BASE_URL}/${toolConfig.toolPath}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {toolConfig.toolName}
                  </a>
                </Button>
              )}

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-destructive ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(strategy.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Deduction Input (only for complete status) */}
            {status === "complete" && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-emerald-700">Deduction:</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deductionInput}
                    onChange={(e) => onDeductionChange(strategy.id, e.target.value)}
                    onBlur={(e) => onDeductionBlur(strategy.id, e.target.value)}
                    className="h-8 w-32 text-sm bg-white"
                  />
                </div>
                {deduction > 0 && (
                  <span className="text-sm font-semibold text-emerald-700">
                    Tax Savings: {formatCurrency(taxSavings)}
                  </span>
                )}
              </div>
            )}

            {/* Document Checklist */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Checklist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((doc) => {
                    const docStatus = getDocumentStatus(doc.name);
                    return (
                      <div 
                        key={doc.name}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                          docStatus === "complete" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {docStatus === "complete" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{doc.name}</span>
                        {doc.required && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Required
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* IRC Citation */}
            {strategy.irc_citation && (
              <p className="text-xs text-blue-600">
                {strategy.irc_citation}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
