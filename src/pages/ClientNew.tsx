import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

// Strategy ID ranges by tier
const TIER_STRATEGY_RANGES: Record<string, { start: number; end: number } | null> = {
  Essentials: null,
  Foundation: { start: 1, end: 13 },
  Complete: { start: 1, end: 30 },
  Premium: { start: 1, end: 59 },
};

interface IndustryBenchmark {
  industry: string;
  display_name: string;
}

const ClientNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<IndustryBenchmark[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    first_name: "",
    last_name: "",
    entity_type: "S-Corp",
    package_tier: "Foundation",
    income_range: "",
    next_review_date: "",
    notes: "",
    tax_rate: "0.37",
    custom_tax_rate: "",
    industry: "",
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    const { data } = await supabase
      .from("industry_benchmarks")
      .select("industry, display_name")
      .order("display_name");
    if (data) setIndustries(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const taxRate = formData.tax_rate === "custom" 
        ? parseFloat(formData.custom_tax_rate) / 100 
        : parseFloat(formData.tax_rate);

      // Insert client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: formData.name,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          entity_type: formData.entity_type,
          package_tier: formData.package_tier,
          income_range: formData.income_range || null,
          next_review_date: formData.next_review_date || null,
          notes: formData.notes || null,
          tax_rate: taxRate,
          industry: formData.industry || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create client_strategies based on package tier
      const range = TIER_STRATEGY_RANGES[formData.package_tier];
      if (range && newClient) {
        const { data: strategies, error: strategiesError } = await supabase
          .from("strategies")
          .select("id")
          .gte("id", range.start)
          .lte("id", range.end);

        if (strategiesError) throw strategiesError;

        if (strategies && strategies.length > 0) {
          const clientStrategies = strategies.map((s) => ({
            client_id: newClient.id,
            strategy_id: s.id,
            status: "not_started",
          }));

          await supabase.from("client_strategies").insert(clientStrategies);
        }
      }

      // Create client_onboarding records
      if (newClient) {
        const { data: onboardingTasks, error: tasksError } = await supabase
          .from("onboarding_tasks")
          .select("id");

        if (!tasksError && onboardingTasks && onboardingTasks.length > 0) {
          const onboardingRecords = onboardingTasks.map((t) => ({
            client_id: newClient.id,
            task_id: t.id,
            status: "pending",
          }));

          await supabase.from("client_onboarding").insert(onboardingRecords);
        }
      }

      toast({
        title: "Client created",
        description: `${formData.name} has been added with ${range ? range.end - range.start + 1 : 0} strategies.`,
      });
      navigate(`/clients/${newClient.id}`);
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Add New Client</h1>
            <p className="text-muted-foreground font-body">
              Enter client information to add them to your portfolio
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Business/Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client or business name"
                  required
                />
              </div>

              {/* Owner First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Owner First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Owner Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Entity Type */}
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S-Corp">S-Corp</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Sole Prop">Sole Prop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.industry} value={ind.industry}>
                        {ind.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package Tier */}
              <div className="space-y-2">
                <Label htmlFor="package_tier">Package Tier</Label>
                <Select
                  value={formData.package_tier}
                  onValueChange={(value) => setFormData({ ...formData, package_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Essentials">Essentials (0 strategies)</SelectItem>
                    <SelectItem value="Foundation">Foundation (13 strategies)</SelectItem>
                    <SelectItem value="Complete">Complete (30 strategies)</SelectItem>
                    <SelectItem value="Premium">Premium (59 strategies)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <Label>Tax Rate</Label>
                <Select
                  value={formData.tax_rate}
                  onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.24">24%</SelectItem>
                    <SelectItem value="0.32">32%</SelectItem>
                    <SelectItem value="0.35">35%</SelectItem>
                    <SelectItem value="0.37">37%</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {formData.tax_rate === "custom" && (
                  <Input
                    type="number"
                    placeholder="Enter rate (0-50)"
                    min="0"
                    max="50"
                    value={formData.custom_tax_rate}
                    onChange={(e) => setFormData({ ...formData, custom_tax_rate: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Income Range */}
              <div className="space-y-2">
                <Label htmlFor="income_range">Income Range</Label>
                <Select
                  value={formData.income_range}
                  onValueChange={(value) => setFormData({ ...formData, income_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$100k-$150k">$100k-$150k</SelectItem>
                    <SelectItem value="$150k-$300k">$150k-$300k</SelectItem>
                    <SelectItem value="$300k-$600k">$300k-$600k</SelectItem>
                    <SelectItem value="$600k-$1M+">$600k-$1M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Review Date */}
              <div className="space-y-2">
                <Label htmlFor="next_review_date">Next Review Date</Label>
                <Input
                  id="next_review_date"
                  type="date"
                  value={formData.next_review_date}
                  onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this client..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/clients")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientNew;
