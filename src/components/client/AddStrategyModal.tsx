import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
}

interface ClientStrategy {
  id: string;
  client_id: string;
  strategy_id: number;
  status: string;
  deduction_amount: number | null;
  notes: string | null;
}

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  packageTier: string;
  allStrategies: Strategy[];
  assignedStrategyIds: number[];
  onStrategyAdded: (newClientStrategy: ClientStrategy) => void;
}

const PHASES = [
  { id: "1", name: "Foundation", color: "#1e40af" },
  { id: "2", name: "Core Deductions", color: "#059669" },
  { id: "3", name: "Retirement & Benefits", color: "#7c3aed" },
  { id: "4", name: "Credits & Multistate", color: "#ea580c" },
  { id: "5", name: "Real Estate & PAL", color: "#0891b2" },
  { id: "6", name: "Acquisitions & Leverage", color: "#dc2626" },
  { id: "7", name: "Exit & Wealth Transfer", color: "#ca8a04" },
  { id: "8", name: "Charitable", color: "#9333ea" },
];

const TIER_MAX_STRATEGY: Record<string, number> = {
  Essentials: 0,
  Foundation: 13,
  Complete: 30,
  Premium: 59,
};

export const AddStrategyModal = ({
  open,
  onOpenChange,
  clientId,
  packageTier,
  allStrategies,
  assignedStrategyIds,
  onStrategyAdded,
}: AddStrategyModalProps) => {
  const { toast } = useToast();
  const [adding, setAdding] = useState<number | null>(null);

  const maxStrategyForTier = TIER_MAX_STRATEGY[packageTier] || 0;

  // Filter to unassigned strategies, grouped by phase
  const { includedStrategies, additionalStrategies } = useMemo(() => {
    const unassigned = allStrategies.filter(
      (s) => !assignedStrategyIds.includes(s.id)
    );

    const included = unassigned.filter((s) => s.id <= maxStrategyForTier);
    const additional = unassigned.filter((s) => s.id > maxStrategyForTier);

    return { includedStrategies: included, additionalStrategies: additional };
  }, [allStrategies, assignedStrategyIds, maxStrategyForTier]);

  // Group by phase
  const groupByPhase = (strategies: Strategy[]) => {
    const grouped: Record<string, Strategy[]> = {};
    strategies.forEach((s) => {
      if (!grouped[s.phase]) grouped[s.phase] = [];
      grouped[s.phase].push(s);
    });
    return grouped;
  };

  const includedGrouped = groupByPhase(includedStrategies);
  const additionalGrouped = groupByPhase(additionalStrategies);

  const handleAdd = async (strategyId: number) => {
    setAdding(strategyId);
    try {
      const { data, error } = await supabase
        .from("client_strategies")
        .insert({
          client_id: clientId,
          strategy_id: strategyId,
          status: "not_started",
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Strategy added:", data);
      onStrategyAdded(data);
      toast({ title: "Strategy added" });
    } catch (error) {
      console.error("Error adding strategy:", error);
      toast({
        title: "Error",
        description: "Failed to add strategy",
        variant: "destructive",
      });
    } finally {
      setAdding(null);
    }
  };

  const renderStrategyGroup = (
    grouped: Record<string, Strategy[]>,
    label?: string
  ) => {
    const phaseIds = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
    if (phaseIds.length === 0) return null;

    return (
      <div className="space-y-4">
        {label && (
          <h4 className="text-sm font-semibold text-muted-foreground">{label}</h4>
        )}
        {phaseIds.map((phaseId) => {
          const phase = PHASES.find((p) => p.id === phaseId);
          const strategies = grouped[phaseId];

          return (
            <div key={phaseId} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: phase?.color }}
                />
                <span className="text-sm font-medium">
                  P{phaseId}: {phase?.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {strategies.length} available
                </Badge>
              </div>
              <div className="grid gap-2 pl-5">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: phase?.color }}
                        >
                          #{strategy.id}
                        </span>
                        <span className="text-sm truncate">{strategy.name}</span>
                      </div>
                      {strategy.irc_citation && (
                        <p className="text-xs text-blue-600 truncate">
                          {strategy.irc_citation}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdd(strategy.id)}
                      disabled={adding === strategy.id}
                      className="ml-2 shrink-0"
                    >
                      {adding === strategy.id ? (
                        "Adding..."
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const hasStrategies =
    includedStrategies.length > 0 || additionalStrategies.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-display">Add Strategy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {!hasStrategies ? (
            <div className="py-8 text-center text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p>All strategies have been assigned to this client.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderStrategyGroup(includedGrouped, "Included in Package")}
              {additionalStrategies.length > 0 && (
                <>
                  <div className="border-t pt-4" />
                  {renderStrategyGroup(
                    additionalGrouped,
                    "Additional Strategies (Outside Package)"
                  )}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
