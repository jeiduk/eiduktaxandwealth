import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Calendar } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeStrategies: number;
  totalSavings: number;
  upcomingReviews: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeStrategies: 0,
    totalSavings: 0,
    upcomingReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch client count
        const { count: clientCount } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true });

        // Fetch active strategies (in_progress or complete)
        const { count: strategyCount } = await supabase
          .from("client_strategies")
          .select("*", { count: "exact", head: true })
          .in("status", ["in_progress", "complete"]);

        // Fetch total savings
        const { data: savingsData } = await supabase
          .from("client_strategies")
          .select("actual_savings")
          .not("actual_savings", "is", null);

        const totalSavings = savingsData?.reduce(
          (sum, item) => sum + (item.actual_savings || 0),
          0
        ) || 0;

        // Fetch upcoming reviews (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: reviewCount } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .not("next_review_date", "is", null)
          .lte("next_review_date", thirtyDaysFromNow.toISOString().split("T")[0]);

        setStats({
          totalClients: clientCount || 0,
          activeStrategies: strategyCount || 0,
          totalSavings,
          upcomingReviews: reviewCount || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-eiduk-blue",
      bgColor: "bg-eiduk-blue/10",
    },
    {
      title: "Active Strategies",
      value: stats.activeStrategies,
      icon: FileText,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Savings",
      value: formatCurrency(stats.totalSavings),
      icon: TrendingUp,
      color: "text-eiduk-gold",
      bgColor: "bg-eiduk-gold/10",
    },
    {
      title: "Upcoming Reviews",
      value: stats.upcomingReviews,
      icon: Calendar,
      color: "text-phase-retirement",
      bgColor: "bg-phase-retirement/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="gradient-header rounded-xl p-8 text-white">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="text-white/80 font-body">
            Here's an overview of your client portfolio and tax strategies.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-body font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-body">
                Activity feed coming soon...
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-body">
                Quick actions coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
