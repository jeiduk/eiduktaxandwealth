import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Trash2 } from "lucide-react";

const PHASES = [
  { id: 1, name: "Foundation", color: "#1E40AF", prefix: "P1" },
  { id: 2, name: "Core Deductions", color: "#059669", prefix: "P2" },
  { id: 3, name: "Retirement", color: "#7C3AED", prefix: "P3" },
  { id: 4, name: "Credits", color: "#EA580C", prefix: "P4" },
  { id: 5, name: "Real Estate", color: "#0891B2", prefix: "P5" },
  { id: 6, name: "Acquisitions", color: "#DC2626", prefix: "P6" },
  { id: 7, name: "Exit", color: "#CA8A04", prefix: "P7" },
  { id: 8, name: "Charitable", color: "#9333EA", prefix: "P8" },
];

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
}

interface ClientStrategy {
  id: string;
  strategy_id: number;
  status: string;
}

interface YearEndOpportunitiesProps {
  allStrategies: Strategy[];
  clientStrategies: ClientStrategy[];
  onAddToConsider: () => void;
  onPromoteToImplementing: (clientStrategyId: string) => void;
  onRemove: (clientStrategyId: string) => void;
}

export const YearEndOpportunities = ({
  allStrategies,
  clientStrategies,
  onAddToConsider,
  onPromoteToImplementing,
  onRemove,
}: YearEndOpportunitiesProps) => {
  // Get strategies marked as "considering"
  const consideringStrategies = useMemo(() => {
    return clientStrategies
      .filter((cs) => cs.status === "considering")
      .map((cs) => {
        const strategy = allStrategies.find((s) => s.id === cs.strategy_id);
        return strategy ? { ...cs, strategy } : null;
      })
      .filter(Boolean) as (ClientStrategy & { strategy: Strategy })[];
  }, [clientStrategies, allStrategies]);

  const getPhaseColor = (phase: string): string => {
    const p = PHASES.find((ph) => ph.prefix === phase);
    return p?.color || "#1E40AF";
  };

  return (
    <div className="space-y-4">
      {/* Currently Considering */}
      {consideringStrategies.length > 0 ? (
        <div className="space-y-2">
          {consideringStrategies.map(({ id, strategy }) => {
            const phaseColor = getPhaseColor(strategy.phase);
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                style={{ borderLeftColor: phaseColor, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge
                    variant="secondary"
                    className="text-xs flex-shrink-0"
                    style={{ backgroundColor: `${phaseColor}15`, color: phaseColor }}
                  >
                    {strategy.phase}
                  </Badge>
                  <span className="font-medium text-sm truncate">
                    #{strategy.id}: {strategy.name}
                  </span>
                  {strategy.irc_citation && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      • {strategy.irc_citation}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPromoteToImplementing(id)}
                    className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Implement
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-muted-foreground mb-2">No strategies being considered yet</p>
          <p className="text-sm text-muted-foreground">
            Click the button below to add year-end optimization strategies
          </p>
        </div>
      )}

      {/* Add Strategy Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onAddToConsider} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Strategy to Consider
        </Button>
      </div>
    </div>
  );
};