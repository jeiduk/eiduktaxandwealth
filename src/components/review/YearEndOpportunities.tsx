import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
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

interface YearEndOpportunitiesProps {
  allStrategies: Strategy[];
  addedStrategyIds: number[];
  phaseStatus: PhaseStatus | null;
  onConsider: (strategyId: number) => void;
}

export const YearEndOpportunities = ({
  allStrategies,
  addedStrategyIds,
  phaseStatus,
  onConsider,
}: YearEndOpportunitiesProps) => {
  const suggestions = useMemo(() => {
    // Get current phase from phase_status
    const currentPhaseNum = phaseStatus
      ? Object.entries(phaseStatus).find(([, status]) => status === "in-progress")?.[0] ||
        Object.entries(phaseStatus).find(([, status]) => status === "not-started")?.[0] ||
        "1"
      : "1";

    const currentPhase = parseInt(currentPhaseNum);

    // Filter strategies not already added
    const available = allStrategies.filter((s) => !addedStrategyIds.includes(s.id));

    // Prioritize strategies from current and next phases
    const priorityPhases = [currentPhase, currentPhase + 1, currentPhase - 1].filter(
      (p) => p >= 1 && p <= 8
    );

    // Score and sort strategies
    const scored = available.map((s) => {
      const phaseNum = parseInt(s.phase.replace("P", ""));
      let score = 0;

      // Higher score for current/adjacent phases
      if (phaseNum === currentPhase) score += 100;
      else if (priorityPhases.includes(phaseNum)) score += 50;

      // Bonus for having savings estimates
      if (s.typical_savings_high) score += 20;

      return { ...s, score };
    });

    // Sort by score descending, take top 6
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

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-muted-foreground">
          All suggested strategies have been added. Great progress!
        </p>
      </div>
    );
  }

  return (
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
                style={{
                  backgroundColor: `${phaseColor}15`,
                  color: phaseColor,
                }}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConsider(strategy.id)}
              className="w-full gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Consider
            </Button>
          </div>
        );
      })}
    </div>
  );
};