import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, BarChart3 } from "lucide-react";

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
  targets: ProfitFirstTargets;
  industryBenchmark: IndustryBenchmark | null;
  onTargetChange: (target: keyof ProfitFirstTargets, value: number) => void;
  onResetToDefaults: () => void;
}

interface BucketData {
  actual: number;
  target: number;
  industryTarget: number;
}

interface CalculatedData {
  profit: BucketData;
  ownerPay: BucketData;
  tax: BucketData;
  opEx: BucketData;
}

type Status = 'good' | 'on-track' | 'review';

const statusConfig = {
  'good': {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    icon: '✓',
  },
  'on-track': {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    icon: '●',
  },
  'review': {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    icon: '⚠',
  },
};

function getStatus(actual: number, target: number, isLowerBetter = false): Status {
  const diff = isLowerBetter ? target - actual : actual - target;

  if (diff >= 0) return 'good';           // At or better than target
  if (diff >= -5) return 'on-track';      // Within 5%
  return 'review';                         // More than 5% off
}

function getStatusLabel(status: Status, isOpEx = false, actual: number, industryTarget: number): string {
  if (isOpEx) {
    if (status === 'good') return actual <= industryTarget ? 'Below Industry' : 'Good';
    if (status === 'on-track') return 'On Track';
    return 'Review';
  }
  if (status === 'good') return actual >= industryTarget ? 'Above Industry' : 'Above Target';
  if (status === 'on-track') return 'On Track';
  return 'Below Target';
}

export const ProfitFirstSection = ({
  revenue,
  profit,
  ownerPay,
  targets,
  industryBenchmark,
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

  const calculatedData = useMemo<CalculatedData>(() => {
    if (!hasRevenue) {
      // Return structure with null-like actuals when no revenue
      return {
        profit: {
          actual: null as unknown as number,
          target: targets.profit,
          industryTarget: benchmark.profit_target,
        },
        ownerPay: {
          actual: null as unknown as number,
          target: targets.ownerPay,
          industryTarget: benchmark.owner_pay_target,
        },
        tax: {
          actual: null as unknown as number,
          target: targets.tax,
          industryTarget: benchmark.tax_target,
        },
        opEx: {
          actual: null as unknown as number,
          target: targets.opEx,
          industryTarget: benchmark.opex_target,
        },
      };
    }

    const profitValue = profit || 0;
    const ownerPayValue = ownerPay || 0;
    const taxReserve = revenue * (targets.tax / 100);
    const opExValue = revenue - profitValue - ownerPayValue - taxReserve;

    return {
      profit: {
        actual: (profitValue / revenue) * 100,
        target: targets.profit,
        industryTarget: benchmark.profit_target,
      },
      ownerPay: {
        actual: (ownerPayValue / revenue) * 100,
        target: targets.ownerPay,
        industryTarget: benchmark.owner_pay_target,
      },
      tax: {
        actual: (taxReserve / revenue) * 100,
        target: targets.tax,
        industryTarget: benchmark.tax_target,
      },
      opEx: {
        actual: Math.max(0, (opExValue / revenue) * 100),
        target: targets.opEx,
        industryTarget: benchmark.opex_target,
      },
    };
  }, [revenue, profit, ownerPay, targets, benchmark, hasRevenue]);

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
  }> = [
    { key: 'profit', title: 'PROFIT' },
    { key: 'ownerPay', title: "OWNER'S PAY" },
    { key: 'tax', title: 'TAX' },
    { key: 'opEx', title: 'OPEX', isLowerBetter: true },
  ];

  return (
    <div className="bg-slate-50 rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h3 className="font-semibold text-lg">Profit First Health Check</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Industry: <span className="font-medium text-foreground">{benchmark.display_name}</span>
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResetToDefaults}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset to Industry Defaults
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic mb-4">
        Based on Mike Michalowicz's Profit First methodology
      </p>

      {/* Industry Benchmark Reference */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 px-3 py-2 rounded-md mb-6">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>
          Industry benchmarks for {benchmark.display_name}: 
          <span className="font-medium ml-1">
            Profit {benchmark.profit_target}% | Owner {benchmark.owner_pay_target}% | Tax {benchmark.tax_target}% | OpEx {benchmark.opex_target}%
          </span>
        </span>
      </div>

      {/* Bucket Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map(({ key, title, isLowerBetter }) => {
          const data = calculatedData[key];
          const actualValue = data.actual;
          const hasActual = actualValue !== null && !isNaN(actualValue);
          const status = hasActual ? getStatus(actualValue, data.target, isLowerBetter) : null;
          const config = status ? statusConfig[status] : { borderColor: 'border-slate-300', color: 'text-muted-foreground', icon: '—', bgColor: 'bg-slate-50' };
          const targetKey = key === 'ownerPay' ? 'ownerPay' : key as keyof ProfitFirstTargets;

          return (
            <div
              key={key}
              className={cn(
                "bg-white rounded-lg p-4 shadow-sm border-t-4",
                config.borderColor
              )}
            >
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-3">
                {title}
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Target:</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={localTargets[targetKey]}
                      onChange={(e) => handleTargetInputChange(targetKey, e.target.value)}
                      onBlur={() => handleTargetBlur(targetKey)}
                      className="w-16 h-8 text-center text-sm"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    (ind: {data.industryTarget}%)
                  </p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Actual:</label>
                  <p className={cn("text-lg font-bold", config.color)}>
                    {hasActual ? `${actualValue.toFixed(1)}%` : '—'}
                  </p>
                </div>

                {hasActual && status ? (
                  <div className={cn("flex items-center gap-1 text-sm", config.color)}>
                    <span>{config.icon}</span>
                    <span>{getStatusLabel(status, isLowerBetter, actualValue, data.industryTarget)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Enter revenue to see status
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
