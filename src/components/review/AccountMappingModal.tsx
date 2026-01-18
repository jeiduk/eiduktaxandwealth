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
import { Separator } from "@/components/ui/separator";
import { Loader2, DollarSign, CheckCircle, AlertCircle, Eye, EyeOff, Filter, Copy, Calendar } from "lucide-react";
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
  needsReview?: string;
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
  excludedAccounts?: ParsedAccount[];
  duplicateAccounts?: ParsedAccount[];
  amountColumnDescription?: string;
  detectedMonthCount?: number | null;
  headerRowIndex?: number | null;
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
  excludedAccounts = [],
  duplicateAccounts = [],
  amountColumnDescription = "",
  detectedMonthCount,
  headerRowIndex,
  onApply,
  isProcessing = false,
  previousMappings,
}: AccountMappingModalProps) {
  // Initialize mappings from accounts
  const [mappings, setMappings] = useState<Map<string, PFCategory>>(new Map());
  const [modifiedAccounts, setModifiedAccounts] = useState<Set<string>>(new Set());
  const [showExcluded, setShowExcluded] = useState(false);

  // Reset mappings when accounts change
  useEffect(() => {
    const map = new Map<string, PFCategory>();
    accounts.forEach((acc) => {
      // Check for previous mapping first (client-specific overrides)
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
  const needsReviewCount = accounts.filter((acc) => acc.needsReview).length;
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
            Review the suggested categories for each account. Accounts flagged with ⚠️ may need verification.
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
            {(lowConfidenceCount > 0 || needsReviewCount > 0) && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {Math.max(lowConfidenceCount, needsReviewCount)} need review
              </span>
            )}
            {amountColumnDescription && (
              <span className="flex items-center gap-1 text-blue-600">
                <DollarSign className="h-4 w-4" />
                {amountColumnDescription}
              </span>
            )}
            {detectedMonthCount != null && detectedMonthCount > 0 && (
              <span className="flex items-center gap-1 text-violet-600">
                <Calendar className="h-4 w-4" />
                {detectedMonthCount} month{detectedMonthCount !== 1 ? 's' : ''} detected
                {headerRowIndex != null && (
                  <span className="text-muted-foreground ml-1">(row {headerRowIndex + 1})</span>
                )}
              </span>
            )}
          </div>
          <span className="text-muted-foreground font-medium">
            Real Revenue: {formatCurrency(realRevenue)}
          </span>
        </div>

        <Separator />

        {/* Account List - Scrollable table with sticky header */}
        <div className="flex-1 max-h-96 overflow-y-auto border rounded-md">
          <table className="w-full">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium text-right w-28">Amount</th>
                <th className="px-3 py-2 font-medium w-44">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y">
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
            </tbody>
          </table>
        </div>

        {/* Excluded rows indicator */}
        {excludedAccounts.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{excludedAccounts.length} total/subtotal rows excluded to avoid double-counting</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowExcluded(!showExcluded)}
            >
              {showExcluded ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide excluded
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show excluded
                </>
              )}
            </Button>
          </div>
        )}

        {/* Show excluded rows when toggled */}
        {showExcluded && excludedAccounts.length > 0 && (
          <div className="max-h-32 overflow-y-auto border rounded-md bg-muted/20">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-1 font-medium">Excluded Account</th>
                  <th className="px-3 py-1 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {excludedAccounts.map((acc, index) => (
                  <tr key={acc.accountName + index} className="text-muted-foreground">
                    <td className="px-3 py-1">{acc.accountName}</td>
                    <td className="px-3 py-1 text-right font-mono">
                      {formatCurrency(acc.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Duplicate rows indicator */}
        {duplicateAccounts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded text-sm text-amber-700">
            <Copy className="h-4 w-4" />
            <span>{duplicateAccounts.length} duplicate rows merged (same account name and amount)</span>
          </div>
        )}

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
