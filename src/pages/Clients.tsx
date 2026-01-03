import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, Eye } from "lucide-react";
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
  completed_strategies: number;
  total_strategies: number;
  total_savings: number;
}

// Strategy counts by tier (matching the reference data)
const TIER_STRATEGY_COUNTS: Record<string, number> = {
  Essentials: 0,
  Foundation: 13,
  Complete: 30,
  Premium: 59,
};

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
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    entity_type: "S-Corp",
    package_tier: "Foundation",
    income_range: "",
    next_review_date: "",
    notes: "",
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
        .select("client_id, status, actual_savings");

      if (strategiesError) throw strategiesError;

      // Aggregate stats per client
      const statsMap = new Map<string, { completed: number; total: number; savings: number }>();
      strategiesData?.forEach((cs) => {
        const current = statsMap.get(cs.client_id) || { completed: 0, total: 0, savings: 0 };
        current.total += 1;
        if (cs.status === "complete") {
          current.completed += 1;
          current.savings += cs.actual_savings || 0;
        }
        statsMap.set(cs.client_id, current);
      });

      const enrichedClients: ClientWithStats[] = (clientsData || []).map((client) => {
        const stats = statsMap.get(client.id) || { completed: 0, total: 0, savings: 0 };
        const expectedTotal = TIER_STRATEGY_COUNTS[client.package_tier] || 0;
        return {
          ...client,
          completed_strategies: stats.completed,
          total_strategies: expectedTotal,
          total_savings: stats.savings,
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
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Premium">Premium</TabsTrigger>
            <TabsTrigger value="Complete">Complete</TabsTrigger>
            <TabsTrigger value="Foundation">Foundation</TabsTrigger>
            <TabsTrigger value="Essentials">Essentials</TabsTrigger>
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
                  <TableHead>Est. Savings</TableHead>
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
                      <TableCell className="font-medium">
                        {formatCurrency(client.total_savings)}
                      </TableCell>
                      <TableCell>
                        {client.next_review_date
                          ? new Date(client.next_review_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
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
