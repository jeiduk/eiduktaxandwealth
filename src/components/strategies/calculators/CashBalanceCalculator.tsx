import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, DollarSign, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface CashBalanceCalculatorProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

// Cash balance contribution limits by age (approximate maximums)
const getCashBalanceMax = (age: number): number => {
  if (age >= 60) return 350000;
  if (age >= 55) return 280000;
  if (age >= 50) return 220000;
  if (age >= 45) return 170000;
  if (age >= 40) return 130000;
  return 100000;
};

const ADMIN_COST_ESTIMATE = 5000; // Annual TPA + actuary fees

export function CashBalanceCalculator({ 
  clientName, 
  companyName,
  savedData, 
  onSave, 
  onClose 
}: CashBalanceCalculatorProps) {
  const [w2Compensation, setW2Compensation] = useState<number>(savedData.w2Compensation as number || 0);
  const [age, setAge] = useState<number>(savedData.age as number || 52);
  const [retirementAge, setRetirementAge] = useState<number>(savedData.retirementAge as number || 65);
  const [currentRetirementSavings, setCurrentRetirementSavings] = useState<number>(
    savedData.currentRetirementSavings as number || 0
  );

  const yearsToRetirement = Math.max(1, retirementAge - age);
  const cashBalanceMax = getCashBalanceMax(age);
  
  // 401(k) contribution (assume maxed)
  const is50Plus = age >= 50;
  const contribution401k = is50Plus ? 77500 : 70000;
  
  // Total possible retirement contributions
  const totalContribution = contribution401k + cashBalanceMax;
  
  // Tax savings (assume 37% federal + 5% state = 42% effective rate at high income)
  const effectiveTaxRate = 0.42;
  const totalTaxSavings = totalContribution * effectiveTaxRate;
  const netTaxSavings = totalTaxSavings - ADMIN_COST_ESTIMATE;
  
  // Projected accumulation
  const annualGrowthRate = 0.05; // 5% interest credit
  const projectedBalance = Array.from({ length: yearsToRetirement }).reduce<number>(
    (balance) => (balance + cashBalanceMax) * (1 + annualGrowthRate),
    currentRetirementSavings
  );

  // Suitability check
  const isIdealCandidate = age >= 45 && w2Compensation >= 250000;
  const isPoorFit = age < 40 || w2Compensation < 150000;

  const handleSave = () => {
    onSave({
      w2Compensation,
      age,
      retirementAge,
      currentRetirementSavings,
      contribution401k,
      cashBalanceContribution: cashBalanceMax,
      totalContribution,
      totalTaxSavings,
      projectedBalance,
    }, Math.round(netTaxSavings));
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
              Strategy #12 · Phase 4
            </p>
            <CardTitle className="font-display text-2xl">
              Cash Balance Plan Calculator
            </CardTitle>
            <p className="text-white/80 text-sm mt-1">
              {clientName} {companyName && `· ${companyName}`}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="w2Compensation" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-eiduk-blue" />
              W-2 Compensation
            </Label>
            <Input
              id="w2Compensation"
              type="number"
              value={w2Compensation || ''}
              onChange={(e) => setW2Compensation(parseFloat(e.target.value) || 0)}
              placeholder="Enter W-2 compensation"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Current Age</Label>
            <Input
              id="age"
              type="number"
              value={age || ''}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              min={30}
              max={70}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retirementAge">Target Retirement Age</Label>
            <Input
              id="retirementAge"
              type="number"
              value={retirementAge || ''}
              onChange={(e) => setRetirementAge(parseInt(e.target.value) || 0)}
              min={55}
              max={75}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSavings">Current Retirement Savings</Label>
            <Input
              id="currentSavings"
              type="number"
              value={currentRetirementSavings || ''}
              onChange={(e) => setCurrentRetirementSavings(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="text-lg"
            />
          </div>
        </div>

        {/* Contribution Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-lg mb-4">Annual Contributions</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">401(k) Maximum</span>
                <span className="font-medium">{formatCurrency(contribution401k)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cash Balance Plan (Age {age})</span>
                <span className="font-medium text-eiduk-blue">{formatCurrency(cashBalanceMax)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total Annual Contribution</span>
                <span className="font-bold text-lg">{formatCurrency(totalContribution)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-success/30 bg-success/5">
            <h3 className="font-semibold text-lg mb-4 text-success">Tax Savings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Gross Tax Savings (42% rate)</span>
                <span className="font-medium">{formatCurrency(totalTaxSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Less: Admin Costs</span>
                <span className="font-medium text-destructive">-{formatCurrency(ADMIN_COST_ESTIMATE)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Net Annual Tax Savings</span>
                <span className="font-bold text-lg text-success">{formatCurrency(netTaxSavings)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projection */}
        <div className="p-6 rounded-lg bg-gradient-to-r from-eiduk-gold/10 to-eiduk-gold/5 border border-eiduk-gold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-eiduk-gold/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-eiduk-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Projected Balance at Age {retirementAge} ({yearsToRetirement} years)
                </p>
                <p className="text-3xl font-bold text-eiduk-gold font-display">
                  {formatCurrency(projectedBalance)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Tax Savings</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(netTaxSavings * yearsToRetirement)}
              </p>
            </div>
          </div>
        </div>

        {/* Suitability Check */}
        {isIdealCandidate ? (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-success">Ideal Candidate</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Age 45+ with high income makes you an excellent candidate for a cash balance plan. 
                  You can maximize contributions and receive significant tax benefits.
                </p>
              </div>
            </div>
          </div>
        ) : isPoorFit ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">May Not Be Suitable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cash balance plans work best for ages 45+ with income over $250,000. 
                  Consider maximizing 401(k) first and revisiting when circumstances change.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Evaluate Carefully</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cash balance plans require 3-5 year funding commitments and consistent income. 
                  Ensure stable cash flow before proceeding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Considerations */}
        <div className="p-4 rounded-lg bg-muted/30 text-sm">
          <p className="font-semibold mb-2">Cash Balance Plan Requirements:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Annual actuarial certification required (~$3,500-$7,000/year)</li>
            <li>• Minimum 3-year funding commitment</li>
            <li>• PBGC insurance premiums (~$100/year)</li>
            <li>• Works best for solo owners or minimal employees</li>
            <li>• Older = higher contribution limits (less time to accumulate)</li>
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
