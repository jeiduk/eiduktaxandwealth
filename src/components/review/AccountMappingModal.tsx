import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Package,
  PiggyBank,
  Wallet,
  Receipt,
  Building2,
  XCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export type PFCategory = 
  | "revenue" 
  | "cogs" 
  | "profit" 
  | "owner_pay" 
  | "tax" 
  | "opex" 
  | "exclude";

export interface ParsedAccount {
  accountName: string;
  amount: number;
  parentAccount?: string;
  suggestedCategory: PFCategory;
  sortOrder: number;
}

export interface AccountMapping {
  accountName: string;
  amount: number;
  parentAccount?: string;
  pfCategory: PFCategory;
  sortOrder: number;
}

interface AccountMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ParsedAccount[];
  onApply: (mappings: AccountMapping[]) => void;
  isProcessing?: boolean;
}

const CATEGORY_CONFIG: Record<PFCategory, {
  label: string;
  icon: typeof DollarSign;
  color: string;
  bgColor: string;
  description: string;
}> = {
  revenue: {
    label: "Revenue",
    icon: TrendingUp,
    color: "#059669",
    bgColor: "bg-emerald-50",
    description: "Income / Sales",
  },
  cogs: {
    label: "COGS",
    icon: Package,
    color: "#6366F1",
    bgColor: "bg-indigo-50",
    description: "Cost of Goods Sold",
  },
  profit: {
    label: "Profit",
    icon: PiggyBank,
    color: "#059669",
    bgColor: "bg-emerald-50",
    description: "Net Income / Retained",
  },
  owner_pay: {
    label: "Owner's Pay",
    icon: Wallet,
    color: "#7C3AED",
    bgColor: "bg-violet-50",
    description: "Officer Comp / Draws",
  },
  tax: {
    label: "Tax",
    icon: Receipt,
    color: "#EA580C",
    bgColor: "bg-orange-50",
    description: "Tax Payments",
  },
  opex: {
    label: "OpEx",
    icon: Building2,
    color: "#2C5AA0",
    bgColor: "bg-blue-50",
    description: "Operating Expenses",
  },
  exclude: {
    label: "Exclude",
    icon: XCircle,
    color: "#6B7280",
    bgColor: "bg-gray-50",
    description: "Don't include in totals",
  },
};

// Auto-suggest category based on account name patterns
export function suggestCategory(accountName: string, parentAccount?: string): PFCategory {
  const name = accountName.toLowerCase();
  const parent = (parentAccount || "").toLowerCase();
  
  // Revenue patterns
  if (
    name.includes("income") ||
    name.includes("revenue") ||
    name.includes("sales") ||
    name.includes("gross profit") ||
    parent.includes("income")
  ) {
    return "revenue";
  }
  
  // COGS patterns
  if (
    name.includes("cost of goods") ||
    name.includes("cost of sales") ||
    name.includes("cogs") ||
    name.includes("materials") ||
    name.includes("direct cost") ||
    parent.includes("cost of goods")
  ) {
    return "cogs";
  }
  
  // Owner's Pay patterns
  if (
    name.includes("owner") ||
    name.includes("officer") ||
    name.includes("shareholder") ||
    name.includes("personal draw") ||
    name.includes("guaranteed payment")
  ) {
    return "owner_pay";
  }
  
  // Tax patterns
  if (
    name.includes("tax") ||
    name.includes("payroll tax") ||
    name.includes("income tax") ||
    name.includes("estimated tax")
  ) {
    return "tax";
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
    name.includes("professional fees")
  ) {
    return "opex";
  }
  
  // Default to exclude for unclear items
  return "exclude";
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
}: AccountMappingModalProps) {
  // Initialize mappings from accounts with suggested categories
  const [mappings, setMappings] = useState<Map<string, PFCategory>>(() => {
    const map = new Map<string, PFCategory>();
    accounts.forEach((acc) => {
      map.set(acc.accountName, acc.suggestedCategory);
    });
    return map;
  });

  // Reset mappings when accounts change
  useMemo(() => {
    const map = new Map<string, PFCategory>();
    accounts.forEach((acc) => {
      map.set(acc.accountName, acc.suggestedCategory);
    });
    setMappings(map);
  }, [accounts]);

  const handleCategoryChange = (accountName: string, category: PFCategory) => {
    setMappings((prev) => {
      const next = new Map(prev);
      next.set(accountName, category);
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
    }));
    onApply(result);
  };

  // Calculate category totals for preview
  const categoryTotals = useMemo(() => {
    const totals: Record<PFCategory, number> = {
      revenue: 0,
      cogs: 0,
      profit: 0,
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

  // Calculate real revenue (revenue - cogs) and check percentages
  const realRevenue = categoryTotals.revenue - categoryTotals.cogs;
  const mappedAccounts = accounts.filter(
    (acc) => mappings.get(acc.accountName) !== "exclude"
  ).length;
  const excludedAccounts = accounts.length - mappedAccounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Map Accounts to Profit First Categories
          </DialogTitle>
          <DialogDescription>
            Review the suggested categories for each account. Click to change any assignment.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Preview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
          {(["revenue", "owner_pay", "tax", "opex"] as PFCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            return (
              <Card
                key={cat}
                className={cn(
                  "p-3 border",
                  config.bgColor
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {config.label}
                  </span>
                </div>
                <p className="text-lg font-bold" style={{ color: config.color }}>
                  {formatCurrency(categoryTotals[cat])}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              {mappedAccounts} mapped
            </span>
            {excludedAccounts > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                {excludedAccounts} excluded
              </span>
            )}
          </div>
          <span className="text-muted-foreground">
            Real Revenue: {formatCurrency(realRevenue)}
          </span>
        </div>

        <Separator />

        {/* Account List */}
        <ScrollArea className="flex-1 max-h-[400px] pr-4">
          <div className="space-y-2">
            {accounts.map((acc, index) => {
              const currentCategory = mappings.get(acc.accountName) || acc.suggestedCategory;
              const config = CATEGORY_CONFIG[currentCategory];
              const Icon = config.icon;
              const isExcluded = currentCategory === "exclude";
              
              return (
                <div
                  key={acc.accountName + index}
                  className={cn(
                    "flex items-center justify-between gap-4 p-3 rounded-lg border transition-colors",
                    isExcluded
                      ? "bg-muted/30 border-dashed opacity-60"
                      : "bg-background"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {acc.parentAccount && (
                        <span className="text-xs text-muted-foreground">
                          {acc.parentAccount} →
                        </span>
                      )}
                      <span className={cn(
                        "font-medium truncate",
                        isExcluded && "line-through"
                      )}>
                        {acc.accountName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-mono text-sm min-w-[100px] text-right",
                      acc.amount < 0 ? "text-red-600" : "text-foreground"
                    )}>
                      {formatCurrency(acc.amount)}
                    </span>
                    
                    <Select
                      value={currentCategory}
                      onValueChange={(val) => handleCategoryChange(acc.accountName, val as PFCategory)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: config.color }} />
                            <span>{config.label}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                          const CatIcon = cfg.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <CatIcon className="h-4 w-4" style={{ color: cfg.color }} />
                                <span>{cfg.label}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({cfg.description})
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
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
