import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Calendar,
  Plus,
  FileText,
  ChevronRight,
  Clock
} from "lucide-react";
import { format, isAfter, startOfMonth, endOfMonth, addDays } from "date-fns";

interface DashboardStats {
  activeClients: number;
  totalSavings: number;
  strategiesImplemented: number;
  reviewsDueThisMonth: number;
}

interface ClientReview {
  id: string;
  name: string;
  package_tier: string;
  next_review_date: string;
  completedStrategies: number;
  totalStrategies: number;
  totalSavings: number;
  isOverdue: boolean;
}

// Strategy counts per tier
const TIER_STRATEGY_COUNTS: Record<string, number> = {
  Essentials: 6,
  Foundation: 13,
  Complete: 30,
  Premium: 70,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    totalSavings: 0,
    strategiesImplemented: 0,
    reviewsDueThisMonth: 0,
  });
  const [upcomingReviews, setUpcomingReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const thirtyDaysFromNow = addDays(today, 30);

      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Fetch all completed strategies with savings
      const { data: completedStrategies, error: strategiesError } = await supabase
        .from("client_strategies")
        .select("client_id, actual_savings, status")
        .eq("status", "complete");

      if (strategiesError) throw strategiesError;

      // Calculate stats
      const activeClients = clients?.length || 0;
      
      const totalSavings = completedStrategies?.reduce(
        (sum, s) => sum + (s.actual_savings || 0), 
        0
      ) || 0;
      
      const strategiesImplemented = completedStrategies?.length || 0;

      const reviewsDueThisMonth = clients?.filter(c => {
        if (!c.next_review_date) return false;
        const reviewDate = new Date(c.next_review_date);
        return reviewDate >= monthStart && reviewDate <= monthEnd;
      }).length || 0;

      setStats({
        activeClients,
        totalSavings,
        strategiesImplemented,
        reviewsDueThisMonth,
      });

      // Calculate upcoming reviews (next 30 days or overdue)
      const clientsWithReviews = clients
        ?.filter(c => c.next_review_date)
        .filter(c => {
          const reviewDate = new Date(c.next_review_date);
          return reviewDate <= thirtyDaysFromNow;
        })
        .map(c => {
          const clientStrategies = completedStrategies?.filter(
            s => s.client_id === c.id
          ) || [];
          
          const reviewDate = new Date(c.next_review_date);
          const isOverdue = reviewDate < today;

          return {
            id: c.id,
            name: c.name,
            package_tier: c.package_tier,
            next_review_date: c.next_review_date,
            completedStrategies: clientStrategies.length,
            totalStrategies: TIER_STRATEGY_COUNTS[c.package_tier] || 6,
            totalSavings: clientStrategies.reduce(
              (sum, s) => sum + (s.actual_savings || 0), 
              0
            ),
            isOverdue,
          };
        })
        .sort((a, b) => 
          new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime()
        ) || [];

      setUpcomingReviews(clientsWithReviews);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case "Premium":
        return "bg-eiduk-gold/20 text-eiduk-gold border-eiduk-gold/30";
      case "Complete":
        return "bg-eiduk-blue/20 text-eiduk-blue border-eiduk-blue/30";
      case "Foundation":
        return "bg-success/20 text-success border-success/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const statCards = [
    {
      title: "Active Clients",
      value: stats.activeClients,
      icon: Users,
      color: "text-eiduk-blue",
      bgColor: "bg-eiduk-blue/10",
    },
    {
      title: "Total Tax Savings",
      value: formatCurrency(stats.totalSavings),
      icon: TrendingUp,
      color: "text-eiduk-gold",
      bgColor: "bg-eiduk-gold/10",
    },
    {
      title: "Strategies Implemented",
      value: stats.strategiesImplemented,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Reviews Due This Month",
      value: stats.reviewsDueThisMonth,
      icon: Calendar,
      color: "text-phase-retirement",
      bgColor: "bg-phase-retirement/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground font-body mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body text-muted-foreground">{stat.title}</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-display font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-eiduk-gold hover:bg-eiduk-gold/90 text-primary">
                <Clock className="h-4 w-4 mr-2" />
                Start Quarterly Review
              </Button>
              <Button variant="outline" className="border-eiduk-blue text-eiduk-blue hover:bg-eiduk-blue/10" asChild>
                <Link to="/clients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Link>
              </Button>
              <Button variant="outline" className="border-eiduk-blue text-eiduk-blue hover:bg-eiduk-blue/10" asChild>
                <Link to="/settings">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Strategies
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Reviews Table */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Upcoming Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : upcomingReviews.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming reviews in the next 30 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Package</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Progress</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Est. Savings</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Next Review</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingReviews.map((client, index) => {
                      const progress = client.totalStrategies > 0 
                        ? (client.completedStrategies / client.totalStrategies) * 100 
                        : 0;

                      return (
                        <tr 
                          key={client.id} 
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                            index % 2 === 0 ? "bg-background" : "bg-muted/20"
                          } ${client.isOverdue ? "bg-destructive/5" : ""}`}
                        >
                          <td className="py-4 px-4">
                            <Link 
                              to={`/clients/${client.id}`}
                              className="font-medium text-foreground hover:text-eiduk-blue transition-colors"
                            >
                              {client.name}
                            </Link>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={getTierBadgeClass(client.package_tier)}>
                              {client.package_tier}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="w-20 h-2" />
                              <span className="text-sm text-muted-foreground">
                                {client.completedStrategies}/{client.totalStrategies}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-eiduk-gold">
                              {formatCurrency(client.totalSavings)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`${client.isOverdue ? "text-destructive font-semibold" : "text-foreground"}`}>
                              {format(new Date(client.next_review_date), "MMM d, yyyy")}
                              {client.isOverdue && (
                                <span className="ml-2 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                                  Overdue
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-eiduk-blue hover:text-eiduk-blue hover:bg-eiduk-blue/10"
                              asChild
                            >
                              <Link to={`/clients/${client.id}`}>
                                Start Review
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
