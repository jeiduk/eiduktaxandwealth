import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { AccountMappingRow } from "./AccountMappingRow";
import { MappingSummaryPanel } from "./MappingSummaryPanel";

export type PFCategory =
  | "gross_revenue"
  | "materials_subs"
  | "owner_pay"
  | "tax"
  | "opex"
  | "exclude";

export interface ParsedAccount {
  accountName: string;
  amount: number;
  parentAccount?: string;
  suggestedCategory: PFCategory;
  confidence: "high" | "low";
  sortOrder: number;
}

export interface AccountMapping {
  accountName: string;
  amount: number;
  parentAccount?: string;
  pfCategory: PFCategory;
  sortOrder: number;
  wasModified?: boolean;
}

interface AccountMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ParsedAccount[];
  onApply: (mappings: AccountMapping[]) => void;
  isProcessing?: boolean;
  previousMappings?: Map<string, PFCategory>;
}

export const CATEGORY_CONFIG: Record<
  PFCategory,
  {
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  gross_revenue: {
    label: "Gross Revenue",
    color: "#10B981",
    bgColor: "bg-emerald-50",
    description: "Income / Sales",
  },
  materials_subs: {
    label: "Materials & Subs",
    color: "#059669",
    bgColor: "bg-green-50",
    description: "COGS / Direct Costs",
  },
  owner_pay: {
    label: "Owner's Pay",
    color: "#7C3AED",
    bgColor: "bg-violet-50",
    description: "Officer Comp / Draws",
  },
  tax: {
    label: "Tax",
    color: "#EA580C",
    bgColor: "bg-orange-50",
    description: "Tax Payments",
  },
  opex: {
    label: "OpEx",
    color: "#2C5AA0",
    bgColor: "bg-blue-50",
    description: "Operating Expenses",
  },
  exclude: {
    label: "Exclude",
    color: "#9CA3AF",
    bgColor: "bg-gray-50",
    description: "Don't include",
  },
};

// Auto-detect PF category based on account name
export function detectPFCategory(
  accountName: string,
  plCategory?: string
): { category: PFCategory; confidence: "high" | "low" } {
  const name = accountName.toLowerCase();
  const parent = (plCategory || "").toLowerCase();

  // High confidence matches - Revenue
  if (
    name.includes("revenue") ||
    name.includes("sales") ||
    name.includes("income") ||
    name.includes("fees earned") ||
    name.includes("service income") ||
    name.includes("consulting income") ||
    parent.includes("income")
  ) {
    return { category: "gross_revenue", confidence: "high" };
  }

  // High confidence - COGS / Materials
  if (
    name.includes("cogs") ||
    name.includes("cost of goods") ||
    name.includes("cost of sales") ||
    name.includes("materials") ||
    name.includes("subcontractor") ||
    name.includes("direct labor") ||
    name.includes("direct cost") ||
    parent.includes("cost of goods")
  ) {
    return { category: "materials_subs", confidence: "high" };
  }

  // High confidence - Owner's Pay
  if (
    name.includes("officer compensation") ||
    name.includes("officer salary") ||
    name.includes("owner salary") ||
    name.includes("shareholder wage") ||
    name.includes("guaranteed payment")
  ) {
    return { category: "owner_pay", confidence: "high" };
  }

  // High confidence - Tax
  if (
    name.includes("tax expense") ||
    name.includes("income tax") ||
    name.includes("taxes paid") ||
    name.includes("franchise tax") ||
    name.includes("state tax")
  ) {
    return { category: "tax", confidence: "high" };
  }

  // High confidence - Exclude (non-cash items)
  if (
    name.includes("depreciation") ||
    name.includes("amortization") ||
    name.includes("unrealized")
  ) {
    return { category: "exclude", confidence: "high" };
  }

  // Low confidence - flag for review
  if (
    name.includes("professional fee") ||
    name.includes("contractor") ||
    name.includes("consultant") ||
    name.includes("1099")
  ) {
    return { category: "opex", confidence: "low" }; // Could be owner pay or materials
  }

  if (name.includes("distribution") || name.includes("draw")) {
    return { category: "exclude", confidence: "low" }; // Could be owner pay
  }

  if (name.includes("payroll tax") || name.includes("fica")) {
    return { category: "opex", confidence: "low" }; // Could be tax category
  }

  // Default to OpEx for expense accounts
  if (
    name.includes("expense") ||
    parent.includes("expense") ||
    name.includes("rent") ||
    name.includes("utilities") ||
    name.includes("insurance") ||
    name.includes("supplies") ||
    name.includes("advertising") ||
    name.includes("marketing") ||
    name.includes("software") ||
    name.includes("subscription")
  ) {
    return { category: "opex", confidence: "high" };
  }

  // Default to OpEx with low confidence for unknown items
  return { category: "opex", confidence: "low" };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AccountMappingModal({
  open,
  onOpenChange,
  accounts,
  onApply,
  isProcessing = false,
  previousMappings,
}: AccountMappingModalProps) {
  // Initialize mappings from accounts
  const [mappings, setMappings] = useState<Map<string, PFCategory>>(new Map());
  const [modifiedAccounts, setModifiedAccounts] = useState<Set<string>>(new Set());

  // Reset mappings when accounts change
  useEffect(() => {
    const map = new Map<string, PFCategory>();
    accounts.forEach((acc) => {
      // Check for previous mapping first
      if (previousMappings?.has(acc.accountName)) {
        map.set(acc.accountName, previousMappings.get(acc.accountName)!);
      } else {
        map.set(acc.accountName, acc.suggestedCategory);
      }
    });
    setMappings(map);
    setModifiedAccounts(new Set());
  }, [accounts, previousMappings]);

  const handleCategoryChange = (accountName: string, category: PFCategory) => {
    setMappings((prev) => {
      const next = new Map(prev);
      next.set(accountName, category);
      return next;
    });
    setModifiedAccounts((prev) => {
      const next = new Set(prev);
      next.add(accountName);
      return next;
    });
  };

  const handleApply = () => {
    const result: AccountMapping[] = accounts.map((acc) => ({
      accountName: acc.accountName,
      amount: acc.amount,
      parentAccount: acc.parentAccount,
      pfCategory: mappings.get(acc.accountName) || acc.suggestedCategory,
      sortOrder: acc.sortOrder,
      wasModified: modifiedAccounts.has(acc.accountName),
    }));
    onApply(result);
  };

  // Calculate category totals for preview
  const categoryTotals = useMemo(() => {
    const totals: Record<PFCategory, number> = {
      gross_revenue: 0,
      materials_subs: 0,
      owner_pay: 0,
      tax: 0,
      opex: 0,
      exclude: 0,
    };

    accounts.forEach((acc) => {
      const category = mappings.get(acc.accountName) || acc.suggestedCategory;
      totals[category] += acc.amount;
    });

    return totals;
  }, [accounts, mappings]);

  // Calculate real revenue and stats
  const realRevenue = categoryTotals.gross_revenue - Math.abs(categoryTotals.materials_subs);
  const lowConfidenceCount = accounts.filter((acc) => acc.confidence === "low").length;
  const excludedCount = accounts.filter(
    (acc) => mappings.get(acc.accountName) === "exclude"
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Map Accounts to Profit First Categories
          </DialogTitle>
          <DialogDescription>
            Review the suggested categories for each account. Accounts flagged with ⚠️ need your attention.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Panel */}
        <MappingSummaryPanel
          totals={categoryTotals}
          realRevenue={realRevenue}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              {accounts.length - excludedCount} mapped
            </span>
            {lowConfidenceCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {lowConfidenceCount} need review
              </span>
            )}
          </div>
          <span className="text-muted-foreground font-medium">
            Real Revenue: {formatCurrency(realRevenue)}
          </span>
        </div>

        <Separator />

        {/* Account List */}
        <ScrollArea className="flex-1 max-h-[400px] pr-4">
          <div className="space-y-2">
            {accounts.map((acc, index) => (
              <AccountMappingRow
                key={acc.accountName + index}
                account={acc}
                currentCategory={mappings.get(acc.accountName) || acc.suggestedCategory}
                onCategoryChange={(category) =>
                  handleCategoryChange(acc.accountName, category)
                }
                hasPreviousMapping={previousMappings?.has(acc.accountName)}
              />
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Mapping
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
