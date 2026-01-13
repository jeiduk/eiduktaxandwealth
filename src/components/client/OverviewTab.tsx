import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar, DollarSign, Target, TrendingUp, Building2, Percent, Wallet, Pencil } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    inProgress: number;
    notStarted: number;
    wontDo: number;
    total: number;
    totalDeductions: number;
    totalSavings: number;
    progress: number;
    taxRate: number;
  };
  onClientUpdate: (updates: Partial<Client>) => void;
}

const TAX_RATE_OPTIONS = [
  { value: "0.22", label: "22%", description: "Single $44k-$95k / MFJ $89k-$190k" },
  { value: "0.24", label: "24%", description: "Single $95k-$201k / MFJ $190k-$384k" },
  { value: "0.32", label: "32%", description: "Single $201k-$384k / MFJ $384k-$487k" },
  { value: "0.35", label: "35%", description: "Single $384k-$487k / MFJ $487k-$731k" },
  { value: "0.37", label: "37%", description: "Single $487k+ / MFJ $731k+" },
  { value: "custom", label: "Custom", description: "" },
];

export const OverviewTab = ({ client, stats, onClientUpdate }: OverviewTabProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);
  const [taxRateOpen, setTaxRateOpen] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState("");
  const [selectedTaxRate, setSelectedTaxRate] = useState<string>(() => {
    const rate = client.tax_rate || 0.37;
    const match = TAX_RATE_OPTIONS.find(o => parseFloat(o.value) === rate);
    return match ? match.value : "custom";
  });

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

  const updateTaxRate = async (value: string) => {
    let newRate: number;
    
    if (value === "custom") {
      setSelectedTaxRate("custom");
      return; // Wait for custom input
    }
    
    newRate = parseFloat(value);
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({ tax_rate: newRate })
        .eq("id", client.id);

      if (error) throw error;
      
      setSelectedTaxRate(value);
      onClientUpdate({ tax_rate: newRate });
      setTaxRateOpen(false);
      toast({ title: `Marginal tax rate updated to ${formatPercent(newRate)}` });
    } catch (error) {
      console.error("Error updating tax rate:", error);
      toast({ title: "Error", description: "Failed to update tax rate", variant: "destructive" });
    }
  };

  const saveCustomTaxRate = async () => {
    const rate = parseFloat(customTaxRate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 0.5) {
      toast({ title: "Invalid rate", description: "Enter a value between 0 and 50", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("clients")
        .update({ tax_rate: rate })
        .eq("id", client.id);

      if (error) throw error;
      
      onClientUpdate({ tax_rate: rate });
      setTaxRateOpen(false);
      toast({ title: `Marginal tax rate updated to ${formatPercent(rate)}` });
    } catch (error) {
      console.error("Error updating tax rate:", error);
      toast({ title: "Error", description: "Failed to update tax rate", variant: "destructive" });
    }
  };

  const statCards = [
    {
      label: "Total Deductions",
      value: formatCurrency(stats.totalDeductions),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      breakdown: null,
    },
    {
      label: "Tax Savings",
      value: formatCurrency(stats.totalSavings),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      breakdown: null,
    },
    {
      label: "Strategies",
      value: `${stats.total} Total`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      breakdown: [
        { label: "Complete", count: stats.completed, color: "bg-emerald-500" },
        { label: "In Progress", count: stats.inProgress, color: "bg-amber-500" },
        { label: "Not Started", count: stats.notStarted, color: "bg-gray-400" },
      ],
    },
    {
      label: "Progress",
      value: `${stats.progress}%`,
      icon: Percent,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      breakdown: null,
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
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.breakdown ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {stat.breakdown.map((item) => (
                        <div key={item.label} className="flex items-center gap-1 text-sm">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="font-semibold">{item.count}</span>
                          <span className="text-muted-foreground text-xs">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                  )}
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
              <p className="text-sm text-muted-foreground mb-1">Marginal Tax Rate</p>
              <Popover open={taxRateOpen} onOpenChange={setTaxRateOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-auto py-1 px-3 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200 gap-2"
                  >
                    {formatPercent(stats.taxRate)}
                    <Pencil className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-popover" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Update Marginal Tax Rate</p>
                    <Select value={selectedTaxRate} onValueChange={updateTaxRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TAX_RATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}{option.description ? ` - ${option.description}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTaxRate === "custom" && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter rate (0-50)"
                          min="0"
                          max="50"
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={saveCustomTaxRate}>Save</Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Combined federal + state marginal rate on business income
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
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
