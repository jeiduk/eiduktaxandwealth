import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Car, Plus, Trash2 } from 'lucide-react';

interface MileageEntry {
  id: string;
  date: string;
  destination: string;
  purpose: string;
  miles: number;
}

interface MileageLogProps {
  clientName: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

const IRS_MILEAGE_RATE_2025 = 0.70; // 70 cents per mile for 2025

export function MileageLog({ clientName, savedData, onSave, onClose }: MileageLogProps) {
  const [entries, setEntries] = useState<MileageEntry[]>(
    (savedData.entries as MileageEntry[]) || []
  );
  const [newEntry, setNewEntry] = useState<Omit<MileageEntry, 'id'>>({
    date: '',
    destination: '',
    purpose: '',
    miles: 0,
  });

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0);
  const deduction = totalMiles * IRS_MILEAGE_RATE_2025;
  const estimatedTaxSavings = deduction * 0.35; // 35% effective rate

  const addEntry = () => {
    if (!newEntry.date || !newEntry.destination || !newEntry.miles) return;
    
    setEntries([
      ...entries,
      {
        ...newEntry,
        id: crypto.randomUUID(),
      },
    ]);
    setNewEntry({
      date: '',
      destination: '',
      purpose: '',
      miles: 0,
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleSave = () => {
    onSave({
      entries,
      totalMiles,
      deduction,
    }, Math.round(estimatedTaxSavings));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-2 border-eiduk-gold/30">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-eiduk-gold font-semibold tracking-wider uppercase">
              Strategy #9 · Phase 3
            </p>
            <CardTitle className="font-display text-2xl">
              Vehicle Mileage Log
            </CardTitle>
            <p className="text-white/80 text-sm mt-1">{clientName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-eiduk-blue" />
            <p className="text-sm text-muted-foreground">Total Miles</p>
            <p className="text-2xl font-bold">{totalMiles.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg border border-success/30 bg-success/5 text-center">
            <p className="text-sm text-muted-foreground">Mileage Deduction</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(deduction)}</p>
            <p className="text-xs text-muted-foreground mt-1">@ ${IRS_MILEAGE_RATE_2025}/mile</p>
          </div>
          <div className="p-4 rounded-lg border border-eiduk-gold/30 bg-eiduk-gold/5 text-center">
            <p className="text-sm text-muted-foreground">Est. Tax Savings</p>
            <p className="text-2xl font-bold text-eiduk-gold">{formatCurrency(estimatedTaxSavings)}</p>
          </div>
        </div>

        {/* Add New Entry */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <Label className="text-base font-semibold mb-4 block">Add Trip</Label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="destination" className="text-xs">Destination</Label>
              <Input
                id="destination"
                value={newEntry.destination}
                onChange={(e) => setNewEntry({ ...newEntry, destination: e.target.value })}
                placeholder="e.g., Client Office"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="purpose" className="text-xs">Purpose</Label>
              <Input
                id="purpose"
                value={newEntry.purpose}
                onChange={(e) => setNewEntry({ ...newEntry, purpose: e.target.value })}
                placeholder="e.g., Client Meeting"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="miles" className="text-xs">Miles</Label>
              <Input
                id="miles"
                type="number"
                value={newEntry.miles || ''}
                onChange={(e) => setNewEntry({ ...newEntry, miles: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addEntry} className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        {entries.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Destination</th>
                  <th className="text-left p-3 text-sm font-medium">Purpose</th>
                  <th className="text-right p-3 text-sm font-medium">Miles</th>
                  <th className="text-right p-3 text-sm font-medium">Deduction</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-sm">{entry.date}</td>
                    <td className="p-3 text-sm">{entry.destination}</td>
                    <td className="p-3 text-sm text-muted-foreground">{entry.purpose}</td>
                    <td className="p-3 text-sm text-right font-medium">{entry.miles}</td>
                    <td className="p-3 text-sm text-right text-success">
                      {formatCurrency(entry.miles * IRS_MILEAGE_RATE_2025)}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(entry.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No mileage entries yet. Add your first business trip above.</p>
          </div>
        )}

        {/* IRS Reference */}
        <div className="p-4 rounded-lg bg-muted/30 text-sm">
          <p className="font-semibold mb-2">2025 IRS Mileage Rates:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Business: $0.70 per mile</li>
            <li>• Medical/Moving: $0.22 per mile</li>
            <li>• Charitable: $0.14 per mile</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button variant="navy" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Mileage Log
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
