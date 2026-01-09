import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  entity_type: string;
  package_tier: string;
  income_range: string | null;
  next_review_date: string | null;
  notes: string | null;
  tax_rate: number | null;
  created_at: string;
}

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  onClientUpdated: (client: Client) => void;
  onClientDeleted: () => void;
}

const TAX_RATE_OPTIONS = [
  { value: "0.22", label: "22%" },
  { value: "0.24", label: "24%" },
  { value: "0.32", label: "32%" },
  { value: "0.35", label: "35%" },
  { value: "0.37", label: "37%" },
  { value: "custom", label: "Custom" },
];

export function EditClientModal({
  open,
  onClose,
  client,
  onClientUpdated,
  onClientDeleted,
}: EditClientModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: client.name,
    entity_type: client.entity_type,
    package_tier: client.package_tier,
    income_range: client.income_range || "",
    next_review_date: client.next_review_date || "",
    notes: client.notes || "",
    tax_rate: String(client.tax_rate || 0.37),
    custom_tax_rate: "",
  });
  const [showCustomRate, setShowCustomRate] = useState(false);

  useEffect(() => {
    const rate = client.tax_rate || 0.37;
    const isStandard = TAX_RATE_OPTIONS.slice(0, -1).some(
      (opt) => Math.abs(parseFloat(opt.value) - rate) < 0.001
    );
    if (!isStandard) {
      setShowCustomRate(true);
      setFormData((prev) => ({
        ...prev,
        tax_rate: "custom",
        custom_tax_rate: String(Math.round(rate * 100)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tax_rate: String(rate),
      }));
    }
  }, [client]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const taxRate =
        formData.tax_rate === "custom"
          ? parseFloat(formData.custom_tax_rate) / 100
          : parseFloat(formData.tax_rate);

      const updates = {
        name: formData.name,
        entity_type: formData.entity_type,
        package_tier: formData.package_tier,
        income_range: formData.income_range || null,
        next_review_date: formData.next_review_date || null,
        notes: formData.notes || null,
        tax_rate: taxRate,
      };

      const { error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", client.id);

      if (error) throw error;

      onClientUpdated({ ...client, ...updates });
      toast({ title: "Client updated" });
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete in order: action_items -> client_strategies -> client_onboarding -> quarterly_reviews -> clients
      // Get all review IDs first
      const { data: reviews } = await supabase
        .from("quarterly_reviews")
        .select("id")
        .eq("client_id", client.id);

      if (reviews && reviews.length > 0) {
        const reviewIds = reviews.map((r) => r.id);
        await supabase.from("action_items").delete().in("review_id", reviewIds);
      }

      await supabase.from("client_strategies").delete().eq("client_id", client.id);
      await supabase.from("client_onboarding").delete().eq("client_id", client.id);
      await supabase.from("quarterly_reviews").delete().eq("client_id", client.id);
      
      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) throw error;

      toast({ title: "Client deleted" });
      onClientDeleted();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S-Corp">S-Corp</SelectItem>
                    <SelectItem value="C-Corp">C-Corp</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Prop">Sole Prop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Package Tier</Label>
                <Select
                  value={formData.package_tier}
                  onValueChange={(value) => setFormData({ ...formData, package_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Essentials">Essentials</SelectItem>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate</Label>
                <Select
                  value={formData.tax_rate}
                  onValueChange={(value) => {
                    setFormData({ ...formData, tax_rate: value });
                    setShowCustomRate(value === "custom");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_RATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showCustomRate && (
                <div className="space-y-2">
                  <Label>Custom Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.custom_tax_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_tax_rate: e.target.value })
                    }
                    placeholder="e.g. 33"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={formData.next_review_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_review_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Client
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client and all associated data including
              quarterly reviews, strategies, and action items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
