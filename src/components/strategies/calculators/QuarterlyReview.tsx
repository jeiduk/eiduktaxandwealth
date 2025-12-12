import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface QuarterlyReviewProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface StrategyReview {
  implemented: boolean;
  savings: string;
  notes: string;
}

interface ReviewData {
  clientName: string;
  companyName: string;
  quarter: string;
  meetingDate: string;
  attendees: string;
  ytdRevenue: string;
  ytdExpenses: string;
  ytdNetIncome: string;
  projectedAnnualIncome: string;
  currentCompensation: string;
  recommendedCompensation: string;
  strategies: {
    // Phase 1: Foundation
    sCorpElection: StrategyReview;
    reasonableCompensation: StrategyReview;
    accountablePlan: StrategyReview;
    // Phase 2: Core
    healthInsurance: StrategyReview;
    mileageReimbursement: StrategyReview;
    homeOffice: StrategyReview;
    // Phase 3: Retirement
    solo401k: StrategyReview;
    sepIra: StrategyReview;
    cashBalancePlan: StrategyReview;
    // Phase 4: Credits
    familyEmployment: StrategyReview;
    boardAdvisors: StrategyReview;
    augustaRule: StrategyReview;
    // Phase 5: Real Estate
    costSegregation: StrategyReview;
    realEstateProfessional: StrategyReview;
  };
  actionItems: string;
  nextQuarterPriorities: string;
  estimatedTotalSavings: string;
}

const STRATEGY_PHASES = [
  {
    name: 'Phase 1: Foundation',
    color: 'bg-blue-600',
    strategies: [
      { key: 'sCorpElection', name: 'S-Corp Election', description: 'Federal & state S-Corp tax election' },
      { key: 'reasonableCompensation', name: 'Reasonable Compensation', description: 'W-2 salary optimization' },
      { key: 'accountablePlan', name: 'Accountable Plan', description: 'Tax-free expense reimbursements' },
    ],
  },
  {
    name: 'Phase 2: Core Strategies',
    color: 'bg-green-600',
    strategies: [
      { key: 'healthInsurance', name: 'Health Insurance Premium', description: 'S-Corp health insurance deduction' },
      { key: 'mileageReimbursement', name: 'Mileage Reimbursement', description: 'Business mileage tracking' },
      { key: 'homeOffice', name: 'Home Office Deduction', description: 'Simplified or actual method' },
    ],
  },
  {
    name: 'Phase 3: Retirement',
    color: 'bg-purple-600',
    strategies: [
      { key: 'solo401k', name: 'Solo 401(k)', description: 'Employee + employer contributions' },
      { key: 'sepIra', name: 'SEP IRA', description: 'Up to 25% employer contribution' },
      { key: 'cashBalancePlan', name: 'Cash Balance Plan', description: 'Defined benefit pension plan' },
    ],
  },
  {
    name: 'Phase 4: Credits & Advanced',
    color: 'bg-orange-600',
    strategies: [
      { key: 'familyEmployment', name: 'Family Employment', description: 'Hiring children/spouse' },
      { key: 'boardAdvisors', name: 'Board of Advisors', description: 'Deductible advisory fees' },
      { key: 'augustaRule', name: 'Augusta Rule', description: 'IRC §280A rental strategy' },
    ],
  },
  {
    name: 'Phase 5: Real Estate',
    color: 'bg-cyan-600',
    strategies: [
      { key: 'costSegregation', name: 'Cost Segregation', description: 'Accelerated depreciation' },
      { key: 'realEstateProfessional', name: 'Real Estate Professional', description: 'REPS status qualification' },
    ],
  },
];

const defaultStrategies = (): ReviewData['strategies'] => ({
  sCorpElection: { implemented: false, savings: '', notes: '' },
  reasonableCompensation: { implemented: false, savings: '', notes: '' },
  accountablePlan: { implemented: false, savings: '', notes: '' },
  healthInsurance: { implemented: false, savings: '', notes: '' },
  mileageReimbursement: { implemented: false, savings: '', notes: '' },
  homeOffice: { implemented: false, savings: '', notes: '' },
  solo401k: { implemented: false, savings: '', notes: '' },
  sepIra: { implemented: false, savings: '', notes: '' },
  cashBalancePlan: { implemented: false, savings: '', notes: '' },
  familyEmployment: { implemented: false, savings: '', notes: '' },
  boardAdvisors: { implemented: false, savings: '', notes: '' },
  augustaRule: { implemented: false, savings: '', notes: '' },
  costSegregation: { implemented: false, savings: '', notes: '' },
  realEstateProfessional: { implemented: false, savings: '', notes: '' },
});

export function QuarterlyReview({ clientName, companyName, savedData, onSave, onClose }: QuarterlyReviewProps) {
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
  
  const [data, setData] = useState<ReviewData>({
    clientName: (savedData.clientName as string) || clientName || '',
    companyName: (savedData.companyName as string) || companyName || '',
    quarter: (savedData.quarter as string) || currentQuarter,
    meetingDate: (savedData.meetingDate as string) || '',
    attendees: (savedData.attendees as string) || '',
    ytdRevenue: (savedData.ytdRevenue as string) || '',
    ytdExpenses: (savedData.ytdExpenses as string) || '',
    ytdNetIncome: (savedData.ytdNetIncome as string) || '',
    projectedAnnualIncome: (savedData.projectedAnnualIncome as string) || '',
    currentCompensation: (savedData.currentCompensation as string) || '',
    recommendedCompensation: (savedData.recommendedCompensation as string) || '',
    strategies: (savedData.strategies as ReviewData['strategies']) || defaultStrategies(),
    actionItems: (savedData.actionItems as string) || '',
    nextQuarterPriorities: (savedData.nextQuarterPriorities as string) || '',
    estimatedTotalSavings: (savedData.estimatedTotalSavings as string) || '',
  });

  const calculateTotalSavings = () => {
    let total = 0;
    Object.values(data.strategies).forEach(strategy => {
      if (strategy.implemented && strategy.savings) {
        total += parseFloat(strategy.savings.replace(/[^0-9.]/g, '')) || 0;
      }
    });
    return total;
  };

  const countImplemented = () => {
    return Object.values(data.strategies).filter(s => s.implemented).length;
  };

  const handleSave = () => {
    const totalSavings = calculateTotalSavings();
    onSave(data as unknown as Record<string, unknown>, totalSavings);
  };

  const updateStrategy = (key: string, field: keyof StrategyReview, value: string | boolean) => {
    setData(prev => ({
      ...prev,
      strategies: {
        ...prev.strategies,
        [key]: {
          ...prev.strategies[key as keyof typeof prev.strategies],
          [field]: value,
        },
      },
    }));
  };

  return (
    <Card className="border-2 border-eiduk-gold/30">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
        <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK PATHWAY™</div>
        <CardTitle className="font-display text-2xl">S-Corp Quarterly Review Workpaper</CardTitle>
        <p className="text-white/80">Comprehensive Strategy Review & Implementation Tracking</p>
        <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Meeting Info */}
        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
          <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Meeting Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Client Name</Label>
              <Input
                value={data.clientName}
                onChange={(e) => setData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input
                value={data.companyName}
                onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Quarter</Label>
              <Input
                value={data.quarter}
                onChange={(e) => setData(prev => ({ ...prev, quarter: e.target.value }))}
                placeholder="e.g., Q1 2025"
              />
            </div>
            <div>
              <Label>Meeting Date</Label>
              <Input
                type="date"
                value={data.meetingDate}
                onChange={(e) => setData(prev => ({ ...prev, meetingDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 p-6 rounded-lg text-center">
          <h3 className="font-display text-xl font-semibold text-eiduk-navy mb-4">Strategy Implementation Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Strategies Implemented</div>
              <div className="text-3xl font-bold text-eiduk-navy mt-2">
                {countImplemented()} / {Object.keys(data.strategies).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Implementation Rate</div>
              <div className="text-3xl font-bold text-eiduk-blue mt-2">
                {Math.round((countImplemented() / Object.keys(data.strategies).length) * 100)}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Est. Annual Savings</div>
              <div className="text-3xl font-bold text-success mt-2">
                ${calculateTotalSavings().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Financial Snapshot
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>YTD Revenue</Label>
              <Input
                value={data.ytdRevenue}
                onChange={(e) => setData(prev => ({ ...prev, ytdRevenue: e.target.value }))}
                placeholder="$0"
              />
            </div>
            <div>
              <Label>YTD Expenses</Label>
              <Input
                value={data.ytdExpenses}
                onChange={(e) => setData(prev => ({ ...prev, ytdExpenses: e.target.value }))}
                placeholder="$0"
              />
            </div>
            <div>
              <Label>YTD Net Income</Label>
              <Input
                value={data.ytdNetIncome}
                onChange={(e) => setData(prev => ({ ...prev, ytdNetIncome: e.target.value }))}
                placeholder="$0"
              />
            </div>
            <div>
              <Label>Projected Annual Income</Label>
              <Input
                value={data.projectedAnnualIncome}
                onChange={(e) => setData(prev => ({ ...prev, projectedAnnualIncome: e.target.value }))}
                placeholder="$0"
              />
            </div>
            <div>
              <Label>Current W-2 Compensation</Label>
              <Input
                value={data.currentCompensation}
                onChange={(e) => setData(prev => ({ ...prev, currentCompensation: e.target.value }))}
                placeholder="$0"
              />
            </div>
            <div>
              <Label>Recommended Compensation</Label>
              <Input
                value={data.recommendedCompensation}
                onChange={(e) => setData(prev => ({ ...prev, recommendedCompensation: e.target.value }))}
                placeholder="$0"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Strategy Review by Phase */}
        {STRATEGY_PHASES.map((phase, phaseIndex) => (
          <div key={phaseIndex}>
            <div className={`${phase.color} text-white p-3 rounded-lg mb-4`}>
              <h3 className="font-display font-semibold">{phase.name}</h3>
            </div>
            <div className="space-y-3">
              {phase.strategies.map(strategy => {
                const strategyData = data.strategies[strategy.key as keyof typeof data.strategies];
                return (
                  <div 
                    key={strategy.key}
                    className={`p-4 rounded-lg border ${
                      strategyData?.implemented 
                        ? 'bg-success/5 border-success' 
                        : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={strategyData?.implemented}
                        onCheckedChange={(checked) => updateStrategy(strategy.key, 'implemented', !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-eiduk-navy">{strategy.name}</span>
                          {strategyData?.implemented && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Implemented
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        
                        {strategyData?.implemented && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <Label className="text-xs">Est. Annual Savings</Label>
                              <Input
                                placeholder="$0"
                                value={strategyData.savings}
                                onChange={(e) => updateStrategy(strategy.key, 'savings', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Input
                                placeholder="Implementation notes..."
                                value={strategyData.notes}
                                onChange={(e) => updateStrategy(strategy.key, 'notes', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {phaseIndex < STRATEGY_PHASES.length - 1 && <Separator className="my-6" />}
          </div>
        ))}

        <Separator />

        {/* Action Items */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Action Items & Next Steps
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Action Items from This Meeting</Label>
              <Textarea
                value={data.actionItems}
                onChange={(e) => setData(prev => ({ ...prev, actionItems: e.target.value }))}
                placeholder="List specific action items, responsible parties, and deadlines..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Next Quarter Priorities</Label>
              <Textarea
                value={data.nextQuarterPriorities}
                onChange={(e) => setData(prev => ({ ...prev, nextQuarterPriorities: e.target.value }))}
                placeholder="Strategies to implement or review next quarter..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
            <FileText className="h-4 w-4 mr-2" />
            Save Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
