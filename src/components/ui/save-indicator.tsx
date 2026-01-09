import { cn } from "@/lib/utils";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "unsaved" | "error";
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all",
        status === "saving" && "bg-amber-100 text-amber-700",
        status === "saved" && "bg-emerald-100 text-emerald-700",
        status === "unsaved" && "bg-orange-100 text-orange-700",
        status === "error" && "bg-destructive/10 text-destructive",
        className
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Unsaved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}
