import { ChevronRight } from "lucide-react";
import { PHASES } from "@/data/strategyReference";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhaseStatus {
  id: string;
  client_id: string;
  phase: number;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface PhaseTrackerProps {
  clientId: string;
  phaseStatuses: PhaseStatus[];
  onStatusChange: (phase: number, status: string) => void;
}

const STATUS_COLORS = {
  "not-started": "bg-muted border-muted-foreground/30 text-muted-foreground",
  "in-progress": "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "complete": "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function PhaseTracker({ clientId, phaseStatuses, onStatusChange }: PhaseTrackerProps) {
  const getPhaseStatus = (phaseNumber: number): string => {
    const status = phaseStatuses.find(ps => ps.phase === phaseNumber);
    return status?.status || "not-started";
  };

  const getStrategyCount = (phaseNumber: number): number => {
    const phase = PHASES[phaseNumber as keyof typeof PHASES];
    if (!phase) return 0;
    return phase.strategies[1] - phase.strategies[0] + 1;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-[800px] gap-2">
        {Object.entries(PHASES).map(([key, phase], index) => {
          const phaseNumber = parseInt(key);
          const status = getPhaseStatus(phaseNumber);
          const strategyCount = getStrategyCount(phaseNumber);
          const isLast = index === Object.keys(PHASES).length - 1;

          return (
            <div key={phaseNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                {/* Circle with phase number */}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-colors ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS["not-started"]}`}
                >
                  {phaseNumber}
                </div>

                {/* Phase name */}
                <span className="text-xs font-medium text-center leading-tight max-w-[80px]">
                  {phase.name}
                </span>

                {/* Strategy count */}
                <span className="text-[10px] text-muted-foreground">
                  {strategyCount} strategies
                </span>

                {/* Status dropdown */}
                <Select
                  value={status}
                  onValueChange={(value) => onStatusChange(phaseNumber, value)}
                >
                  <SelectTrigger className="h-6 w-24 text-[10px] px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started" className="text-xs">Not Started</SelectItem>
                    <SelectItem value="in-progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="complete" className="text-xs">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
