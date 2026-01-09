import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProfitFirstTargets {
  profit: number;
  ownerPay: number;
  tax: number;
  opEx: number;
}

interface ProfitFirstSectionProps {
  revenue: number | null;
  profit: number | null;
  ownerPay: number | null;
  targets: ProfitFirstTargets;
  onTargetChange: (target: keyof ProfitFirstTargets, value: number) => void;
}

interface BucketData {
  actual: number;
  target: number;
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

function getStatusLabel(status: Status, isOpEx = false): string {
  if (status === 'good') return isOpEx ? 'Good' : 'Above Target';
  if (status === 'on-track') return 'On Track';
  return isOpEx ? 'Review' : 'Below Target';
}

export const ProfitFirstSection = ({
  revenue,
  profit,
  ownerPay,
  targets,
  onTargetChange,
}: ProfitFirstSectionProps) => {
  const [localTargets, setLocalTargets] = useState(targets);

  useEffect(() => {
    setLocalTargets(targets);
  }, [targets]);

  const calculatedData = useMemo<CalculatedData | null>(() => {
    if (!revenue || revenue === 0) return null;

    const profitValue = profit || 0;
    const ownerPayValue = ownerPay || 0;
    const taxReserve = revenue * (targets.tax / 100);
    const opExValue = revenue - profitValue - ownerPayValue - taxReserve;

    return {
      profit: {
        actual: (profitValue / revenue) * 100,
        target: targets.profit,
      },
      ownerPay: {
        actual: (ownerPayValue / revenue) * 100,
        target: targets.ownerPay,
      },
      tax: {
        actual: (taxReserve / revenue) * 100,
        target: targets.tax,
      },
      opEx: {
        actual: Math.max(0, (opExValue / revenue) * 100),
        target: targets.opEx,
      },
    };
  }, [revenue, profit, ownerPay, targets]);

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

  if (!calculatedData) {
    return (
      <div className="bg-slate-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💰</span>
          <h3 className="font-semibold text-lg">Profit First Health Check</h3>
        </div>
        <p className="text-sm text-muted-foreground italic mb-6">
          Based on Mike Michalowicz's Profit First methodology
        </p>
        <p className="text-center text-muted-foreground py-8">
          Enter revenue to see Profit First analysis
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">💰</span>
        <h3 className="font-semibold text-lg">Profit First Health Check</h3>
      </div>
      <p className="text-sm text-muted-foreground italic mb-6">
        Based on Mike Michalowicz's Profit First methodology
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map(({ key, title, isLowerBetter }) => {
          const data = calculatedData[key];
          const status = getStatus(data.actual, data.target, isLowerBetter);
          const config = statusConfig[status];
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
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Actual:</label>
                  <p className={cn("text-lg font-bold", config.color)}>
                    {data.actual.toFixed(1)}%
                  </p>
                </div>

                <div className={cn("flex items-center gap-1 text-sm", config.color)}>
                  <span>{config.icon}</span>
                  <span>{getStatusLabel(status, isLowerBetter)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
