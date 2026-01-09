import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackfillStrategies } from "@/hooks/useBackfillStrategies";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Calendar,
  Plus,
  FileText,
  ChevronRight,
  Clock,
  Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";

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


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    totalSavings: 0,
    strategiesImplemented: 0,
    reviewsDueThisMonth: 0,
  });
  const [upcomingReviews, setUpcomingReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingReview, setCreatingReview] = useState<string | null>(null);

  // Run backfill for existing clients without strategies
  useBackfillStrategies(user?.id);

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

      // Fetch all clients with tax_rate
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Fetch all client strategies (to get total assigned count)
      const { data: allClientStrategies, error: strategiesError } = await supabase
        .from("client_strategies")
        .select("client_id, deduction_amount, status");

      if (strategiesError) throw strategiesError;

      // Filter to completed strategies for savings calculation
      const completedStrategies = allClientStrategies?.filter(s => s.status === "complete") || [];

      // Calculate stats - tax savings = sum of (deductions × client tax rate)
      const activeClients = clients?.length || 0;
      
      // Calculate total savings across all clients
      let totalSavings = 0;
      clients?.forEach(client => {
        const clientDeductions = completedStrategies
          ?.filter(s => s.client_id === client.id)
          .reduce((sum, s) => sum + (s.deduction_amount || 0), 0) || 0;
        const taxRate = client.tax_rate || 0.37;
        totalSavings += Math.round(clientDeductions * taxRate);
      });
      
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
          // Get all strategies for this client (for total count)
          const allClientStrategiesForClient = allClientStrategies?.filter(
            s => s.client_id === c.id
          ) || [];
          const completedClientStrategies = allClientStrategiesForClient.filter(
            s => s.status === "complete"
          );
          
          const reviewDate = new Date(c.next_review_date);
          const isOverdue = reviewDate < today;
          const totalDeductions = completedClientStrategies.reduce(
            (sum, s) => sum + (s.deduction_amount || 0), 
            0
          );
          const taxRate = c.tax_rate || 0.37;

          return {
            id: c.id,
            name: c.name,
            package_tier: c.package_tier,
            next_review_date: c.next_review_date,
            completedStrategies: completedClientStrategies.length,
            totalStrategies: allClientStrategiesForClient.length, // Use actual assigned count
            totalSavings: Math.round(totalDeductions * taxRate),
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

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${now.getFullYear()}`;
  };

  const createReviewAndNavigate = async (clientId: string) => {
    setCreatingReview(clientId);
    try {
      const { data, error } = await supabase
        .from("quarterly_reviews")
        .insert({
          client_id: clientId,
          quarter: getCurrentQuarter(),
          status: "in-progress",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/reviews/${data.id}`);
    } catch (error) {
      console.error("Error creating review:", error);
      toast({
        title: "Error",
        description: "Failed to create quarterly review",
        variant: "destructive",
      });
    } finally {
      setCreatingReview(null);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-body">{stat.title}</p>
                    <p className="text-2xl font-bold font-display mt-1 tabular-nums">{stat.value}</p>
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
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="gold"
            onClick={() => {
              if (upcomingReviews.length > 0) {
                createReviewAndNavigate(upcomingReviews[0].id);
              } else {
                toast({
                  title: "No clients available",
                  description: "Add a client first to start a quarterly review",
                });
              }
            }}
            disabled={creatingReview !== null}
          >
            {creatingReview ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Start Quarterly Review
          </Button>
          <Button variant="outline" className="border-eiduk-blue text-eiduk-blue hover:bg-eiduk-blue/10" asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Link>
          </Button>
          <Button variant="outline" className="border-eiduk-blue text-eiduk-blue hover:bg-eiduk-blue/10" asChild>
            <Link to="/strategies">
              <FileText className="h-4 w-4 mr-2" />
              View All Strategies
            </Link>
          </Button>
        </div>

        {/* Onboarding Progress Card */}
        <OnboardingProgressCard />

        {/* Upcoming Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-eiduk-blue" />
              Upcoming Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming reviews in the next 30 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Package</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Est. Savings</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Next Review</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingReviews.map((review, index) => {
                      const progress = review.totalStrategies > 0 
                        ? (review.completedStrategies / review.totalStrategies) * 100 
                        : 0;
                      
                      return (
                        <tr 
                          key={review.id} 
                          className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                        >
                          <td className="py-3 px-4 font-medium">{review.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getTierBadgeClass(review.package_tier)}>
                              {review.package_tier}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progress} className="h-2 flex-1" />
                              <span className="text-sm text-muted-foreground tabular-nums w-10">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-emerald-600 tabular-nums">
                            {formatCurrency(review.totalSavings)}
                          </td>
                          <td className={`py-3 px-4 ${review.isOverdue ? 'text-destructive font-medium' : ''}`}>
                            {format(new Date(review.next_review_date), "MMM d, yyyy")}
                            {review.isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => createReviewAndNavigate(review.id)}
                              disabled={creatingReview === review.id}
                            >
                              {creatingReview === review.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : null}
                              Start Review
                              <ChevronRight className="h-4 w-4 ml-1" />
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
