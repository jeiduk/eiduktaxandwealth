import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronRight, Upload, Loader2, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuarterlyReviewProps {
  clientName: string;
  companyName?: string;
  clientId?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface StrategyData {
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  doc1: boolean;
  doc2: boolean;
  doc3: boolean;
  savings: string;
  notes: string;
}

interface PhaseStatus {
  status: 'not-started' | 'in-progress' | 'complete' | 'maintaining';
}

interface ReviewData {
  // Meeting Info
  clientName: string;
  entityName: string;
  ein: string;
  quarter: string;
  meetingDate: string;
  reviewDate: string;
  
  // Phase Status
  phaseStatus: {
    p1: PhaseStatus;
    p2: PhaseStatus;
    p3: PhaseStatus;
    p4: PhaseStatus;
    p5: PhaseStatus;
    p6: PhaseStatus;
    p7: PhaseStatus;
    p8: PhaseStatus;
  };
  
  // Client Snapshot
  primaryContact: string;
  filingStatus: string;
  dependents: string;
  primaryBusiness: string;
  
  // Financial Snapshot
  ytdRevenue: string;
  ytdExpenses: string;
  ytdNetIncome: string;
  projectedAnnual: string;
  plFilePath: string;
  plFileName: string;
  
  // Reasonable Compensation
  currentW2: string;
  recommendedW2: string;
  ficaSavings: string;
  distributionsYtd: string;
  
  // Estimated Taxes
  estTaxes: {
    fedQ1Req: string; fedQ1Paid: string; fedQ1Date: string;
    fedQ2Req: string; fedQ2Paid: string; fedQ2Date: string;
    fedQ3Req: string; fedQ3Paid: string; fedQ3Date: string;
    fedQ4Req: string; fedQ4Paid: string; fedQ4Date: string;
    stateQ1Req: string; stateQ1Paid: string; stateQ1Date: string;
    stateQ2Req: string; stateQ2Paid: string; stateQ2Date: string;
    stateQ3Req: string; stateQ3Paid: string; stateQ3Date: string;
    stateQ4Req: string; stateQ4Paid: string; stateQ4Date: string;
  };
  
  // All Strategies by Phase
  strategies: Record<string, StrategyData>;
  
  // Action Items
  actionItems: string;
  nextQuarterPriorities: string;
}

// Define all strategies organized by 8 phases (The Eiduk System™)
const PHASES = [
  {
    id: 'p1',
    name: 'Phase 1: Foundational',
    color: 'bg-blue-600',
    targetSavings: '$26k-$52k',
    strategies: [
      { key: 's1', name: '#1: S-Corp Election', irc: 'IRC §1361', docs: ['Form 2553 filed', 'State election filed', 'Shareholder consent'] },
      { key: 's2', name: '#2: Reasonable Compensation', irc: 'IRC §3121', docs: ['Salary comparison study', 'Job description documented', 'Payroll records current'] },
      { key: 's3', name: '#3: S-Corp Health Insurance', irc: 'IRC §162(l)', docs: ['Premiums paid by S-Corp', 'W-2 Box 1 includes premium', '>2% owner verification'] },
      { key: 's4', name: '#4: Accountable Plan', irc: 'IRC §62(c)', docs: ['Written plan on file', 'Business connection proven', '60-day substantiation'] },
      { key: 's5', name: '#5: Augusta Rule (14-Day Rental)', irc: 'IRC §280A(g)', docs: ['Board resolution on file', 'Fair rental rate documented', 'Meeting minutes/purpose'] },
      { key: 's6', name: '#6: Asset Reimbursement', irc: 'IRC §162', docs: ['Asset use agreement', 'FMV rental rate documented', 'Business use percentage'] },
    ],
  },
  {
    id: 'p2',
    name: 'Phase 2: Core',
    color: 'bg-green-600',
    targetSavings: '$12k-$30k',
    strategies: [
      { key: 's7', name: '#7: Home Office Deduction', irc: 'IRC §280A', docs: ['Square footage calculation', 'Exclusive use documented', 'Direct/indirect expenses'] },
      { key: 's8', name: '#8: Business Mileage', irc: 'IRC §162, §274', docs: ['Mileage log maintained', '2025 rate: $0.70/mile', 'Business purpose documented'] },
      { key: 's9', name: '#9: Business Meals', irc: 'IRC §274(n)', docs: ['50% deduction applied', 'Business purpose noted', 'Receipt retention system'] },
      { key: 's10', name: '#10: Technology & Software', irc: 'IRC §179', docs: ['Business use documented', 'Subscription tracking', 'Asset list maintained'] },
      { key: 's11', name: '#11: Professional Development', irc: 'IRC §162', docs: ['Business connection clear', 'Receipt documentation', 'Maintains/improves skills'] },
      { key: 's12', name: '#12: Family Employment', irc: 'IRC §162, §3121', docs: ['Reasonable wages paid', 'Time records maintained', 'W-2/W-4 on file'] },
    ],
  },
  {
    id: 'p3',
    name: 'Phase 3: Retirement & Benefits',
    color: 'bg-purple-600',
    targetSavings: '$35k-$100k+',
    strategies: [
      { key: 's13', name: '#13: Solo 401(k) / SEP IRA', irc: 'IRC §401(k), §408', docs: ['Plan document on file', '2025 limit: $23,500 + $7,500', 'Contribution deadline noted'] },
      { key: 's14', name: '#14: Profit Sharing', irc: 'IRC §401(a)', docs: ['Profit sharing formula set', 'Contribution calculation', 'Discrimination testing'] },
      { key: 's15', name: '#15: Cash Balance Plan', irc: 'IRC §401(a)', docs: ['Actuarial study completed', 'Annual funding requirement', '2025 limit: up to $280,000+'] },
      { key: 's16', name: '#16: Mega Backdoor Roth', irc: 'IRC §402(g), §415', docs: ['Plan allows after-tax contrib', 'In-plan Roth conversion setup', '2025 limit: $70k total cap'] },
      { key: 's17', name: '#17: HSA Triple Tax', irc: 'IRC §223', docs: ['HDHP coverage verified', 'Investment strategy set', '2025 limit: $4,300/$8,550'] },
      { key: 's18', name: '#18: Backdoor Roth IRA', irc: 'IRC §408A(d)(3)', docs: ['Non-deductible IRA contrib', 'Form 8606 filed', 'Pro-rata rule considered'] },
      { key: 's19', name: '#19: Roth Conversions', irc: 'IRC §408A', docs: ['Tax bracket analysis', 'Conversion strategy timeline', 'Tax payment planning'] },
      { key: 's20', name: '#20: Self-Directed Accounts', irc: 'IRC §408, §401', docs: ['Custodian established', 'Prohibited transaction review', 'UBIT considerations'] },
      { key: 's21', name: '#21: QSEHRA/HRA', irc: 'IRC §9831', docs: ['Plan document current', 'Eligibility verified', 'Notice requirements met'] },
    ],
  },
  {
    id: 'p4',
    name: 'Phase 4: Credits & Multistate',
    color: 'bg-orange-600',
    targetSavings: '$8k-$30k',
    strategies: [
      { key: 's22', name: '#22: R&D Tax Credit', irc: 'IRC §41', docs: ['4-part test documentation', 'Qualified research expenses', 'Form 6765 preparation'] },
      { key: 's23', name: '#23: WOTC', irc: 'IRC §51', docs: ['Form 8850 filed (28 days)', 'Target group certification', 'Wage/hour documentation'] },
      { key: 's24', name: '#24: PTET Election', irc: 'State-Specific', docs: ['State election filed', 'Estimated payments made', 'SALT cap workaround calc'] },
      { key: 's25', name: '#25: State Tax Planning', irc: 'Various', docs: ['Nexus analysis complete', 'Apportionment review', 'Credit/incentive evaluation'] },
      { key: 's26', name: '#26: Energy Credits', irc: 'IRC §30D, §45L', docs: ['Clean vehicle qualification', 'Energy efficiency docs', 'Credit calculation'] },
    ],
  },
  {
    id: 'p5',
    name: 'Phase 5: Real Estate',
    color: 'bg-cyan-600',
    targetSavings: '$30k-$150k+',
    strategies: [
      { key: 's27', name: '#27: RE Professional Status', irc: 'IRC §469(c)(7)', docs: ['750+ hours documented', 'Material participation log', '>50% of services in RE'] },
      { key: 's28', name: '#28: Cost Segregation Study', irc: 'IRC §168', docs: ['Engineering study complete', 'Component breakdown', 'Catch-up depreciation calc'] },
      { key: 's29', name: '#29: STR Loophole', irc: 'IRC §469', docs: ['Average stay ≤7 days', 'Material participation met', 'Non-passive treatment docs'] },
      { key: 's30', name: '#30: Self-Rental Loophole', irc: 'IRC §469(c)(2)', docs: ['Lease agreement on file', 'FMV rental rate', 'Recharacterization election'] },
      { key: 's31', name: '#31: 1031 Exchange', irc: 'IRC §1031', docs: ['QI engaged before sale', '45-day ID requirement', '180-day closing deadline'] },
      { key: 's32', name: '#32: PAL Grouping Election', irc: 'IRC §469', docs: ['Grouping statement filed', 'Economic unit analysis', 'Material participation log'] },
      { key: 's33', name: '#33: Syndication Strategy', irc: 'IRC §469', docs: ['9(g) election filed', 'RE Pro status verified', 'K-1 loss allocation'] },
    ],
  },
  {
    id: 'p6',
    name: 'Phase 6: Acquisitions & Leverage',
    color: 'bg-red-600',
    targetSavings: '$20k-$75k',
    strategies: [
      { key: 's34', name: '#34: Heavy Vehicle Strategy', irc: 'IRC §179(b)(5)', docs: ['GVWR >6,000 lbs documented', 'Business use >50%', '2025 SUV limit: $31,300'] },
      { key: 's35', name: '#35: Oil & Gas Investments', irc: 'IRC §263(c), §611', docs: ['IDC deduction calculated', 'Depletion allowance', 'K-1 partnership analysis'] },
      { key: 's36', name: '#36: DST Investments', irc: 'IRC §1031', docs: ['DST due diligence', 'Passive income treatment', '1031 replacement property'] },
      { key: 's37', name: '#37: Opportunity Zone', irc: 'IRC §1400Z-2', docs: ['180-day investment window', 'QOZ fund certification', 'Gain deferral election'] },
      { key: 's38', name: '#38: Equipment Acquisition', irc: 'IRC §179, §168(k)', docs: ['Business purpose documented', 'Placed in service date', 'Financing vs. purchase analysis'] },
    ],
  },
  {
    id: 'p7',
    name: 'Phase 7: Exit & Wealth Transfer',
    color: 'bg-amber-600',
    targetSavings: '$50k-$500k+',
    strategies: [
      { key: 's39', name: '#39: QSBS Exclusion', irc: 'IRC §1202', docs: ['C-Corp issued stock', '5-year holding period', 'Qualified trade/business'] },
      { key: 's40', name: '#40: Installment Sale', irc: 'IRC §453', docs: ['Sale agreement terms', 'Interest rate >AFR', 'Gain deferral schedule'] },
      { key: 's41', name: '#41: Dynasty Trust', irc: 'State-Specific', docs: ['Trust document drafted', 'GST exemption applied', 'Trustee selection'] },
      { key: 's42', name: '#42: GRAT/GRUT', irc: 'IRC §2702', docs: ['Annuity payment schedule', 'IRS 7520 rate used', 'Remainder value calculated'] },
      { key: 's43', name: '#43: Life Insurance Strategy', irc: 'IRC §101', docs: ['Policy in force', 'ILIT if applicable', 'Premium payment schedule'] },
      { key: 's44', name: '#44: Succession Planning', irc: 'Various', docs: ['Buy-sell agreement', 'Valuation method set', 'Funding mechanism'] },
    ],
  },
  {
    id: 'p8',
    name: 'Phase 8: Charitable & Philanthropic',
    color: 'bg-pink-600',
    targetSavings: '$10k-$100k+',
    strategies: [
      { key: 's45', name: '#45: Charitable Lead Trust', irc: 'IRC §664', docs: ['CLT document drafted', 'Annual payment schedule', 'Remainder beneficiaries'] },
      { key: 's46', name: '#46: Charitable Remainder Trust', irc: 'IRC §664', docs: ['CRT established', 'Unitrust vs annuity trust', 'Income beneficiary terms'] },
      { key: 's47', name: '#47: Donor Advised Fund', irc: 'IRC §170', docs: ['DAF account open', 'Contribution documentation', 'Grant recommendations'] },
      { key: 's48', name: '#48: Appreciated Stock Donation', irc: 'IRC §170(e)', docs: ['FMV appraisal if >$5k', 'Form 8283 prepared', 'Holding period >1 year'] },
      { key: 's49', name: '#49: Private Foundation', irc: 'IRC §501(c)(3)', docs: ['Foundation established', 'Board governance', '5% distribution requirement'] },
      { key: 's50', name: '#50: Qualified Charitable Distribution', irc: 'IRC §408(d)(8)', docs: ['Age 70½+ verified', 'Direct transfer to charity', 'Up to $105,000 limit'] },
    ],
  },
];

const defaultStrategyData = (): StrategyData => ({
  q1: false, q2: false, q3: false, q4: false,
  doc1: false, doc2: false, doc3: false,
  savings: '', notes: '',
});

const defaultStrategies = (): Record<string, StrategyData> => {
  const strategies: Record<string, StrategyData> = {};
  PHASES.forEach(phase => {
    phase.strategies.forEach(strategy => {
      strategies[`${phase.id}-${strategy.key}`] = defaultStrategyData();
    });
  });
  return strategies;
};

export function QuarterlyReview({ clientName, companyName, clientId, savedData, onSave, onClose }: QuarterlyReviewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
  
  const [uploading, setUploading] = useState(false);
  
  const [data, setData] = useState<ReviewData>({
    clientName: (savedData.clientName as string) || clientName || '',
    entityName: (savedData.entityName as string) || companyName || '',
    ein: (savedData.ein as string) || '',
    quarter: (savedData.quarter as string) || currentQuarter,
    meetingDate: (savedData.meetingDate as string) || '',
    reviewDate: (savedData.reviewDate as string) || '',
    phaseStatus: (savedData.phaseStatus as ReviewData['phaseStatus']) || {
      p1: { status: 'not-started' },
      p2: { status: 'not-started' },
      p3: { status: 'not-started' },
      p4: { status: 'not-started' },
      p5: { status: 'not-started' },
      p6: { status: 'not-started' },
      p7: { status: 'not-started' },
      p8: { status: 'not-started' },
    },
    primaryContact: (savedData.primaryContact as string) || '',
    filingStatus: (savedData.filingStatus as string) || '',
    dependents: (savedData.dependents as string) || '',
    primaryBusiness: (savedData.primaryBusiness as string) || '',
    ytdRevenue: (savedData.ytdRevenue as string) || '',
    ytdExpenses: (savedData.ytdExpenses as string) || '',
    ytdNetIncome: (savedData.ytdNetIncome as string) || '',
    projectedAnnual: (savedData.projectedAnnual as string) || '',
    plFilePath: (savedData.plFilePath as string) || '',
    plFileName: (savedData.plFileName as string) || '',
    currentW2: (savedData.currentW2 as string) || '',
    recommendedW2: (savedData.recommendedW2 as string) || '',
    ficaSavings: (savedData.ficaSavings as string) || '',
    distributionsYtd: (savedData.distributionsYtd as string) || '',
    estTaxes: (savedData.estTaxes as ReviewData['estTaxes']) || {
      fedQ1Req: '', fedQ1Paid: '', fedQ1Date: '',
      fedQ2Req: '', fedQ2Paid: '', fedQ2Date: '',
      fedQ3Req: '', fedQ3Paid: '', fedQ3Date: '',
      fedQ4Req: '', fedQ4Paid: '', fedQ4Date: '',
      stateQ1Req: '', stateQ1Paid: '', stateQ1Date: '',
      stateQ2Req: '', stateQ2Paid: '', stateQ2Date: '',
      stateQ3Req: '', stateQ3Paid: '', stateQ3Date: '',
      stateQ4Req: '', stateQ4Paid: '', stateQ4Date: '',
    },
    strategies: (savedData.strategies as Record<string, StrategyData>) || defaultStrategies(),
    actionItems: (savedData.actionItems as string) || '',
    nextQuarterPriorities: (savedData.nextQuarterPriorities as string) || '',
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meeting: true,
    pathway: true,
    financial: false,
    compensation: false,
    estTax: false,
    ...PHASES.reduce((acc, phase) => ({ ...acc, [phase.id]: false }), {}),
    actionItems: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const calculateTotalSavings = (): number => {
    let total = 0;
    Object.values(data.strategies).forEach(strategy => {
      if (strategy.savings) {
        total += parseFloat(strategy.savings.replace(/[^0-9.]/g, '')) || 0;
      }
    });
    return total;
  };

  const countActiveStrategies = (): number => {
    return Object.values(data.strategies).filter(s => s.q1 || s.q2 || s.q3 || s.q4).length;
  };

  const calculatePathwayProgress = (): number => {
    const phaseValues: Record<string, number> = {
      'not-started': 0,
      'in-progress': 50,
      'complete': 100,
      'maintaining': 100,
    };
    const totalPhases = 8;
    let totalProgress = 0;
    Object.values(data.phaseStatus).forEach(phase => {
      totalProgress += phaseValues[phase.status] || 0;
    });
    return Math.round(totalProgress / totalPhases);
  };

  const getCurrentPhase = (): string => {
    const phaseOrder = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
    const phaseNames: Record<string, string> = {
      p1: 'P1: Foundational',
      p2: 'P2: Core',
      p3: 'P3: Retirement',
      p4: 'P4: Credits',
      p5: 'P5: Real Estate',
      p6: 'P6: Acquisitions',
      p7: 'P7: Exit & Wealth',
      p8: 'P8: Charitable',
    };
    for (const phase of phaseOrder) {
      if (data.phaseStatus[phase as keyof typeof data.phaseStatus].status !== 'complete' && 
          data.phaseStatus[phase as keyof typeof data.phaseStatus].status !== 'maintaining') {
        return phaseNames[phase];
      }
    }
    return 'Complete!';
  };

  const handleSave = () => {
    const totalSavings = calculateTotalSavings();
    onSave(data as unknown as Record<string, unknown>, totalSavings);
  };

  const handlePLUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientId) {
      if (!clientId) {
        toast({
          variant: 'destructive',
          title: 'Upload unavailable',
          description: 'Client ID is required to upload documents.',
        });
      }
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/quarterly-review-pl/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setData(prev => ({
        ...prev,
        plFilePath: fileName,
        plFileName: file.name,
      }));

      toast({
        title: 'P&L uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload P&L document',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePL = async () => {
    if (!data.plFilePath) return;
    
    try {
      await supabase.storage
        .from('client-documents')
        .remove([data.plFilePath]);
      
      setData(prev => ({
        ...prev,
        plFilePath: '',
        plFileName: '',
      }));
      
      toast({
        title: 'P&L removed',
        description: 'The P&L document has been removed.',
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: error.message || 'Failed to remove P&L document',
      });
    }
  };

  const getPLUrl = (): string | null => {
    if (!data.plFilePath) return null;
    const { data: urlData } = supabase.storage
      .from('client-documents')
      .getPublicUrl(data.plFilePath);
    return urlData?.publicUrl || null;
  };

  const updateStrategy = (phaseKey: string, strategyKey: string, field: keyof StrategyData, value: string | boolean) => {
    const key = `${phaseKey}-${strategyKey}`;
    setData(prev => ({
      ...prev,
      strategies: {
        ...prev.strategies,
        [key]: {
          ...prev.strategies[key],
          [field]: value,
        },
      },
    }));
  };

  const getPhaseStatusColor = (status: string): string => {
    switch (status) {
      case 'complete': return 'bg-eiduk-gold text-eiduk-navy';
      case 'maintaining': return 'bg-success text-white';
      case 'in-progress': return 'bg-eiduk-blue text-white';
      default: return 'bg-white/20 border-2 border-white/40 text-white';
    }
  };

  return (
    <Card className="border-2 border-eiduk-gold/30 max-h-[85vh] overflow-y-auto">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white sticky top-0 z-10">
        <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK PATHWAY™</div>
        <CardTitle className="font-display text-2xl">S-Corp Quarterly Review Workpaper</CardTitle>
        <p className="text-white/80">Comprehensive 47-Strategy Tax Optimization Framework</p>
        <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Meeting Information */}
        <Collapsible open={openSections.meeting} onOpenChange={() => toggleSection('meeting')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-eiduk-navy">Meeting Information</h3>
            {openSections.meeting ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input value={data.clientName} onChange={(e) => setData(prev => ({ ...prev, clientName: e.target.value }))} />
                </div>
                <div>
                  <Label>Entity Name</Label>
                  <Input value={data.entityName} onChange={(e) => setData(prev => ({ ...prev, entityName: e.target.value }))} />
                </div>
                <div>
                  <Label>EIN</Label>
                  <Input value={data.ein} onChange={(e) => setData(prev => ({ ...prev, ein: e.target.value }))} placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <Label>Quarter</Label>
                  <Select value={data.quarter} onValueChange={(value) => setData(prev => ({ ...prev, quarter: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select Quarter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                      <SelectItem value="Q2 2025">Q2 2025</SelectItem>
                      <SelectItem value="Q3 2025">Q3 2025</SelectItem>
                      <SelectItem value="Q4 2025">Q4 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meeting Date</Label>
                  <Input type="date" value={data.meetingDate} onChange={(e) => setData(prev => ({ ...prev, meetingDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Review Date</Label>
                  <Input type="date" value={data.reviewDate} onChange={(e) => setData(prev => ({ ...prev, reviewDate: e.target.value }))} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Eiduk Pathway Dashboard */}
        <Collapsible open={openSections.pathway} onOpenChange={() => toggleSection('pathway')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg">
            <h3 className="font-display text-lg font-semibold">The Eiduk Pathway™ Client Journey</h3>
            {openSections.pathway ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-6 rounded-lg">
              <p className="text-sm opacity-90 mb-4">Systematic tax optimization through 8 strategic phases • 50 strategies • Building wealth while reducing taxes</p>
              
              {/* Phase Timeline */}
              <div className="flex flex-wrap justify-between items-start gap-2 mb-6">
                {[
                  { key: 'p1', label: 'Foundational', count: 6 },
                  { key: 'p2', label: 'Core', count: 6 },
                  { key: 'p3', label: 'Retirement', count: 9 },
                  { key: 'p4', label: 'Credits', count: 5 },
                  { key: 'p5', label: 'Real Estate', count: 7 },
                  { key: 'p6', label: 'Acquisitions', count: 5 },
                  { key: 'p7', label: 'Exit & Wealth', count: 6 },
                  { key: 'p8', label: 'Charitable', count: 6 },
                ].map((phase, index) => (
                  <div key={phase.key} className="flex-1 min-w-[100px] text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full ${getPhaseStatusColor(data.phaseStatus[phase.key as keyof typeof data.phaseStatus].status)} flex items-center justify-center font-bold text-lg mb-2`}>
                      P{index + 1}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide">{phase.label}</div>
                    <div className="text-xs opacity-80">{phase.count} Strategies</div>
                    <Select
                      value={data.phaseStatus[phase.key as keyof typeof data.phaseStatus].status}
                      onValueChange={(value) => setData(prev => ({
                        ...prev,
                        phaseStatus: {
                          ...prev.phaseStatus,
                          [phase.key]: { status: value as PhaseStatus['status'] },
                        },
                      }))}
                    >
                      <SelectTrigger className="mt-2 h-7 text-xs bg-white/20 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="maintaining">Maintaining</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-xs uppercase opacity-80 mb-1">Current Phase</div>
                  <div className="text-lg font-bold">{getCurrentPhase()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs uppercase opacity-80 mb-1">Strategies Active</div>
                  <div className="text-lg font-bold">{countActiveStrategies()} / 50</div>
                </div>
                <div className="text-center">
                  <div className="text-xs uppercase opacity-80 mb-1">Est. Annual Savings</div>
                  <div className="text-lg font-bold">${calculateTotalSavings().toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs uppercase opacity-80 mb-1">Pathway Progress</div>
                  <div className="text-lg font-bold">{calculatePathwayProgress()}%</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Compliance Scorecard */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 p-6 rounded-lg text-center">
          <h3 className="font-display text-xl font-semibold text-eiduk-navy mb-4">Quarterly Compliance Scorecard</h3>
          <Progress value={calculatePathwayProgress()} className="h-5 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="text-xs text-muted-foreground uppercase">Compliance Score</div>
              <div className="text-2xl font-bold text-eiduk-navy">{calculatePathwayProgress()}%</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="text-xs text-muted-foreground uppercase">Strategies Active</div>
              <div className="text-2xl font-bold text-eiduk-blue">{countActiveStrategies()}/50</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="text-xs text-muted-foreground uppercase">YTD Tax Savings</div>
              <div className="text-2xl font-bold text-success">${calculateTotalSavings().toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="text-xs text-muted-foreground uppercase">Quarter</div>
              <div className="text-2xl font-bold text-eiduk-navy">{data.quarter.split(' ')[0]}</div>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-eiduk-navy">Financial Snapshot</h3>
            {openSections.financial ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>YTD Revenue</Label>
                <Input value={data.ytdRevenue} onChange={(e) => setData(prev => ({ ...prev, ytdRevenue: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>YTD Expenses</Label>
                <Input value={data.ytdExpenses} onChange={(e) => setData(prev => ({ ...prev, ytdExpenses: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>YTD Net Income</Label>
                <Input value={data.ytdNetIncome} onChange={(e) => setData(prev => ({ ...prev, ytdNetIncome: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>Projected Annual</Label>
                <Input value={data.projectedAnnual} onChange={(e) => setData(prev => ({ ...prev, projectedAnnual: e.target.value }))} placeholder="$0" />
              </div>
            </div>

            {/* P&L Upload Section */}
            <div className="border-t pt-4">
              <Label className="mb-2 block">Recent P&L Statement</Label>
              {data.plFileName ? (
                <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  <FileText className="h-5 w-5 text-eiduk-blue shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{data.plFileName}</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                  <div className="flex gap-2">
                    {getPLUrl() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getPLUrl()!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePL}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-eiduk-blue/30 rounded-lg p-6 text-center hover:border-eiduk-blue/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handlePLUpload}
                    className="hidden"
                    accept=".pdf,.xls,.xlsx,.csv"
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-eiduk-blue" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-eiduk-blue/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-eiduk-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-eiduk-navy">Click to upload P&L</p>
                        <p className="text-xs text-muted-foreground">PDF, Excel, or CSV</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reasonable Compensation */}
        <Collapsible open={openSections.compensation} onOpenChange={() => toggleSection('compensation')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-eiduk-navy">Reasonable Compensation Review</h3>
            {openSections.compensation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Current W-2 Compensation</Label>
                <Input value={data.currentW2} onChange={(e) => setData(prev => ({ ...prev, currentW2: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>Recommended W-2</Label>
                <Input value={data.recommendedW2} onChange={(e) => setData(prev => ({ ...prev, recommendedW2: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>Est. FICA Savings</Label>
                <Input value={data.ficaSavings} onChange={(e) => setData(prev => ({ ...prev, ficaSavings: e.target.value }))} placeholder="$0" />
              </div>
              <div>
                <Label>Distributions YTD</Label>
                <Input value={data.distributionsYtd} onChange={(e) => setData(prev => ({ ...prev, distributionsYtd: e.target.value }))} placeholder="$0" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Strategy Phases */}
        {PHASES.map((phase) => (
          <Collapsible key={phase.id} open={openSections[phase.id]} onOpenChange={() => toggleSection(phase.id)}>
            <CollapsibleTrigger className={`flex items-center justify-between w-full ${phase.color} text-white p-3 rounded-lg`}>
              <div className="flex items-center gap-3">
                <h3 className="font-display font-semibold">{phase.name}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {phase.strategies.length} Strategies • {phase.targetSavings}
                </Badge>
              </div>
              {openSections[phase.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left w-[20%]">Strategy & IRC</th>
                      <th className="p-2 text-center w-[5%]">Q1</th>
                      <th className="p-2 text-center w-[5%]">Q2</th>
                      <th className="p-2 text-center w-[5%]">Q3</th>
                      <th className="p-2 text-center w-[5%]">Q4</th>
                      <th className="p-2 text-left w-[20%]">Documentation</th>
                      <th className="p-2 text-left w-[10%]">Savings</th>
                      <th className="p-2 text-left w-[30%]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.strategies.map((strategy) => {
                      const strategyKey = `${phase.id}-${strategy.key}`;
                      const strategyData = data.strategies[strategyKey] || defaultStrategyData();
                      return (
                        <tr key={strategy.key} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            <div className="font-semibold text-eiduk-navy">{strategy.name}</div>
                            <div className="text-xs text-muted-foreground">{strategy.irc}</div>
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q1}
                              onCheckedChange={(checked) => updateStrategy(phase.id, strategy.key, 'q1', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q2}
                              onCheckedChange={(checked) => updateStrategy(phase.id, strategy.key, 'q2', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q3}
                              onCheckedChange={(checked) => updateStrategy(phase.id, strategy.key, 'q3', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q4}
                              onCheckedChange={(checked) => updateStrategy(phase.id, strategy.key, 'q4', !!checked)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {strategy.docs.map((doc, idx) => (
                                <label key={idx} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <Checkbox
                                    checked={strategyData[`doc${idx + 1}` as keyof StrategyData] as boolean}
                                    onCheckedChange={(checked) => updateStrategy(phase.id, strategy.key, `doc${idx + 1}` as keyof StrategyData, !!checked)}
                                    className="h-3 w-3"
                                  />
                                  <span className="text-muted-foreground">{doc}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              value={strategyData.savings}
                              onChange={(e) => updateStrategy(phase.id, strategy.key, 'savings', e.target.value)}
                              placeholder="$0"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Textarea
                              value={strategyData.notes}
                              onChange={(e) => updateStrategy(phase.id, strategy.key, 'notes', e.target.value)}
                              placeholder="Notes..."
                              className="min-h-[60px] text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        <Separator />

        {/* Action Items */}
        <Collapsible open={openSections.actionItems} onOpenChange={() => toggleSection('actionItems')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg">
            <h3 className="font-display text-lg font-semibold">Action Items & Next Steps</h3>
            {openSections.actionItems ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t">
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
