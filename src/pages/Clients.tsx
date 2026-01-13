import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, Eye, Mail, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface ClientWithStats {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  created_at: string;
  tax_rate: number | null;
  completed_strategies: number;
  total_strategies: number;
  total_deductions: number;
  tax_savings: number;
}

// Strategy ID ranges by tier (for auto-assignment on new clients)

// Strategy ID ranges by tier
const TIER_STRATEGY_RANGES: Record<string, { start: number; end: number } | null> = {
  Essentials: null,
  Foundation: { start: 1, end: 13 },
  Complete: { start: 1, end: 30 },
  Premium: { start: 1, end: 59 },
};

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [creatingReview, setCreatingReview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    entity_type: "S-Corp",
    package_tier: "Foundation",
    income_range: "",
    next_review_date: "",
    notes: "",
    tax_rate: "0.37",
    custom_tax_rate: "",
  });

  const fetchClients = async () => {
    if (!user) return;

    try {
      // Fetch clients with their strategy stats
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch strategy stats for all clients
      const { data: strategiesData, error: strategiesError } = await supabase
        .from("client_strategies")
        .select("client_id, status, deduction_amount");

      if (strategiesError) throw strategiesError;

      // Aggregate stats per client - sum deductions for complete AND in_progress strategies
      const statsMap = new Map<string, { 
        completed: number; 
        inProgress: number;
        total: number; 
        deductions: number;
      }>();
      
      strategiesData?.forEach((cs) => {
        const current = statsMap.get(cs.client_id) || { 
          completed: 0, 
          inProgress: 0,
          total: 0, 
          deductions: 0
        };
        current.total += 1;
        if (cs.status === "complete") {
          current.completed += 1;
        }
        if (cs.status === "in_progress") {
          current.inProgress += 1;
        }
        // Sum deductions for both complete and in_progress strategies (matches ClientDetail logic)
        if (cs.status === "complete" || cs.status === "in_progress") {
          current.deductions += cs.deduction_amount || 0;
        }
        statsMap.set(cs.client_id, current);
      });

      const enrichedClients: ClientWithStats[] = (clientsData || []).map((client) => {
        const clientStats = statsMap.get(client.id) || { 
          completed: 0, 
          inProgress: 0,
          total: 0, 
          deductions: 0
        };
        // Calculate tax savings from deductions × tax_rate (same as ClientDetail)
        const taxRate = client.tax_rate || 0.37;
        const calculatedSavings = Math.round(clientStats.deductions * taxRate);
        return {
          ...client,
          completed_strategies: clientStats.completed,
          total_strategies: clientStats.total,
          total_deductions: clientStats.deductions,
          tax_savings: calculatedSavings,
        };
      });

      setClients(enrichedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormLoading(true);
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
          entity_type: formData.entity_type,
          package_tier: formData.package_tier,
          income_range: formData.income_range || null,
          next_review_date: formData.next_review_date || null,
          notes: formData.notes || null,
          tax_rate: taxRate,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create client_strategies based on package tier
      const range = TIER_STRATEGY_RANGES[formData.package_tier];
      if (range && newClient) {
        // Get strategy IDs for this tier
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

          const { error: insertError } = await supabase
            .from("client_strategies")
            .insert(clientStrategies);

          if (insertError) throw insertError;
        }
      }

      // Create client_onboarding records for all onboarding tasks
      if (newClient) {
        const { data: onboardingTasks, error: tasksError } = await supabase
          .from("onboarding_tasks")
          .select("id");

        if (tasksError) throw tasksError;

        if (onboardingTasks && onboardingTasks.length > 0) {
          const onboardingRecords = onboardingTasks.map((t) => ({
            client_id: newClient.id,
            task_id: t.id,
            status: "pending",
          }));

          const { error: onboardingError } = await supabase
            .from("client_onboarding")
            .insert(onboardingRecords);

          if (onboardingError) throw onboardingError;
        }
      }

      toast({
        title: "Client created",
        description: `${formData.name} has been added with ${range ? range.end - range.start + 1 : 0} strategies.`,
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        entity_type: "S-Corp",
        package_tier: "Foundation",
        income_range: "",
        next_review_date: "",
        notes: "",
        tax_rate: "0.37",
        custom_tax_rate: "",
      });
      setDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${now.getFullYear()}`;
  };

  const createReviewAndNavigate = async (clientId: string) => {
    setCreatingReview(clientId);
    try {
      const { data, error } = await supabase
        .from("quarterly_reviews")
        .insert({
          client_id: clientId,
          quarter: getCurrentQuarter(),
          status: "in-progress",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/reviews/${data.id}`);
    } catch (error) {
      console.error("Error creating review:", error);
      toast({
        title: "Error",
        description: "Failed to create quarterly review",
        variant: "destructive",
      });
    } finally {
      setCreatingReview(null);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" || client.package_tier === activeTab;
    return matchesSearch && matchesTab;
  });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground font-body">
              Manage your client portfolio
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter client or business name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Entity Type</Label>
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Package Tier</Label>
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

                <div className="space-y-2">
                  <Label>Income Range</Label>
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

                <div className="space-y-2">
                  <Label>Marginal Tax Rate</Label>
                  <Select
                    value={formData.tax_rate}
                    onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.22">22% - Single $44k-$95k / MFJ $89k-$190k</SelectItem>
                      <SelectItem value="0.24">24% - Single $95k-$201k / MFJ $190k-$384k</SelectItem>
                      <SelectItem value="0.32">32% - Single $201k-$384k / MFJ $384k-$487k</SelectItem>
                      <SelectItem value="0.35">35% - Single $384k-$487k / MFJ $487k-$731k</SelectItem>
                      <SelectItem value="0.37">37% - Single $487k+ / MFJ $731k+</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Combined federal + state marginal rate on business income
                  </p>
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

                <div className="space-y-2">
                  <Label htmlFor="next_review_date">Next Review Date</Label>
                  <Input
                    id="next_review_date"
                    type="date"
                    value={formData.next_review_date}
                    onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading || !formData.name}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {formLoading ? "Creating..." : "Create Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="All">All ({clients.length})</TabsTrigger>
            <TabsTrigger value="Essentials">Essentials ({clients.filter(c => c.package_tier === 'Essentials').length})</TabsTrigger>
            <TabsTrigger value="Foundation">Foundation ({clients.filter(c => c.package_tier === 'Foundation').length})</TabsTrigger>
            <TabsTrigger value="Complete">Complete ({clients.filter(c => c.package_tier === 'Complete').length})</TabsTrigger>
            <TabsTrigger value="Premium">Premium ({clients.filter(c => c.package_tier === 'Premium').length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground font-body mb-4">
              {clients.length === 0
                ? "Get started by adding your first client"
                : "No clients match your current filters"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Client Name</TableHead>
                  <TableHead>Package Tier</TableHead>
                  <TableHead>Strategies</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Total Deductions</TableHead>
                  <TableHead>Tax Savings</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => {
                  const progress =
                    client.total_strategies > 0
                      ? (client.completed_strategies / client.total_strategies) * 100
                      : 0;

                  return (
                    <TableRow
                      key={client.id}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.entity_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTierColor(client.package_tier)}>
                          {client.package_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {client.completed_strategies}/{client.total_strategies}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground w-10">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatCurrency(client.total_deductions)}
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600 tabular-nums">
                        {formatCurrency(client.tax_savings)}
                      </TableCell>
                      <TableCell>
                        {client.next_review_date
                          ? new Date(client.next_review_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => createReviewAndNavigate(client.id)}
                            disabled={creatingReview === client.id}
                          >
                            {creatingReview === client.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4 mr-1" />
                            )}
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = `https://tools.eiduktaxandwealth.com/welcome-packet.html?client=${encodeURIComponent(client.name)}`;
                              window.open(url, "_blank");
                            }}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Welcome
                          </Button>
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
