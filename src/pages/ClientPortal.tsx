import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import ClientDocumentUpload from '@/components/portal/ClientDocumentUpload';

interface Roadmap {
  id: string;
  title: string;
  service_level: string;
  phase1_title: string;
  phase1_description: string;
  phase1_tasks: string[];
  phase1_completed: number[];
  phase2_title: string;
  phase2_description: string;
  phase2_tasks: string[];
  phase2_completed: number[];
  phase3_title: string;
  phase3_description: string;
  phase3_tasks: string[];
  phase3_completed: number[];
  phase4_title: string;
  phase4_description: string;
  phase4_tasks: string[];
  phase4_completed: number[];
  phase5_title: string;
  phase5_description: string;
  phase5_tasks: string[];
  phase5_completed: number[];
  phase6_title: string;
  phase6_description: string;
  phase6_tasks: string[];
  phase6_completed: number[];
  estimated_savings_min: number;
  estimated_savings_max: number;
  created_at: string;
}

interface ClientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
}

const PHASE_TIMING = [
  'Week 1–2',
  'Week 2–4',
  'Week 4–6',
  'Week 6–8',
  'Week 8–10',
  'Week 10–12',
];

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      validateTokenAndFetchData();
    } else {
      setError('No access token provided');
      setLoading(false);
    }
  }, [token]);

  const validateTokenAndFetchData = async () => {
    try {
      // Validate token using secure server-side function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('validate_client_token', { p_token: token });

      if (tokenError || !tokenData || tokenData.length === 0) {
        setError('Invalid or expired access link');
        setLoading(false);
        return;
      }

      const validatedToken = tokenData[0];
      
      // Check if token is valid (not expired)
      if (!validatedToken.is_valid) {
        setError('This access link has expired. Please contact your advisor for a new link.');
        setLoading(false);
        return;
      }

      // Fetch client info first
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, company_name')
        .eq('id', validatedToken.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
      }

      const roadmapId = validatedToken.roadmap_id;

      // Fetch roadmap data
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();

      if (roadmapError || !roadmapData) {
        setError('Roadmap not found');
        setLoading(false);
        return;
      }

      // Parse JSON fields
      const parseCompleted = (data: unknown): number[] => {
        if (Array.isArray(data)) return data.map(Number);
        return [];
      };

      const parsedRoadmap: Roadmap = {
        ...roadmapData,
        service_level: roadmapData.service_level || 'Tax Advisory',
        phase1_tasks: Array.isArray(roadmapData.phase1_tasks) ? roadmapData.phase1_tasks as string[] : JSON.parse(roadmapData.phase1_tasks as string),
        phase1_completed: parseCompleted(roadmapData.phase1_completed),
        phase2_tasks: Array.isArray(roadmapData.phase2_tasks) ? roadmapData.phase2_tasks as string[] : JSON.parse(roadmapData.phase2_tasks as string),
        phase2_completed: parseCompleted(roadmapData.phase2_completed),
        phase3_tasks: Array.isArray(roadmapData.phase3_tasks) ? roadmapData.phase3_tasks as string[] : JSON.parse(roadmapData.phase3_tasks as string),
        phase3_completed: parseCompleted(roadmapData.phase3_completed),
        phase4_tasks: Array.isArray(roadmapData.phase4_tasks) ? roadmapData.phase4_tasks as string[] : JSON.parse(roadmapData.phase4_tasks as string),
        phase4_completed: parseCompleted(roadmapData.phase4_completed),
        phase5_tasks: Array.isArray(roadmapData.phase5_tasks) ? roadmapData.phase5_tasks as string[] : JSON.parse(roadmapData.phase5_tasks as string),
        phase5_completed: parseCompleted(roadmapData.phase5_completed),
        phase6_tasks: Array.isArray(roadmapData.phase6_tasks) ? roadmapData.phase6_tasks as string[] : JSON.parse(roadmapData.phase6_tasks as string),
        phase6_completed: parseCompleted(roadmapData.phase6_completed),
      };

      setRoadmap(parsedRoadmap);

      // Update last accessed
      await supabase
        .from('client_access_tokens')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('token', token);

    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred loading your portal');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (phaseNum: number, taskIndex: number) => {
    if (!roadmap) return;
    setSaving(true);

    const completedKey = `phase${phaseNum}_completed` as keyof Roadmap;
    const currentCompleted = (roadmap[completedKey] as number[]) || [];
    
    let newCompleted: number[];
    if (currentCompleted.includes(taskIndex)) {
      newCompleted = currentCompleted.filter(i => i !== taskIndex);
    } else {
      newCompleted = [...currentCompleted, taskIndex];
    }

    try {
      const { error } = await supabase
        .from('client_roadmaps')
        .update({ [completedKey]: newCompleted })
        .eq('id', roadmap.id);

      if (error) throw error;

      setRoadmap({
        ...roadmap,
        [completedKey]: newCompleted,
      });

      toast({
        title: currentCompleted.includes(taskIndex) ? 'Task unmarked' : 'Task completed!',
        description: currentCompleted.includes(taskIndex) 
          ? 'Task has been marked as incomplete' 
          : 'Great progress on your roadmap!',
      });
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task status',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-eiduk-cream flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-sm tracking-[0.3em] uppercase text-eiduk-gold mb-4">
            Eiduk Tax & Wealth
          </p>
          <Loader2 className="h-8 w-8 animate-spin text-eiduk-navy mx-auto" />
          <p className="text-muted-foreground mt-4">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-eiduk-cream flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-eiduk-navy mb-2">
            Access Error
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your advisor at{' '}
            <a href="mailto:john@eiduktaxandwealth.com" className="text-eiduk-blue hover:underline">
              john@eiduktaxandwealth.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const phases = [
    { title: roadmap.phase1_title, description: roadmap.phase1_description, tasks: roadmap.phase1_tasks, completed: roadmap.phase1_completed },
    { title: roadmap.phase2_title, description: roadmap.phase2_description, tasks: roadmap.phase2_tasks, completed: roadmap.phase2_completed },
    { title: roadmap.phase3_title, description: roadmap.phase3_description, tasks: roadmap.phase3_tasks, completed: roadmap.phase3_completed },
    { title: roadmap.phase4_title, description: roadmap.phase4_description, tasks: roadmap.phase4_tasks, completed: roadmap.phase4_completed },
    { title: roadmap.phase5_title, description: roadmap.phase5_description, tasks: roadmap.phase5_tasks, completed: roadmap.phase5_completed },
    { title: roadmap.phase6_title, description: roadmap.phase6_description, tasks: roadmap.phase6_tasks, completed: roadmap.phase6_completed },
  ];

  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = phases.reduce((sum, p) => sum + p.completed.length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-eiduk-cream">
      {/* Header */}
      <div 
        className="text-center py-12 px-6"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)',
        }}
      >
        <div className="font-display text-sm tracking-[3px] uppercase text-eiduk-gold mb-4">
          Eiduk Tax & Wealth
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          Welcome to Your Tax Advisory Partnership!
        </h1>
        {client && (
          <p className="text-lg text-white/80">
            Welcome, {client.first_name}!
          </p>
        )}
        <div className="font-display text-lg font-semibold text-eiduk-gold mt-4">
          Pay Less. Keep More. Build Wealth.
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
        {/* Client Info Box */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-eiduk-blue">
          <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold text-eiduk-navy">Client Name:</span>
              <p className="text-foreground">{client?.first_name} {client?.last_name}</p>
            </div>
            {client?.company_name && (
              <div>
                <span className="text-sm font-semibold text-eiduk-navy">Business Name:</span>
                <p className="text-foreground">{client.company_name}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-eiduk-navy">Engagement Date:</span>
              <p className="text-foreground">{formatDate(roadmap.created_at)}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-eiduk-navy">Service Level:</span>
              <p className="text-foreground">{roadmap.service_level}</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-eiduk-navy">
              Your Progress
            </h2>
            <span className="text-2xl font-bold text-eiduk-gold">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, hsl(var(--eiduk-blue)) 0%, hsl(var(--eiduk-gold)) 100%)',
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Savings Box */}
        <div 
          className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-eiduk-gold"
          style={{ background: 'linear-gradient(135deg, rgba(201, 162, 39, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)' }}
        >
          <h3 className="font-display text-xl text-eiduk-navy mb-2">
            Projected Annual Tax Savings
            <span className="ml-2 inline-block bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white text-xs px-3 py-1 rounded-full">
              The Eiduk Pathway™
            </span>
          </h3>
          <p className="font-display text-4xl md:text-5xl font-bold text-eiduk-gold my-4">
            {formatCurrency(roadmap.estimated_savings_min)} – {formatCurrency(roadmap.estimated_savings_max)}+
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Based on your business profile and The Eiduk Pathway™ systematic implementation.
          </p>
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div 
            className="p-4 text-white font-display text-lg font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)' }}
          >
            What's Included in Your Service
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCard 
              emoji="🎯" 
              title="Strategic Tax Planning"
              items={['Quarterly planning sessions', 'Year-end optimization review', 'Multi-year projections']}
            />
            <ServiceCard 
              emoji="📊" 
              title="S-Corp Foundation Setup"
              items={['Compensation analysis', 'Accountable plan', 'Home office deduction']}
            />
            <ServiceCard 
              emoji="📁" 
              title="Complete Tax Compliance"
              items={['Corporate tax return (1120S)', 'Personal tax return (1040)', 'Quarterly tax guidance']}
            />
            <ServiceCard 
              emoji="💼" 
              title="Ongoing Advisory Support"
              items={['Unlimited email support', 'Priority phone consultations', 'Document review']}
            />
          </div>
        </div>

        {/* 90-Day Roadmap Header */}
        <div 
          className="p-4 rounded-lg text-white font-display text-lg font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)' }}
        >
          Your 90-Day Success Roadmap
        </div>

        {/* Phases */}
        <div className="space-y-6">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div 
                className="p-6 flex items-center justify-between"
                style={{
                  background: phaseIndex === 5 
                    ? 'linear-gradient(135deg, hsl(var(--eiduk-gold)) 0%, hsl(45, 80%, 50%) 100%)'
                    : 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                    {phaseIndex === 5 ? '🎉' : phaseIndex + 1}
                  </div>
                  <div>
                    <h3 className={`font-display text-xl font-semibold ${phaseIndex === 5 ? 'text-eiduk-navy' : 'text-white'}`}>
                      {phase.title}
                    </h3>
                    <p className={`text-sm ${phaseIndex === 5 ? 'text-eiduk-navy/70' : 'text-white/70'}`}>
                      {PHASE_TIMING[phaseIndex]}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${phaseIndex === 5 ? 'text-eiduk-navy' : 'text-white'}`}>
                  {phase.completed.length}/{phase.tasks.length} done
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-muted-foreground mb-4">{phase.description}</p>
                
                <div className="space-y-3">
                  {phase.tasks.map((task, taskIndex) => {
                    const isCompleted = phase.completed.includes(taskIndex);
                    return (
                      <div 
                        key={taskIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isCompleted 
                            ? 'bg-success/5 border-success/20' 
                            : 'bg-muted/50 border-border hover:bg-muted'
                        }`}
                        onClick={() => toggleTask(phaseIndex + 1, taskIndex)}
                      >
                        <Checkbox 
                          checked={isCompleted}
                          disabled={saving}
                          className="mt-0.5"
                        />
                        <span className={`flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task}
                        </span>
                        {isCompleted && (
                          <Check className="h-5 w-5 text-success shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Box */}
        <div 
          className="rounded-xl p-6 border-l-4 border-success"
          style={{
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          }}
        >
          <h3 className="font-display text-xl text-eiduk-navy mb-3">
            ✅ We're With You Every Step
          </h3>
          <p className="text-[15px] leading-relaxed text-foreground">
            Don't worry about remembering all of this! Our team will guide you through each phase and remind you when action is needed. 
            We'll send you exactly what you need, when you need it.
          </p>
        </div>

        {/* Document Upload Section */}
        {client && (
          <ClientDocumentUpload 
            clientId={client.id} 
            clientName={`${client.first_name} ${client.last_name}`} 
          />
        )}
        <div 
          className="rounded-2xl p-9 text-center text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)',
          }}
        >
          <h3 className="font-display text-[22px] text-white mb-4">
            Questions? We're Here to Help
          </h3>
          <p className="text-base mb-2">
            <strong>John Eiduk, CPA, CFP®, MSCTA</strong>
          </p>
          <p className="text-base mb-2">
            847-917-8981 | <a href="mailto:john@eiduktaxandwealth.com" className="text-eiduk-gold font-semibold hover:underline">john@eiduktaxandwealth.com</a>
          </p>
          <p className="mt-4">
            <a href="https://eiduktaxandwealth.com" className="text-eiduk-gold font-semibold hover:underline">eiduktaxandwealth.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ emoji, title, items }: { emoji: string; title: string; items: string[] }) {
  return (
    <div className="border border-border/50 rounded-xl p-5 border-l-4 border-l-eiduk-blue">
      <h4 className="font-semibold text-eiduk-navy mb-3">{emoji} {title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
