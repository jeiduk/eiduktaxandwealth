import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, Target, TrendingUp, Building2, Percent, Wallet } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  tax_rate: number | null;
}

interface OverviewTabProps {
  client: Client;
  stats: {
    completed: number;
    total: number;
    totalDeductions: number;
    totalSavings: number;
    progress: number;
    taxRate: number;
  };
  onClientUpdate: (updates: Partial<Client>) => void;
}

export const OverviewTab = ({ client, stats, onClientUpdate }: OverviewTabProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Premium":
        return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "Complete":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "Foundation":
        return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes })
        .eq("id", client.id);

      if (error) throw error;
      
      onClientUpdate({ notes });
      toast({ title: "Notes saved" });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    {
      label: "Total Deductions",
      value: formatCurrency(stats.totalDeductions),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Tax Savings",
      value: formatCurrency(stats.totalSavings),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Strategies Complete",
      value: `${stats.completed} of ${stats.total}`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Progress",
      value: `${stats.progress}%`,
      icon: Percent,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entity Type</p>
              <Badge variant="outline" className="text-base">
                {client.entity_type}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Package Tier</p>
              <Badge variant="outline" className={getTierColor(client.package_tier)}>
                {client.package_tier}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tax Rate</p>
              <Badge variant="outline" className="bg-slate-100 text-slate-600">
                {formatPercent(stats.taxRate)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Income Range</p>
              <p className="font-medium">{client.income_range || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Client Since</p>
              <p className="font-medium">{format(new Date(client.created_at), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Next Review Date
              </p>
              <p className="font-medium">
                {client.next_review_date
                  ? format(new Date(client.next_review_date), "MMM d, yyyy")
                  : "Not scheduled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Quick Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this client..."
            rows={4}
          />
          <Button 
            onClick={saveNotes} 
            disabled={saving || notes === (client.notes || "")}
          >
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
