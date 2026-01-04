import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, TrendingUp, Users, BookOpen, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Phase configuration with colors, descriptions, and strategy ranges
const PHASES = [
  { id: 'P1', name: 'Foundation', shortName: 'Foundation', color: '#1E40AF', description: 'S-Corp Optimization & Core Setup', strategyStart: 1, strategyEnd: 6 },
  { id: 'P2', name: 'Core Deductions', shortName: 'Core', color: '#059669', description: 'Depreciation, Deductions & QBI', strategyStart: 7, strategyEnd: 13 },
  { id: 'P3', name: 'Retirement & Benefits', shortName: 'Retirement', color: '#7C3AED', description: 'Tax-Advantaged Wealth Building', strategyStart: 14, strategyEnd: 23 },
  { id: 'P4', name: 'Credits & Multistate', shortName: 'Credits', color: '#EA580C', description: 'Tax Credits & State Optimization', strategyStart: 24, strategyEnd: 30 },
  { id: 'P5', name: 'Real Estate & PAL', shortName: 'Real Estate', color: '#0891B2', description: 'Real Estate Tax Strategies', strategyStart: 31, strategyEnd: 38 },
  { id: 'P6', name: 'Acquisitions & Leverage', shortName: 'Acquisitions', color: '#DC2626', description: 'Advanced Asset & Investment Strategies', strategyStart: 39, strategyEnd: 49 },
  { id: 'P7', name: 'Exit & Wealth Transfer', shortName: 'Exit', color: '#CA8A04', description: 'Business Exit & Legacy Planning', strategyStart: 50, strategyEnd: 59 },
  { id: 'P8', name: 'Charitable & Philanthropic', shortName: 'Charitable', color: '#9333EA', description: 'Charitable Planning & Giving', strategyStart: 60, strategyEnd: 70 },
];

const getPhaseConfig = (phase: string) => {
  return PHASES.find(p => p.id === phase);
};

const getPhaseColor = (phase: string) => {
  return getPhaseConfig(phase)?.color || '#6B7280';
};

interface Strategy {
  id: number;
  name: string;
  phase: string;
  phase_name: string;
  irc_citation: string | null;
  description: string | null;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
}

interface Client {
  id: string;
  name: string;
  package_tier: string;
}

interface ClientStrategy {
  client_id: string;
  strategy_id: number;
  status: string;
}

export default function Strategies() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhase, setActivePhase] = useState<string>('all');
  const [addToClientModal, setAddToClientModal] = useState<{ open: boolean; strategy: Strategy | null }>({ open: false, strategy: null });
  const [detailModal, setDetailModal] = useState<{ open: boolean; strategy: Strategy | null }>({ open: false, strategy: null });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // Fetch all strategies
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data as Strategy[];
    },
  });

  // Fetch all clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, package_tier')
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch all client_strategies for stats
  const { data: clientStrategies = [] } = useQuery({
    queryKey: ['client-strategies-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_strategies')
        .select('client_id, strategy_id, status');
      if (error) throw error;
      return data as ClientStrategy[];
    },
  });

  // Add strategy to client mutation
  const addStrategyMutation = useMutation({
    mutationFn: async ({ clientId, strategyId }: { clientId: string; strategyId: number }) => {
      const { error } = await supabase
        .from('client_strategies')
        .insert({ client_id: clientId, strategy_id: strategyId, status: 'not_started' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-strategies-all'] });
      const strategy = addToClientModal.strategy;
      const client = clients.find(c => c.id === selectedClient);
      toast({
        title: 'Strategy Added',
        description: `Added #${strategy?.id} ${strategy?.name} to ${client?.name}`,
      });
      setAddToClientModal({ open: false, strategy: null });
      setSelectedClient(null);
      setClientSearch('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add strategy to client',
        variant: 'destructive',
      });
    },
  });

  // Filter strategies based on search and phase
  const filteredStrategies = useMemo(() => {
    return strategies.filter(strategy => {
      const matchesSearch = searchQuery === '' || 
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.id.toString().includes(searchQuery) ||
        (strategy.irc_citation?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (strategy.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPhase = activePhase === 'all' || strategy.phase === activePhase;
      
      return matchesSearch && matchesPhase;
    });
  }, [strategies, searchQuery, activePhase]);

  // Group strategies by phase for "All" view
  const groupedStrategies = useMemo(() => {
    if (activePhase !== 'all') return null;
    
    const groups: Record<string, Strategy[]> = {};
    filteredStrategies.forEach(strategy => {
      if (!groups[strategy.phase]) {
        groups[strategy.phase] = [];
      }
      groups[strategy.phase].push(strategy);
    });
    return groups;
  }, [filteredStrategies, activePhase]);

  // Calculate phase counts
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    strategies.forEach(strategy => {
      counts[strategy.phase] = (counts[strategy.phase] || 0) + 1;
    });
    return counts;
  }, [strategies]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalImplementations = clientStrategies.length;
    
    // Find most implemented strategy
    const strategyCount: Record<number, number> = {};
    clientStrategies.forEach(cs => {
      strategyCount[cs.strategy_id] = (strategyCount[cs.strategy_id] || 0) + 1;
    });
    
    let mostImplementedId = 0;
    let mostImplementedCount = 0;
    Object.entries(strategyCount).forEach(([id, count]) => {
      if (count > mostImplementedCount) {
        mostImplementedId = parseInt(id);
        mostImplementedCount = count;
      }
    });
    
    const mostImplemented = strategies.find(s => s.id === mostImplementedId);
    
    return {
      totalStrategies: strategies.length,
      totalImplementations,
      mostImplemented: mostImplemented ? { name: mostImplemented.name, count: mostImplementedCount } : null,
    };
  }, [strategies, clientStrategies]);

  // Get clients that already have a strategy assigned
  const getAssignedClientIds = (strategyId: number) => {
    return clientStrategies
      .filter(cs => cs.strategy_id === strategyId)
      .map(cs => cs.client_id);
  };

  // Get clients using a specific strategy (for detail modal)
  const getClientsWithStrategy = (strategyId: number) => {
    return clientStrategies
      .filter(cs => cs.strategy_id === strategyId)
      .map(cs => {
        const client = clients.find(c => c.id === cs.client_id);
        return client ? { ...client, status: cs.status } : null;
      })
      .filter(Boolean);
  };

  // Filter clients for modal
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const handleAddToClient = () => {
    if (!selectedClient || !addToClientModal.strategy) return;
    addStrategyMutation.mutate({
      clientId: selectedClient,
      strategyId: addToClientModal.strategy.id,
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const StrategyCard = ({ strategy, onClick }: { strategy: Strategy; onClick: () => void }) => {
    const phaseColor = getPhaseColor(strategy.phase);
    
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge 
              className="text-white text-xs font-bold"
              style={{ backgroundColor: phaseColor }}
            >
              #{strategy.id}
            </Badge>
          </div>
          
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {strategy.name}
          </h3>
          
          {strategy.irc_citation && (
            <p className="text-xs font-mono text-muted-foreground mb-2">
              {strategy.irc_citation}
            </p>
          )}
          
          {strategy.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {strategy.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-success">
              {formatCurrency(strategy.typical_savings_low)} - {formatCurrency(strategy.typical_savings_high)}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setAddToClientModal({ open: true, strategy });
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (strategiesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
          <p className="text-muted-foreground">70 Tax Reduction Strategies</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Strategies</p>
                <p className="text-2xl font-bold">{stats.totalStrategies}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Implemented</p>
                <p className="text-lg font-bold truncate">
                  {stats.mostImplemented ? `${stats.mostImplemented.name}` : 'None'}
                </p>
                {stats.mostImplemented && (
                  <p className="text-xs text-muted-foreground">{stats.mostImplemented.count} clients</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Implementations</p>
                <p className="text-2xl font-bold">{stats.totalImplementations}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies by name, number, or IRC citation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activePhase === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePhase('all')}
          >
            All ({strategies.length})
          </Button>
          {PHASES.map(phase => {
            const count = phaseCounts[phase.id] || 0;
            const isActive = activePhase === phase.id;
            return (
              <Button
                key={phase.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePhase(phase.id)}
                style={isActive ? { backgroundColor: phase.color, borderColor: phase.color } : {}}
              >
                {phase.id}: {phase.shortName} ({count})
              </Button>
            );
          })}
        </div>

        {/* Phase Description (when specific phase selected) */}
        {activePhase !== 'all' && (
          <Card className="border-l-4" style={{ borderLeftColor: getPhaseColor(activePhase) }}>
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg">
                {activePhase}: {getPhaseConfig(activePhase)?.name}
              </h2>
              <p className="text-muted-foreground">
                {getPhaseConfig(activePhase)?.description} (Strategies #{getPhaseConfig(activePhase)?.strategyStart}-{getPhaseConfig(activePhase)?.strategyEnd})
              </p>
            </CardContent>
          </Card>
        )}

        {/* Strategies Grid */}
        {filteredStrategies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No strategies found</p>
              <p className="text-sm text-muted-foreground/70">Try adjusting your search or filter</p>
            </CardContent>
          </Card>
        ) : activePhase === 'all' && groupedStrategies ? (
          // Grouped by phase view
          <div className="space-y-8">
            {PHASES.map(phase => {
              const phaseStrategies = groupedStrategies[phase.id];
              if (!phaseStrategies || phaseStrategies.length === 0) return null;
              
              return (
                <div key={phase.id}>
                  <div 
                    className="py-3 px-5 rounded-lg mb-4 flex items-center justify-between"
                    style={{ backgroundColor: phase.color }}
                  >
                    <span className="text-white font-bold text-lg">
                      {phase.id}: {phase.name}
                    </span>
                    <span className="text-white/90 text-sm">
                      Strategies #{phase.strategyStart}-{phase.strategyEnd} | {phaseStrategies.length} strategies
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phaseStrategies.map(strategy => (
                      <StrategyCard
                        key={strategy.id}
                        strategy={strategy}
                        onClick={() => setDetailModal({ open: true, strategy })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single phase view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStrategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onClick={() => setDetailModal({ open: true, strategy })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add to Client Modal */}
      <Dialog open={addToClientModal.open} onOpenChange={(open) => {
        setAddToClientModal({ open, strategy: open ? addToClientModal.strategy : null });
        if (!open) {
          setSelectedClient(null);
          setClientSearch('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add #{addToClientModal.strategy?.id} {addToClientModal.strategy?.name} to Client
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No clients found</p>
              ) : (
                filteredClients.map(client => {
                  const isAssigned = addToClientModal.strategy 
                    ? getAssignedClientIds(addToClientModal.strategy.id).includes(client.id)
                    : false;
                  
                  return (
                    <button
                      key={client.id}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors",
                        isAssigned 
                          ? "bg-muted cursor-not-allowed opacity-60" 
                          : selectedClient === client.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                      )}
                      onClick={() => !isAssigned && setSelectedClient(client.id)}
                      disabled={isAssigned}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {client.package_tier}
                          </Badge>
                        </div>
                      </div>
                      {isAssigned ? (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Already assigned
                        </Badge>
                      ) : selectedClient === client.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToClientModal({ open: false, strategy: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToClient} 
              disabled={!selectedClient || addStrategyMutation.isPending}
            >
              {addStrategyMutation.isPending ? 'Adding...' : 'Add Strategy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strategy Detail Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => {
        setDetailModal({ open, strategy: open ? detailModal.strategy : null });
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge 
                className="text-white"
                style={{ backgroundColor: detailModal.strategy ? getPhaseColor(detailModal.strategy.phase) : undefined }}
              >
                #{detailModal.strategy?.id}
              </Badge>
              <Badge variant="outline">
                P{detailModal.strategy?.phase} {detailModal.strategy?.phase_name}
              </Badge>
            </div>
            <DialogTitle className="text-xl mt-2">
              {detailModal.strategy?.name}
            </DialogTitle>
          </DialogHeader>
          
          {detailModal.strategy && (
            <div className="space-y-4">
              {detailModal.strategy.irc_citation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IRC Citation</p>
                  <p className="font-mono text-sm">{detailModal.strategy.irc_citation}</p>
                </div>
              )}
              
              {detailModal.strategy.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{detailModal.strategy.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Typical Savings Range</p>
                <p className="text-lg font-semibold text-success">
                  {formatCurrency(detailModal.strategy.typical_savings_low)} - {formatCurrency(detailModal.strategy.typical_savings_high)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Clients Using This Strategy ({getClientsWithStrategy(detailModal.strategy.id).length})
                </p>
                {getClientsWithStrategy(detailModal.strategy.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground/70">No clients have this strategy assigned</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getClientsWithStrategy(detailModal.strategy.id).map((client: any) => (
                      <div key={client.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{client.name}</span>
                        <Badge variant={client.status === 'complete' ? 'default' : 'secondary'} className="text-xs">
                          {client.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModal({ open: false, strategy: null })}>
              Close
            </Button>
            <Button onClick={() => {
              setDetailModal({ open: false, strategy: null });
              setAddToClientModal({ open: true, strategy: detailModal.strategy });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
