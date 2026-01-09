import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Save, Printer, Trash2, Check, Loader2, Plus } from "lucide-react";
import { StrategyCard } from "@/components/review/StrategyCard";
import { AddStrategyModal } from "@/components/review/AddStrategyModal";

// Phase configuration
const PHASES = [
  { id: 1, name: "Foundation", color: "#1E40AF", strategies: 6, range: [1, 6] },
  { id: 2, name: "Core Deductions", color: "#059669", strategies: 7, range: [7, 13] },
  { id: 3, name: "Retirement", color: "#7C3AED", strategies: 10, range: [14, 23] },
  { id: 4, name: "Credits", color: "#EA580C", strategies: 7, range: [24, 30] },
  { id: 5, name: "Real Estate", color: "#0891B2", strategies: 9, range: [31, 39] },
  { id: 6, name: "Acquisitions", color: "#DC2626", strategies: 11, range: [40, 50] },
  { id: 7, name: "Exit", color: "#CA8A04", strategies: 10, range: [51, 60] },
  { id: 8, name: "Charitable", color: "#9333EA", strategies: 10, range: [61, 70] },
];

const TOTAL_STRATEGIES = 70;

interface PhaseStatus {
  [key: string]: "not-started" | "in-progress" | "complete";
}

interface QuarterlyReview {
  id: string;
  client_id: string;
  quarter: string;
  meeting_date: string | null;
  status: string;
  revenue_ytd: number | null;
  revenue_goal: number | null;
  profit_ytd: number | null;
  profit_goal: number | null;
  draw_ytd: number | null;
  draw_goal: number | null;
  employees_current: number | null;
  employees_goal: number | null;
  hurdle_1: string | null;
  hurdle_2: string | null;
  hurdle_3: string | null;
  advisor_name: string | null;
  tax_rate_override: number | null;
  compliance_payroll: boolean | null;
  compliance_estimates: boolean | null;
  compliance_books: boolean | null;
  compliance_notes: string | null;
}

interface Client {
  id: string;
  name: string;
  entity_type: string;
  tax_rate: number | null;
  phase_status: PhaseStatus | null;
}

interface ClientStrategy {
  id: string;
  strategy_id: number;
  status: string;
  tax_savings: number | null;
  deduction_amount: number | null;
  notes: string | null;
}

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
}

const TAX_RATE_OPTIONS = [
  { value: "0.22", label: "22% - Single $44k-$95k / MFJ $89k-$190k" },
  { value: "0.24", label: "24% - Single $95k-$201k / MFJ $190k-$384k" },
  { value: "0.32", label: "32% - Single $201k-$384k / MFJ $384k-$487k" },
  { value: "0.35", label: "35% - Single $384k-$487k / MFJ $487k-$731k" },
  { value: "0.37", label: "37% - Single $487k+ / MFJ $731k+" },
  { value: "custom", label: "Custom" },
];

const QUARTER_OPTIONS = [
  { value: "Q1 2025", label: "Q1 2025" },
  { value: "Q2 2025", label: "Q2 2025" },
  { value: "Q3 2025", label: "Q3 2025" },
  { value: "Q4 2025", label: "Q4 2025" },
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q2 2026", label: "Q2 2026" },
  { value: "Q3 2026", label: "Q3 2026" },
  { value: "Q4 2026", label: "Q4 2026" },
];

const QuarterlyReviewForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [review, setReview] = useState<QuarterlyReview | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clientStrategies, setClientStrategies] = useState<ClientStrategy[]>([]);
  const [allStrategies, setAllStrategies] = useState<Strategy[]>([]);
  const [showCustomTaxRate, setShowCustomTaxRate] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState("");
  const [showAddStrategyModal, setShowAddStrategyModal] = useState(false);

  useEffect(() => {
    if (user && id) fetchReview();
  }, [user, id]);

  const fetchReview = async () => {
    try {
      const { data: reviewData, error: reviewError } = await supabase
        .from("quarterly_reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, name, entity_type, tax_rate, phase_status")
        .eq("id", reviewData.client_id)
        .single();

      if (clientError) throw clientError;

      // Fetch client strategies
      const { data: strategiesData } = await supabase
        .from("client_strategies")
        .select("id, strategy_id, status, tax_savings, deduction_amount, notes")
        .eq("client_id", reviewData.client_id);

      // Fetch all strategies for the library
      const { data: allStrategiesData } = await supabase
        .from("strategies")
        .select("id, name, phase, phase_name, irc_citation, description")
        .order("id");

      setReview(reviewData);
      setClient(clientData as Client);
      setClientStrategies((strategiesData || []) as ClientStrategy[]);
      setAllStrategies((allStrategiesData || []) as Strategy[]);

      // Check if tax rate is custom
      const currentRate = reviewData.tax_rate_override ?? clientData.tax_rate ?? 0.37;
      const isStandardRate = TAX_RATE_OPTIONS.slice(0, -1).some(
        (opt) => Math.abs(parseFloat(opt.value) - currentRate) < 0.001
      );
      if (!isStandardRate) {
        setShowCustomTaxRate(true);
        setCustomTaxRate(String(Math.round(currentRate * 100)));
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      toast({ title: "Error", description: "Failed to load review", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const saveReview = useCallback(
    async (updates: Partial<QuarterlyReview>) => {
      if (!review) return;

      setSaving(true);
      setSaved(false);

      try {
        const { error } = await supabase
          .from("quarterly_reviews")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", review.id);

        if (error) throw error;

        setReview((prev) => (prev ? { ...prev, ...updates } : null));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        console.error("Error saving:", error);
        toast({ title: "Error", description: "Failed to save", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [review]
  );

  const handleSaveDraft = async () => {
    if (!review) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("quarterly_reviews")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", review.id);

      if (error) throw error;
      toast({ title: "Draft saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearForm = async () => {
    if (!review) return;

    try {
      const clearedData = {
        revenue_ytd: null,
        revenue_goal: null,
        profit_ytd: null,
        profit_goal: null,
        draw_ytd: null,
        draw_goal: null,
        employees_current: null,
        employees_goal: null,
        hurdle_1: null,
        hurdle_2: null,
        hurdle_3: null,
      };

      const { error } = await supabase
        .from("quarterly_reviews")
        .update(clearedData)
        .eq("id", review.id);

      if (error) throw error;

      setReview((prev) => (prev ? { ...prev, ...clearedData } : null));
      toast({ title: "Form cleared" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear form", variant: "destructive" });
    }
  };

  const updateField = (field: keyof QuarterlyReview, value: any) => {
    setReview((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleBlur = (field: keyof QuarterlyReview, value: any) => {
    saveReview({ [field]: value });
  };

  const formatCurrencyInput = (value: string): number | null => {
    const num = parseInt(value.replace(/[^0-9]/g, ""));
    return isNaN(num) ? null : num;
  };

  const displayCurrency = (value: number | null): string => {
    if (value === null || value === 0) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgress = (ytd: number | null, goal: number | null): number => {
    if (!ytd || !goal || goal === 0) return 0;
    return Math.min(Math.round((ytd / goal) * 100), 100);
  };

  const getYear = () => {
    if (!review?.quarter) return new Date().getFullYear();
    const match = review.quarter.match(/\d{4}/);
    return match ? match[0] : new Date().getFullYear();
  };

  const getCurrentTaxRate = () => {
    return review?.tax_rate_override ?? client?.tax_rate ?? 0.37;
  };

  const handleTaxRateChange = (value: string) => {
    if (value === "custom") {
      setShowCustomTaxRate(true);
    } else {
      setShowCustomTaxRate(false);
      const rate = parseFloat(value);
      saveReview({ tax_rate_override: rate });
    }
  };

  const handleCustomTaxRateBlur = () => {
    const rate = parseFloat(customTaxRate) / 100;
    if (rate >= 0 && rate <= 0.5) {
      saveReview({ tax_rate_override: rate });
    }
  };

  // Phase status helpers
  const getPhaseStatus = (phaseId: number): "not-started" | "in-progress" | "complete" => {
    const status = client?.phase_status?.[String(phaseId)];
    if (status === "in-progress" || status === "complete") return status;
    return "not-started";
  };

  const cyclePhaseStatus = async (phaseId: number) => {
    if (!client) return;
    
    const currentStatus = getPhaseStatus(phaseId);
    const nextStatus = 
      currentStatus === "not-started" ? "in-progress" :
      currentStatus === "in-progress" ? "complete" : "not-started";
    
    const newPhaseStatus = {
      ...(client.phase_status || {}),
      [String(phaseId)]: nextStatus,
    };

    try {
      const { error } = await supabase
        .from("clients")
        .update({ phase_status: newPhaseStatus })
        .eq("id", client.id);

      if (error) throw error;

      setClient((prev) => prev ? { ...prev, phase_status: newPhaseStatus as PhaseStatus } : null);
    } catch (error) {
      console.error("Error updating phase status:", error);
      toast({ title: "Error", description: "Failed to update phase status", variant: "destructive" });
    }
  };

  // Calculate pathway stats
  const pathwayStats = useMemo(() => {
    // Find current phase (first in-progress, or first not-started, or 8 if all complete)
    let currentPhase = 1;
    for (let i = 1; i <= 8; i++) {
      const status = getPhaseStatus(i);
      if (status === "in-progress") {
        currentPhase = i;
        break;
      }
      if (status === "not-started") {
        currentPhase = i;
        break;
      }
      if (i === 8) currentPhase = 8;
    }

    // Calculate progress (count completed phase strategies)
    let completedStrategies = 0;
    PHASES.forEach((phase) => {
      if (getPhaseStatus(phase.id) === "complete") {
        completedStrategies += phase.strategies;
      }
    });
    const progressPercent = Math.round((completedStrategies / TOTAL_STRATEGIES) * 100);

    // Active strategies from client_strategies
    const activeStrategies = clientStrategies.filter(
      (cs) => cs.status === "active" || cs.status === "complete" || cs.status === "in_progress"
    ).length;

    // YTD Savings
    const ytdSavings = clientStrategies.reduce((sum, cs) => sum + (cs.tax_savings || 0), 0);

    return { currentPhase, progressPercent, activeStrategies, ytdSavings };
  }, [client?.phase_status, clientStrategies]);

  const formatCurrencyDisplay = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Strategy management functions
  const handleAddStrategies = async (strategyIds: number[]) => {
    if (!client || !review || strategyIds.length === 0) return;

    try {
      const inserts = strategyIds.map((strategyId) => ({
        client_id: client.id,
        strategy_id: strategyId,
        review_id: review.id,
        status: "not_started",
      }));

      const { data, error } = await supabase
        .from("client_strategies")
        .insert(inserts)
        .select("id, strategy_id, status, tax_savings, deduction_amount, notes");

      if (error) throw error;

      setClientStrategies((prev) => [...prev, ...(data as ClientStrategy[])]);
      setShowAddStrategyModal(false);
      toast({ title: `${strategyIds.length} strateg${strategyIds.length === 1 ? "y" : "ies"} added` });
    } catch (error) {
      console.error("Error adding strategies:", error);
      toast({ title: "Error", description: "Failed to add strategies", variant: "destructive" });
    }
  };

  const handleUpdateStrategy = async (id: string, updates: Partial<ClientStrategy>) => {
    try {
      const { error } = await supabase
        .from("client_strategies")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setClientStrategies((prev) =>
        prev.map((cs) => (cs.id === id ? { ...cs, ...updates } : cs))
      );
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({ title: "Error", description: "Failed to update strategy", variant: "destructive" });
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      const { error } = await supabase
        .from("client_strategies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClientStrategies((prev) => prev.filter((cs) => cs.id !== id));
      toast({ title: "Strategy removed" });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({ title: "Error", description: "Failed to remove strategy", variant: "destructive" });
    }
  };

  const addedStrategyIds = useMemo(
    () => clientStrategies.map((cs) => cs.strategy_id),
    [clientStrategies]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-eiduk-gold" />
      </div>
    );
  }

  if (!review || !client) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Review not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Back button */}
      <div className="max-w-[1200px] mx-auto px-4 py-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Main container */}
      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="gradient-header px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+')] bg-repeat"></div>
            </div>
            <div className="relative z-10">
              <p className="text-eiduk-gold font-semibold tracking-widest text-sm mb-2">
                EIDUK TAX & WEALTH
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
                Quarterly Review Guide
              </h1>
              <p className="text-white/80 text-lg">
                The Eiduk Pathway™ — 70-Strategy Tax Optimization
              </p>
              <p className="text-eiduk-gold font-medium mt-2">
                Pay Less. Keep More. Build Wealth.
              </p>
            </div>
          </div>

          {/* Meeting Information Bar */}
          <div className="bg-slate-50 border-b px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Client Name</Label>
                <p className="font-medium">{client.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Entity Name</Label>
                <p className="font-medium">{client.entity_type}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Quarter</Label>
                <Select
                  value={review.quarter}
                  onValueChange={(value) => {
                    updateField("quarter", value);
                    saveReview({ quarter: value });
                  }}
                >
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTER_OPTIONS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Meeting Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal bg-white",
                        !review.meeting_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {review.meeting_date
                        ? format(new Date(review.meeting_date), "MMM d, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={review.meeting_date ? new Date(review.meeting_date) : undefined}
                      onSelect={(date) => {
                        const dateStr = date ? format(date, "yyyy-MM-dd") : null;
                        updateField("meeting_date", dateStr);
                        saveReview({ meeting_date: dateStr });
                      }}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Advisor</Label>
                <Input
                  value={review.advisor_name || "John Eiduk, CPA, CFP®"}
                  onChange={(e) => updateField("advisor_name", e.target.value)}
                  onBlur={(e) => handleBlur("advisor_name", e.target.value)}
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marginal Tax Rate</Label>
                <div className="flex gap-2">
                  <Select
                    value={
                      showCustomTaxRate
                        ? "custom"
                        : TAX_RATE_OPTIONS.find(
                            (opt) =>
                              Math.abs(parseFloat(opt.value) - getCurrentTaxRate()) < 0.001
                          )?.value || "0.37"
                    }
                    onValueChange={handleTaxRateChange}
                  >
                    <SelectTrigger className="h-9 bg-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_RATE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.value === "custom" ? "Custom" : `${Math.round(parseFloat(opt.value) * 100)}%`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomTaxRate && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={customTaxRate}
                        onChange={(e) => setCustomTaxRate(e.target.value)}
                        onBlur={handleCustomTaxRateBlur}
                        className="h-9 w-16 bg-white"
                        placeholder="37"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save status indicator */}
          <div className="px-6 py-2 border-b bg-white flex items-center justify-end gap-2 text-sm print:hidden">
            {saving && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving...</span>
              </>
            )}
            {saved && !saving && (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600">Saved ✓</span>
              </>
            )}
          </div>

          {/* Accordion Sections */}
          <div className="p-6">
            <Accordion type="multiple" defaultValue={["section-1", "section-2", "section-3", "section-4", "section-5", "section-6"]} className="space-y-4">
              {/* Section 1: How We Work Together */}
              <AccordionItem value="section-1" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">1. How We Work Together</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <p className="text-muted-foreground mb-6">
                    Your annual engagement rhythm with Eiduk Tax & Wealth
                  </p>

                  {/* Timeline visualization */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      {["Q1", "Q2", "Q3", "Q4"].map((q, idx) => {
                        const isActive = review.quarter.startsWith(q);
                        return (
                          <div key={q} className="flex-1 flex flex-col items-center">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                isActive
                                  ? "bg-eiduk-gold text-white"
                                  : "bg-slate-200 text-slate-500"
                              )}
                            >
                              {idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative h-1 bg-slate-200 rounded mx-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-eiduk-gold/20 via-eiduk-gold to-eiduk-gold/20 rounded" />
                    </div>
                  </div>

                  {/* Quarter badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { q: "Q1", title: "Quarterly Review", desc: "Strategy selection & projections" },
                      { q: "Q2", title: "Quarterly Review", desc: "Implementation & tracking" },
                      { q: "Q3", title: "Quarterly Review", desc: "Mid-year adjustments" },
                      { q: "Q4", title: "Quarterly Review", desc: "Year-end optimization & filing" },
                    ].map(({ q, title, desc }) => {
                      const isActive = review.quarter.startsWith(q);
                      return (
                        <div
                          key={q}
                          className={cn(
                            "p-4 rounded-lg text-center transition-all",
                            isActive
                              ? "bg-eiduk-gold/10 border-2 border-eiduk-gold"
                              : "bg-slate-50 border border-slate-200"
                          )}
                        >
                          <p
                            className={cn(
                              "font-bold text-lg",
                              isActive ? "text-eiduk-gold" : "text-slate-400"
                            )}
                          >
                            {q}
                          </p>
                          <p className="font-medium text-sm mt-1">{title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Financial Goals */}
              <AccordionItem value="section-2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">2. Financial Goals for {getYear()}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue */}
                    <MetricCard
                      title="Revenue"
                      color="emerald"
                      ytd={review.revenue_ytd}
                      goal={review.revenue_goal}
                      onYtdChange={(v) => updateField("revenue_ytd", v)}
                      onGoalChange={(v) => updateField("revenue_goal", v)}
                      onYtdBlur={(v) => handleBlur("revenue_ytd", v)}
                      onGoalBlur={(v) => handleBlur("revenue_goal", v)}
                    />

                    {/* Net Profit */}
                    <MetricCard
                      title="Net Profit"
                      color="blue"
                      ytd={review.profit_ytd}
                      goal={review.profit_goal}
                      onYtdChange={(v) => updateField("profit_ytd", v)}
                      onGoalChange={(v) => updateField("profit_goal", v)}
                      onYtdBlur={(v) => handleBlur("profit_ytd", v)}
                      onGoalBlur={(v) => handleBlur("profit_goal", v)}
                    />

                    {/* Personal Draw */}
                    <MetricCard
                      title="Personal Draw"
                      color="navy"
                      ytd={review.draw_ytd}
                      goal={review.draw_goal}
                      onYtdChange={(v) => updateField("draw_ytd", v)}
                      onGoalChange={(v) => updateField("draw_goal", v)}
                      onYtdBlur={(v) => handleBlur("draw_ytd", v)}
                      onGoalBlur={(v) => handleBlur("draw_goal", v)}
                    />

                    {/* Employees */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-700 mb-3">Employees</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Current</Label>
                          <Input
                            type="number"
                            min="0"
                            value={review.employees_current ?? ""}
                            onChange={(e) =>
                              updateField("employees_current", parseInt(e.target.value) || null)
                            }
                            onBlur={(e) =>
                              handleBlur("employees_current", parseInt(e.target.value) || null)
                            }
                            className="h-9 bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Goal</Label>
                          <Input
                            type="number"
                            min="0"
                            value={review.employees_goal ?? ""}
                            onChange={(e) =>
                              updateField("employees_goal", parseInt(e.target.value) || null)
                            }
                            onBlur={(e) =>
                              handleBlur("employees_goal", parseInt(e.target.value) || null)
                            }
                            className="h-9 bg-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <Progress
                        value={getProgress(review.employees_current, review.employees_goal)}
                        className="h-2"
                      />
                      <p className="text-xs text-right text-muted-foreground mt-1">
                        {getProgress(review.employees_current, review.employees_goal)}%
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Biggest Hurdles */}
              <AccordionItem value="section-3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">3. Biggest Hurdles This Quarter</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <p className="text-muted-foreground mb-4">
                    What's standing between you and your goals?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((num) => {
                      const field = `hurdle_${num}` as keyof QuarterlyReview;
                      return (
                        <div
                          key={num}
                          className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-eiduk-gold rounded-lg p-4"
                        >
                          <p className="text-eiduk-gold font-bold text-sm uppercase mb-2">
                            Hurdle {num}
                          </p>
                          <Textarea
                            rows={3}
                            placeholder="Describe the challenge..."
                            value={(review[field] as string) ?? ""}
                            onChange={(e) => updateField(field, e.target.value)}
                            onBlur={(e) => handleBlur(field, e.target.value)}
                            className="bg-white resize-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: The Eiduk Pathway Dashboard */}
              <AccordionItem value="section-4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">4. The Eiduk Pathway™ Dashboard</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <p className="text-muted-foreground mb-6 text-center">
                    70-Strategy Framework • 8 Phases • Building Wealth While Reducing Taxes
                  </p>

                  {/* Phase Badges Row */}
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4 mb-8">
                    {PHASES.map((phase) => {
                      const phaseStatus = getPhaseStatus(phase.id);
                      return (
                        <button
                          key={phase.id}
                          onClick={() => cyclePhaseStatus(phase.id)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer border-2",
                            phaseStatus === "not-started" && "bg-gray-100 border-gray-200 hover:bg-gray-200",
                            phaseStatus === "in-progress" && "border-solid hover:opacity-80",
                            phaseStatus === "complete" && "text-white hover:opacity-90"
                          )}
                          style={{
                            backgroundColor:
                              phaseStatus === "complete"
                                ? phase.color
                                : phaseStatus === "in-progress"
                                ? `${phase.color}20`
                                : undefined,
                            borderColor:
                              phaseStatus === "in-progress" || phaseStatus === "complete"
                                ? phase.color
                                : undefined,
                          }}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1",
                              phaseStatus === "not-started" && "bg-gray-300 text-gray-600",
                              phaseStatus === "in-progress" && "text-white",
                              phaseStatus === "complete" && "bg-white/20 text-white"
                            )}
                            style={{
                              backgroundColor:
                                phaseStatus === "in-progress" ? phase.color : undefined,
                            }}
                          >
                            {phaseStatus === "complete" ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              `P${phase.id}`
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium text-center leading-tight",
                              phaseStatus === "not-started" && "text-gray-500",
                              phaseStatus === "in-progress" && "text-gray-700",
                              phaseStatus === "complete" && "text-white"
                            )}
                          >
                            {phase.name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] mt-1",
                              phaseStatus === "not-started" && "text-gray-400",
                              phaseStatus === "in-progress" && "text-gray-500",
                              phaseStatus === "complete" && "text-white/80"
                            )}
                          >
                            {phase.strategies} str
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Current Phase */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Current Phase
                      </p>
                      <p
                        className="text-3xl font-bold"
                        style={{ color: "#C9A227" }}
                      >
                        P{pathwayStats.currentPhase}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {PHASES.find((p) => p.id === pathwayStats.currentPhase)?.name || "Foundation"}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Progress
                      </p>
                      <p className="text-3xl font-bold text-slate-700">
                        {pathwayStats.progressPercent}%
                      </p>
                      <Progress value={pathwayStats.progressPercent} className="h-2 mt-2" />
                    </div>

                    {/* Active Strategies */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Active Strategies
                      </p>
                      <p className="text-3xl font-bold text-blue-700">
                        {pathwayStats.activeStrategies}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of {TOTAL_STRATEGIES}
                      </p>
                    </div>

                    {/* YTD Savings */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        YTD Savings
                      </p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {formatCurrencyDisplay(pathwayStats.ytdSavings)}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 5: Quick Compliance Check */}
              <AccordionItem value="section-5" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">5. Quick Compliance Check</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Payroll Current */}
                    <label
                      className={cn(
                        "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                        review.compliance_payroll
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={review.compliance_payroll || false}
                          onCheckedChange={(checked) => {
                            updateField("compliance_payroll", !!checked);
                            saveReview({ compliance_payroll: !!checked });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-semibold text-sm">Payroll Current</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            W-2 wages paid, 941 deposits made
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Estimates Current */}
                    <label
                      className={cn(
                        "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                        review.compliance_estimates
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={review.compliance_estimates || false}
                          onCheckedChange={(checked) => {
                            updateField("compliance_estimates", !!checked);
                            saveReview({ compliance_estimates: !!checked });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-semibold text-sm">Estimates Current</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Federal & state quarterly est. on track
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Books Reconciled */}
                    <label
                      className={cn(
                        "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                        review.compliance_books
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={review.compliance_books || false}
                          onCheckedChange={(checked) => {
                            updateField("compliance_books", !!checked);
                            saveReview({ compliance_books: !!checked });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-semibold text-sm">Books Reconciled</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Accounting current through prior month
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Notes field */}
                  <div>
                    <Label className="text-sm font-medium">Notes / Issues</Label>
                    <Textarea
                      rows={2}
                      placeholder="Any items needing attention..."
                      value={review.compliance_notes ?? ""}
                      onChange={(e) => updateField("compliance_notes", e.target.value)}
                      onBlur={(e) => handleBlur("compliance_notes", e.target.value)}
                      className="mt-1.5 bg-white resize-none"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 6: Strategies Currently Implementing */}
              <AccordionItem value="section-6" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-semibold">6. Strategies Currently Implementing</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <p className="text-muted-foreground mb-6">
                    Active strategies being executed this quarter. Enter tax deduction amounts to auto-calculate savings.
                  </p>

                  {/* Strategy Cards */}
                  <div className="space-y-4 mb-6">
                    {clientStrategies.length > 0 ? (
                      clientStrategies.map((cs) => {
                        const strategy = allStrategies.find((s) => s.id === cs.strategy_id);
                        if (!strategy) return null;
                        return (
                          <StrategyCard
                            key={cs.id}
                            clientStrategy={cs}
                            strategy={strategy}
                            taxRate={getCurrentTaxRate()}
                            onUpdate={handleUpdateStrategy}
                            onDelete={handleDeleteStrategy}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-muted-foreground mb-2">No strategies added yet</p>
                        <p className="text-sm text-muted-foreground">
                          Click the button below to add strategies for this client
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Strategy Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddStrategyModal(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Strategy
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Add Strategy Modal */}
          <AddStrategyModal
            open={showAddStrategyModal}
            onClose={() => setShowAddStrategyModal(false)}
            strategies={allStrategies}
            addedStrategyIds={addedStrategyIds}
            onAddStrategies={handleAddStrategies}
          />

          {/* Bottom Buttons */}
          <div className="px-6 py-6 border-t bg-slate-50 flex flex-wrap justify-center gap-4 print:hidden">
            <Button onClick={handleSaveDraft} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handlePrint} variant="default" className="bg-eiduk-blue hover:bg-eiduk-blue/90">
              <Printer className="h-4 w-4 mr-2" />
              Print to PDF
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Form
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all form data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearForm}>Clear Form</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Footer */}
          <div className="gradient-header px-8 py-6 text-center">
            <p className="text-eiduk-gold font-semibold text-sm">EIDUK TAX & WEALTH</p>
            <p className="text-white/80 text-sm mt-1">
              (704) 469-6777 • john@eiduk.com • eiduk.com
            </p>
            <p className="text-white/60 text-xs mt-2">
              The Eiduk Pathway™ — Pay Less. Keep More. Build Wealth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  color: "emerald" | "blue" | "navy";
  ytd: number | null;
  goal: number | null;
  onYtdChange: (v: number | null) => void;
  onGoalChange: (v: number | null) => void;
  onYtdBlur: (v: number | null) => void;
  onGoalBlur: (v: number | null) => void;
}

const MetricCard = ({
  title,
  color,
  ytd,
  goal,
  onYtdChange,
  onGoalChange,
  onYtdBlur,
  onGoalBlur,
}: MetricCardProps) => {
  const [ytdInput, setYtdInput] = useState(ytd ? String(ytd) : "");
  const [goalInput, setGoalInput] = useState(goal ? String(goal) : "");

  useEffect(() => {
    setYtdInput(ytd ? String(ytd) : "");
    setGoalInput(goal ? String(goal) : "");
  }, [ytd, goal]);

  const colorClasses = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    navy: "bg-slate-100 border-slate-300 text-slate-700",
  };

  const getProgress = (): number => {
    if (!ytd || !goal || goal === 0) return 0;
    return Math.min(Math.round((ytd / goal) * 100), 100);
  };

  const formatCurrency = (value: string): string => {
    const num = parseInt(value.replace(/[^0-9]/g, ""));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleYtdBlur = () => {
    const num = parseInt(ytdInput.replace(/[^0-9]/g, "")) || null;
    setYtdInput(num ? formatCurrency(String(num)) : "");
    onYtdChange(num);
    onYtdBlur(num);
  };

  const handleGoalBlur = () => {
    const num = parseInt(goalInput.replace(/[^0-9]/g, "")) || null;
    setGoalInput(num ? formatCurrency(String(num)) : "");
    onGoalChange(num);
    onGoalBlur(num);
  };

  return (
    <div className={cn("border rounded-lg p-4", colorClasses[color])}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <Label className="text-xs text-muted-foreground">YTD</Label>
          <Input
            value={ytdInput}
            onChange={(e) => setYtdInput(e.target.value)}
            onBlur={handleYtdBlur}
            className="h-9 bg-white"
            placeholder="$0"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Goal</Label>
          <Input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={handleGoalBlur}
            className="h-9 bg-white"
            placeholder="$0"
          />
        </div>
      </div>
      <Progress value={getProgress()} className="h-2" />
      <p className="text-xs text-right text-muted-foreground mt-1">{getProgress()}%</p>
    </div>
  );
};

export default QuarterlyReviewForm;
