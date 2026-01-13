import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Plus, TrendingUp, Users, BookOpen, Check, X, ChevronDown, ChevronRight, ExternalLink, Calculator, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Phase configuration with colors, descriptions - matching database phase values
const PHASES = [
  { id: '1', name: 'Foundation', shortName: 'Foundation', color: '#1e40af', description: 'S-Corp Optimization & Core Setup', range: '1-7' },
  { id: '2', name: 'Core Deductions', shortName: 'Core', color: '#059669', description: 'Depreciation, Deductions & QBI', range: '8-17' },
  { id: '3', name: 'Retirement & Benefits', shortName: 'Retirement', color: '#7c3aed', description: 'Tax-Advantaged Wealth Building', range: '18-28' },
  { id: '4', name: 'Credits & Multistate', shortName: 'Credits', color: '#ea580c', description: 'Tax Credits & State Optimization', range: '29-35' },
  { id: '5', name: 'Real Estate & PAL', shortName: 'Real Estate', color: '#0891b2', description: 'Real Estate Tax Strategies', range: '36-43' },
  { id: '6', name: 'Acquisitions & Leverage', shortName: 'Acquisitions', color: '#dc2626', description: 'Advanced Asset & Investment Strategies', range: '44-50' },
  { id: '7', name: 'Exit & Wealth Transfer', shortName: 'Exit', color: '#ca8a04', description: 'Business Exit & Legacy Planning', range: '51-61' },
  { id: '8', name: 'Charitable & Philanthropic', shortName: 'Charitable', color: '#9333ea', description: 'Charitable Planning & Giving', range: '62-72' },
  { id: '9', name: 'Premium Alternative Investments', shortName: 'Premium Alt', color: '#be185d', description: 'Alternative Investment Strategies', range: '73-80' },
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
  strategy_number: string | null;
  irc_citation: string | null;
  irc_sections: string | null;
  description: string | null;
  what_it_is: string | null;
  client_overview: string | null;
  implementation: string | null;
  forms_required: string | null;
  risk_level: string | null;
  irs_scrutiny: boolean | null;
  tier: string | null;
  typical_savings_low: number | null;
  typical_savings_high: number | null;
  savings_low: number | null;
  savings_high: number | null;
  tool_url: string | null;
  tool_name: string | null;
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
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    // Default all phases to expanded
    const expanded: Record<string, boolean> = {};
    PHASES.forEach(p => { expanded[p.id] = true; });
    return expanded;
  });

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

  const exportStrategiesWithTools = () => {
    const headers = ['id', 'strategy_number', 'name', 'phase', 'phase_name', 'tool_name', 'tool_url'];
    const rows = strategies.map((s) => [
      s.id,
      s.strategy_number || '',
      `"${(s.name || '').replace(/"/g, '""')}"`,
      s.phase,
      `"${(s.phase_name || '').replace(/"/g, '""')}"`,
      `"${(s.tool_name || '').replace(/"/g, '""')}"`,
      s.tool_url || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategies-tools.csv';
    link.click();
    URL.revokeObjectURL(url);
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
              #{strategy.strategy_number || strategy.id}
            </Badge>
            {strategy.risk_level && (
              <Badge variant={strategy.risk_level === 'High' ? 'destructive' : strategy.risk_level === 'Low' ? 'secondary' : 'outline'} className="text-xs">
                {strategy.risk_level}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {strategy.name}
          </h3>
          
          {(strategy.irc_sections || strategy.irc_citation) && (
            <p className="text-xs font-mono text-muted-foreground mb-2">
              {strategy.irc_sections || strategy.irc_citation}
            </p>
          )}
          
          {(strategy.what_it_is || strategy.description) && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {strategy.what_it_is || strategy.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-success">
              {formatCurrency(strategy.savings_low || strategy.typical_savings_low)} - {formatCurrency(strategy.savings_high || strategy.typical_savings_high)}
            </span>
            
            <div className="flex items-center gap-1">
              {strategy.tool_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(strategy.tool_url!, '_blank');
                  }}
                  title={strategy.tool_name || 'Open Calculator'}
                >
                  <Calculator className="h-4 w-4 text-primary" />
                </Button>
              )}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
            <p className="text-muted-foreground">80 Tax Reduction Strategies Across 9 Phases</p>
          </div>
          <Button variant="outline" onClick={exportStrategiesWithTools}>
            <Download className="h-4 w-4 mr-2" />
            Export Tools CSV
          </Button>
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
                P{phase.id}: {phase.shortName} ({count})
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
                {getPhaseConfig(activePhase)?.description} • Strategies #{getPhaseConfig(activePhase)?.range}
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
          // Grouped by phase view with collapsible sections
          <div className="space-y-4">
            {PHASES.map(phase => {
              const phaseStrategies = groupedStrategies[phase.id];
              if (!phaseStrategies || phaseStrategies.length === 0) return null;
              const isExpanded = expandedPhases[phase.id] ?? true;
              
              return (
                <Collapsible 
                  key={phase.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedPhases(prev => ({ ...prev, [phase.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full py-3 px-5 rounded-lg flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: phase.color }}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-white" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-white" />
                        )}
                        <span className="text-white font-bold text-lg">
                          {phase.id}: {phase.name}
                        </span>
                      </div>
                      <span className="text-white/90 text-sm">
                        {phaseStrategies.length} strategies
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phaseStrategies.map(strategy => (
                        <StrategyCard
                          key={strategy.id}
                          strategy={strategy}
                          onClick={() => setDetailModal({ open: true, strategy })}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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
                #{detailModal.strategy?.strategy_number || detailModal.strategy?.id}
              </Badge>
              <Badge variant="outline">
                Phase {detailModal.strategy?.phase}: {detailModal.strategy?.phase_name}
              </Badge>
              {detailModal.strategy?.tier && (
                <Badge variant="secondary">{detailModal.strategy.tier}</Badge>
              )}
              {detailModal.strategy?.irs_scrutiny && (
                <Badge variant="destructive">IRS Scrutiny</Badge>
              )}
            </div>
            <DialogTitle className="text-xl mt-2">
              {detailModal.strategy?.name}
            </DialogTitle>
          </DialogHeader>
          
          {detailModal.strategy && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Savings Range */}
              <div className="bg-success/10 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">Typical Savings Range</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(detailModal.strategy.savings_low || detailModal.strategy.typical_savings_low)} - {formatCurrency(detailModal.strategy.savings_high || detailModal.strategy.typical_savings_high)}
                </p>
              </div>

              {/* Risk Level */}
              {detailModal.strategy.risk_level && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Risk Level:</p>
                  <Badge variant={detailModal.strategy.risk_level === 'High' ? 'destructive' : detailModal.strategy.risk_level === 'Low' ? 'secondary' : 'outline'}>
                    {detailModal.strategy.risk_level}
                  </Badge>
                </div>
              )}

              {/* IRC Sections */}
              {(detailModal.strategy.irc_sections || detailModal.strategy.irc_citation) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IRC Sections</p>
                  <p className="font-mono text-sm">{detailModal.strategy.irc_sections || detailModal.strategy.irc_citation}</p>
                </div>
              )}

              {/* What It Is */}
              {detailModal.strategy.what_it_is && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">What It Is</p>
                  <p className="text-sm">{detailModal.strategy.what_it_is}</p>
                </div>
              )}

              {/* Client Overview */}
              {detailModal.strategy.client_overview && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client Overview</p>
                  <p className="text-sm">{detailModal.strategy.client_overview}</p>
                </div>
              )}

              {/* Implementation Steps */}
              {detailModal.strategy.implementation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Implementation</p>
                  <div className="text-sm space-y-1 mt-1">
                    {detailModal.strategy.implementation.split(' | ').map((step, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-primary font-medium">{idx + 1}.</span>
                        <span>{step.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forms Required */}
              {detailModal.strategy.forms_required && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forms Required</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                    {detailModal.strategy.forms_required}
                  </p>
                </div>
              )}
              
              {/* Clients Using This Strategy */}
              <div className="border-t pt-4">
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
