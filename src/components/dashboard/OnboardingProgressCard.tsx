import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, Rocket } from "lucide-react";
import { differenceInDays } from "date-fns";

interface ClientOnboardingProgress {
  id: string;
  name: string;
  created_at: string;
  completedTasks: number;
  totalTasks: number;
  progress: number;
  daysSinceStart: number;
}

export const OnboardingProgressCard = () => {
  const [clients, setClients] = useState<ClientOnboardingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboardingClients();
  }, []);

  const fetchOnboardingClients = async () => {
    try {
      // Get all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, created_at");

      if (clientsError) throw clientsError;

      // Get total onboarding tasks count
      const { count: totalTasks, error: tasksError } = await supabase
        .from("onboarding_tasks")
        .select("*", { count: "exact", head: true });

      if (tasksError) throw tasksError;

      // Get all client onboarding records
      const { data: onboardingData, error: onboardingError } = await supabase
        .from("client_onboarding")
        .select("client_id, status");

      if (onboardingError) throw onboardingError;

      const today = new Date();
      const clientsWithProgress: ClientOnboardingProgress[] = [];

      for (const client of clientsData || []) {
        const clientOnboarding = onboardingData?.filter((o) => o.client_id === client.id) || [];
        const completedTasks = clientOnboarding.filter((o) => o.status === "complete").length;
        const daysSinceStart = differenceInDays(today, new Date(client.created_at));

        // Show if client is within 90 days OR has incomplete onboarding
        const hasIncomplete = clientOnboarding.length > 0 && completedTasks < (totalTasks || 0);
        const isWithin90Days = daysSinceStart <= 90;

        if ((isWithin90Days || hasIncomplete) && completedTasks < (totalTasks || 0)) {
          clientsWithProgress.push({
            id: client.id,
            name: client.name,
            created_at: client.created_at,
            completedTasks,
            totalTasks: totalTasks || 0,
            progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
            daysSinceStart,
          });
        }
      }

      // Sort by days since start (newest first)
      clientsWithProgress.sort((a, b) => a.daysSinceStart - b.daysSinceStart);

      setClients(clientsWithProgress);
    } catch (error) {
      console.error("Error fetching onboarding clients:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Onboarding in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Rocket className="h-5 w-5 text-eiduk-blue" />
          Onboarding in Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{client.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={client.progress} className="h-2 w-24" />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {client.progress}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Day {client.daysSinceStart}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/clients/${client.id}?tab=onboarding`}>
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
