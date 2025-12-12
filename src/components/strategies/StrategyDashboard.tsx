import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Ban,
  ChevronRight,
  DollarSign,
  FileText
} from 'lucide-react';
import { FICACalculator } from './calculators/FICACalculator';
import { HomeOfficeCalculator } from './calculators/HomeOfficeCalculator';
import { MileageLog } from './calculators/MileageLog';
import { ProfitSharing401kCalculator } from './calculators/ProfitSharing401kCalculator';
import { CashBalanceCalculator } from './calculators/CashBalanceCalculator';
import { RothConversionCalculator } from './calculators/RothConversionCalculator';

interface Strategy {
  id: string;
  strategy_number: number;
  name: string;
  description: string | null;
  phase: number;
  category: string;
  has_calculator: boolean;
  calculator_type: string | null;
}

interface ClientStrategy {
  id: string;
  strategy_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable';
  calculator_data: Record<string, unknown>;
  estimated_savings: number;
  notes: string | null;
  documentation_complete: boolean;
}

interface StrategyDashboardProps {
  clientId: string;
  clientName: string;
  companyName?: string;
}

const PHASE_COLORS: Record<number, string> = {
  1: 'bg-slate-500',
  2: 'bg-phase-foundation',
  3: 'bg-phase-deductions',
  4: 'bg-phase-retirement',
  5: 'bg-phase-realestate',
  6: 'bg-phase-exit',
  7: 'bg-phase-credits',
  8: 'bg-phase-acquisitions',
};

const PHASE_NAMES: Record<number, string> = {
  1: 'Foundational',
  2: 'Core',
  3: 'Retirement & Benefits',
  4: 'Credits & Multistate',
  5: 'Real Estate',
  6: 'Acquisitions & Leverage',
  7: 'Exit & Wealth Transfer',
  8: 'Charitable & Philanthropic',
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-warning' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-success' },
  not_applicable: { label: 'N/A', icon: Ban, color: 'text-muted-foreground' },
};

export function StrategyDashboard({ clientId, clientName, companyName }: StrategyDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [clientStrategies, setClientStrategies] = useState<Map<string, ClientStrategy>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [activePhase, setActivePhase] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      // Fetch all strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .order('strategy_number');

      if (strategiesError) throw strategiesError;
      setStrategies(strategiesData || []);

      // Fetch client's strategies
      const { data: clientStrategiesData, error: clientError } = await supabase
        .from('client_strategies')
        .select('*')
        .eq('client_id', clientId);

      if (clientError) throw clientError;

      const strategiesMap = new Map<string, ClientStrategy>();
      clientStrategiesData?.forEach(cs => {
        strategiesMap.set(cs.strategy_id, cs as ClientStrategy);
      });
      setClientStrategies(strategiesMap);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load strategies',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStrategyStatus = async (strategyId: string, status: ClientStrategy['status']) => {
    if (!user) return;

    try {
      const existing = clientStrategies.get(strategyId);
      
      if (existing) {
        const { error } = await supabase
          .from('client_strategies')
          .update({ status })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_strategies')
          .insert({
            client_id: clientId,
            strategy_id: strategyId,
            user_id: user.id,
            status,
          });
        if (error) throw error;
      }

      fetchData();
      toast({ title: 'Status updated' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const saveCalculatorData = async (strategyId: string, data: Record<string, unknown>, estimatedSavings?: number) => {
    if (!user) return;

    try {
      const existing = clientStrategies.get(strategyId);
      const jsonData = JSON.parse(JSON.stringify(data));
      
      if (existing) {
        const { error } = await supabase
          .from('client_strategies')
          .update({ 
            calculator_data: jsonData,
            estimated_savings: estimatedSavings ?? existing.estimated_savings,
            status: 'in_progress' as const,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_strategies')
          .insert([{
            client_id: clientId,
            strategy_id: strategyId,
            user_id: user.id,
            calculator_data: jsonData,
            estimated_savings: estimatedSavings ?? 0,
            status: 'in_progress' as const,
          }]);
        if (error) throw error;
      }

      fetchData();
      toast({ title: 'Data saved' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const getPhaseStrategies = (phase: number) => strategies.filter(s => s.phase === phase);
  
  const calculateProgress = () => {
    const total = strategies.length;
    const completed = Array.from(clientStrategies.values()).filter(cs => cs.status === 'completed').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const calculateTotalSavings = () => {
    return Array.from(clientStrategies.values()).reduce((sum, cs) => sum + (cs.estimated_savings || 0), 0);
  };

  const renderCalculator = () => {
    if (!selectedStrategy) return null;
    
    const clientStrategy = clientStrategies.get(selectedStrategy.id);
    const savedData = clientStrategy?.calculator_data || {};

    switch (selectedStrategy.calculator_type) {
      case 'fica_calculator':
        return (
          <FICACalculator
            clientName={clientName}
            companyName={companyName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      case 'home_office':
        return (
          <HomeOfficeCalculator
            clientName={clientName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      case 'mileage_log':
        return (
          <MileageLog
            clientName={clientName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      case '401k_calculator':
        return (
          <ProfitSharing401kCalculator
            clientName={clientName}
            companyName={companyName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      case 'cash_balance':
        return (
          <CashBalanceCalculator
            clientName={clientName}
            companyName={companyName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      case 'roth_conversion':
        return (
          <RothConversionCalculator
            clientName={clientName}
            savedData={savedData}
            onSave={(data, savings) => saveCalculatorData(selectedStrategy.id, data, savings)}
            onClose={() => setSelectedStrategy(null)}
          />
        );
      default:
        return (
          <Card className="border-2 border-eiduk-gold/30">
            <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
              <CardTitle className="font-display">
                {selectedStrategy.name}
              </CardTitle>
              <p className="text-white/80 text-sm">{selectedStrategy.description}</p>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Calculator for this strategy is coming soon.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedStrategy(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-card rounded-card animate-pulse" />
        <div className="h-64 bg-card rounded-card animate-pulse" />
      </div>
    );
  }

  if (selectedStrategy) {
    return renderCalculator();
  }

  const filteredStrategies = activePhase === 'all' 
    ? strategies 
    : strategies.filter(s => s.phase === parseInt(activePhase));

  const groupedByPhase = filteredStrategies.reduce((acc, s) => {
    if (!acc[s.phase]) acc[s.phase] = [];
    acc[s.phase].push(s);
    return acc;
  }, {} as Record<number, Strategy[]>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{calculateProgress()}%</p>
              </div>
            </div>
            <Progress value={calculateProgress()} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-eiduk-gold/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-eiduk-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Annual Savings</p>
                <p className="text-2xl font-bold">
                  ${calculateTotalSavings().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-eiduk-blue/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-eiduk-blue" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Strategies</p>
                <p className="text-2xl font-bold">
                  {Array.from(clientStrategies.values()).filter(cs => cs.status === 'completed').length}
                  <span className="text-muted-foreground text-lg font-normal">/{strategies.length}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Filter */}
      <Tabs value={activePhase} onValueChange={setActivePhase}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-eiduk-navy data-[state=active]:text-white"
          >
            All Phases
          </TabsTrigger>
          {Object.entries(PHASE_NAMES).map(([phase, name]) => (
            <TabsTrigger 
              key={phase} 
              value={phase}
              className="data-[state=active]:bg-eiduk-navy data-[state=active]:text-white"
            >
              Phase {phase}: {name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activePhase} className="mt-6">
          {Object.entries(groupedByPhase).map(([phase, phaseStrategies]) => (
            <div key={phase} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${PHASE_COLORS[parseInt(phase)]}`} />
                <h3 className="font-display text-lg font-semibold">
                  Phase {phase}: {PHASE_NAMES[parseInt(phase)] || 'Other'}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {phaseStrategies.length} strategies
                </Badge>
              </div>

              <div className="space-y-2">
                {phaseStrategies.map((strategy) => {
                  const clientStrategy = clientStrategies.get(strategy.id);
                  const status = clientStrategy?.status || 'not_started';
                  const StatusIcon = STATUS_CONFIG[status].icon;

                  return (
                    <div
                      key={strategy.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <button
                        onClick={() => {
                          const nextStatus: Record<string, ClientStrategy['status']> = {
                            not_started: 'in_progress',
                            in_progress: 'completed',
                            completed: 'not_started',
                            not_applicable: 'not_started',
                          };
                          updateStrategyStatus(strategy.id, nextStatus[status]);
                        }}
                        className="flex-shrink-0"
                      >
                        <StatusIcon className={`h-5 w-5 ${STATUS_CONFIG[status].color}`} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{strategy.strategy_number}
                          </span>
                          <p className="font-medium truncate">{strategy.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {strategy.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {clientStrategy?.estimated_savings ? (
                          <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                            ${clientStrategy.estimated_savings.toLocaleString()}
                          </Badge>
                        ) : null}
                        
                        <Badge variant="secondary" className="capitalize">
                          {strategy.category}
                        </Badge>

                        {strategy.has_calculator && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStrategy(strategy)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            Open
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
