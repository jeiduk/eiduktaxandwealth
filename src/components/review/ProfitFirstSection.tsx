import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Info } from "lucide-react";
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
  totalExpenses: number | null;
  targets: ProfitFirstTargets;
  industryBenchmark: IndustryBenchmark | null;
  onRevenueChange: (value: number | null) => void;
  onProfitChange: (value: number | null) => void;
  onOwnerPayChange: (value: number | null) => void;
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

function formatPercent(value: number | null): string {
  if (value === null || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function getStatus(actual: number, target: number, isLowerBetter = false): Status {
  const diff = isLowerBetter ? target - actual : actual - target;
  return diff >= 0 ? 'good' : 'review';
}

// Editable currency input component
function CurrencyInput({ 
  value, 
  onChange, 
  onBlur,
  placeholder = "0"
}: { 
  value: number | null; 
  onChange: (value: number | null) => void;
  onBlur?: (value: number | null) => void;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value?.toString() ?? '');

  useEffect(() => {
    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    const num = parseFloat(val);
    onChange(isNaN(num) ? null : num);
  };

  const handleBlur = () => {
    const num = parseFloat(localValue);
    const finalValue = isNaN(num) ? null : num;
    onBlur?.(finalValue);
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="h-10 text-xl font-bold bg-transparent border-0 border-b-2 border-dashed border-muted-foreground/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

export const ProfitFirstSection = ({
  revenue,
  profit,
  ownerPay,
  totalExpenses,
  targets,
  industryBenchmark,
  onRevenueChange,
  onProfitChange,
  onOwnerPayChange,
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
    const taxReserve = rev * (targets.tax / 100);
    const opExValue = totalExpenses || (rev - profitValue - ownerPayValue - taxReserve);

    const profitActual = (profitValue / rev) * 100;
    const ownerPayActual = (ownerPayValue / rev) * 100;
    const taxActual = (taxReserve / rev) * 100;
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
        actualDollars: taxReserve,
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
        variance: targets.opEx - opExActual, // Inverted for OpEx (lower is better)
      },
    };
  }, [revenue, profit, ownerPay, totalExpenses, targets, benchmark, hasRevenue]);

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
    { key: 'tax', title: 'Tax', isEditable: false },
    { key: 'opEx', title: 'Operating Expenses', isLowerBetter: true, isEditable: false },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards - Top Row (Editable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <div className="flex items-center mt-1">
                <span className="text-muted-foreground mr-1">$</span>
                <CurrencyInput 
                  value={revenue} 
                  onChange={onRevenueChange}
                  onBlur={onRevenueChange}
                />
              </div>
              <p className="text-xs text-primary mt-1">Gross receipts</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <div className="flex items-center mt-1">
                <span className="text-muted-foreground mr-1">$</span>
                <CurrencyInput 
                  value={totalExpenses} 
                  onChange={onExpensesChange}
                  onBlur={onExpensesChange}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Operating expenses</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <div className="flex items-center mt-1">
                <span className="text-muted-foreground mr-1">$</span>
                <CurrencyInput 
                  value={profit} 
                  onChange={onProfitChange}
                  onBlur={onProfitChange}
                />
              </div>
              <p className={cn("text-xs mt-1", summaryData.isProfitable ? "text-emerald-600" : "text-destructive")}>
                {summaryData.isProfitable ? "Profitable" : "Not profitable"}
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              summaryData.isProfitable ? "bg-emerald-500/10" : "bg-destructive/10"
            )}>
              <TrendingUp className={cn("h-5 w-5", summaryData.isProfitable ? "text-emerald-600" : "text-destructive")} />
            </div>
          </div>
        </div>

        {/* Profit Margin (calculated) */}
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
