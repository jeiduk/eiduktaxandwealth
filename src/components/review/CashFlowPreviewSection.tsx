import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
  Receipt,
  Building2,
  DollarSign,
  Calendar,
  PiggyBank,
  Download,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Edit2,
  HelpCircle,
} from "lucide-react";

interface ProfitFirstTargets {
  profit: number;
  ownerPay: number;
  tax: number;
  opEx: number;
}

interface CashFlowPreviewSectionProps {
  quarter: string;
  revenueYtd: number | null;
  profitYtd: number | null;
  drawYtd: number | null;
  taxYtd: number | null;
  totalExpenses: number | null;
  cogs: number | null;
  pnlMonthCount?: number | null;
  pnlMonthCountDetected?: number | null;
  targets: ProfitFirstTargets;
  onApplyTargets?: () => void;
  onMonthCountChange?: (value: number | null) => void;
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getQuarterNumber(quarter: string): number {
  const match = quarter.match(/Q(\d)/);
  return match ? parseInt(match[1]) : 4;
}

type GapStatus = "good" | "warning" | "danger";

function getGapStatus(gap: number, isLowerBetter = false): GapStatus {
  const absGap = Math.abs(gap);
  if (isLowerBetter) {
    // For OpEx, being under target is good
    if (gap <= 0) return "good";
    if (absGap <= 2) return "good";
    if (absGap <= 5) return "warning";
    return "danger";
  }
  // For Profit, Owner's Pay, Tax - being at or above target is good
  if (gap >= -2) return "good";
  if (gap >= -5) return "warning";
  return "danger";
}

function getStatusIcon(status: GapStatus) {
  switch (status) {
    case "good":
      return <div className="w-3 h-3 rounded-full bg-emerald-500" />;
    case "warning":
      return <div className="w-3 h-3 rounded-full bg-amber-500" />;
    case "danger":
      return <div className="w-3 h-3 rounded-full bg-red-500" />;
  }
}

const CATEGORY_CONFIG = {
  profit: {
    icon: PiggyBank,
    color: "#059669",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    label: "PROFIT",
    description: "Funds Strategy #19 Solo 401(k), #20 Cash Balance",
    yearLabel: "for retirement contributions",
    tooltip: "The percentage of Real Revenue set aside as true profit before paying yourself. This is money for growth, dividends, or emergency reserves.",
  },
  ownerPay: {
    icon: Wallet,
    color: "#7C3AED",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-700",
    label: "OWNER'S PAY",
    description: "Strategy #1 Reasonable Compensation",
    yearLabel: "W-2 salary",
    tooltip: "Your reasonable compensation as the business owner. This is your W-2 salary that should reflect fair market value for your role.",
  },
  tax: {
    icon: Receipt,
    color: "#EA580C",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    label: "TAX",
    description: "Strategy #31 PTET Election",
    yearLabel: "for estimates & PTET",
    tooltip: "Money set aside for federal, state, and local taxes including quarterly estimated payments and PTET (Pass-Through Entity Tax) elections.",
  },
  opEx: {
    icon: Building2,
    color: "#2C5AA0",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    label: "OPEX",
    description: "Strategy #3 Accountable Plan, #8 Depreciation",
    yearLabel: "operating expenses",
    tooltip: "Operating Expenses - the costs to run your business day-to-day including rent, utilities, payroll, software, and other overhead costs.",
  },
};

export const CashFlowPreviewSection = ({
  quarter,
  revenueYtd,
  profitYtd,
  drawYtd,
  taxYtd,
  totalExpenses,
  cogs,
  pnlMonthCount,
  pnlMonthCountDetected,
  targets,
  onApplyTargets,
  onMonthCountChange,
}: CashFlowPreviewSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [editingMonthCount, setEditingMonthCount] = useState(false);
  const [tempMonthCount, setTempMonthCount] = useState<string>("");

  // Check if month count has been manually overridden
  const isMonthCountOverridden = pnlMonthCountDetected !== null && 
    pnlMonthCount !== null && 
    pnlMonthCount !== pnlMonthCountDetected;

  const calculations = useMemo(() => {
    const currentQuarter = getQuarterNumber(quarter);
    const revenue = revenueYtd || 0;
    const cogsValue = cogs || 0;

    // Use detected month count from P&L import if available, otherwise calculate from quarter
    const monthsInData = pnlMonthCount || (currentQuarter * 3);
    
    // Calculate true monthly revenue by dividing YTD by actual months
    const monthlyRevenue = monthsInData > 0 ? revenue / monthsInData : 0;
    
    // Annualize based on monthly average
    const annualRevenue = monthlyRevenue * 12;
    const perTransfer = monthlyRevenue / 2; // Bi-monthly (10th & 25th)

    // Real Revenue = Gross Revenue - COGS
    const realRevenue = revenue - cogsValue;
    const monthlyRealRevenue = monthsInData > 0 ? realRevenue / monthsInData : 0;

    // Target amounts per transfer
    const profitTransfer = perTransfer * (targets.profit / 100);
    const ownerTransfer = perTransfer * (targets.ownerPay / 100);
    const taxTransfer = perTransfer * (targets.tax / 100);
    const opexTransfer = perTransfer * (targets.opEx / 100);

    // Current percentages (CAPs) from actual data
    const profit = profitYtd || 0;
    const draw = drawYtd || 0;
    const tax = taxYtd || 0;
    const expenses = totalExpenses || 0;

    const currentProfitPct = realRevenue > 0 ? (profit / realRevenue) * 100 : 0;
    const currentOwnerPct = realRevenue > 0 ? (draw / realRevenue) * 100 : 0;
    const currentTaxPct = realRevenue > 0 ? (tax / realRevenue) * 100 : 0;
    const currentOpexPct =
      realRevenue > 0
        ? ((expenses - cogsValue - draw - tax) / realRevenue) * 100
        : 0;

    // Gap calculations
    const profitGap = currentProfitPct - targets.profit;
    const ownerGap = currentOwnerPct - targets.ownerPay;
    const taxGap = currentTaxPct - targets.tax;
    const opexGap = currentOpexPct - targets.opEx;

    // 12-month impact
    const annualRealRevenue = realRevenue * (4 / currentQuarter);
    const profitImpact = (profitGap / 100) * annualRealRevenue;
    const ownerImpact = (ownerGap / 100) * annualRealRevenue;
    const taxImpact = (taxGap / 100) * annualRealRevenue;
    const opexImpact = (opexGap / 100) * annualRealRevenue;

    return {
      annualRevenue,
      monthlyRevenue,
      realRevenue,
      monthlyRealRevenue,
      perTransfer,
      transfers: {
        profit: profitTransfer,
        ownerPay: ownerTransfer,
        tax: taxTransfer,
        opEx: opexTransfer,
      },
      annuals: {
        profit: profitTransfer * 24,
        ownerPay: ownerTransfer * 24,
        tax: taxTransfer * 24,
        opEx: opexTransfer * 24,
      },
      current: {
        profit: currentProfitPct,
        ownerPay: currentOwnerPct,
        tax: currentTaxPct,
        opEx: Math.max(0, currentOpexPct),
      },
      gaps: {
        profit: profitGap,
        ownerPay: ownerGap,
        tax: taxGap,
        opEx: opexGap,
      },
      impacts: {
        profit: profitImpact,
        ownerPay: ownerImpact,
        tax: taxImpact,
        opEx: opexImpact,
      },
      hasData: revenue > 0,
    };
  }, [
    quarter,
    revenueYtd,
    profitYtd,
    drawYtd,
    taxYtd,
    totalExpenses,
    cogs,
    pnlMonthCount,
    targets,
  ]);

  // Generate dynamic insights
  const insights = useMemo(() => {
    const items: Array<{
      type: "danger" | "warning" | "info";
      title: string;
      description: string;
      action: string;
    }> = [];

    if (!calculations.hasData) return items;

    // Profit gap insights
    if (calculations.gaps.profit < -5) {
      items.push({
        type: "danger",
        title: `You're leaving ${formatCurrency(Math.abs(calculations.impacts.profit))}/year on the table in PROFIT`,
        description:
          "This could fund a Solo 401(k) + Cash Balance Plan for tax-deferred retirement savings.",
        action: "Review Strategy #19 Solo 401(k), #20 Cash Balance Plan",
      });
    }

    // Owner's Pay insights
    if (calculations.gaps.ownerPay < -5) {
      items.push({
        type: "warning",
        title: `Your Owner's Pay is below target by ${formatCurrency(Math.abs(calculations.impacts.ownerPay))}`,
        description:
          "Risk: IRS may consider you underpaid, increasing audit risk for S-Corps.",
        action: "Review Strategy #1 Reasonable Compensation",
      });
    } else if (calculations.gaps.ownerPay > 5) {
      items.push({
        type: "info",
        title: `Your Owner's Pay exceeds target by ${formatCurrency(calculations.impacts.ownerPay)}`,
        description:
          "You may be overpaying payroll taxes. Consider shifting to distributions after reasonable comp.",
        action: "Review Strategy #1 Reasonable Compensation",
      });
    }

    // Tax insights
    if (calculations.gaps.tax < -5) {
      items.push({
        type: "warning",
        title: `Your TAX reserves are underfunded by ${formatCurrency(Math.abs(calculations.impacts.tax))}`,
        description:
          "Risk: You may scramble at tax time or miss PTET election opportunities.",
        action: "Build reserves for Strategy #31 PTET",
      });
    }

    // OpEx insights
    if (calculations.gaps.opEx > 5) {
      items.push({
        type: "danger",
        title: `Operating expenses are ${formatCurrency(calculations.impacts.opEx)} over target`,
        description:
          "Review expenses for optimization opportunities and potential deductions.",
        action: "See Strategy #3 Accountable Plan, #8 Depreciation",
      });
    }

    return items;
  }, [calculations]);

  const handleDownloadPdf = () => {
    // TODO: Implement PDF generation
    window.print();
  };

  if (!calculations.hasData) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-2" style={{ borderColor: "#1E3A5F" }}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Cash Flow Allocation Preview
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    What your bi-monthly transfers would look like
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Enter revenue data in the Profit First section above to see
                  your cash flow allocation preview.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 overflow-hidden" style={{ borderColor: "#1E3A5F" }}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ backgroundColor: "#1E3A5F08" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#1E3A5F" }}
              >
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Cash Flow Allocation Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  What your bi-monthly transfers would look like
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-6">
            {/* Row 1: Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Real Revenue (YTD) Card */}
              <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">
                        Real Revenue (YTD)
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              <strong>Real Revenue</strong> = Gross Revenue minus COGS. 
                              <strong> Annualized</strong> = (Real Revenue ÷ months) × 12 for planning.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">
                      {formatCurrency(calculations.realRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(calculations.annualRevenue)}/yr annualized
                    </p>
                  </div>
                </div>
              </Card>

              {/* 2. Monthly Real Revenue Card */}
              <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-200 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">
                        Monthly Real Revenue
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              <strong>Real Revenue</strong> = Gross Revenue minus COGS (Materials & Subs). 
                              This is your actual revenue after subtracting cost of goods sold.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold text-teal-700">
                      {formatCurrency(calculations.monthlyRealRevenue)}
                    </p>
                    {pnlMonthCount && (cogs || 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(calculations.realRevenue)} ÷ {pnlMonthCount} month{pnlMonthCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* 3. Per Transfer Card */}
              <Card
                className="p-4 border-2"
                style={{
                  backgroundColor: "#C9A22710",
                  borderColor: "#C9A227",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#C9A227" }}
                  >
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">
                        Per Transfer (2x/month)
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              Profit First recommends transferring funds <strong>twice per month</strong> (on the 10th and 25th) to build consistent cash flow habits and maintain discipline.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p
                      className="text-xl font-bold"
                      style={{ color: "#1E3A5F" }}
                    >
                      {formatCurrency(calculations.perTransfer)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 4. Monthly Revenue Card */}
              <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">
                        Monthly Revenue
                      </p>
                      {pnlMonthCount && !editingMonthCount && (
                        <button
                          onClick={() => {
                            setTempMonthCount(String(pnlMonthCount));
                            setEditingMonthCount(true);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 text-xs transition-colors",
                            isMonthCountOverridden 
                              ? "text-amber-600 hover:text-amber-700 font-medium" 
                              : "text-primary hover:text-primary/80"
                          )}
                          title={isMonthCountOverridden 
                            ? `Manually adjusted from detected ${pnlMonthCountDetected} months. Click to edit.`
                            : "Click to adjust month count"
                          }
                        >
                          (YTD ÷ {pnlMonthCount})
                          {isMonthCountOverridden && (
                            <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal border-amber-400 text-amber-600 bg-amber-50">
                              manual
                            </Badge>
                          )}
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                      {editingMonthCount && (
                        <div className="inline-flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">(YTD ÷</span>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={tempMonthCount}
                            onChange={(e) => setTempMonthCount(e.target.value)}
                            onBlur={() => {
                              const parsed = parseInt(tempMonthCount);
                              if (parsed >= 1 && parsed <= 12) {
                                onMonthCountChange?.(parsed);
                              }
                              setEditingMonthCount(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const parsed = parseInt(tempMonthCount);
                                if (parsed >= 1 && parsed <= 12) {
                                  onMonthCountChange?.(parsed);
                                }
                                setEditingMonthCount(false);
                              } else if (e.key === "Escape") {
                                setEditingMonthCount(false);
                              }
                            }}
                            autoFocus
                            className="w-12 h-5 text-xs p-1 text-center"
                          />
                          <span className="text-xs text-muted-foreground">)</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(calculations.monthlyRevenue)}
                    </p>
                    {pnlMonthCount && !editingMonthCount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(revenueYtd || 0)} YTD ÷ {pnlMonthCount} month{pnlMonthCount !== 1 ? 's' : ''}
                        {isMonthCountOverridden && (
                          <span className="text-amber-600 ml-1">(adjusted)</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 2: Transfer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(
                Object.keys(CATEGORY_CONFIG) as Array<
                  keyof typeof CATEGORY_CONFIG
                >
              ).map((key) => {
                const config = CATEGORY_CONFIG[key];
                const Icon = config.icon;
                const transfer = calculations.transfers[key];
                const annual = calculations.annuals[key];
                const targetPct = targets[key];

                return (
                  <Card
                    key={key}
                    className={cn("p-4 border-2", config.borderColor)}
                    style={{ backgroundColor: `${config.color}08` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">{config.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {targetPct}%
                      </span>
                    </div>

                    <p
                      className="text-2xl font-bold mb-1"
                      style={{ color: config.color }}
                    >
                      {formatCurrency(transfer)}
                    </p>
                    <p className="text-xs text-muted-foreground">per transfer</p>

                    <div className="flex items-center gap-1 mt-3 text-sm">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(annual)}/year
                      </span>
                      <span className="text-muted-foreground">
                        {config.yearLabel}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {config.description}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* Row 3: Gap Analysis Table */}
            <Card className="overflow-hidden">
              <div className="p-3 bg-slate-50 border-b">
                <h4 className="font-semibold text-sm">Gap Analysis</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead className="text-right">You Now</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                    <TableHead className="text-right">12-Month Impact</TableHead>
                    <TableHead className="w-[60px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { key: "profit" as const, label: "Profit", isLowerBetter: false },
                    { key: "ownerPay" as const, label: "Owner's Pay", isLowerBetter: false },
                    { key: "tax" as const, label: "Tax", isLowerBetter: false },
                    { key: "opEx" as const, label: "OpEx", isLowerBetter: true },
                  ].map(({ key, label, isLowerBetter }) => {
                    const current = calculations.current[key];
                    const target = targets[key];
                    const gap = calculations.gaps[key];
                    const impact = calculations.impacts[key];
                    const status = getGapStatus(gap, isLowerBetter);
                    const config = CATEGORY_CONFIG[key];

                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: config.color }}
                            />
                            <span className="font-medium">{label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercent(current)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercent(target)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-medium",
                            gap > 0 && !isLowerBetter && "text-emerald-600",
                            gap < 0 && !isLowerBetter && "text-red-600",
                            gap > 0 && isLowerBetter && "text-red-600",
                            gap < 0 && isLowerBetter && "text-emerald-600"
                          )}
                        >
                          {gap >= 0 ? "+" : ""}
                          {formatPercent(gap)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-medium",
                            impact > 0 && !isLowerBetter && "text-emerald-600",
                            impact < 0 && !isLowerBetter && "text-red-600",
                            impact > 0 && isLowerBetter && "text-red-600",
                            impact < 0 && isLowerBetter && "text-emerald-600"
                          )}
                        >
                          {impact >= 0 ? "+" : ""}
                          {formatCurrency(impact)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusIcon(status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Row 4: What This Means (Insights) */}
            {insights.length > 0 && (
              <Collapsible open={showInsights} onOpenChange={setShowInsights}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 bg-amber-50 border-b border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <h4 className="font-semibold text-sm">
                          What This Means ({insights.length} insight
                          {insights.length !== 1 ? "s" : ""})
                        </h4>
                      </div>
                      {showInsights ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-3">
                      {insights.map((insight, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-lg border-l-4",
                            insight.type === "danger" &&
                              "bg-red-50 border-red-500",
                            insight.type === "warning" &&
                              "bg-amber-50 border-amber-500",
                            insight.type === "info" &&
                              "bg-blue-50 border-blue-500"
                          )}
                        >
                          <p className="font-medium text-sm">{insight.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <p className="text-xs text-primary mt-2 font-medium">
                            → {insight.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Row 5: Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF Proposal
              </Button>
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                View Bank Setup Guide
              </Button>
              {onApplyTargets && (
                <Button
                  onClick={onApplyTargets}
                  className="gap-2"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply to This Review
                </Button>
              )}
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Based on Profit First® methodology by Mike Michalowicz
            </p>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
