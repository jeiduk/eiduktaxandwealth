import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PFCategory, CATEGORY_CONFIG } from "./AccountMappingModal";

interface MappingSummaryPanelProps {
  totals: Record<PFCategory, number>;
  realRevenue: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const DISPLAY_CATEGORIES: PFCategory[] = [
  "gross_revenue",
  "materials_subs",
  "owner_pay",
  "tax",
  "opex",
];

export function MappingSummaryPanel({ totals, realRevenue }: MappingSummaryPanelProps) {
  return (
    <div className="space-y-3 py-2">
      {/* Category totals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {DISPLAY_CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const value = totals[cat];
          
          return (
            <Card
              key={cat}
              className={cn("p-3 border", config.bgColor)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="h-2.5 w-2.5 p-0 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              <p
                className="text-base font-bold"
                style={{ color: config.color }}
              >
                {formatCurrency(Math.abs(value))}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Real Revenue calculation */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-slate-100 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Gross Revenue</span>
          <span className="font-medium">{formatCurrency(totals.gross_revenue)}</span>
        </div>
        <span className="text-muted-foreground">−</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Materials & Subs</span>
          <span className="font-medium">{formatCurrency(Math.abs(totals.materials_subs))}</span>
        </div>
        <span className="text-muted-foreground">=</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-700">Real Revenue</span>
          <span className="font-bold text-lg text-slate-900">{formatCurrency(realRevenue)}</span>
        </div>
      </div>

      {/* Excluded info */}
      {totals.exclude !== 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Excluded from calculations: {formatCurrency(Math.abs(totals.exclude))}
        </p>
      )}
    </div>
  );
}
