import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check, Clock, Circle, X, DollarSign, Rocket, Plus, Trash2, Target, Loader2, Edit, FileText, FolderOpen } from "lucide-react";
import { StrategyCardCollapsible } from "@/components/client/StrategyCardCollapsible";
import { AddStrategyModal } from "@/components/client/AddStrategyModal";
import { ReviewsTab } from "@/components/client/ReviewsTab";
import { EditClientModal } from "@/components/client/EditClientModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OnboardingTab } from "@/components/client/OnboardingTab";
import { OverviewTab } from "@/components/client/OverviewTab";
import { differenceInDays } from "date-fns";

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
  industry: string | null;
}

interface StrategyDocument {
  id: string;
  name: string;
}

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
  strategy_number: string | null;
  tool_url: string | null;
  tool_name: string | null;
  documents: StrategyDocument[] | null;
}

interface ClientStrategy {
  id: string;
  client_id: string;
  strategy_id: number;
  status: string;
  deduction_amount: number | null;
  notes: string | null;
  tax_savings: number | null;
  review_id: string | null;
  document_statuses: Record<string, "received" | "pending" | "needed"> | null;
}

// Phase configuration - all 8 phases with their colors
const PHASES = [
  { id: 1, displayId: "P1", name: "Foundation", color: "#1e40af" },
  { id: 2, displayId: "P2", name: "Core Deductions", color: "#059669" },
  { id: 3, displayId: "P3", name: "Retirement", color: "#7c3aed" },
  { id: 4, displayId: "P4", name: "Credits", color: "#ea580c" },
  { id: 5, displayId: "P5", name: "Real Estate", color: "#0891b2" },
  { id: 6, displayId: "P6", name: "Acquisitions", color: "#dc2626" },
  { id: 7, displayId: "P7", name: "Exit", color: "#ca8a04" },
  { id: 8, displayId: "P8", name: "Charitable", color: "#9333ea" },
];

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [clientStrategies, setClientStrategies] = useState<ClientStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<number>(1);
  const [deductionInputs, setDeductionInputs] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(0);
  const [onboardingTotal, setOnboardingTotal] = useState(0);
  const [addStrategyOpen, setAddStrategyOpen] = useState(false);
  const [creatingReview, setCreatingReview] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [latestReviewId, setLatestReviewId] = useState<string | null>(null);
  const [ytdTaxSavings, setYtdTaxSavings] = useState(0);

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${now.getFullYear()}`;
  };

  const createReviewAndNavigate = async () => {
    if (!id) return;
    setCreatingReview(true);
    try {
      // Create the quarterly review
      const { data: reviewData, error: reviewError } = await supabase
        .from("quarterly_reviews")
        .insert({
          client_id: id,
          quarter: getCurrentQuarter(),
          status: "in-progress",
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Link all client strategies that don't have a review_id to this new review
      const unlinkedStrategies = clientStrategies.filter(cs => !cs.review_id);
      if (unlinkedStrategies.length > 0) {
        const { error: updateError } = await supabase
          .from("client_strategies")
          .update({ review_id: reviewData.id })
          .in("id", unlinkedStrategies.map(cs => cs.id));

        if (updateError) {
          console.error("Error linking strategies to review:", updateError);
          // Don't throw - the review was created, just log the error
        }
      }

      navigate(`/reviews/${reviewData.id}`);
    } catch (error) {
      console.error("Error creating review:", error);
      toast({
        title: "Error",
        description: "Failed to create quarterly review",
        variant: "destructive",
      });
    } finally {
      setCreatingReview(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        // Fetch client, strategies, client_strategies, onboarding data, and latest review in parallel
        const [clientRes, strategiesRes, clientStrategiesRes, onboardingTasksRes, clientOnboardingRes, latestReviewRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", id).maybeSingle(),
          supabase.from("strategies").select("*").order("id"),
          supabase.from("client_strategies").select("*").eq("client_id", id),
          supabase.from("onboarding_tasks").select("*", { count: "exact", head: true }),
          supabase.from("client_onboarding").select("*").eq("client_id", id),
          supabase.from("quarterly_reviews").select("id").eq("client_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (clientRes.error) throw clientRes.error;
        if (strategiesRes.error) throw strategiesRes.error;
        if (clientStrategiesRes.error) throw clientStrategiesRes.error;

        console.log("Fetched data:", {
          client: clientRes.data?.name,
          strategiesCount: strategiesRes.data?.length,
          clientStrategiesCount: clientStrategiesRes.data?.length,
          clientStrategies: clientStrategiesRes.data,
        });

        setClient(clientRes.data);
        setStrategies((strategiesRes.data || []).map(s => ({
          ...s,
          documents: (Array.isArray(s.documents) ? s.documents : []) as unknown as StrategyDocument[]
        })) as Strategy[]);
        setClientStrategies((clientStrategiesRes.data || []).map(cs => ({
          ...cs,
          document_statuses: (typeof cs.document_statuses === 'object' && cs.document_statuses !== null && !Array.isArray(cs.document_statuses) 
            ? cs.document_statuses 
            : {}) as unknown as Record<string, "received" | "pending" | "needed">
        })) as ClientStrategy[]);

        // Set latest review and calculate YTD tax savings
        if (latestReviewRes.data) {
          setLatestReviewId(latestReviewRes.data.id);
          // Calculate YTD savings from strategies linked to this review
          const reviewStrategies = clientStrategiesRes.data?.filter(
            (cs) => cs.review_id === latestReviewRes.data.id
          ) || [];
          const totalSavings = reviewStrategies.reduce((sum, cs) => sum + (cs.tax_savings || 0), 0);
          setYtdTaxSavings(totalSavings);
        }

        // Check if onboarding should be shown
        if (clientRes.data) {
          const daysSinceCreation = differenceInDays(new Date(), new Date(clientRes.data.created_at));
          const totalTasks = onboardingTasksRes.count || 0;
          const completedTasks = clientOnboardingRes.data?.filter((o) => o.status === "complete").length || 0;
          const hasIncomplete = completedTasks < totalTasks;
          
          setOnboardingTotal(totalTasks);
          setOnboardingComplete(completedTasks);
          setShowOnboarding(daysSinceCreation <= 90 || hasIncomplete);
        }

        // Initialize deduction inputs
        const inputs: Record<number, string> = {};
        clientStrategiesRes.data?.forEach((cs) => {
          if (cs.deduction_amount) {
            inputs[cs.strategy_id] = cs.deduction_amount.toString();
          }
        });
        setDeductionInputs(inputs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  // Calculate stats with tax rate - use actual assigned strategies count
  const stats = useMemo(() => {
    const completed = clientStrategies.filter((cs) => cs.status === "complete").length;
    const total = clientStrategies.length; // Dynamic count based on actual assigned
    const totalDeductions = clientStrategies
      .filter((cs) => cs.status === "complete")
      .reduce((sum, cs) => sum + (cs.deduction_amount || 0), 0);
    const taxRate = client?.tax_rate || 0.37;
    const totalSavings = Math.round(totalDeductions * taxRate);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, totalDeductions, totalSavings, progress, taxRate };
  }, [clientStrategies, client]);

  // Get phases that have assigned strategies - for highlighting, but show all 8 phases
  const phasesWithStrategies = useMemo(() => {
    const phaseSet = new Set<number>();
    clientStrategies.forEach((cs) => {
      const strategy = strategies.find((s) => s.id === cs.strategy_id);
      if (strategy) phaseSet.add(Number(strategy.phase));
    });
    return phaseSet;
  }, [clientStrategies, strategies]);

  // Show all 8 phases always
  const availablePhases = PHASES;

  // Get phase completion stats (only for assigned strategies)
  const phaseStats = useMemo(() => {
    const phaseStatsMap: Record<number, { completed: number; total: number }> = {};
    
    // Only count assigned strategies
    clientStrategies.forEach((cs) => {
      const strategy = strategies.find((s) => s.id === cs.strategy_id);
      if (!strategy) return;
      
      const phaseId = Number(strategy.phase);
      if (!phaseStatsMap[phaseId]) {
        phaseStatsMap[phaseId] = { completed: 0, total: 0 };
      }
      phaseStatsMap[phaseId].total += 1;
      if (cs.status === "complete") {
        phaseStatsMap[phaseId].completed += 1;
      }
    });

    return phaseStatsMap;
  }, [strategies, clientStrategies]);

  // Get strategies for active phase (only assigned ones)
  const phaseStrategies = useMemo(() => {
    const assignedIds = clientStrategies.map((cs) => cs.strategy_id);
    return strategies.filter(
      (s) => Number(s.phase) === activePhase && assignedIds.includes(s.id)
    );
  }, [strategies, activePhase, clientStrategies]);

  const getClientStrategy = (strategyId: number) => {
    return clientStrategies.find((cs) => cs.strategy_id === strategyId);
  };

  const removeStrategy = async (strategyId: number) => {
    const cs = getClientStrategy(strategyId);
    if (!cs) return;

    try {
      const { error } = await supabase
        .from("client_strategies")
        .delete()
        .eq("id", cs.id);

      if (error) throw error;

      setClientStrategies((prev) => prev.filter((c) => c.id !== cs.id));
      toast({ title: "Strategy removed" });
    } catch (error) {
      console.error("Error removing strategy:", error);
      toast({
        title: "Error",
        description: "Failed to remove strategy",
        variant: "destructive",
      });
    }
  };

  const handleStrategyAdded = (newClientStrategy: ClientStrategy) => {
    console.log("Adding strategy to state:", newClientStrategy);
    setClientStrategies((prev) => [...prev, newClientStrategy]);
  };

  const updateStatus = async (strategyId: number, newStatus: string) => {
    if (!id) return;

    const existingCs = getClientStrategy(strategyId);

    try {
      if (existingCs) {
        const { error } = await supabase
          .from("client_strategies")
          .update({ status: newStatus })
          .eq("id", existingCs.id);

        if (error) throw error;

        setClientStrategies((prev) =>
          prev.map((cs) =>
            cs.id === existingCs.id ? { ...cs, status: newStatus } : cs
          )
        );
      } else {
        const { data, error } = await supabase
          .from("client_strategies")
          .insert({
            client_id: id,
            strategy_id: strategyId,
            status: newStatus,
          })
          .select()
          .single();

        if (error) throw error;
        setClientStrategies((prev) => [...prev, {
          ...data,
          document_statuses: data.document_statuses as Record<string, "received" | "pending" | "needed"> | null
        } as ClientStrategy]);
      }

      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const updateDeduction = async (strategyId: number, value: string) => {
    if (!id) return;

    const deduction = parseInt(value) || 0;
    const existingCs = getClientStrategy(strategyId);

    if (!existingCs) return;

    try {
      const { error } = await supabase
        .from("client_strategies")
        .update({ deduction_amount: deduction })
        .eq("id", existingCs.id);

      if (error) throw error;

      setClientStrategies((prev) =>
        prev.map((cs) =>
          cs.id === existingCs.id ? { ...cs, deduction_amount: deduction } : cs
        )
      );

      toast({ title: "Deduction updated" });
    } catch (error) {
      console.error("Error updating deduction:", error);
      toast({ title: "Error", description: "Failed to update deduction", variant: "destructive" });
    }
  };

  const updateDocumentStatus = async (
    clientStrategyId: string, 
    documentId: string, 
    status: "received" | "pending" | "needed"
  ) => {
    const existingCs = clientStrategies.find((cs) => cs.id === clientStrategyId);
    if (!existingCs) return;

    const newDocStatuses = {
      ...(existingCs.document_statuses || {}),
      [documentId]: status
    };

    try {
      const { error } = await supabase
        .from("client_strategies")
        .update({ document_statuses: newDocStatuses })
        .eq("id", clientStrategyId);

      if (error) throw error;

      setClientStrategies((prev) =>
        prev.map((cs) =>
          cs.id === clientStrategyId ? { ...cs, document_statuses: newDocStatuses } : cs
        )
      );
    } catch (error) {
      console.error("Error updating document status:", error);
      toast({ title: "Error", description: "Failed to update document status", variant: "destructive" });
    }
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "complete":
        return { label: "Complete", icon: Check, bg: "bg-emerald-500/20", text: "text-emerald-600", border: "border-emerald-500/30" };
      case "in_progress":
        return { label: "In Progress", icon: Clock, bg: "bg-amber-500/20", text: "text-amber-600", border: "border-amber-500/30" };
      case "not_applicable":
        return { label: "N/A", icon: X, bg: "bg-transparent", text: "text-red-500", border: "border-red-500" };
      default:
        return { label: "Not Started", icon: Circle, bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
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

  const formatPercent = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-display text-xl font-semibold mb-2">Client not found</h2>
          <p className="text-muted-foreground mb-4">
            The client you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/clients")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>

        {/* Client Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-card rounded-xl border">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: PHASES[0].color }}
            >
              {getInitials(client.name)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {client.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{client.entity_type}</Badge>
                <Badge variant="outline" className={getTierColor(client.package_tier)}>
                  {client.package_tier}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-600">
                  {formatPercent(stats.taxRate)} Marginal Rate
                </Badge>
              </div>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">{stats.progress}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{stats.completed}/{stats.total}</p>
              <p className="text-sm text-muted-foreground">Strategies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(ytdTaxSavings)}</p>
              <p className="text-sm text-muted-foreground">YTD Tax Savings</p>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="gold"
              onClick={createReviewAndNavigate}
              disabled={creatingReview}
            >
              {creatingReview ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Start Quarterly Review
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {showOnboarding && (
              <TabsTrigger value="onboarding" className="gap-2">
                <Rocket className="h-4 w-4" />
                Onboarding
                <Badge variant="secondary" className="ml-1">
                  {onboardingComplete}/{onboardingTotal}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <FileText className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              client={client} 
              stats={stats} 
              onClientUpdate={(updates) => setClient(prev => prev ? { ...prev, ...updates } : null)}
            />
          </TabsContent>

          <TabsContent value="strategies" className="mt-6 space-y-6">
            {/* Empty state when no strategies assigned */}
            {clientStrategies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No strategies assigned</h3>
                  <p className="text-muted-foreground mb-4">
                    Add strategies to start tracking tax savings for this client.
                  </p>
                  <Button onClick={() => setAddStrategyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Strategy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Progress Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Strategy Progress</p>
                      <p className="text-xl font-bold">
                        {stats.completed} of {stats.total} strategies complete
                      </p>
                    </div>
                    <div className="w-32">
                      <Progress value={stats.progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {stats.progress}%
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddStrategyOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Strategy
                  </Button>
                </div>

                {/* Phase Tabs - Always show all 8 phases */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    {availablePhases.map((phase) => {
                      const pStats = phaseStats[phase.id] || { completed: 0, total: 0 };
                      const isActive = activePhase === phase.id;
                      const hasStrategies = phasesWithStrategies.has(phase.id);
                      return (
                        <button
                          key={phase.id}
                          onClick={() => setActivePhase(phase.id)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                            isActive
                              ? "text-white shadow-md"
                              : hasStrategies
                              ? "bg-muted hover:bg-muted/80 text-foreground"
                              : "bg-muted/50 hover:bg-muted/70 text-muted-foreground"
                          )}
                          style={isActive ? { backgroundColor: phase.color } : undefined}
                        >
                          <span>{phase.displayId}</span>
                          <span className="hidden sm:inline">{phase.name}</span>
                          {pStats.total > 0 && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              isActive ? "bg-white/20" : "bg-background"
                            )}>
                              {pStats.completed}/{pStats.total}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Strategy Cards - Collapsible List */}
                {phaseStrategies.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No strategies assigned in {PHASES.find(p => p.id === activePhase)?.displayId} {PHASES.find(p => p.id === activePhase)?.name}</p>
                      <Button variant="outline" onClick={() => setAddStrategyOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Strategy
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phaseStrategies.map((strategy) => {
                      const cs = getClientStrategy(strategy.id);
                      const phase = PHASES.find((p) => p.id === Number(strategy.phase));
                      
                      return (
                        <StrategyCardCollapsible
                          key={strategy.id}
                          strategy={strategy}
                          clientStrategy={cs}
                          phaseColor={phase?.color || "#1e40af"}
                          taxRate={stats.taxRate}
                          deductionInput={deductionInputs[strategy.id] || ""}
                          onStatusChange={updateStatus}
                          onDeductionChange={(strategyId, value) => 
                            setDeductionInputs((prev) => ({
                              ...prev,
                              [strategyId]: value,
                            }))
                          }
                          onDeductionBlur={updateDeduction}
                          onRemove={removeStrategy}
                          onDocumentStatusChange={updateDocumentStatus}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {showOnboarding && (
            <TabsContent value="onboarding" className="mt-6">
              <OnboardingTab clientId={id!} clientCreatedAt={client.created_at} />
            </TabsContent>
          )}

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <ReviewsTab clientId={id!} clientName={client.name} clientIndustry={client.industry} />
          </TabsContent>

          {/* Documents Tab - Placeholder */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Upload and manage client documents, tax returns, and supporting files.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Strategy Modal */}
        <AddStrategyModal
          open={addStrategyOpen}
          onOpenChange={setAddStrategyOpen}
          clientId={id!}
          packageTier={client.package_tier}
          allStrategies={strategies}
          assignedStrategyIds={clientStrategies.map((cs) => cs.strategy_id)}
          onStrategyAdded={handleStrategyAdded}
        />

        {/* Edit Client Modal */}
        <EditClientModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          client={client}
          onClientUpdated={(updated) => setClient(updated)}
          onClientDeleted={() => navigate("/clients")}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientDetail;
