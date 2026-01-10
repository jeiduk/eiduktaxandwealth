import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plus, FileText, Calendar, Target, Loader2, Trash2, AlertTriangle } from "lucide-react";
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
  
  // Delete state
  const [deleteReview, setDeleteReview] = useState<QuarterlyReview | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      // Find the most recent review for this client to copy from
      const { data: previousReview } = await supabase
        .from("quarterly_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Build new review data - copy from previous if exists, otherwise use industry defaults
      let newReviewData: TablesInsert<"quarterly_reviews"> = {
        client_id: clientId,
        quarter: getCurrentQuarter(),
        status: "in-progress",
      };

      if (previousReview) {
        // Copy relevant fields from previous review (NOT signatures, YTD values, or meeting dates)
        newReviewData = {
          ...newReviewData,
          // Goals carry over
          revenue_goal: previousReview.revenue_goal,
          profit_goal: previousReview.profit_goal,
          draw_goal: previousReview.draw_goal,
          employees_goal: previousReview.employees_goal,
          // Profit First targets carry over
          profit_first_profit_target: previousReview.profit_first_profit_target,
          profit_first_owner_target: previousReview.profit_first_owner_target,
          profit_first_tax_target: previousReview.profit_first_tax_target,
          profit_first_opex_target: previousReview.profit_first_opex_target,
          // Other settings
          tax_rate_override: previousReview.tax_rate_override,
          advisor_name: previousReview.advisor_name,
          // Hurdles carry over for continuity
          hurdle_1: previousReview.hurdle_1,
          hurdle_2: previousReview.hurdle_2,
          hurdle_3: previousReview.hurdle_3,
        };
      } else if (clientIndustry) {
        // No previous review - use industry benchmarks
        const { data: benchmark } = await supabase
          .from("industry_benchmarks")
          .select("profit_target, owner_pay_target, tax_target, opex_target")
          .eq("industry", clientIndustry)
          .maybeSingle();

        if (benchmark) {
          newReviewData = {
            ...newReviewData,
            profit_first_profit_target: benchmark.profit_target,
            profit_first_owner_target: benchmark.owner_pay_target,
            profit_first_tax_target: benchmark.tax_target,
            profit_first_opex_target: benchmark.opex_target,
          };
        }
      }

      const { data: newReview, error } = await supabase
        .from("quarterly_reviews")
        .insert(newReviewData)
        .select()
        .single();

      if (error) throw error;

      // Copy strategies from previous review if exists
      if (previousReview) {
        const { data: previousStrategies } = await supabase
          .from("client_strategies")
          .select("strategy_id, status, notes, tax_savings, deduction_amount")
          .eq("review_id", previousReview.id);

        if (previousStrategies && previousStrategies.length > 0) {
          const newStrategies = previousStrategies.map((s) => ({
            client_id: clientId,
            review_id: newReview.id,
            strategy_id: s.strategy_id,
            status: s.status,
            notes: s.notes,
            tax_savings: s.tax_savings,
            deduction_amount: s.deduction_amount,
          }));

          await supabase.from("client_strategies").insert(newStrategies);
        }

        // Copy action items (reset completed status)
        const { data: previousActions } = await supabase
          .from("action_items")
          .select("description, owner, due_date")
          .eq("review_id", previousReview.id);

        if (previousActions && previousActions.length > 0) {
          const newActions = previousActions.map((a) => ({
            review_id: newReview.id,
            description: a.description,
            owner: a.owner,
            completed: false,
          }));

          await supabase.from("action_items").insert(newActions);
        }
      }

      navigate(`/reviews/${newReview.id}`);
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

  const handleDeleteClick = (e: React.MouseEvent, review: QuarterlyReview) => {
    e.stopPropagation();
    setDeleteReview(review);
    setDeleteStep(1);
    setConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReview) return;

    // For completed reviews, require double confirmation
    if (deleteReview.status === "completed" && deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    // For completed reviews on step 2, check confirmation text
    if (deleteReview.status === "completed" && confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      // Delete related action items first
      await supabase
        .from("action_items")
        .delete()
        .eq("review_id", deleteReview.id);

      // Unlink strategies from this review (don't delete them, just remove the review_id)
      await supabase
        .from("client_strategies")
        .update({ review_id: null })
        .eq("review_id", deleteReview.id);

      // Delete the review
      const { error } = await supabase
        .from("quarterly_reviews")
        .delete()
        .eq("id", deleteReview.id);

      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== deleteReview.id));
      toast({ title: "Review deleted" });
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteReview(null);
      setDeleteStep(1);
      setConfirmText("");
    }
  };

  const handleCancelDelete = () => {
    setDeleteReview(null);
    setDeleteStep(1);
    setConfirmText("");
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
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, review)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog - Step 1 */}
      <Dialog open={!!deleteReview && deleteStep === 1} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review?</DialogTitle>
            <DialogDescription>
              {deleteReview?.status === "completed" ? (
                <>
                  This is a <strong>completed review</strong> for <strong>{deleteReview?.quarter}</strong>. 
                  Deleting it will remove all associated data. This action cannot be undone.
                  <br /><br />
                  <strong>Are you sure you want to proceed?</strong>
                </>
              ) : (
                <>
                  Are you sure you want to delete the review for <strong>{deleteReview?.quarter}</strong>? 
                  This will remove the review and unlink any associated strategies.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {deleteReview?.status === "completed" ? "Yes, Continue" : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Step 2 (double confirmation for completed reviews) */}
      <Dialog open={!!deleteReview && deleteStep === 2} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation Required
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to permanently delete the completed review for <strong>{deleteReview?.quarter}</strong>.
                </p>
                <p>
                  This will remove all review data including financial information, signatures, and meeting notes.
                </p>
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="font-mono"
                  />
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting || confirmText !== "DELETE"}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
