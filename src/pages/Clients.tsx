import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Users,
  Building2,
  Phone,
  Mail
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  status: string;
  created_at: string;
}

export default function Clients() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, statusFilter]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.first_name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        c.company_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }

    setFilteredClients(filtered);
  };

  const statusOptions = ['All', 'Active', 'Inactive', 'Prospect'];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Manage your client relationships
            </p>
          </div>
          <Button variant="gold" asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'navy' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-card animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                {searchQuery || statusFilter !== 'All' 
                  ? 'No clients found' 
                  : 'No clients yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first client to get started'}
              </p>
              {!searchQuery && statusFilter === 'All' && (
                <Button variant="navy" asChild>
                  <Link to="/clients/new">Add Your First Client</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, index) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full hover:shadow-medium transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-eiduk-navy flex items-center justify-center text-white font-display font-bold text-lg">
                        {client.first_name[0]}{client.last_name[0]}
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
                    </div>
                    
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                      {client.first_name} {client.last_name}
                    </h3>
                    
                    {client.company_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Building2 className="h-4 w-4" />
                        {client.company_name}
                      </div>
                    )}

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
