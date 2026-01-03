import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  created_at: string;
}

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground font-body">
              Manage your client portfolio
            </p>
          </div>
          <Link to="/clients/new">
            <Button className="bg-eiduk-blue hover:bg-eiduk-light-blue">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No clients yet</h3>
              <p className="text-muted-foreground font-body mb-4">
                Get started by adding your first client
              </p>
              <Link to="/clients/new">
                <Button className="bg-eiduk-blue hover:bg-eiduk-light-blue">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Link key={client.id} to={`/clients/${client.id}`}>
                <Card className="shadow-soft hover:shadow-medium transition-all hover:border-eiduk-blue/30 cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-display text-lg line-clamp-1">
                        {client.name}
                      </CardTitle>
                      <Badge variant="outline" className={getTierColor(client.package_tier)}>
                        {client.package_tier}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{client.entity_type}</span>
                    </div>
                    {client.income_range && (
                      <p className="text-sm text-muted-foreground">
                        Income: {client.income_range}
                      </p>
                    )}
                    {client.next_review_date && (
                      <p className="text-xs text-muted-foreground">
                        Next Review: {new Date(client.next_review_date).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
