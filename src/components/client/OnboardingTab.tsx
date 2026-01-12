import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, User, Users, StickyNote, ChevronsUpDown, ChevronsDownUp, CalendarIcon, Flag, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OnboardingTask {
  id: number;
  phase: string;
  task_name: string;
  description: string | null;
  owner: string;
  default_deadline_days: number;
  strategy_ref: string | null;
  sort_order: number;
}

interface ClientOnboarding {
  id: string;
  client_id: string;
  task_id: number;
  status: string;
  completed_date: string | null;
  notes: string | null;
  due_date: string | null;
}

interface OnboardingTabProps {
  clientId: string;
  clientCreatedAt: string;
  hasCompletedReview?: boolean;
}

const PHASE_ORDER = ["Setup", "Foundation", "Accounting", "Retirement"];
const PHASE_COLORS: Record<string, string> = {
  Setup: "#1e40af",
  Foundation: "#059669",
  Accounting: "#7c3aed",
  Retirement: "#ea580c",
};

export const OnboardingTab = ({ clientId, clientCreatedAt, hasCompletedReview = false }: OnboardingTabProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [clientOnboarding, setClientOnboarding] = useState<ClientOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    Setup: true,
    Foundation: true,
    Accounting: true,
    Retirement: true,
  });
  const [notesOpen, setNotesOpen] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [nextSteps, setNextSteps] = useState({
    firstQuarterlyReview: false,
    ongoingMonitoring: false,
    onboardingComplete: false,
  });

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [tasksRes, onboardingRes] = await Promise.all([
        supabase.from("onboarding_tasks").select("*").order("sort_order"),
        supabase.from("client_onboarding").select("*").eq("client_id", clientId),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (onboardingRes.error) throw onboardingRes.error;

      setTasks(tasksRes.data || []);
      setClientOnboarding(onboardingRes.data || []);

      // Initialize onboarding records if none exist
      if ((onboardingRes.data?.length || 0) === 0 && tasksRes.data && tasksRes.data.length > 0) {
        const records = tasksRes.data.map((task) => ({
          client_id: clientId,
          task_id: task.id,
          status: "pending",
        }));

        const { data: inserted, error } = await supabase
          .from("client_onboarding")
          .insert(records)
          .select();

        if (error) throw error;
        setClientOnboarding(inserted || []);
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const completed = clientOnboarding.filter((co) => co.status === "complete").length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, progress };
  }, [tasks, clientOnboarding]);

  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, OnboardingTask[]> = {};
    PHASE_ORDER.forEach((phase) => {
      grouped[phase] = tasks.filter((t) => t.phase === phase);
    });
    return grouped;
  }, [tasks]);

  const getClientOnboarding = (taskId: number) => {
    return clientOnboarding.find((co) => co.task_id === taskId);
  };

  const toggleTaskComplete = async (taskId: number) => {
    const existing = getClientOnboarding(taskId);
    if (!existing) return;

    const newStatus = existing.status === "complete" ? "pending" : "complete";
    const completedDate = newStatus === "complete" ? new Date().toISOString().split("T")[0] : null;

    try {
      const { error } = await supabase
        .from("client_onboarding")
        .update({ status: newStatus, completed_date: completedDate })
        .eq("id", existing.id);

      if (error) throw error;

      setClientOnboarding((prev) =>
        prev.map((co) =>
          co.id === existing.id
            ? { ...co, status: newStatus, completed_date: completedDate }
            : co
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const saveNotes = async (taskId: number) => {
    const existing = getClientOnboarding(taskId);
    if (!existing) return;

    try {
      const { error } = await supabase
        .from("client_onboarding")
        .update({ notes: noteText })
        .eq("id", existing.id);

      if (error) throw error;

      setClientOnboarding((prev) =>
        prev.map((co) =>
          co.id === existing.id ? { ...co, notes: noteText } : co
        )
      );

      setNotesOpen(null);
      setNoteText("");
      toast({ title: "Notes saved" });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    }
  };

  const getDeadlineDate = (task: OnboardingTask, onboarding: ClientOnboarding | undefined) => {
    // Use custom due_date if set, otherwise calculate from default
    if (onboarding?.due_date) {
      return new Date(onboarding.due_date);
    }
    const startDate = new Date(clientCreatedAt);
    startDate.setDate(startDate.getDate() + task.default_deadline_days);
    return startDate;
  };

  const updateDueDate = async (taskId: number, date: Date | undefined) => {
    const existing = getClientOnboarding(taskId);
    if (!existing) return;

    const dueDateStr = date ? format(date, "yyyy-MM-dd") : null;

    try {
      const { error } = await supabase
        .from("client_onboarding")
        .update({ due_date: dueDateStr })
        .eq("id", existing.id);

      if (error) throw error;

      setClientOnboarding((prev) =>
        prev.map((co) =>
          co.id === existing.id ? { ...co, due_date: dueDateStr } : co
        )
      );

      toast({ title: "Due date updated" });
    } catch (error) {
      console.error("Error updating due date:", error);
      toast({ title: "Error", description: "Failed to update due date", variant: "destructive" });
    }
  };

  const getOwnerBadge = (owner: string) => {
    switch (owner) {
      case "Client":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <User className="h-3 w-3 mr-1" />
            Client
          </Badge>
        );
      case "Advisor":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            <User className="h-3 w-3 mr-1" />
            Advisor
          </Badge>
        );
      case "Both":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Users className="h-3 w-3 mr-1" />
            Both
          </Badge>
        );
      default:
        return null;
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const expandAll = () => {
    setExpandedPhases(PHASE_ORDER.reduce((acc, phase) => ({ ...acc, [phase]: true }), {}));
  };

  const collapseAll = () => {
    setExpandedPhases(PHASE_ORDER.reduce((acc, phase) => ({ ...acc, [phase]: false }), {}));
  };

  const allExpanded = PHASE_ORDER.every((phase) => expandedPhases[phase]);
  const allCollapsed = PHASE_ORDER.every((phase) => !expandedPhases[phase]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Onboarding Progress</h3>
              <p className="text-muted-foreground text-sm">
                {stats.completed} of {stats.total} tasks complete
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  disabled={allExpanded}
                  className="gap-1"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  disabled={allCollapsed}
                  className="gap-1"
                >
                  <ChevronsDownUp className="h-4 w-4" />
                  Collapse All
                </Button>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.progress}%</div>
            </div>
          </div>
          <Progress value={stats.progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Tasks by Phase */}
      {PHASE_ORDER.map((phase) => {
        const phaseTasks = tasksByPhase[phase] || [];
        const phaseCompleted = phaseTasks.filter(
          (t) => getClientOnboarding(t.id)?.status === "complete"
        ).length;

        return (
          <Collapsible
            key={phase}
            open={expandedPhases[phase]}
            onOpenChange={() => togglePhase(phase)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ borderLeftWidth: "4px", borderLeftColor: PHASE_COLORS[phase] }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedPhases[phase] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <CardTitle className="text-lg">{phase}</CardTitle>
                      <Badge variant="secondary">
                        {phaseCompleted}/{phaseTasks.length}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-2">
                  {phaseTasks.map((task) => {
                    const onboarding = getClientOnboarding(task.id);
                    const isComplete = onboarding?.status === "complete";
                    const deadline = getDeadlineDate(task, onboarding);
                    const isOverdue = !isComplete && deadline < new Date();

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          isComplete
                            ? "bg-emerald-50/50 border-emerald-200"
                            : isOverdue
                            ? "bg-red-50/50 border-red-200"
                            : "bg-card hover:bg-muted/30"
                        )}
                      >
                        <Checkbox
                          checked={isComplete}
                          onCheckedChange={() => toggleTaskComplete(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p
                                className={cn(
                                  "font-medium",
                                  isComplete && "line-through text-muted-foreground"
                                )}
                              >
                                {task.task_name}
                              </p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {task.strategy_ref && (
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  {task.strategy_ref}
                                </Badge>
                              )}
                              {getOwnerBadge(task.owner)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-6 px-2 text-xs gap-1",
                                    isOverdue ? "text-red-600 font-medium hover:text-red-700" : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <CalendarIcon className="h-3 w-3" />
                                  Due: {format(deadline, "MMM d, yyyy")}
                                  {isOverdue && " (Overdue)"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
                                <Calendar
                                  mode="single"
                                  selected={deadline}
                                  onSelect={(date) => updateDueDate(task.id, date)}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                setNotesOpen(notesOpen === task.id ? null : task.id);
                                setNoteText(onboarding?.notes || "");
                              }}
                            >
                              <StickyNote className="h-3 w-3 mr-1" />
                              {onboarding?.notes ? "Edit Notes" : "Add Notes"}
                            </Button>
                          </div>
                          {notesOpen === task.id && (
                            <div className="mt-3 space-y-2">
                              <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add notes for this task..."
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveNotes(task.id)}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setNotesOpen(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Next Steps Section */}
      <Card>
        <CardHeader style={{ borderLeftWidth: "4px", borderLeftColor: "#0ea5e9" }}>
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-sky-500" />
            <CardTitle className="text-lg">Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* First Quarterly Review */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
              (nextSteps.firstQuarterlyReview || hasCompletedReview)
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-card hover:bg-muted/30"
            )}
            onClick={() => setNextSteps(prev => ({ ...prev, firstQuarterlyReview: !prev.firstQuarterlyReview }))}
          >
            {(nextSteps.firstQuarterlyReview || hasCompletedReview) ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                (nextSteps.firstQuarterlyReview || hasCompletedReview) && "text-emerald-700"
              )}>
                First Quarterly Review
              </p>
              <p className="text-sm text-muted-foreground">
                Complete the initial quarterly review with the client
              </p>
            </div>
          </div>

          {/* Ongoing Monitoring Established */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
              nextSteps.ongoingMonitoring
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-card hover:bg-muted/30"
            )}
            onClick={() => setNextSteps(prev => ({ ...prev, ongoingMonitoring: !prev.ongoingMonitoring }))}
          >
            {nextSteps.ongoingMonitoring ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                nextSteps.ongoingMonitoring && "text-emerald-700"
              )}>
                Ongoing Monitoring Established
              </p>
              <p className="text-sm text-muted-foreground">
                Set up recurring reviews and monitoring schedule
              </p>
            </div>
          </div>

          {/* Onboarding Complete */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
              nextSteps.onboardingComplete
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-card hover:bg-muted/30"
            )}
            onClick={() => setNextSteps(prev => ({ ...prev, onboardingComplete: !prev.onboardingComplete }))}
          >
            {nextSteps.onboardingComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                nextSteps.onboardingComplete && "text-emerald-700"
              )}>
                Onboarding Complete
              </p>
              <p className="text-sm text-muted-foreground">
                All onboarding tasks finished and client is fully set up
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
