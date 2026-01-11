import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  Check, 
  Clock, 
  Circle, 
  ExternalLink,
  Trash2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

// Strategy tool configurations
const STRATEGY_TOOLS: Record<number, { toolName: string; toolPath: string }> = {
  1: { toolName: "Reasonable Comp Calculator", toolPath: "reasonable-comp" },
  2: { toolName: "Entity Comparison Tool", toolPath: "entity-comparison" },
  3: { toolName: "Basis Tracker", toolPath: "basis-tracker" },
  4: { toolName: "Accountable Plan Generator", toolPath: "accountable-plan" },
  5: { toolName: "Home Office Calculator", toolPath: "home-office" },
  6: { toolName: "Vehicle Deduction Calculator", toolPath: "vehicle-deduction" },
};

// Document checklist by strategy
const STRATEGY_DOCUMENTS: Record<number, { id: string; name: string; required: boolean }[]> = {
  1: [
    { id: "comp-study", name: "Compensation Study", required: true },
    { id: "job-desc", name: "Job Description", required: true },
    { id: "board-res", name: "Board Resolution", required: true },
    { id: "payroll-records", name: "Payroll Records", required: false },
  ],
  2: [
    { id: "entity-docs", name: "Entity Formation Docs", required: true },
    { id: "operating-agreement", name: "Operating Agreement", required: true },
    { id: "tax-returns", name: "Prior Tax Returns", required: false },
  ],
  3: [
    { id: "basis-schedule", name: "Basis Schedule", required: true },
    { id: "k1-forms", name: "K-1 Forms", required: true },
    { id: "contribution-records", name: "Contribution Records", required: false },
  ],
  4: [
    { id: "expense-policy", name: "Expense Policy", required: true },
    { id: "receipts", name: "Expense Receipts", required: true },
  ],
  5: [
    { id: "floor-plan", name: "Floor Plan/Measurements", required: true },
    { id: "utility-bills", name: "Utility Bills", required: false },
  ],
  6: [
    { id: "mileage-log", name: "Mileage Log", required: true },
    { id: "vehicle-title", name: "Vehicle Title", required: true },
  ],
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
  const [isHovered, setIsHovered] = useState(false);
  
  // Track document statuses locally (in real app, persist to database)
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, "received" | "pending" | "needed">>({});
  
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
          className: "bg-emerald-100 text-emerald-700 border-emerald-300" 
        };
      case "in_progress":
        return { 
          label: "In Progress", 
          icon: Clock, 
          className: "bg-amber-100 text-amber-700 border-amber-300" 
        };
      default:
        return { 
          label: "Not Started", 
          icon: Circle, 
          className: "bg-gray-100 text-gray-600 border-gray-300" 
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

  // Get document status with fallback
  const getDocumentStatus = (docId: string): "received" | "pending" | "needed" => {
    if (documentStatuses[docId]) return documentStatuses[docId];
    // Default based on strategy status
    if (status === "complete") return "received";
    if (status === "in_progress") return "pending";
    return "needed";
  };

  const toggleDocumentStatus = (docId: string) => {
    const currentStatus = getDocumentStatus(docId);
    const nextStatus: "received" | "pending" | "needed" = 
      currentStatus === "needed" ? "pending" :
      currentStatus === "pending" ? "received" : "needed";
    
    setDocumentStatuses(prev => ({
      ...prev,
      [docId]: nextStatus
    }));
  };

  const getDocumentStatusBadge = (docStatus: "received" | "pending" | "needed") => {
    switch (docStatus) {
      case "received":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">Received</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">Pending</Badge>;
      case "needed":
        return <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">Needed</Badge>;
    }
  };

  // Calculate document progress
  const receivedCount = documents.filter(doc => getDocumentStatus(doc.id) === "received").length;
  const totalDocs = documents.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className={cn(
          "bg-white rounded-xl overflow-hidden transition-all duration-300",
          isOpen ? "shadow-lg" : "shadow-sm hover:shadow-md"
        )}
        style={{ 
          borderLeft: "4px solid #1e40af",
          borderRadius: "12px"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed Row */}
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors">
            {/* Strategy Number */}
            <span 
              className="font-bold text-sm shrink-0"
              style={{ color: "#1e40af" }}
            >
              #{strategy.id}
            </span>
            
            {/* Strategy Name */}
            <span className="font-semibold text-sm flex-1 truncate uppercase tracking-wide text-slate-800">
              {strategy.name}
            </span>
            
            {/* Savings Range Badge */}
            {savingsRange && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 shrink-0 gap-1">
                <DollarSign className="h-3 w-3" />
                {savingsRange}
              </Badge>
            )}
            
            {/* Status Badge */}
            <Badge 
              variant="outline" 
              className={cn("shrink-0 gap-1", statusConfig.className)}
            >
              <statusConfig.icon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
            
            {/* Chevron Icon */}
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300",
                isOpen && "rotate-180"
              )} 
            />
            
            {/* Delete Icon - Show on hover only */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(strategy.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-4">
            {/* Tool Link Button */}
            {toolConfig && (
              <a 
                href={`${TOOLS_BASE_URL}/${toolConfig.toolPath}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-[#eff6ff] text-[#1e40af] hover:bg-[#2c5aa0] hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {toolConfig.toolName}
              </a>
            )}

            {/* Document Checklist */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Required Documents</h4>
                  <span className="text-xs text-slate-500">
                    {receivedCount} of {totalDocs} collected
                  </span>
                </div>
                
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const docStatus = getDocumentStatus(doc.id);
                    return (
                      <div 
                        key={doc.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <Checkbox 
                          checked={docStatus === "received"}
                          onCheckedChange={() => toggleDocumentStatus(doc.id)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <span className="flex-1 text-sm text-slate-700">{doc.name}</span>
                        {getDocumentStatusBadge(docStatus)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deduction Input (only for complete status) */}
            {status === "complete" && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-emerald-700 font-medium">Deduction:</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deductionInput}
                    onChange={(e) => onDeductionChange(strategy.id, e.target.value)}
                    onBlur={(e) => onDeductionBlur(strategy.id, e.target.value)}
                    className="h-8 w-32 text-sm bg-white border-emerald-200"
                  />
                </div>
                {deduction > 0 && (
                  <span className="text-sm font-semibold text-emerald-700">
                    Tax Savings: {formatCurrency(taxSavings)}
                  </span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
