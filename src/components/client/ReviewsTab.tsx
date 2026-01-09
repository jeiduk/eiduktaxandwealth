import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, FileText, Calendar, DollarSign, Target, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QuarterlyReview {
  id: string;
  quarter: string;
  meeting_date: string | null;
  status: string;
  created_at: string;
}

interface ReviewsTabProps {
  clientId: string;
  clientName: string;
  clientIndustry?: string | null;
}

export function ReviewsTab({ clientId, clientName, clientIndustry }: ReviewsTabProps) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [strategyCounts, setStrategyCounts] = useState<Record<string, number>>({});

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${now.getFullYear()}`;
  };

  useEffect(() => {
    fetchReviews();
  }, [clientId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("quarterly_reviews")
        .select("id, quarter, meeting_date, status, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Get strategy counts for each review
      const counts: Record<string, number> = {};
      for (const review of data || []) {
        const { count } = await supabase
          .from("client_strategies")
          .select("*", { count: "exact", head: true })
          .eq("review_id", review.id);
        counts[review.id] = count || 0;
      }
      setStrategyCounts(counts);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    setCreating(true);
    try {
      // Get industry benchmarks if client has an industry
      let profitFirstTargets = {};
      if (clientIndustry) {
        const { data: benchmark } = await supabase
          .from("industry_benchmarks")
          .select("profit_target, owner_pay_target, tax_target, opex_target")
          .eq("industry", clientIndustry)
          .single();

        if (benchmark) {
          profitFirstTargets = {
            profit_first_profit_target: benchmark.profit_target,
            profit_first_owner_target: benchmark.owner_pay_target,
            profit_first_tax_target: benchmark.tax_target,
            profit_first_opex_target: benchmark.opex_target,
          };
        }
      }

      const { data, error } = await supabase
        .from("quarterly_reviews")
        .insert({
          client_id: clientId,
          quarter: getCurrentQuarter(),
          status: "in-progress",
          ...profitFirstTargets,
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
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quarterly Reviews</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} for {clientName}
          </p>
        </div>
        <Button onClick={handleCreateReview} disabled={creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Start New Review
        </Button>
      </div>

      {/* Reviews Table */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No quarterly reviews yet</h3>
          <p className="text-muted-foreground mb-4">
            Start a review to begin tracking tax optimization progress
          </p>
          <Button onClick={handleCreateReview} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Start First Review
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Strategies</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow
                  key={review.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/reviews/${review.id}`)}
                >
                  <TableCell className="font-medium">{review.quarter}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {review.meeting_date
                        ? format(new Date(review.meeting_date), "MMM d, yyyy")
                        : "Not set"}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      {strategyCounts[review.id] || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
