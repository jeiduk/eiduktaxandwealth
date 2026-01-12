import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Check, 
  Clock, 
  Circle, 
  ExternalLink,
  Trash2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPhaseColor } from "@/lib/strategy-constants";
interface StrategyDocument {
  id: string;
  name: string;
}

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
  strategy_number: string | null;
  tool_url: string | null;
  tool_name: string | null;
  documents: StrategyDocument[] | null;
  what_it_is: string | null;
  client_overview: string | null;
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
  document_statuses: Record<string, "received" | "pending" | "needed"> | null;
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
  onDocumentStatusChange?: (clientStrategyId: string, documentId: string, status: "received" | "pending" | "needed") => void;
}

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
  onDocumentStatusChange,
}: StrategyCardCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localDocStatuses, setLocalDocStatuses] = useState<Record<string, "received" | "pending" | "needed">>({});
  
  const status = clientStrategy?.status || "not_started";
  const deduction = clientStrategy?.deduction_amount || 0;
  const taxSavings = Math.round(deduction * taxRate);
  
  // Use database fields
  const strategyNumber = strategy.strategy_number || `#${strategy.id}`;
  const toolUrl = strategy.tool_url;
  const toolName = strategy.tool_name || "Open Tool";
  const documents = strategy.documents || [];

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

  // Get document status from database or local state
  const getDocumentStatus = (docId: string): "received" | "pending" | "needed" => {
    // First check local state (for optimistic updates)
    if (localDocStatuses[docId]) return localDocStatuses[docId];
    // Then check database value
    if (clientStrategy?.document_statuses?.[docId]) return clientStrategy.document_statuses[docId];
    // Default based on strategy status
    if (status === "complete") return "received";
    if (status === "in_progress") return "pending";
    return "needed";
  };

  const toggleDocumentStatus = (docId: string) => {
    if (!clientStrategy) return;
    
    const currentStatus = getDocumentStatus(docId);
    const nextStatus: "received" | "pending" | "needed" = 
      currentStatus === "needed" ? "pending" :
      currentStatus === "pending" ? "received" : "needed";
    
    // Optimistic update
    setLocalDocStatuses(prev => ({
      ...prev,
      [docId]: nextStatus
    }));

    // Call parent handler if provided
    if (onDocumentStatusChange) {
      onDocumentStatusChange(clientStrategy.id, docId, nextStatus);
    }
  };

  const getDocumentStatusBadge = (docStatus: "received" | "pending" | "needed") => {
    switch (docStatus) {
      case "received":
        return <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-xs font-medium">Received</Badge>;
      case "pending":
        return <Badge className="bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 text-xs font-medium">Pending</Badge>;
      case "needed":
        return <Badge className="bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30 text-xs font-medium">Needed</Badge>;
    }
  };

  // Calculate document progress
  const receivedCount = documents.filter(doc => getDocumentStatus(doc.id) === "received").length;
  const totalDocs = documents.length;

  const dynamicPhaseColor = getPhaseColor(strategy.phase);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className={cn(
          "bg-white rounded-xl overflow-hidden transition-all duration-300",
          isOpen ? "shadow-lg" : "shadow-sm hover:shadow-md"
        )}
        style={{ 
          borderLeft: `4px solid ${dynamicPhaseColor}`,
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
              style={{ color: dynamicPhaseColor }}
            >
              {strategyNumber}
            </span>
            
            {/* Strategy Name with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-semibold text-sm flex-1 truncate uppercase tracking-wide text-slate-800">
                  {strategy.name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{strategy.name}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Savings Range Badge */}
            {savingsRange && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 shrink-0 gap-1">
                <DollarSign className="h-3 w-3" />
                {savingsRange}
              </Badge>
            )}
            
            {/* Status Selector */}
            <Select
              value={status}
              onValueChange={(value) => onStatusChange(strategy.id, value)}
            >
              <SelectTrigger 
                className={cn(
                  "h-7 w-[130px] text-xs border shrink-0",
                  statusConfig.className
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <statusConfig.icon className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="not_started">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-gray-500" />
                    Not Started
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-600" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="complete">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Complete
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
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
            {/* Full Strategy Name */}
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              {strategyNumber} {strategy.name}
            </h3>

            {/* What It Is */}
            {strategy.what_it_is && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What It Is</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{strategy.what_it_is}</p>
              </div>
            )}

            {/* Client Overview */}
            {strategy.client_overview && (
              <div className="space-y-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Client Overview</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{strategy.client_overview}</p>
              </div>
            )}

            {/* Tool Link Button */}
            {toolUrl && (
              <a 
                href={toolUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-[#eff6ff] text-[#1e40af] hover:bg-[#2c5aa0] hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {toolName}
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
