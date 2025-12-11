import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Map, 
  Plus, 
  Trash2, 
  Save, 
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  Loader2
} from 'lucide-react';
import { RoadmapPreview } from './RoadmapPreview';

interface Roadmap {
  id: string;
  title: string;
  phase1_title: string;
  phase1_description: string;
  phase1_tasks: string[];
  phase2_title: string;
  phase2_description: string;
  phase2_tasks: string[];
  phase3_title: string;
  phase3_description: string;
  phase3_tasks: string[];
  phase4_title: string;
  phase4_description: string;
  phase4_tasks: string[];
  phase5_title: string;
  phase5_description: string;
  phase5_tasks: string[];
  phase6_title: string;
  phase6_description: string;
  phase6_tasks: string[];
  estimated_savings_min: number;
  estimated_savings_max: number;
  status: string;
  created_at: string;
}

interface RoadmapGeneratorProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
}

type PhaseKey = 'phase1_tasks' | 'phase2_tasks' | 'phase3_tasks' | 'phase4_tasks' | 'phase5_tasks' | 'phase6_tasks';

export function RoadmapGenerator({ clientId, clientName, clientEmail }: RoadmapGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Partial<Roadmap> | null>(null);

  const sendToClient = async (roadmapId: string) => {
    if (!clientEmail) {
      toast({
        variant: 'destructive',
        title: 'No email address',
        description: 'This client does not have an email address configured.',
      });
      return;
    }

    setSending(roadmapId);
    try {
      const { data, error } = await supabase.functions.invoke('send-client-magic-link', {
        body: {
          clientId,
          roadmapId,
          clientEmail,
          clientName,
          baseUrl: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: 'Roadmap sent!',
        description: `Magic link sent to ${clientEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send magic link',
      });
    } finally {
      setSending(null);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [clientId]);

  const fetchRoadmaps = async () => {
    try {
      const { data, error } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse JSON tasks for all 6 phases
      const parsed = (data || []).map(r => ({
        ...r,
        phase1_tasks: Array.isArray(r.phase1_tasks) ? r.phase1_tasks : JSON.parse(r.phase1_tasks as string),
        phase2_tasks: Array.isArray(r.phase2_tasks) ? r.phase2_tasks : JSON.parse(r.phase2_tasks as string),
        phase3_tasks: Array.isArray(r.phase3_tasks) ? r.phase3_tasks : JSON.parse(r.phase3_tasks as string),
        phase4_tasks: Array.isArray(r.phase4_tasks) ? r.phase4_tasks : JSON.parse(r.phase4_tasks as string),
        phase5_tasks: Array.isArray(r.phase5_tasks) ? r.phase5_tasks : JSON.parse(r.phase5_tasks as string),
        phase6_tasks: Array.isArray(r.phase6_tasks) ? r.phase6_tasks : JSON.parse(r.phase6_tasks as string),
      }));
      setRoadmaps(parsed);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoadmap = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('client_roadmaps')
        .insert({
          client_id: clientId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Roadmap created',
        description: 'A new 90-day roadmap has been created for this client.',
      });

      fetchRoadmaps();
      if (data) {
        setExpandedId(data.id);
        setEditForm({
          ...data,
          phase1_tasks: data.phase1_tasks as string[],
          phase2_tasks: data.phase2_tasks as string[],
          phase3_tasks: data.phase3_tasks as string[],
          phase4_tasks: data.phase4_tasks as string[],
          phase5_tasks: data.phase5_tasks as string[],
          phase6_tasks: data.phase6_tasks as string[],
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create roadmap',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveRoadmap = async () => {
    if (!editForm?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('client_roadmaps')
        .update({
          title: editForm.title,
          phase1_title: editForm.phase1_title,
          phase1_description: editForm.phase1_description,
          phase1_tasks: editForm.phase1_tasks,
          phase2_title: editForm.phase2_title,
          phase2_description: editForm.phase2_description,
          phase2_tasks: editForm.phase2_tasks,
          phase3_title: editForm.phase3_title,
          phase3_description: editForm.phase3_description,
          phase3_tasks: editForm.phase3_tasks,
          phase4_title: editForm.phase4_title,
          phase4_description: editForm.phase4_description,
          phase4_tasks: editForm.phase4_tasks,
          phase5_title: editForm.phase5_title,
          phase5_description: editForm.phase5_description,
          phase5_tasks: editForm.phase5_tasks,
          phase6_title: editForm.phase6_title,
          phase6_description: editForm.phase6_description,
          phase6_tasks: editForm.phase6_tasks,
          estimated_savings_min: editForm.estimated_savings_min,
          estimated_savings_max: editForm.estimated_savings_max,
          status: editForm.status,
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: 'Roadmap saved',
        description: 'Changes have been saved.',
      });

      fetchRoadmaps();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save roadmap',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRoadmap = async (id: string) => {
    if (!confirm('Delete this roadmap?')) return;

    try {
      const { error } = await supabase
        .from('client_roadmaps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Roadmap deleted' });
      fetchRoadmaps();
      if (expandedId === id) {
        setExpandedId(null);
        setEditForm(null);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const toggleExpand = (roadmap: Roadmap) => {
    if (expandedId === roadmap.id) {
      setExpandedId(null);
      setEditForm(null);
    } else {
      setExpandedId(roadmap.id);
      setEditForm({ ...roadmap });
    }
  };

  const updateTask = (phase: PhaseKey, index: number, value: string) => {
    if (!editForm) return;
    const tasks = [...(editForm[phase] as string[] || [])];
    tasks[index] = value;
    setEditForm({ ...editForm, [phase]: tasks });
  };

  const addTask = (phase: PhaseKey) => {
    if (!editForm) return;
    const tasks = [...(editForm[phase] as string[] || []), ''];
    setEditForm({ ...editForm, [phase]: tasks });
  };

  const removeTask = (phase: PhaseKey, index: number) => {
    if (!editForm) return;
    const tasks = (editForm[phase] as string[] || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, [phase]: tasks });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Show preview modal
  if (previewId) {
    const roadmap = roadmaps.find(r => r.id === previewId);
    if (roadmap) {
      return (
        <RoadmapPreview 
          roadmap={roadmap} 
          clientName={clientName}
          onClose={() => setPreviewId(null)} 
        />
      );
    }
  }

  const phaseConfigs = [
    { key: 'phase1', timing: 'Week 1-2' },
    { key: 'phase2', timing: 'Week 2-4' },
    { key: 'phase3', timing: 'Week 4-6' },
    { key: 'phase4', timing: 'Week 6-8' },
    { key: 'phase5', timing: 'Week 8-10' },
    { key: 'phase6', timing: 'Week 10-12' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-eiduk-gold" />
          <h3 className="font-display text-lg font-semibold">90-Day Roadmaps</h3>
        </div>
        <Button onClick={createRoadmap} disabled={saving} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Roadmap
        </Button>
      </div>

      {/* Roadmap List */}
      {roadmaps.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium text-lg mb-2">No Roadmaps Yet</h4>
            <p className="text-muted-foreground mb-4">
              Create a personalized 90-day tax strategy roadmap for this client.
            </p>
            <Button onClick={createRoadmap} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Roadmap
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roadmaps.map((roadmap) => (
            <Card key={roadmap.id} className="overflow-hidden">
              {/* Collapsed Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(roadmap)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-eiduk-blue" />
                  <div>
                    <h4 className="font-medium">{roadmap.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(roadmap.created_at)} • 
                      Savings: ${roadmap.estimated_savings_min.toLocaleString()} - ${roadmap.estimated_savings_max.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    roadmap.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {roadmap.status}
                  </span>
                  {expandedId === roadmap.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Editor */}
              {expandedId === roadmap.id && editForm && (
                <CardContent className="border-t p-6 space-y-6">
                  {/* Title & Savings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-2">
                      <Label>Roadmap Title</Label>
                      <Input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Min Savings
                      </Label>
                      <Input
                        type="number"
                        value={editForm.estimated_savings_min || 0}
                        onChange={(e) => setEditForm({ ...editForm, estimated_savings_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Max Savings
                      </Label>
                      <Input
                        type="number"
                        value={editForm.estimated_savings_max || 0}
                        onChange={(e) => setEditForm({ ...editForm, estimated_savings_max: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* All 6 Phases */}
                  {phaseConfigs.map((config, index) => {
                    const phaseNum = index + 1;
                    const titleKey = `phase${phaseNum}_title` as keyof Roadmap;
                    const descKey = `phase${phaseNum}_description` as keyof Roadmap;
                    const tasksKey = `phase${phaseNum}_tasks` as PhaseKey;
                    
                    return (
                      <PhaseEditor
                        key={config.key}
                        phaseNumber={phaseNum}
                        timing={config.timing}
                        title={(editForm[titleKey] as string) || ''}
                        description={(editForm[descKey] as string) || ''}
                        tasks={(editForm[tasksKey] as string[]) || []}
                        onTitleChange={(v) => setEditForm({ ...editForm, [titleKey]: v })}
                        onDescriptionChange={(v) => setEditForm({ ...editForm, [descKey]: v })}
                        onTaskChange={(i, v) => updateTask(tasksKey, i, v)}
                        onAddTask={() => addTask(tasksKey)}
                        onRemoveTask={(i) => removeTask(tasksKey, i)}
                        isCelebration={phaseNum === 6}
                      />
                    );
                  })}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRoadmap(roadmap.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewId(roadmap.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendToClient(roadmap.id)}
                        disabled={sending === roadmap.id || !clientEmail}
                        className="bg-eiduk-blue text-white hover:bg-eiduk-navy border-none"
                      >
                        {sending === roadmap.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send to Client
                      </Button>
                      <Button
                        onClick={saveRoadmap}
                        disabled={saving}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Phase Editor Component
interface PhaseEditorProps {
  phaseNumber: number;
  timing: string;
  title: string;
  description: string;
  tasks: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTaskChange: (index: number, value: string) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  isCelebration?: boolean;
}

function PhaseEditor({
  phaseNumber,
  timing,
  title,
  description,
  tasks,
  onTitleChange,
  onDescriptionChange,
  onTaskChange,
  onAddTask,
  onRemoveTask,
  isCelebration,
}: PhaseEditorProps) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span 
            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--eiduk-blue)) 0%, hsl(var(--eiduk-navy)) 100%)',
            }}
          >
            {isCelebration ? '🎉' : phaseNumber}
          </span>
          <h4 className="font-display font-semibold">Phase {phaseNumber}</h4>
        </div>
        <span className="text-xs bg-eiduk-cream text-eiduk-navy px-2 py-1 rounded-full font-medium">
          {timing}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phase Title</Label>
          <Input value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tasks</Label>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={task}
                onChange={(e) => onTaskChange(index, e.target.value)}
                placeholder="Enter task..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveTask(index)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddTask}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
}
