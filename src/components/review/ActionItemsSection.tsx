import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Pin, CheckCircle2 } from "lucide-react";

interface ActionItem {
  id: string;
  review_id: string;
  owner: "client" | "advisor";
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

interface ActionItemsSectionProps {
  reviewId: string;
}

export const ActionItemsSection = ({ reviewId }: ActionItemsSectionProps) => {
  const [clientItems, setClientItems] = useState<ActionItem[]>([]);
  const [advisorItems, setAdvisorItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionItems();
  }, [reviewId]);

  const fetchActionItems = async () => {
    try {
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const items = data as ActionItem[];
      setClientItems(items.filter((i) => i.owner === "client"));
      setAdvisorItems(items.filter((i) => i.owner === "advisor"));
    } catch (error) {
      console.error("Error fetching action items:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (owner: "client" | "advisor") => {
    try {
      const { data, error } = await supabase
        .from("action_items")
        .insert({ review_id: reviewId, owner, description: "", completed: false })
        .select()
        .single();

      if (error) throw error;

      const newItem = data as ActionItem;
      if (owner === "client") {
        setClientItems((prev) => [...prev, newItem]);
      } else {
        setAdvisorItems((prev) => [...prev, newItem]);
      }
    } catch (error) {
      console.error("Error adding action item:", error);
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const updateItem = async (id: string, updates: Partial<ActionItem>) => {
    try {
      const { error } = await supabase
        .from("action_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      const updateList = (list: ActionItem[]) =>
        list.map((item) => (item.id === id ? { ...item, ...updates } : item));

      setClientItems(updateList);
      setAdvisorItems(updateList);
    } catch (error) {
      console.error("Error updating action item:", error);
    }
  };

  const deleteItem = async (id: string, owner: "client" | "advisor") => {
    try {
      const { error } = await supabase.from("action_items").delete().eq("id", id);

      if (error) throw error;

      if (owner === "client") {
        setClientItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        setAdvisorItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (error) {
      console.error("Error deleting action item:", error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const ActionItemRow = ({ item }: { item: ActionItem }) => {
    const [description, setDescription] = useState(item.description || "");

    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
          item.completed ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200"
        )}
      >
        <Checkbox
          checked={item.completed}
          onCheckedChange={(checked) => updateItem(item.id, { completed: !!checked })}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => updateItem(item.id, { description })}
            placeholder="Describe the action item..."
            rows={2}
            className={cn(
              "resize-none bg-transparent border-0 p-0 focus-visible:ring-0 text-sm",
              item.completed && "line-through text-muted-foreground"
            )}
          />
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1",
                    !item.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {item.due_date ? format(new Date(item.due_date), "MMM d, yyyy") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={item.due_date ? new Date(item.due_date) : undefined}
                  onSelect={(date) =>
                    updateItem(item.id, {
                      due_date: date ? format(date, "yyyy-MM-dd") : null,
                    })
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteItem(item.id, item.owner)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading action items...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Client Action Items */}
      <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <Pin className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Client Action Items</h4>
        </div>
        <div className="space-y-3">
          {clientItems.map((item) => (
            <ActionItemRow key={item.id} item={item} />
          ))}
          {clientItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No action items yet
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addItem("client")}
          className="w-full mt-3 gap-1 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Advisor Action Items */}
      <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h4 className="font-semibold text-emerald-900">Eiduk Tax & Wealth Action Items</h4>
        </div>
        <div className="space-y-3">
          {advisorItems.map((item) => (
            <ActionItemRow key={item.id} item={item} />
          ))}
          {advisorItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No action items yet
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addItem("advisor")}
          className="w-full mt-3 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
};