import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";

interface Client {
  id: string;
  name: string;
  package_tier: string;
}

interface ClientSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (clientId: string) => void;
  isLoading?: boolean;
}

export function ClientSelectDialog({
  open,
  onOpenChange,
  onSelect,
  isLoading,
}: ClientSelectDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, package_tier")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case "Premium":
        return "bg-eiduk-gold/20 text-eiduk-gold border-eiduk-gold/30";
      case "Complete":
        return "bg-eiduk-blue/20 text-eiduk-blue border-eiduk-blue/30";
      case "Foundation":
        return "bg-success/20 text-success border-success/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Client</DialogTitle>
          <DialogDescription>
            Choose which client this quarterly review is for
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No clients found</p>
            <p className="text-sm mt-1">Add a client first to start a review</p>
          </div>
        ) : (
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => onSelect(client.id)}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{client.name}</span>
                      <Badge
                        variant="outline"
                        className={getTierBadgeClass(client.package_tier)}
                      >
                        {client.package_tier}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}
