import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, ArrowRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface PhaseStatus {
  [key: string]: "not-started" | "in-progress" | "complete";
}

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
  typical_savings_low?: number | null;
  typical_savings_high?: number | null;
}

interface ClientStrategy {
  id: string;
  strategy_id: number;
  status: string;
}

interface YearEndOpportunitiesProps {
  allStrategies: Strategy[];
  clientStrategies: ClientStrategy[];
  phaseStatus: PhaseStatus | null;
  onAddToConsider: () => void;
  onPromoteToImplementing: (clientStrategyId: string) => void;
  onRemove: (clientStrategyId: string) => void;
}

export const YearEndOpportunities = ({
  allStrategies,
  clientStrategies,
  phaseStatus,
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

  // Get suggested strategies (not already added in any capacity)
  const addedStrategyIds = clientStrategies.map((cs) => cs.strategy_id);
  
  const suggestions = useMemo(() => {
    const currentPhaseNum = phaseStatus
      ? Object.entries(phaseStatus).find(([, status]) => status === "in-progress")?.[0] ||
        Object.entries(phaseStatus).find(([, status]) => status === "not-started")?.[0] ||
        "1"
      : "1";

    const currentPhase = parseInt(currentPhaseNum);
    const available = allStrategies.filter((s) => !addedStrategyIds.includes(s.id));
    const priorityPhases = [currentPhase, currentPhase + 1, currentPhase - 1].filter(
      (p) => p >= 1 && p <= 8
    );

    const scored = available.map((s) => {
      const phaseNum = parseInt(s.phase.replace("P", ""));
      let score = 0;
      if (phaseNum === currentPhase) score += 100;
      else if (priorityPhases.includes(phaseNum)) score += 50;
      if (s.typical_savings_high) score += 20;
      return { ...s, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [allStrategies, addedStrategyIds, phaseStatus]);

  const getPhaseColor = (phase: string): string => {
    const p = PHASES.find((ph) => ph.prefix === phase);
    return p?.color || "#1E40AF";
  };

  const formatSavings = (low: number | null | undefined, high: number | null | undefined) => {
    if (!low && !high) return null;
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (low && high) {
      return `${formatter.format(low)} - ${formatter.format(high)}`;
    }
    return high ? `Up to ${formatter.format(high)}` : formatter.format(low!);
  };

  return (
    <div className="space-y-6">
      {/* Currently Considering */}
      {consideringStrategies.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Currently Considering</h4>
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
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Suggested Strategies</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((strategy) => {
              const phaseColor = getPhaseColor(strategy.phase);
              const savings = formatSavings(strategy.typical_savings_low, strategy.typical_savings_high);

              return (
                <div
                  key={strategy.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: phaseColor, borderLeftWidth: 4 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: `${phaseColor}15`, color: phaseColor }}
                    >
                      {strategy.phase}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">
                    #{strategy.id}: {strategy.name}
                  </h4>
                  {strategy.irc_citation && (
                    <p className="text-xs text-muted-foreground mb-2">{strategy.irc_citation}</p>
                  )}
                  {savings && (
                    <p className="text-xs text-emerald-600 font-medium mb-3">
                      Est. savings: {savings}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {consideringStrategies.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-muted-foreground">
            All strategies have been added. Great progress!
          </p>
        </div>
      )}

      {/* Add Strategy Button */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onAddToConsider} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Strategy to Consider
        </Button>
      </div>
    </div>
  );
};