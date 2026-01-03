import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Clock, Circle, X, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
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
}

interface ClientStrategy {
  id: string;
  client_id: string;
  strategy_id: number;
  status: string;
  actual_savings: number | null;
  notes: string | null;
}

// Phase configuration
const PHASES = [
  { id: "1", name: "Foundation", color: "#1e40af", strategies: 6 },
  { id: "2", name: "Core Deductions", color: "#059669", strategies: 7 },
  { id: "3", name: "Retirement & Benefits", color: "#7c3aed", strategies: 10 },
  { id: "4", name: "Credits & Multistate", color: "#ea580c", strategies: 7 },
  { id: "5", name: "Real Estate & PAL", color: "#0891b2", strategies: 8 },
  { id: "6", name: "Acquisitions & Leverage", color: "#dc2626", strategies: 11 },
  { id: "7", name: "Exit & Wealth Transfer", color: "#ca8a04", strategies: 10 },
  { id: "8", name: "Charitable", color: "#9333ea", strategies: 11 },
];

// Package tier to max phase
const TIER_MAX_PHASE: Record<string, number> = {
  Essentials: 0,
  Foundation: 2,
  Complete: 4,
  Premium: 7,
};

const TIER_STRATEGY_COUNTS: Record<string, number> = {
  Essentials: 0,
  Foundation: 13,
  Complete: 30,
  Premium: 59,
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [clientStrategies, setClientStrategies] = useState<ClientStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState("1");
  const [savingsInputs, setSavingsInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        // Fetch client, strategies, and client_strategies in parallel
        const [clientRes, strategiesRes, clientStrategiesRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", id).maybeSingle(),
          supabase.from("strategies").select("*").order("id"),
          supabase.from("client_strategies").select("*").eq("client_id", id),
        ]);

        if (clientRes.error) throw clientRes.error;
        if (strategiesRes.error) throw strategiesRes.error;
        if (clientStrategiesRes.error) throw clientStrategiesRes.error;

        setClient(clientRes.data);
        setStrategies(strategiesRes.data || []);
        setClientStrategies(clientStrategiesRes.data || []);

        // Initialize savings inputs
        const inputs: Record<number, string> = {};
        clientStrategiesRes.data?.forEach((cs) => {
          if (cs.actual_savings) {
            inputs[cs.strategy_id] = cs.actual_savings.toString();
          }
        });
        setSavingsInputs(inputs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = clientStrategies.filter((cs) => cs.status === "complete").length;
    const total = TIER_STRATEGY_COUNTS[client?.package_tier || "Essentials"];
    const totalSavings = clientStrategies
      .filter((cs) => cs.status === "complete")
      .reduce((sum, cs) => sum + (cs.actual_savings || 0), 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, totalSavings, progress };
  }, [clientStrategies, client]);

  // Get phases available for this client's tier
  const availablePhases = useMemo(() => {
    const maxPhase = TIER_MAX_PHASE[client?.package_tier || "Essentials"];
    return PHASES.filter((p) => parseInt(p.id) <= maxPhase);
  }, [client]);

  // Get phase completion stats
  const phaseStats = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    
    strategies.forEach((s) => {
      const cs = clientStrategies.find((c) => c.strategy_id === s.id);
      if (!stats[s.phase]) {
        stats[s.phase] = { completed: 0, total: 0 };
      }
      stats[s.phase].total += 1;
      if (cs?.status === "complete") {
        stats[s.phase].completed += 1;
      }
    });

    return stats;
  }, [strategies, clientStrategies]);

  // Get strategies for active phase
  const phaseStrategies = useMemo(() => {
    return strategies.filter((s) => s.phase === activePhase);
  }, [strategies, activePhase]);

  const getClientStrategy = (strategyId: number) => {
    return clientStrategies.find((cs) => cs.strategy_id === strategyId);
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
        setClientStrategies((prev) => [...prev, data]);
      }

      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const updateSavings = async (strategyId: number, value: string) => {
    if (!id) return;

    const savings = parseInt(value) || 0;
    const existingCs = getClientStrategy(strategyId);

    if (!existingCs) return;

    try {
      const { error } = await supabase
        .from("client_strategies")
        .update({ actual_savings: savings })
        .eq("id", existingCs.id);

      if (error) throw error;

      setClientStrategies((prev) =>
        prev.map((cs) =>
          cs.id === existingCs.id ? { ...cs, actual_savings: savings } : cs
        )
      );

      toast({ title: "Savings updated" });
    } catch (error) {
      console.error("Error updating savings:", error);
      toast({ title: "Error", description: "Failed to update savings", variant: "destructive" });
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
              </div>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.progress}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
              <p className="text-sm text-muted-foreground">Strategies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalSavings)}</p>
              <p className="text-sm text-muted-foreground">Est. Savings</p>
            </div>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate(`/clients/${id}/review`)}
            >
              Start Quarterly Review
            </Button>
          </div>
        </div>

        {/* Phase Tabs */}
        {availablePhases.length > 0 && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {availablePhases.map((phase) => {
                const pStats = phaseStats[phase.id] || { completed: 0, total: 0 };
                const isActive = activePhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                      isActive
                        ? "text-white shadow-md"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                    style={isActive ? { backgroundColor: phase.color } : undefined}
                  >
                    <span>P{phase.id}</span>
                    <span className="hidden sm:inline">{phase.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isActive ? "bg-white/20" : "bg-background"
                    )}>
                      {pStats.completed}/{pStats.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategy Cards Grid */}
        {phaseStrategies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No strategies in this phase</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phaseStrategies.map((strategy) => {
              const cs = getClientStrategy(strategy.id);
              const status = cs?.status || "not_started";
              const statusConfig = getStatusConfig(status);
              const phase = PHASES.find((p) => p.id === strategy.phase);

              return (
                <Card
                  key={strategy.id}
                  className="overflow-hidden"
                  style={{ borderLeftWidth: "4px", borderLeftColor: phase?.color }}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Strategy header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold"
                            style={{ color: phase?.color }}
                          >
                            #{strategy.id}
                          </span>
                          <span className="font-semibold text-sm line-clamp-1">
                            {strategy.name}
                          </span>
                        </div>
                        {strategy.irc_citation && (
                          <p className="text-xs text-blue-600 mt-0.5">{strategy.irc_citation}</p>
                        )}
                      </div>
                    </div>

                    {/* Status dropdown */}
                    <Select
                      value={status}
                      onValueChange={(value) => updateStatus(strategy.id, value)}
                    >
                      <SelectTrigger className={cn(
                        "h-8 text-sm font-medium",
                        statusConfig.bg,
                        statusConfig.text,
                        statusConfig.border
                      )}>
                        <div className="flex items-center gap-2">
                          <statusConfig.icon className="h-3.5 w-3.5" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3.5 w-3.5" />
                            Not Started
                          </div>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="complete">
                          <div className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5" />
                            Complete
                          </div>
                        </SelectItem>
                        <SelectItem value="not_applicable">
                          <div className="flex items-center gap-2">
                            <X className="h-3.5 w-3.5" />
                            N/A
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Savings input (only for complete status) */}
                    {status === "complete" && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Actual savings"
                          value={savingsInputs[strategy.id] || ""}
                          onChange={(e) =>
                            setSavingsInputs((prev) => ({
                              ...prev,
                              [strategy.id]: e.target.value,
                            }))
                          }
                          onBlur={(e) => updateSavings(strategy.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDetail;
