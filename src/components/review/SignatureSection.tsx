import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SignatureSectionProps {
  clientSignature: boolean;
  advisorSignature: boolean;
  advisorName: string;
  onClientSignatureChange: (checked: boolean) => void;
  onAdvisorSignatureChange: (checked: boolean) => void;
}

export const SignatureSection = ({
  clientSignature,
  advisorSignature,
  advisorName,
  onClientSignatureChange,
  onAdvisorSignatureChange,
}: SignatureSectionProps) => {
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        By signing below, we acknowledge the topics discussed and action items assigned during this quarterly review.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Client Signature */}
        <div className="bg-slate-50 rounded-lg p-6 border">
          <div className="h-16 border-b border-slate-300 mb-4" />
          <p className="font-medium text-sm mb-1">Client Signature</p>
          <p className="text-sm text-muted-foreground mb-4">
            Date: {clientSignature ? today : "____________"}
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={clientSignature}
              onCheckedChange={(checked) => onClientSignatureChange(!!checked)}
            />
            <span className={cn("text-sm", clientSignature && "text-emerald-600 font-medium")}>
              Client acknowledges
            </span>
          </label>
        </div>

        {/* Advisor Signature */}
        <div className="bg-slate-50 rounded-lg p-6 border">
          <div className="h-16 border-b border-slate-300 mb-4" />
          <p className="font-medium text-sm mb-1">Advisor Signature</p>
          <p className="text-sm text-muted-foreground mb-1">{advisorName}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Date: {advisorSignature ? today : "____________"}
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={advisorSignature}
              onCheckedChange={(checked) => onAdvisorSignatureChange(!!checked)}
            />
            <span className={cn("text-sm", advisorSignature && "text-emerald-600 font-medium")}>
              Advisor acknowledges
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};