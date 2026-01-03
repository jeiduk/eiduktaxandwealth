import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Printer, Check, ArrowRight, TrendingUp, Target, DollarSign, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  package_tier: string;
}

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
}

interface ClientStrategy {
  id: string;
  strategy_id: number;
  status: string;
  actual_savings: number | null;
  updated_at: string;
}

const PHASES = [
  { id: "1", name: "Foundation", color: "#1e40af" },
  { id: "2", name: "Core Deductions", color: "#059669" },
  { id: "3", name: "Retirement & Benefits", color: "#7c3aed" },
  { id: "4", name: "Credits & Multistate", color: "#ea580c" },
  { id: "5", name: "Real Estate & PAL", color: "#0891b2" },
  { id: "6", name: "Acquisitions & Leverage", color: "#dc2626" },
  { id: "7", name: "Exit & Wealth Transfer", color: "#ca8a04" },
  { id: "8", name: "Charitable", color: "#9333ea" },
];

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

// Estimated annual fee by tier for ROI calculation
const TIER_ANNUAL_FEE: Record<string, number> = {
  Essentials: 2500,
  Foundation: 5000,
  Complete: 10000,
  Premium: 20000,
};

const QuarterlyReview = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [clientStrategies, setClientStrategies] = useState<ClientStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        const [clientRes, strategiesRes, clientStrategiesRes] = await Promise.all([
          supabase.from("clients").select("id, name, package_tier").eq("id", id).maybeSingle(),
          supabase.from("strategies").select("*").order("id"),
          supabase.from("client_strategies").select("*").eq("client_id", id),
        ]);

        if (clientRes.error) throw clientRes.error;
        if (strategiesRes.error) throw strategiesRes.error;
        if (clientStrategiesRes.error) throw clientStrategiesRes.error;

        setClient(clientRes.data);
        setStrategies(strategiesRes.data || []);
        setClientStrategies(clientStrategiesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(`/clients/${id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, id]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = clientStrategies.filter((cs) => cs.status === "complete").length;
    const total = TIER_STRATEGY_COUNTS[client?.package_tier || "Essentials"];
    const totalSavings = clientStrategies
      .filter((cs) => cs.status === "complete")
      .reduce((sum, cs) => sum + (cs.actual_savings || 0), 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const annualFee = TIER_ANNUAL_FEE[client?.package_tier || "Essentials"];
    const roi = annualFee > 0 ? (totalSavings / annualFee).toFixed(1) : "0";

    return { completed, total, totalSavings, progress, roi };
  }, [clientStrategies, client]);

  // Get phase stats
  const phaseStats = useMemo(() => {
    const maxPhase = TIER_MAX_PHASE[client?.package_tier || "Essentials"];
    const availablePhases = PHASES.filter((p) => parseInt(p.id) <= maxPhase);

    return availablePhases.map((phase) => {
      const phaseStrategies = strategies.filter((s) => s.phase === phase.id);
      const completed = phaseStrategies.filter((s) =>
        clientStrategies.find((cs) => cs.strategy_id === s.id && cs.status === "complete")
      ).length;
      return { ...phase, completed, total: phaseStrategies.length };
    });
  }, [strategies, clientStrategies, client]);

  // Get completed this quarter (last 90 days)
  const completedThisQuarter = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return clientStrategies
      .filter((cs) => {
        if (cs.status !== "complete") return false;
        const updatedAt = new Date(cs.updated_at);
        return updatedAt >= ninetyDaysAgo;
      })
      .map((cs) => {
        const strategy = strategies.find((s) => s.id === cs.strategy_id);
        return { ...cs, strategy };
      })
      .filter((item) => item.strategy)
      .slice(0, 8);
  }, [clientStrategies, strategies]);

  // Get focus for next quarter (not started or in progress, sorted by potential savings)
  const focusNextQuarter = useMemo(() => {
    const maxPhase = TIER_MAX_PHASE[client?.package_tier || "Essentials"];
    
    return strategies
      .filter((s) => {
        if (parseInt(s.phase) > maxPhase) return false;
        const cs = clientStrategies.find((c) => c.strategy_id === s.id);
        return !cs || cs.status === "not_started" || cs.status === "in_progress";
      })
      .sort((a, b) => {
        const aHigh = a.typical_savings_high || 0;
        const bHigh = b.typical_savings_high || 0;
        return bHigh - aHigh;
      })
      .slice(0, 8)
      .map((strategy) => {
        const cs = clientStrategies.find((c) => c.strategy_id === strategy.id);
        return { strategy, status: cs?.status || "not_started" };
      });
  }, [strategies, clientStrategies, client]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRange = (low: number | null, high: number | null) => {
    if (!low && !high) return "Varies";
    if (low && high) return `${formatCurrency(low)} - ${formatCurrency(high)}`;
    return formatCurrency(low || high || 0);
  };

  const getQuarter = () => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center">
        <div className="text-white text-xl">Client not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-white p-6 print:p-4 print:bg-white print:text-black">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 print:mb-4">
        <div>
          <h1 className="text-3xl font-bold print:text-2xl">{client.name}</h1>
          <p className="text-white/70 text-lg print:text-gray-600">{getQuarter()} Quarterly Review</p>
        </div>
        <div className="flex items-center gap-4 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="hidden print:block text-right">
          <p className="font-semibold">Eiduk Tax & Wealth</p>
        </div>
      </header>

      {/* Row 1 - Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:mb-4 print:gap-2">
        <div className="bg-white rounded-xl p-5 text-gray-900 print:p-3 print:border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Overall Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${stats.progress * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {stats.progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 text-gray-900 print:p-3 print:border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <Check className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Strategies Implemented</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.completed}<span className="text-gray-400 text-xl">/{stats.total}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 text-gray-900 print:p-3 print:border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Est. Tax Savings</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(stats.totalSavings)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 text-gray-900 print:p-3 print:border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Advisory ROI</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {stats.roi}<span className="text-xl">:1</span>
          </p>
        </div>
      </div>

      {/* Row 2 - Phase Progress */}
      <div className="mb-6 print:mb-4">
        <h2 className="text-lg font-semibold mb-3 text-white/90 print:text-gray-700">Phase Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 print:gap-2">
          {phaseStats.map((phase) => {
            const percentage = phase.total > 0 ? (phase.completed / phase.total) * 100 : 0;
            return (
              <div
                key={phase.id}
                className="rounded-lg p-3 print:p-2 print:border"
                style={{ backgroundColor: `${phase.color}20` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: phase.color, color: "white" }}
                  >
                    P{phase.id}
                  </span>
                  <span className="text-xs text-white/80 truncate print:text-gray-600">
                    {phase.name}
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2 mb-1"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                />
                <p className="text-xs text-white/70 print:text-gray-500">
                  {phase.completed}/{phase.total} complete
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3 - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:gap-4 print:mb-4">
        {/* Completed This Quarter */}
        <div className="bg-white/10 rounded-xl p-5 print:p-3 print:border print:bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-gray-700">
            <Check className="h-5 w-5 text-emerald-400 print:text-emerald-600" />
            Completed This Quarter
          </h2>
          {completedThisQuarter.length === 0 ? (
            <p className="text-white/60 text-sm print:text-gray-500">No strategies completed in the last 90 days</p>
          ) : (
            <div className="space-y-2">
              {completedThisQuarter.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 print:bg-white print:border"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-400 print:text-emerald-600" />
                    <div>
                      <span className="text-xs text-white/60 print:text-gray-400">
                        #{item.strategy?.id}
                      </span>
                      <p className="text-sm font-medium print:text-gray-900">
                        {item.strategy?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 print:text-emerald-600">
                    {item.actual_savings ? formatCurrency(item.actual_savings) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus for Next Quarter */}
        <div className="bg-white/10 rounded-xl p-5 print:p-3 print:border print:bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-gray-700">
            <TrendingUp className="h-5 w-5 text-amber-400 print:text-amber-600" />
            Focus for Next Quarter
          </h2>
          {focusNextQuarter.length === 0 ? (
            <p className="text-white/60 text-sm print:text-gray-500">All strategies completed!</p>
          ) : (
            <div className="space-y-2">
              {focusNextQuarter.map((item) => (
                <div
                  key={item.strategy.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 print:bg-white print:border"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-4 w-4 text-amber-400 print:text-amber-600" />
                    <div>
                      <span className="text-xs text-white/60 print:text-gray-400">
                        #{item.strategy.id}
                      </span>
                      <p className="text-sm font-medium print:text-gray-900">
                        {item.strategy.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-white/60 print:text-gray-500">
                    {formatRange(item.strategy.typical_savings_low, item.strategy.typical_savings_high)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-4 border-t border-white/10 print:border-gray-200">
        <p className="text-lg font-semibold text-amber-400 mb-1 print:text-amber-600">
          Pay Less. Keep More. Build Wealth.
        </p>
        <p className="text-sm text-white/60 print:text-gray-500">
          John Eiduk, CPA, CFP®, MSCTA
        </p>
      </footer>
    </div>
  );
};

export default QuarterlyReview;
