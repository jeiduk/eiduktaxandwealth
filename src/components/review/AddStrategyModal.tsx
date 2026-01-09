import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Phase configuration
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

interface AddStrategyModalProps {
  open: boolean;
  onClose: () => void;
  strategies: Strategy[];
  addedStrategyIds: number[];
  onAddStrategy: (strategyId: number) => void;
}

export const AddStrategyModal = ({
  open,
  onClose,
  strategies,
  addedStrategyIds,
  onAddStrategy,
}: AddStrategyModalProps) => {
  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const filteredStrategies = useMemo(() => {
    return strategies.filter((s) => {
      const matchesSearch =
        search === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.irc_citation?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (s.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesPhase = selectedPhase === null || s.phase === selectedPhase;

      return matchesSearch && matchesPhase;
    });
  }, [strategies, search, selectedPhase]);

  const getPhaseColor = (phase: string): string => {
    const p = PHASES.find((ph) => ph.prefix === phase);
    return p?.color || "#1E40AF";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Strategy</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Phase Filter */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedPhase === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase(null)}
            className="h-7 text-xs"
          >
            All
          </Button>
          {PHASES.map((phase) => (
            <Button
              key={phase.id}
              variant={selectedPhase === phase.prefix ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPhase(phase.prefix)}
              className="h-7 text-xs"
              style={{
                backgroundColor:
                  selectedPhase === phase.prefix ? phase.color : undefined,
                borderColor: phase.color,
                color: selectedPhase === phase.prefix ? "white" : phase.color,
              }}
            >
              {phase.prefix}
            </Button>
          ))}
        </div>

        {/* Strategy List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pb-4">
            {filteredStrategies.map((strategy) => {
              const isAdded = addedStrategyIds.includes(strategy.id);
              const phaseColor = getPhaseColor(strategy.phase);

              return (
                <div
                  key={strategy.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-start justify-between gap-3",
                    isAdded ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        #{strategy.id}: {strategy.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${phaseColor}15`,
                          color: phaseColor,
                        }}
                      >
                        {strategy.phase} {strategy.phase_name}
                      </Badge>
                    </div>
                    {strategy.irc_citation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {strategy.irc_citation}
                      </p>
                    )}
                    {strategy.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {strategy.description}
                      </p>
                    )}
                  </div>
                  {isAdded ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-8 text-emerald-600"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Added
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddStrategy(strategy.id)}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })}

            {filteredStrategies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No strategies found matching your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
