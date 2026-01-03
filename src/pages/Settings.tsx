import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [strategyCount, setStrategyCount] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategyCount();
  }, []);

  const fetchStrategyCount = async () => {
    try {
      const { count, error } = await supabase
        .from("strategies")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setStrategyCount(count || 0);
    } catch (error) {
      console.error("Error fetching strategy count:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedStrategies = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-strategies");

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Strategies seeded",
          description: data.message,
        });
        fetchStrategyCount();
      } else {
        toast({
          title: "Already seeded",
          description: data.message,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error seeding strategies:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to seed strategies",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground font-body">
            Manage your application settings
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Database className="h-5 w-5 text-eiduk-blue" />
              Strategy Database
            </CardTitle>
            <CardDescription>
              Seed the database with all 70 tax strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : strategyCount === 70 ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <div>
                <p className="font-medium">
                  {loading
                    ? "Loading..."
                    : strategyCount === 70
                    ? "All 70 strategies loaded"
                    : `${strategyCount} of 70 strategies loaded`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strategyCount === 70
                    ? "Your strategy database is complete"
                    : "Run the seed function to populate strategies"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSeedStrategies}
              disabled={seeding || strategyCount === 70}
              className="bg-eiduk-blue hover:bg-eiduk-light-blue"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : strategyCount === 70 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Seeded
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed 70 Strategies
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
