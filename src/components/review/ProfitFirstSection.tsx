import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Info, Pencil, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfitFirstTargets {
  profit: number;
  ownerPay: number;
  tax: number;
  opEx: number;
}

interface IndustryBenchmark {
  industry: string;
  display_name: string;
  profit_target: number;
  owner_pay_target: number;
  tax_target: number;
  opex_target: number;
}

interface ProfitFirstSectionProps {
  revenue: number | null;
  profit: number | null;
  ownerPay: number | null;
  taxPaid: number | null;
  totalExpenses: number | null;
  targets: ProfitFirstTargets;
  industryBenchmark: IndustryBenchmark | null;
  onRevenueChange: (value: number | null) => void;
  onProfitChange: (value: number | null) => void;
  onOwnerPayChange: (value: number | null) => void;
  onTaxPaidChange: (value: number | null) => void;
  onExpensesChange: (value: number | null) => void;
  onTargetChange: (target: keyof ProfitFirstTargets, value: number) => void;
  onResetToDefaults: () => void;
}

interface BucketData {
  actual: number;
  actualDollars: number;
  target: number;
  targetDollars: number;
  industryTarget: number;
  variance: number;
}

interface CalculatedData {
  profit: BucketData;
  ownerPay: BucketData;
  tax: BucketData;
  opEx: BucketData;
}

type Status = 'good' | 'review';

function formatCurrency(value: number | null): string {
  if (value === null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyFull(value: number | null): string {
  if (value === null || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function getStatus(actual: number, target: number, isLowerBetter = false): Status {
  const diff = isLowerBetter ? target - actual : actual - target;
  return diff >= 0 ? 'good' : 'review';
}

// Editable summary card component with edit/confirm pattern
function EditableSummaryCard({
  title,
  subtitle,
  value,
  onChange,
  icon: Icon,
  iconBgClass,
  iconClass,
}: {
  title: string;
  subtitle: string;
  value: number | null;
  onChange: (value: number | null) => void;
  icon: React.ElementType;
  iconBgClass: string;
  iconClass: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() ?? '');

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value?.toString() ?? '');
    }
  }, [value, isEditing]);

  const handleConfirm = () => {
    const num = parseFloat(localValue);
    onChange(isNaN(num) ? null : num);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value?.toString() ?? '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          
          {isEditing ? (
            <div className="mt-1">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="h-8 text-lg font-bold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-1 mt-2">
                <Button size="sm" variant="default" onClick={handleConfirm} className="h-7 px-2">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 px-2">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-foreground truncate">
                {formatCurrencyFull(value)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          
          <p className={cn("text-xs mt-1", iconClass.includes('primary') ? "text-primary" : "text-muted-foreground")}>
            {subtitle}
          </p>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-2", iconBgClass)}>
          <Icon className={cn("h-5 w-5", iconClass)} />
        </div>
      </div>
    </div>
  );
}

export const ProfitFirstSection = ({
  revenue,
  profit,
  ownerPay,
  taxPaid,
  totalExpenses,
  targets,
  industryBenchmark,
  onRevenueChange,
  onProfitChange,
  onOwnerPayChange,
  onTaxPaidChange,
  onExpensesChange,
  onTargetChange,
  onResetToDefaults,
}: ProfitFirstSectionProps) => {
  const [localTargets, setLocalTargets] = useState(targets);

  useEffect(() => {
    setLocalTargets(targets);
  }, [targets]);

  const defaultBenchmark: IndustryBenchmark = {
    industry: 'custom',
    display_name: 'Custom / Other',
    profit_target: 10,
    owner_pay_target: 50,
    tax_target: 15,
    opex_target: 25,
  };

  const benchmark = industryBenchmark || defaultBenchmark;
  const hasRevenue = revenue && revenue > 0;

  // Calculate summary metrics
  const summaryData = useMemo(() => {
    const rev = revenue || 0;
    const netProfit = profit || 0;
    const expenses = totalExpenses || 0;
    const profitMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
    
    return {
      revenue: rev,
      totalExpenses: expenses,
      netProfit,
      profitMargin,
      isProfitable: netProfit > 0,
      isHealthyMargin: profitMargin >= 15,
    };
  }, [revenue, profit, totalExpenses]);

  const calculatedData = useMemo<CalculatedData>(() => {
    const emptyBucket = (target: number, industryTarget: number): BucketData => ({
      actual: 0,
      actualDollars: 0,
      target,
      targetDollars: 0,
      industryTarget,
      variance: 0,
    });

    if (!hasRevenue) {
      return {
        profit: emptyBucket(targets.profit, benchmark.profit_target),
        ownerPay: emptyBucket(targets.ownerPay, benchmark.owner_pay_target),
        tax: emptyBucket(targets.tax, benchmark.tax_target),
        opEx: emptyBucket(targets.opEx, benchmark.opex_target),
      };
    }

    const rev = revenue!;
    const profitValue = profit || 0;
    const ownerPayValue = ownerPay || 0;
    const taxPaidValue = taxPaid || 0;
    const opExValue = totalExpenses || 0;

    const profitActual = (profitValue / rev) * 100;
    const ownerPayActual = (ownerPayValue / rev) * 100;
    const taxActual = (taxPaidValue / rev) * 100;
    const opExActual = Math.max(0, (opExValue / rev) * 100);

    return {
      profit: {
        actual: profitActual,
        actualDollars: profitValue,
        target: targets.profit,
        targetDollars: rev * (targets.profit / 100),
        industryTarget: benchmark.profit_target,
        variance: profitActual - targets.profit,
      },
      ownerPay: {
        actual: ownerPayActual,
        actualDollars: ownerPayValue,
        target: targets.ownerPay,
        targetDollars: rev * (targets.ownerPay / 100),
        industryTarget: benchmark.owner_pay_target,
        variance: ownerPayActual - targets.ownerPay,
      },
      tax: {
        actual: taxActual,
        actualDollars: taxPaidValue,
        target: targets.tax,
        targetDollars: rev * (targets.tax / 100),
        industryTarget: benchmark.tax_target,
        variance: taxActual - targets.tax,
      },
      opEx: {
        actual: opExActual,
        actualDollars: Math.max(0, opExValue),
        target: targets.opEx,
        targetDollars: rev * (targets.opEx / 100),
        industryTarget: benchmark.opex_target,
        variance: targets.opEx - opExActual,
      },
    };
  }, [revenue, profit, ownerPay, taxPaid, totalExpenses, targets, benchmark, hasRevenue]);

  const handleTargetBlur = (key: keyof ProfitFirstTargets) => {
    const value = localTargets[key];
    if (value !== targets[key]) {
      onTargetChange(key, value);
    }
  };

  const handleTargetInputChange = (key: keyof ProfitFirstTargets, value: string) => {
    const num = parseFloat(value) || 0;
    setLocalTargets(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, num)) }));
  };

  const buckets: Array<{
    key: keyof CalculatedData;
    title: string;
    isLowerBetter?: boolean;
    isEditable?: boolean;
    onActualChange?: (value: number | null) => void;
  }> = [
    { key: 'profit', title: 'Profit', isEditable: false },
    { key: 'ownerPay', title: "Owner's Pay", isEditable: true, onActualChange: onOwnerPayChange },
    { key: 'tax', title: 'Tax', isEditable: true, onActualChange: onTaxPaidChange },
    { key: 'opEx', title: 'Operating Expenses', isLowerBetter: true, isEditable: false },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards - Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EditableSummaryCard
          title="Total Revenue"
          subtitle="Gross receipts"
          value={revenue}
          onChange={onRevenueChange}
          icon={DollarSign}
          iconBgClass="bg-primary/10"
          iconClass="text-primary"
        />

        <EditableSummaryCard
          title="Total Expenses"
          subtitle="Operating expenses"
          value={totalExpenses}
          onChange={onExpensesChange}
          icon={TrendingDown}
          iconBgClass="bg-destructive/10"
          iconClass="text-destructive"
        />

        <EditableSummaryCard
          title="Net Profit"
          subtitle={summaryData.isProfitable ? "Profitable" : "Not profitable"}
          value={profit}
          onChange={onProfitChange}
          icon={TrendingUp}
          iconBgClass={summaryData.isProfitable ? "bg-emerald-500/10" : "bg-destructive/10"}
          iconClass={summaryData.isProfitable ? "text-emerald-600" : "text-destructive"}
        />

        {/* Profit Margin (calculated, not editable) */}
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatPercent(summaryData.profitMargin)}
              </p>
              <p className={cn("text-xs mt-1", summaryData.isHealthyMargin ? "text-emerald-600" : "text-amber-600")}>
                {summaryData.isHealthyMargin ? "Healthy margin" : "Below target"}
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              summaryData.isHealthyMargin ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}>
              <CheckCircle className={cn("h-5 w-5", summaryData.isHealthyMargin ? "text-emerald-600" : "text-amber-600")} />
            </div>
          </div>
        </div>
      </div>

      {/* Profit First Methodology Section */}
      <div className="bg-slate-50 rounded-lg p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Profit First Methodology</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Based on Mike Michalowicz's Profit First methodology</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResetToDefaults}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset to Defaults
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Based on your revenue of {formatCurrency(summaryData.revenue)}, here are the recommended Profit First allocations
        </p>

        {/* Profit First Bucket Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {buckets.map(({ key, title, isLowerBetter, isEditable, onActualChange }) => {
            const data = calculatedData[key];
            const status = hasRevenue ? getStatus(data.actual, data.target, isLowerBetter) : null;
            const isGood = status === 'good';
            const varianceValue = isLowerBetter ? data.variance : data.actual - data.target;
            const showPositive = varianceValue >= 0;
            const targetKey = key === 'ownerPay' ? 'ownerPay' : key as keyof ProfitFirstTargets;

            return (
              <div
                key={key}
                className="bg-card rounded-lg p-4 border shadow-sm"
              >
                {/* Header with title and status icon */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {title}
                  </h4>
                  {hasRevenue && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isGood ? "bg-emerald-100" : "bg-destructive/10"
                    )}>
                      {isGood ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>

                {/* Main percentage and variance */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    hasRevenue ? (isGood ? "text-emerald-600" : "text-destructive") : "text-foreground"
                  )}>
                    {hasRevenue ? formatPercent(data.actual) : '—'}
                  </span>
                  {hasRevenue && (
                    <span className={cn(
                      "text-sm font-medium",
                      showPositive ? "text-emerald-600" : "text-destructive"
                    )}>
                      {showPositive ? '+' : ''}{varianceValue.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Target with editable input */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <span>Target:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={localTargets[targetKey]}
                    onChange={(e) => handleTargetInputChange(targetKey, e.target.value)}
                    onBlur={() => handleTargetBlur(targetKey)}
                    className="w-14 h-6 text-center text-xs px-1"
                  />
                  <span>%</span>
                </div>

                {/* Actual and Target dollar amounts */}
                <div className="space-y-1 text-sm border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Actual</span>
                    {isEditable && onActualChange ? (
                      <div className="flex items-center">
                        <span className="text-muted-foreground text-xs mr-1">$</span>
                        <Input
                          type="number"
                          value={data.actualDollars || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onActualChange(isNaN(val) ? null : val);
                          }}
                          className="w-20 h-6 text-right text-xs px-1"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <span className="font-medium tabular-nums">
                        {hasRevenue ? formatCurrency(data.actualDollars) : '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium tabular-nums">
                      {hasRevenue ? formatCurrency(data.targetDollars) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
