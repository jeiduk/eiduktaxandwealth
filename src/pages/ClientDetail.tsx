import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Calendar, DollarSign, FileText } from "lucide-react";

interface Client {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
}

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        setClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [user, id]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Premium":
        return "bg-eiduk-gold/20 text-eiduk-gold border-eiduk-gold/30";
      case "Complete":
        return "bg-phase-retirement/20 text-phase-retirement border-phase-retirement/30";
      case "Foundation":
        return "bg-eiduk-blue/20 text-eiduk-blue border-eiduk-blue/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-display text-xl font-semibold mb-2">Client not found</h2>
          <p className="text-muted-foreground mb-4">
            The client you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {client.name}
              </h1>
              <Badge variant="outline" className={getTierColor(client.package_tier)}>
                {client.package_tier}
              </Badge>
            </div>
            <p className="text-muted-foreground font-body">
              Client details and strategy overview
            </p>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-eiduk-blue/10">
                  <Building2 className="h-5 w-5 text-eiduk-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  <p className="font-semibold">{client.entity_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-eiduk-gold/10">
                  <DollarSign className="h-5 w-5 text-eiduk-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Income Range</p>
                  <p className="font-semibold">{client.income_range || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-phase-retirement/10">
                  <Calendar className="h-5 w-5 text-phase-retirement" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Review</p>
                  <p className="font-semibold">
                    {client.next_review_date
                      ? new Date(client.next_review_date).toLocaleDateString()
                      : "Not scheduled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strategies</p>
                  <p className="font-semibold">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {client.notes && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-body whitespace-pre-wrap">
                {client.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Strategies Section Placeholder */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Tax Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground font-body">
              Strategy management coming in Phase 2...
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientDetail;
