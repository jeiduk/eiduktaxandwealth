import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save, Home, Calculator, DollarSign } from 'lucide-react';

interface HomeOfficeCalculatorProps {
  clientName: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

const SIMPLIFIED_RATE = 5; // $5 per sq ft
const SIMPLIFIED_MAX_SQFT = 300;

export function HomeOfficeCalculator({ clientName, savedData, onSave, onClose }: HomeOfficeCalculatorProps) {
  const [method, setMethod] = useState<'simplified' | 'actual'>(savedData.method as 'simplified' | 'actual' || 'simplified');
  const [officeSquareFeet, setOfficeSquareFeet] = useState<number>(savedData.officeSquareFeet as number || 0);
  const [homeSquareFeet, setHomeSquareFeet] = useState<number>(savedData.homeSquareFeet as number || 0);
  
  // Actual method expenses
  const [mortgage, setMortgage] = useState<number>(savedData.mortgage as number || 0);
  const [utilities, setUtilities] = useState<number>(savedData.utilities as number || 0);
  const [insurance, setInsurance] = useState<number>(savedData.insurance as number || 0);
  const [repairs, setRepairs] = useState<number>(savedData.repairs as number || 0);
  const [propertyTax, setPropertyTax] = useState<number>(savedData.propertyTax as number || 0);
  const [depreciation, setDepreciation] = useState<number>(savedData.depreciation as number || 0);

  const businessUsePercentage = homeSquareFeet > 0 ? (officeSquareFeet / homeSquareFeet) * 100 : 0;
  
  const calculateSimplified = () => {
    const eligibleSqFt = Math.min(officeSquareFeet, SIMPLIFIED_MAX_SQFT);
    return eligibleSqFt * SIMPLIFIED_RATE;
  };

  const calculateActual = () => {
    const totalExpenses = mortgage + utilities + insurance + repairs + propertyTax + depreciation;
    return totalExpenses * (businessUsePercentage / 100);
  };

  const deduction = method === 'simplified' ? calculateSimplified() : calculateActual();
  const estimatedTaxSavings = deduction * 0.35; // Assume 35% effective tax rate

  const handleSave = () => {
    onSave({
      method,
      officeSquareFeet,
      homeSquareFeet,
      businessUsePercentage,
      mortgage,
      utilities,
      insurance,
      repairs,
      propertyTax,
      depreciation,
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
              Strategy #7 · Phase 3
            </p>
            <CardTitle className="font-display text-2xl">
              Home Office Deduction Worksheet
            </CardTitle>
            <p className="text-white/80 text-sm mt-1">{clientName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Method Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Calculation Method</Label>
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as 'simplified' | 'actual')}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${method === 'simplified' ? 'border-eiduk-gold bg-eiduk-gold/5' : 'border-border hover:border-eiduk-gold/50'}`}>
              <RadioGroupItem value="simplified" id="simplified" />
              <div>
                <Label htmlFor="simplified" className="text-base font-medium cursor-pointer">
                  Simplified Method
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  $5 per sq ft, max 300 sq ft ($1,500 max)
                </p>
              </div>
            </div>
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${method === 'actual' ? 'border-eiduk-gold bg-eiduk-gold/5' : 'border-border hover:border-eiduk-gold/50'}`}>
              <RadioGroupItem value="actual" id="actual" />
              <div>
                <Label htmlFor="actual" className="text-base font-medium cursor-pointer">
                  Actual Expense Method
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Percentage of actual home expenses
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Square Footage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="officeSquareFeet" className="flex items-center gap-2">
              <Home className="h-4 w-4 text-eiduk-blue" />
              Office Square Feet
            </Label>
            <Input
              id="officeSquareFeet"
              type="number"
              value={officeSquareFeet || ''}
              onChange={(e) => setOfficeSquareFeet(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 150"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeSquareFeet">Total Home Square Feet</Label>
            <Input
              id="homeSquareFeet"
              type="number"
              value={homeSquareFeet || ''}
              onChange={(e) => setHomeSquareFeet(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 2000"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Business Use Percentage</Label>
            <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50">
              <span className="text-lg font-semibold">{businessUsePercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Actual Method Expenses */}
        {method === 'actual' && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Annual Home Expenses</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mortgage">Mortgage Interest</Label>
                <Input
                  id="mortgage"
                  type="number"
                  value={mortgage || ''}
                  onChange={(e) => setMortgage(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utilities">Utilities</Label>
                <Input
                  id="utilities"
                  type="number"
                  value={utilities || ''}
                  onChange={(e) => setUtilities(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance</Label>
                <Input
                  id="insurance"
                  type="number"
                  value={insurance || ''}
                  onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairs">Repairs & Maintenance</Label>
                <Input
                  id="repairs"
                  type="number"
                  value={repairs || ''}
                  onChange={(e) => setRepairs(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyTax">Property Taxes</Label>
                <Input
                  id="propertyTax"
                  type="number"
                  value={propertyTax || ''}
                  onChange={(e) => setPropertyTax(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciation">Depreciation</Label>
                <Input
                  id="depreciation"
                  type="number"
                  value={depreciation || ''}
                  onChange={(e) => setDepreciation(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="p-6 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Home Office Deduction</p>
              <p className="text-3xl font-bold text-success font-display">
                {formatCurrency(deduction)}
              </p>
              {method === 'simplified' && officeSquareFeet > SIMPLIFIED_MAX_SQFT && (
                <p className="text-xs text-warning mt-1">
                  Limited to 300 sq ft under simplified method
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Tax Savings</p>
              <p className="text-3xl font-bold text-eiduk-gold font-display">
                {formatCurrency(estimatedTaxSavings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on 35% effective tax rate
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button variant="navy" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Worksheet
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
