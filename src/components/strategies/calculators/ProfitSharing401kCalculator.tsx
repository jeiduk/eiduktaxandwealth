import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProfitSharing401kCalculatorProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

const EMPLOYEE_DEFERRAL_2025 = 23500;
const EMPLOYEE_DEFERRAL_CATCHUP = 31000; // Age 50+
const PROFIT_SHARING_MAX = 46500;
const TOTAL_MAX_2025 = 70000;
const TOTAL_MAX_CATCHUP = 77500;
const SS_WAGE_BASE = 176100;

export function ProfitSharing401kCalculator({ 
  clientName, 
  companyName,
  savedData, 
  onSave, 
  onClose 
}: ProfitSharing401kCalculatorProps) {
  const [w2Wage, setW2Wage] = useState<number>(savedData.w2Wage as number || 0);
  const [age, setAge] = useState<number>(savedData.age as number || 50);
  const [state, setState] = useState<string>(savedData.state as string || 'IL');

  const isOverFifty = age >= 50;
  const employeeDeferral = isOverFifty ? EMPLOYEE_DEFERRAL_CATCHUP : EMPLOYEE_DEFERRAL_2025;
  const maxTotal = isOverFifty ? TOTAL_MAX_CATCHUP : TOTAL_MAX_2025;

  // Profit sharing = 25% of W-2, capped at $46,500
  const profitSharingCalc = w2Wage * 0.25;
  const profitSharing = Math.min(profitSharingCalc, PROFIT_SHARING_MAX);

  // Total contribution capped at max
  const totalContribution = Math.min(employeeDeferral + profitSharing, maxTotal);
  const actualProfitSharing = totalContribution - employeeDeferral;
  const gap = maxTotal - totalContribution;

  // Tax calculations
  const federalRate = w2Wage > 191950 ? 0.32 : w2Wage > 100525 ? 0.24 : 0.22;
  const stateRates: Record<string, number> = {
    IL: 0.0495, CA: 0.093, NY: 0.0685, TX: 0, FL: 0, OTHER: 0.05
  };
  const stateRate = stateRates[state] ?? 0.05;

  // Payroll tax on W-2
  const ssWages = Math.min(w2Wage, SS_WAGE_BASE);
  const ssTax = ssWages * 0.124;
  const medicareTax = w2Wage * 0.029;
  const additionalMedicare = w2Wage > 200000 ? (w2Wage - 200000) * 0.009 : 0;
  const totalPayrollTax = ssTax + medicareTax + additionalMedicare;

  // Tax savings from contributions
  const fedTaxSavings = totalContribution * federalRate;
  const stateTaxSavings = totalContribution * stateRate;
  const totalTaxSavings = fedTaxSavings + stateTaxSavings;

  // Wage needed to max out contributions
  const wageNeededForMax = 186000;

  const handleSave = () => {
    onSave({
      w2Wage,
      age,
      state,
      employeeDeferral,
      profitSharing: actualProfitSharing,
      totalContribution,
      federalTaxSavings: fedTaxSavings,
      stateTaxSavings,
    }, Math.round(totalTaxSavings));
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
              Strategy #11 · Phase 4
            </p>
            <CardTitle className="font-display text-2xl">
              Profit Sharing 401(k) Calculator
            </CardTitle>
            <p className="text-white/80 text-sm mt-1">
              {clientName} {companyName && `· ${companyName}`}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="w2Wage" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-eiduk-blue" />
              W-2 Compensation
            </Label>
            <Input
              id="w2Wage"
              type="number"
              value={w2Wage || ''}
              onChange={(e) => setW2Wage(parseFloat(e.target.value) || 0)}
              placeholder="Enter W-2 salary"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Your Age</Label>
            <Input
              id="age"
              type="number"
              value={age || ''}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              min={21}
              max={75}
              className="text-lg"
            />
            {isOverFifty && (
              <p className="text-xs text-success">✓ Catch-up contributions eligible</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IL">Illinois (4.95%)</SelectItem>
                <SelectItem value="CA">California (9.3%)</SelectItem>
                <SelectItem value="NY">New York (6.85%)</SelectItem>
                <SelectItem value="TX">Texas (0%)</SelectItem>
                <SelectItem value="FL">Florida (0%)</SelectItem>
                <SelectItem value="OTHER">Other (5%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-lg mb-4">Contribution Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Employee Deferral {isOverFifty && '(50+ catch-up)'}</span>
                <span className="font-medium">{formatCurrency(employeeDeferral)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Employer Profit Sharing (25%)</span>
                <span className="font-medium">{formatCurrency(actualProfitSharing)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total Contribution</span>
                <span className="font-bold text-lg text-eiduk-blue">{formatCurrency(totalContribution)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>2025 Maximum Available</span>
                <span>{formatCurrency(maxTotal)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-success/30 bg-success/5">
            <h3 className="font-semibold text-lg mb-4 text-success">Tax Savings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Federal Tax Savings ({Math.round(federalRate * 100)}%)</span>
                <span className="font-medium">{formatCurrency(fedTaxSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">State Tax Savings ({(stateRate * 100).toFixed(1)}%)</span>
                <span className="font-medium">{formatCurrency(stateTaxSavings)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total Tax Savings</span>
                <span className="font-bold text-lg text-success">{formatCurrency(totalTaxSavings)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Alert */}
        {gap > 0 && w2Wage < wageNeededForMax && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Optimization Opportunity</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You have {formatCurrency(gap)} of unused contribution capacity. 
                  Increasing W-2 to {formatCurrency(wageNeededForMax)} would allow you to maximize 
                  your profit sharing contributions to the full {formatCurrency(PROFIT_SHARING_MAX)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {gap === 0 && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="font-semibold text-success">Maximized!</p>
                <p className="text-sm text-muted-foreground">
                  You are utilizing the full 2025 contribution limit of {formatCurrency(maxTotal)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2025 Limits Reference */}
        <div className="p-4 rounded-lg bg-muted/30 text-sm">
          <p className="font-semibold mb-2">2025 Contribution Limits:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Employee Deferral: $23,500 (under 50) / $31,000 (50+)</li>
            <li>• Employer Profit Sharing: 25% of W-2, max $46,500</li>
            <li>• Total Combined Limit: $70,000 (under 50) / $77,500 (50+)</li>
            <li>• Need ~$186,000 W-2 to maximize profit sharing</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button variant="navy" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Calculation
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
