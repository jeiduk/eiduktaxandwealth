import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { STRATEGY_PHASES, TIER_MAX_STRATEGY } from "@/lib/strategy-constants";

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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);

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

  const toggleStrategy = (strategyId: number) => {
    setSelectedIds((prev) =>
      prev.includes(strategyId)
        ? prev.filter((id) => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const handleConfirmAdd = async () => {
    if (selectedIds.length === 0) return;
    
    setAdding(true);
    try {
      // Insert all selected strategies
      const insertData = selectedIds.map((strategyId) => ({
        client_id: clientId,
        strategy_id: strategyId,
        status: "not_started",
      }));

      const { data, error } = await supabase
        .from("client_strategies")
        .insert(insertData)
        .select();

      if (error) throw error;

      // Call onStrategyAdded for each added strategy
      data?.forEach((cs) => {
        onStrategyAdded(cs);
      });

      toast({ 
        title: "Strategies added", 
        description: `${data?.length || 0} strategies added successfully` 
      });
      
      // Clear selection and close modal
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding strategies:", error);
      toast({
        title: "Error",
        description: "Failed to add strategies",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIds([]);
    }
    onOpenChange(isOpen);
  };

  const renderStrategyGroup = (
    grouped: Record<string, Strategy[]>,
    label?: string
  ) => {
    // Sort by phase number (extract number from "P1", "P2", etc.)
    const phaseIds = Object.keys(grouped).sort((a, b) => {
      const numA = parseInt(a.replace("P", ""));
      const numB = parseInt(b.replace("P", ""));
      return numA - numB;
    });
    if (phaseIds.length === 0) return null;

    return (
      <div className="space-y-4">
        {label && (
          <h4 className="text-sm font-semibold text-muted-foreground">{label}</h4>
        )}
        {phaseIds.map((phaseId) => {
          const phase = STRATEGY_PHASES.find((p) => p.id === phaseId);
          const strategies = grouped[phaseId];

          return (
            <div key={phaseId} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: phase?.color }}
                />
                <span className="text-sm font-medium">
                  {phaseId}: {phase?.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {strategies.length} available
                </Badge>
              </div>
              <div className="grid gap-2 pl-5">
                {strategies.map((strategy) => {
                  const isSelected = selectedIds.includes(strategy.id);
                  
                  return (
                    <div
                      key={strategy.id}
                      onClick={() => toggleStrategy(strategy.id)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleStrategy(strategy.id)}
                        className="shrink-0"
                      />
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
                    </div>
                  );
                })}
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Add Strategies</DialogTitle>
          {selectedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} strateg{selectedIds.length === 1 ? 'y' : 'ies'} selected
            </p>
          )}
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[50vh] pr-4">
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
        {hasStrategies && (
          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAdd}
              disabled={selectedIds.length === 0 || adding}
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}
                  Strateg{selectedIds.length === 1 ? 'y' : 'ies'}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
