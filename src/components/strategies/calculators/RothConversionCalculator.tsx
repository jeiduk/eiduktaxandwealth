import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, DollarSign, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface RothConversionCalculatorProps {
  clientName: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

// 2025 Tax Brackets
const TAX_BRACKETS_2025 = {
  single: [
    { rate: 0.10, min: 0, max: 11925 },
    { rate: 0.12, min: 11925, max: 48475 },
    { rate: 0.22, min: 48475, max: 103350 },
    { rate: 0.24, min: 103350, max: 197300 },
    { rate: 0.32, min: 197300, max: 250525 },
    { rate: 0.35, min: 250525, max: 626350 },
    { rate: 0.37, min: 626350, max: Infinity },
  ],
  married: [
    { rate: 0.10, min: 0, max: 23850 },
    { rate: 0.12, min: 23850, max: 96950 },
    { rate: 0.22, min: 96950, max: 206700 },
    { rate: 0.24, min: 206700, max: 394600 },
    { rate: 0.32, min: 394600, max: 501050 },
    { rate: 0.35, min: 501050, max: 751600 },
    { rate: 0.37, min: 751600, max: Infinity },
  ],
};

const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  married: 30000,
};

export function RothConversionCalculator({ 
  clientName, 
  savedData, 
  onSave, 
  onClose 
}: RothConversionCalculatorProps) {
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>(
    savedData.filingStatus as 'single' | 'married' || 'married'
  );
  const [ordinaryIncome, setOrdinaryIncome] = useState<number>(savedData.ordinaryIncome as number || 0);
  const [traditionalIRABalance, setTraditionalIRABalance] = useState<number>(
    savedData.traditionalIRABalance as number || 0
  );
  const [conversionAmount, setConversionAmount] = useState<number>(savedData.conversionAmount as number || 0);

  const brackets = TAX_BRACKETS_2025[filingStatus];
  const standardDeduction = STANDARD_DEDUCTION_2025[filingStatus];
  
  // Current taxable income
  const currentTaxableIncome = Math.max(0, ordinaryIncome - standardDeduction);
  
  // Find current bracket
  const getCurrentBracket = (income: number) => {
    return brackets.find(b => income >= b.min && income < b.max) || brackets[brackets.length - 1];
  };
  
  const currentBracket = getCurrentBracket(currentTaxableIncome);
  const roomInCurrentBracket = currentBracket.max - currentTaxableIncome;
  
  // Optimal conversion = fill current bracket
  const optimalConversion = Math.min(roomInCurrentBracket, traditionalIRABalance);
  
  // New taxable income after conversion
  const newTaxableIncome = currentTaxableIncome + conversionAmount;
  const newBracket = getCurrentBracket(newTaxableIncome);
  
  // Calculate tax on conversion
  const calculateTaxOnAmount = (amount: number, startingIncome: number) => {
    let remainingAmount = amount;
    let tax = 0;
    let currentIncome = startingIncome;
    
    for (const bracket of brackets) {
      if (currentIncome >= bracket.max) continue;
      
      const taxableInBracket = Math.min(
        remainingAmount,
        bracket.max - Math.max(currentIncome, bracket.min)
      );
      
      if (taxableInBracket <= 0) continue;
      
      tax += taxableInBracket * bracket.rate;
      remainingAmount -= taxableInBracket;
      currentIncome += taxableInBracket;
      
      if (remainingAmount <= 0) break;
    }
    
    return tax;
  };
  
  const conversionTax = calculateTaxOnAmount(conversionAmount, currentTaxableIncome);
  const effectiveRate = conversionAmount > 0 ? (conversionTax / conversionAmount) * 100 : 0;
  
  // Benefits of converting at current rate vs future (assume 32% future rate)
  const futureRate = 0.32;
  const futureTaxOnAmount = conversionAmount * futureRate;
  const taxSavingsVsFuture = futureTaxOnAmount - conversionTax;

  const handleSave = () => {
    onSave({
      filingStatus,
      ordinaryIncome,
      traditionalIRABalance,
      conversionAmount,
      currentTaxableIncome,
      currentBracketRate: currentBracket.rate,
      conversionTax,
      effectiveRate,
      optimalConversion,
    }, Math.round(Math.max(0, taxSavingsVsFuture)));
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
              Strategy #28 · Phase 6
            </p>
            <CardTitle className="font-display text-2xl">
              Roth Conversion Calculator
            </CardTitle>
            <p className="text-white/80 text-sm mt-1">{clientName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Filing Status</Label>
            <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as 'single' | 'married')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married Filing Jointly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordinaryIncome" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-eiduk-blue" />
              Ordinary Income (W-2, 1099, etc.)
            </Label>
            <Input
              id="ordinaryIncome"
              type="number"
              value={ordinaryIncome || ''}
              onChange={(e) => setOrdinaryIncome(parseFloat(e.target.value) || 0)}
              placeholder="Enter ordinary income"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iraBalance">Traditional IRA/401(k) Balance</Label>
            <Input
              id="iraBalance"
              type="number"
              value={traditionalIRABalance || ''}
              onChange={(e) => setTraditionalIRABalance(parseFloat(e.target.value) || 0)}
              placeholder="Enter balance"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionAmount" className="flex items-center gap-2">
              Roth Conversion Amount
              <span className="text-xs text-muted-foreground">(or use optimal below)</span>
            </Label>
            <Input
              id="conversionAmount"
              type="number"
              value={conversionAmount || ''}
              onChange={(e) => setConversionAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter conversion amount"
              className="text-lg border-eiduk-gold/50"
            />
          </div>
        </div>

        {/* Current Tax Situation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-lg mb-4">Current Tax Situation</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Ordinary Income</span>
                <span className="font-medium">{formatCurrency(ordinaryIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Less: Standard Deduction</span>
                <span className="font-medium">-{formatCurrency(standardDeduction)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Taxable Income</span>
                <span className="font-bold">{formatCurrency(currentTaxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Current Bracket</span>
                <span className="font-medium text-eiduk-blue">{(currentBracket.rate * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Room in Bracket</span>
                <span className="font-medium text-success">{formatCurrency(roomInCurrentBracket)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-eiduk-gold/30 bg-eiduk-gold/5">
            <h3 className="font-semibold text-lg mb-4 text-eiduk-gold">Optimal Conversion</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Optimal Amount (fill bracket)</span>
                <span className="font-bold text-lg text-eiduk-gold">{formatCurrency(optimalConversion)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConversionAmount(optimalConversion)}
                className="w-full mt-2"
              >
                Use Optimal Amount
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This fills your current {(currentBracket.rate * 100)}% bracket without jumping to {(newBracket.rate * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Analysis */}
        {conversionAmount > 0 && (
          <div className="p-6 rounded-lg border border-success/30 bg-success/5">
            <h3 className="font-semibold text-lg mb-4 text-success">Conversion Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Conversion Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(conversionAmount)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tax on Conversion</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(conversionTax)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Effective Rate</p>
                <p className="text-2xl font-bold text-eiduk-blue">{effectiveRate.toFixed(1)}%</p>
              </div>
            </div>

            {conversionAmount > roomInCurrentBracket && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-sm text-warning font-medium">
                    Conversion exceeds bracket room - you'll pay {(newBracket.rate * 100)}% on the excess
                  </p>
                </div>
              </div>
            )}

            {taxSavingsVsFuture > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <p className="text-sm text-success font-medium">
                    Potential savings vs 32% future rate: {formatCurrency(taxSavingsVsFuture)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-muted/30 text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold mb-2">Roth Conversion Strategy Tips:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Convert in low-income years to minimize tax impact</li>
                <li>• Fill up current bracket before jumping to higher rates</li>
                <li>• Consider spreading conversions over multiple years</li>
                <li>• Pay conversion tax from non-retirement funds if possible</li>
                <li>• Roth grows tax-free and has no RMDs</li>
              </ul>
            </div>
          </div>
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
