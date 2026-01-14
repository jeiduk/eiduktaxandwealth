import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_COLORS, STATUS_OPTIONS } from "@/lib/strategy-constants";

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
  deduction_amount: number | null;
  tax_savings: number | null;
  notes: string | null;
}

interface StrategyCardProps {
  clientStrategy: ClientStrategy;
  strategy: Strategy;
  taxRate: number;
  onUpdate: (id: string, updates: Partial<ClientStrategy>) => void;
  onDelete: (id: string) => void;
}

export const StrategyCard = ({
  clientStrategy,
  strategy,
  taxRate,
  onUpdate,
  onDelete,
}: StrategyCardProps) => {
  const formatCurrencyValue = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const [deductionInput, setDeductionInput] = useState(
    clientStrategy.deduction_amount ? formatCurrencyValue(clientStrategy.deduction_amount) : ""
  );
  const [notes, setNotes] = useState(clientStrategy.notes || "");

  useEffect(() => {
    setDeductionInput(
      clientStrategy.deduction_amount ? formatCurrencyValue(clientStrategy.deduction_amount) : ""
    );
    setNotes(clientStrategy.notes || "");
  }, [clientStrategy.deduction_amount, clientStrategy.notes]);

  const phaseColor = PHASE_COLORS[strategy.phase] || "#1e40af";

  const handleDeductionBlur = () => {
    const num = parseInt(deductionInput.replace(/[^0-9]/g, "")) || 0;
    const taxSavings = Math.round(num * taxRate);
    setDeductionInput(num ? formatCurrencyValue(num) : "");
    onUpdate(clientStrategy.id, {
      deduction_amount: num || null,
      tax_savings: taxSavings || null,
    });
  };

  const handleNotesBlur = () => {
    onUpdate(clientStrategy.id, { notes: notes || null });
  };

  const handleStatusChange = (value: string) => {
    onUpdate(clientStrategy.id, { status: value });
  };

  const calculatedSavings = clientStrategy.deduction_amount
    ? Math.round(clientStrategy.deduction_amount * taxRate)
    : 0;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border overflow-hidden"
      style={{ borderLeftWidth: "4px", borderLeftColor: phaseColor }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-4 border-b bg-slate-50">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              #{strategy.id}: {strategy.name}
            </span>
          </div>
          {strategy.irc_citation && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {strategy.irc_citation}
              {strategy.description && ` — ${strategy.description}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={clientStrategy.status} onValueChange={handleStatusChange}>
            <SelectTrigger
              className={cn(
                "w-[130px] h-8 text-xs font-medium",
                STATUS_OPTIONS.find((s) => s.value === clientStrategy.status)?.className
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={cn("text-xs", option.className)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Strategy?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove "{strategy.name}" from this client's strategies.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(clientStrategy.id)}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tax Calculation Row */}
      <div className="px-4 py-3 bg-emerald-50/50 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tax Deduction:</span>
          <Input
            value={deductionInput}
            onChange={(e) => setDeductionInput(e.target.value)}
            onBlur={handleDeductionBlur}
            className="w-32 h-8 bg-white"
            placeholder="$0"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tax Savings:</span>
          <span className="text-lg font-bold text-emerald-600">
            {formatCurrencyValue(calculatedSavings)}
          </span>
        </div>
      </div>

      {/* Notes Row */}
      <div className="px-4 py-3 border-t">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Implementation notes..."
          className="resize-none text-sm bg-white"
          rows={1}
        />
      </div>
    </div>
  );
};
