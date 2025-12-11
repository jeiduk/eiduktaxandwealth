import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, FileText, TrendingUp, Plus } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalDocuments: number;
  prospects: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalDocuments: 0,
    prospects: 0,
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch client stats
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, status, created_at, first_name, last_name, company_name')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch document count
      const { count: docCount, error: docError } = await supabase
        .from('client_documents')
        .select('*', { count: 'exact', head: true });

      if (docError) throw docError;

      const activeCount = clients?.filter(c => c.status === 'Active').length || 0;
      const prospectCount = clients?.filter(c => c.status === 'Prospect').length || 0;

      setStats({
        totalClients: clients?.length || 0,
        activeClients: activeCount,
        totalDocuments: docCount || 0,
        prospects: prospectCount,
      });

      setRecentClients(clients?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Clients', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'bg-eiduk-navy',
      href: '/clients'
    },
    { 
      title: 'Active Clients', 
      value: stats.activeClients, 
      icon: TrendingUp, 
      color: 'bg-success',
      href: '/clients?status=Active'
    },
    { 
      title: 'Prospects', 
      value: stats.prospects, 
      icon: Users, 
      color: 'bg-eiduk-blue',
      href: '/clients?status=Prospect'
    },
    { 
      title: 'Documents', 
      value: stats.totalDocuments, 
      icon: FileText, 
      color: 'bg-eiduk-gold',
      href: '/documents'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back to your advisor portal
            </p>
          </div>
          <Button variant="gold" asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link key={stat.title} to={stat.href}>
              <Card 
                className="hover:shadow-medium transition-all hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {loading ? '—' : stat.value}
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-card`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-xl">Recent Clients</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clients">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No clients yet</p>
                <Button variant="navy" asChild>
                  <Link to="/clients/new">Add Your First Client</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <Link
                    key={client.id}
                    to={`/clients/${client.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-eiduk-navy flex items-center justify-center text-white font-semibold">
                        {client.first_name[0]}{client.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.company_name || 'No company'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      client.status === 'Active' 
                        ? 'bg-success/10 text-success' 
                        : client.status === 'Prospect'
                        ? 'bg-eiduk-blue/10 text-eiduk-blue'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {client.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tagline Footer */}
        <div className="text-center py-4">
          <p className="text-eiduk-gold font-display font-semibold">
            Pay Less. Keep More. Build Wealth.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
