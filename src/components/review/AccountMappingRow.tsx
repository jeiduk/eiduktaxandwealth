import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertCircle, History, AlertTriangle } from "lucide-react";
import { PFCategory, ParsedAccount, CATEGORY_CONFIG } from "./AccountMappingModal";

interface AccountMappingRowProps {
  account: ParsedAccount;
  currentCategory: PFCategory;
  onCategoryChange: (category: PFCategory) => void;
  hasPreviousMapping?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AccountMappingRow({
  account,
  currentCategory,
  onCategoryChange,
  hasPreviousMapping = false,
}: AccountMappingRowProps) {
  const config = CATEGORY_CONFIG[currentCategory];
  const isExcluded = currentCategory === "exclude";
  const isLowConfidence = account.confidence === "low";
  const hasReviewFlag = !!account.needsReview;

  return (
    <tr
      className={cn(
        "transition-colors",
        isExcluded
          ? "bg-muted/30 opacity-60"
          : hasReviewFlag
          ? "bg-amber-50/70"
          : isLowConfidence
          ? "bg-amber-50/50"
          : "bg-background hover:bg-muted/30"
      )}
    >
      {/* Account Name Column */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Review flag with tooltip */}
          {hasReviewFlag && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{account.needsReview}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Low confidence indicator */}
          {isLowConfidence && !hasReviewFlag && (
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          )}
          
          {/* Previous mapping indicator */}
          {hasPreviousMapping && !isLowConfidence && !hasReviewFlag && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <History className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Previously mapped for this client</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {account.parentAccount && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {account.parentAccount} →
            </span>
          )}
          <span
            className={cn(
              "font-medium truncate text-sm",
              isExcluded && "line-through text-muted-foreground"
            )}
          >
            {account.accountName}
          </span>
        </div>
      </td>

      {/* Amount Column */}
      <td className="px-3 py-2 text-right">
        <span
          className={cn(
            "font-mono text-sm",
            account.amount < 0 ? "text-red-600" : "text-foreground"
          )}
        >
          {formatCurrency(account.amount)}
        </span>
      </td>

      {/* Category Select Column */}
      <td className="px-3 py-2">
        <Select
          value={currentCategory}
          onValueChange={(val) => onCategoryChange(val as PFCategory)}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="h-3 w-3 p-0 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="truncate text-sm">{config.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="h-3 w-3 p-0 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({cfg.description})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}
