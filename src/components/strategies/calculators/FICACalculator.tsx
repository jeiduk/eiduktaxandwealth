import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Calculator, DollarSign, TrendingDown } from 'lucide-react';

interface FICACalculatorProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, estimatedSavings: number) => void;
  onClose: () => void;
}

const SOCIAL_SECURITY_RATE = 0.124;
const SOCIAL_SECURITY_WAGE_BASE_2025 = 176100;
const MEDICARE_RATE = 0.029;
const ADDITIONAL_MEDICARE_THRESHOLD = 200000;
const ADDITIONAL_MEDICARE_RATE = 0.009;

export function FICACalculator({ clientName, companyName, savedData, onSave, onClose }: FICACalculatorProps) {
  const [netProfit, setNetProfit] = useState<number>(savedData.netProfit as number || 0);
  const [reasonableComp, setReasonableComp] = useState<number>(savedData.reasonableComp as number || 0);
  const [currentSalary, setCurrentSalary] = useState<number>(savedData.currentSalary as number || 0);

  const calculateFICATax = (wages: number) => {
    const socialSecurityWages = Math.min(wages, SOCIAL_SECURITY_WAGE_BASE_2025);
    const socialSecurityTax = socialSecurityWages * SOCIAL_SECURITY_RATE;
    const medicareTax = wages * MEDICARE_RATE;
    const additionalMedicare = wages > ADDITIONAL_MEDICARE_THRESHOLD 
      ? (wages - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE 
      : 0;
    
    return {
      socialSecurity: socialSecurityTax,
      medicare: medicareTax,
      additionalMedicare,
      total: socialSecurityTax + medicareTax + additionalMedicare,
    };
  };

  const currentFICA = calculateFICATax(currentSalary || netProfit);
  const optimizedFICA = calculateFICATax(reasonableComp);
  const savings = currentFICA.total - optimizedFICA.total;

  const handleSave = () => {
    onSave({
      netProfit,
      reasonableComp,
      currentSalary,
      currentFICA: currentFICA.total,
      optimizedFICA: optimizedFICA.total,
    }, Math.max(0, savings));
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
              Strategy #3 · Phase 3
            </p>
            <CardTitle className="font-display text-2xl">
              Reasonable Compensation - FICA Calculator
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
            <Label htmlFor="netProfit" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-eiduk-blue" />
              Net Business Profit
            </Label>
            <Input
              id="netProfit"
              type="number"
              value={netProfit || ''}
              onChange={(e) => setNetProfit(parseFloat(e.target.value) || 0)}
              placeholder="Enter net profit"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Total S-Corp net profit for the year
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSalary" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Current W-2 Salary
            </Label>
            <Input
              id="currentSalary"
              type="number"
              value={currentSalary || ''}
              onChange={(e) => setCurrentSalary(parseFloat(e.target.value) || 0)}
              placeholder="Current salary (if any)"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if taking all profit as salary
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonableComp" className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-success" />
              Reasonable Compensation
            </Label>
            <Input
              id="reasonableComp"
              type="number"
              value={reasonableComp || ''}
              onChange={(e) => setReasonableComp(parseFloat(e.target.value) || 0)}
              placeholder="Optimized salary"
              className="text-lg border-success/50"
            />
            <p className="text-xs text-muted-foreground">
              IRS-compliant reasonable salary amount
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current FICA */}
          <div className="p-6 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-lg mb-4 text-muted-foreground">Current FICA Tax</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Social Security (12.4%)</span>
                <span className="font-medium">{formatCurrency(currentFICA.socialSecurity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Medicare (2.9%)</span>
                <span className="font-medium">{formatCurrency(currentFICA.medicare)}</span>
              </div>
              {currentFICA.additionalMedicare > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Additional Medicare (0.9%)</span>
                  <span className="font-medium">{formatCurrency(currentFICA.additionalMedicare)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total FICA</span>
                <span className="font-bold text-lg">{formatCurrency(currentFICA.total)}</span>
              </div>
            </div>
          </div>

          {/* Optimized FICA */}
          <div className="p-6 rounded-lg border border-success/30 bg-success/5">
            <h3 className="font-semibold text-lg mb-4 text-success">Optimized FICA Tax</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Social Security (12.4%)</span>
                <span className="font-medium">{formatCurrency(optimizedFICA.socialSecurity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Medicare (2.9%)</span>
                <span className="font-medium">{formatCurrency(optimizedFICA.medicare)}</span>
              </div>
              {optimizedFICA.additionalMedicare > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Additional Medicare (0.9%)</span>
                  <span className="font-medium">{formatCurrency(optimizedFICA.additionalMedicare)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total FICA</span>
                <span className="font-bold text-lg text-success">{formatCurrency(optimizedFICA.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Summary */}
        {savings > 0 && (
          <div className="p-6 rounded-lg bg-gradient-to-r from-eiduk-gold/10 to-eiduk-gold/5 border border-eiduk-gold/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-eiduk-gold/20 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-eiduk-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual FICA Tax Savings</p>
                  <p className="text-3xl font-bold text-eiduk-gold font-display">
                    {formatCurrency(savings)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Distributions (Tax-Free FICA)</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(netProfit - reasonableComp)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2025 Tax Reference */}
        <div className="p-4 rounded-lg bg-muted/30 text-sm">
          <p className="font-semibold mb-2">2025 FICA Tax Reference:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Social Security wage base: {formatCurrency(SOCIAL_SECURITY_WAGE_BASE_2025)}</li>
            <li>• Social Security rate: 12.4% (6.2% employee + 6.2% employer)</li>
            <li>• Medicare rate: 2.9% (1.45% employee + 1.45% employer)</li>
            <li>• Additional Medicare: 0.9% on wages over $200,000</li>
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
