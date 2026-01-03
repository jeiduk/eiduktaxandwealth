import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ClientNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    entity_type: "S-Corp",
    package_tier: "Foundation",
    income_range: "",
    next_review_date: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        name: formData.name,
        entity_type: formData.entity_type,
        package_tier: formData.package_tier,
        income_range: formData.income_range || null,
        next_review_date: formData.next_review_date || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Client created",
        description: `${formData.name} has been added to your portfolio.`,
      });
      navigate("/clients");
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Add New Client</h1>
            <p className="text-muted-foreground font-body">
              Enter client information to add them to your portfolio
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Business/Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client or business name"
                  required
                />
              </div>

              {/* Entity Type */}
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S-Corp">S-Corp</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Package Tier */}
              <div className="space-y-2">
                <Label htmlFor="package_tier">Package Tier</Label>
                <Select
                  value={formData.package_tier}
                  onValueChange={(value) => setFormData({ ...formData, package_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Essentials">Essentials</SelectItem>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Income Range */}
              <div className="space-y-2">
                <Label htmlFor="income_range">Income Range</Label>
                <Select
                  value={formData.income_range}
                  onValueChange={(value) => setFormData({ ...formData, income_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $100k">Under $100k</SelectItem>
                    <SelectItem value="$100k-$300k">$100k-$300k</SelectItem>
                    <SelectItem value="$300k-$600k">$300k-$600k</SelectItem>
                    <SelectItem value="$600k-$1M">$600k-$1M</SelectItem>
                    <SelectItem value="Over $1M">Over $1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Review Date */}
              <div className="space-y-2">
                <Label htmlFor="next_review_date">Next Review Date</Label>
                <Input
                  id="next_review_date"
                  type="date"
                  value={formData.next_review_date}
                  onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this client..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/clients")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="flex-1 bg-eiduk-blue hover:bg-eiduk-light-blue"
                >
                  {loading ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientNew;
