import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  Loader2,
  DollarSign,
  Calendar,
  Gift
} from 'lucide-react';
import { WelcomePacketPreview } from './WelcomePacketPreview';

interface WelcomePacket {
  id: string;
  service_level: string;
  engagement_date: string;
  projected_savings_min: number;
  projected_savings_max: number;
  status: string;
  created_at: string;
}

interface WelcomePacketGeneratorProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  companyName?: string;
}

export function WelcomePacketGenerator({ clientId, clientName, clientEmail, companyName }: WelcomePacketGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [packets, setPackets] = useState<WelcomePacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WelcomePacket> | null>(null);

  useEffect(() => {
    fetchPackets();
  }, [clientId]);

  const fetchPackets = async () => {
    try {
      const { data, error } = await supabase
        .from('client_welcome_packets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackets(data || []);
    } catch (error) {
      console.error('Error fetching welcome packets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPacket = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('client_welcome_packets')
        .insert({
          client_id: clientId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Welcome Packet created',
        description: 'A new welcome packet has been created for this client.',
      });

      fetchPackets();
      if (data) {
        setExpandedId(data.id);
        setEditForm({ ...data });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create welcome packet',
      });
    } finally {
      setSaving(false);
    }
  };

  const savePacket = async () => {
    if (!editForm?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('client_welcome_packets')
        .update({
          service_level: editForm.service_level,
          engagement_date: editForm.engagement_date,
          projected_savings_min: editForm.projected_savings_min,
          projected_savings_max: editForm.projected_savings_max,
          status: editForm.status,
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: 'Welcome Packet saved',
        description: 'Changes have been saved.',
      });

      fetchPackets();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save welcome packet',
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePacket = async (id: string) => {
    if (!confirm('Delete this welcome packet?')) return;

    try {
      const { error } = await supabase
        .from('client_welcome_packets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Welcome Packet deleted' });
      fetchPackets();
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

  const toggleExpand = (packet: WelcomePacket) => {
    if (expandedId === packet.id) {
      setExpandedId(null);
      setEditForm(null);
    } else {
      setExpandedId(packet.id);
      setEditForm({ ...packet });
    }
  };

  const sendToClient = async (packetId: string) => {
    if (!clientEmail) {
      toast({
        variant: 'destructive',
        title: 'No email address',
        description: 'This client does not have an email address configured.',
      });
      return;
    }

    // For now, just show the email dialog
    const subject = encodeURIComponent('Welcome to Eiduk Tax & Wealth - Your Client Resource Package');
    const body = encodeURIComponent(`Dear ${clientName},\n\nWelcome! Please find your complete Client Welcome Packet at the link below.\n\nThis packet contains everything you need to get started and maximize your tax savings.\n\nI'm excited to work with you!\n\nBest regards,\nJohn Eiduk, CPA, CFP®, MSCTA\nEiduk Tax & Wealth\n847-917-8981\njohn@eiduktaxandwealth.com`);
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
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
    const packet = packets.find(p => p.id === previewId);
    if (packet) {
      return (
        <WelcomePacketPreview 
          packet={packet}
          clientName={clientName}
          companyName={companyName}
          onClose={() => setPreviewId(null)} 
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-eiduk-gold" />
          <h3 className="font-display text-lg font-semibold">Welcome Packets</h3>
        </div>
        <Button onClick={createPacket} disabled={saving} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Welcome Packet
        </Button>
      </div>

      {/* Packet List */}
      {packets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium text-lg mb-2">No Welcome Packets Yet</h4>
            <p className="text-muted-foreground mb-4">
              Create a personalized welcome packet for this client with all the onboarding information they need.
            </p>
            <Button onClick={createPacket} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Welcome Packet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {packets.map((packet) => (
            <Card key={packet.id} className="overflow-hidden">
              {/* Collapsed Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(packet)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-eiduk-blue" />
                  <div>
                    <h4 className="font-medium">Welcome Packet</h4>
                    <p className="text-sm text-muted-foreground">
                      {packet.service_level} • Created {formatDate(packet.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    packet.status === 'sent' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {packet.status}
                  </span>
                  {expandedId === packet.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Editor */}
              {expandedId === packet.id && editForm && (
                <CardContent className="border-t p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Service Level</Label>
                      <Select
                        value={editForm.service_level || 'Tax Advisory'}
                        onValueChange={(value) => setEditForm({ ...editForm, service_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tax Advisory">Tax Advisory</SelectItem>
                          <SelectItem value="Tax + Wealth">Tax + Wealth</SelectItem>
                          <SelectItem value="Full Service">Full Service</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Engagement Date
                      </Label>
                      <Input
                        type="date"
                        value={editForm.engagement_date?.split('T')[0] || ''}
                        onChange={(e) => setEditForm({ ...editForm, engagement_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Projected Savings Min
                      </Label>
                      <Input
                        type="number"
                        value={editForm.projected_savings_min || 26000}
                        onChange={(e) => setEditForm({ ...editForm, projected_savings_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Projected Savings Max
                      </Label>
                      <Input
                        type="number"
                        value={editForm.projected_savings_max || 87000}
                        onChange={(e) => setEditForm({ ...editForm, projected_savings_max: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePacket(packet.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewId(packet.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendToClient(packet.id)}
                        disabled={sending === packet.id || !clientEmail}
                        className="bg-eiduk-blue text-white hover:bg-eiduk-navy border-none"
                      >
                        {sending === packet.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send to Client
                      </Button>
                      <Button
                        onClick={savePacket}
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
