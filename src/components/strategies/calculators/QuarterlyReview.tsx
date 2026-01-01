import { useState, useRef, useEffect } from 'react';
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
import { FileText, ChevronDown, ChevronRight, Upload, Loader2, CheckCircle, ExternalLink, Trash2, History, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface QuarterlyReviewProps {
  clientName: string;
  companyName?: string;
  clientId?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface StrategyTrackingData {
  q1_active: boolean;
  q2_active: boolean;
  q3_active: boolean;
  q4_active: boolean;
  doc1_complete: boolean;
  doc2_complete: boolean;
  doc3_complete: boolean;
  estimated_savings: number;
  notes: string;
}

interface PhaseStatusData {
  phase: number;
  status: 'not-started' | 'in-progress' | 'complete' | 'maintaining';
}

interface ActionItemData {
  id?: string;
  description: string;
  responsible_party: 'client' | 'advisor' | null;
  due_date: string;
  status: 'pending' | 'in-progress' | 'complete';
  priority: number;
  strategy_number: number | null;
}

interface MeetingData {
  id?: string;
  meeting_date: string;
  quarter: number;
  tax_year: number;
  ytd_gross_revenue: number;
  ytd_cogs: number;
  ytd_operating_expenses: number;
  ytd_net_income: number;
  current_salary: number;
  recommended_salary: number;
  ytd_distributions: number;
  retirement_contribution_401k: number;
  retirement_contribution_profit_sharing: number;
  retirement_contribution_cash_balance: number;
  retirement_contribution_hsa: number;
  federal_estimated_paid: number;
  state_estimated_paid: number;
  federal_estimated_due: number;
  state_estimated_due: number;
  general_notes: string;
  next_quarter_priorities: string;
}

// Define all 50 strategies organized by 8 phases (The Eiduk System™)
const PHASES = [
  {
    id: 1,
    name: 'Phase 1: Foundational',
    color: 'bg-phase-foundation',
    targetSavings: '$26k-$52k',
    strategies: [
      { number: 1, name: '#1: S-Corp Election', irc: 'IRC §1361', docs: ['Form 2553 filed', 'State election filed', 'Shareholder consent'] },
      { number: 2, name: '#2: Reasonable Compensation', irc: 'IRC §3121', docs: ['Salary comparison study', 'Job description documented', 'Payroll records current'] },
      { number: 3, name: '#3: S-Corp Health Insurance', irc: 'IRC §162(l)', docs: ['Premiums paid by S-Corp', 'W-2 Box 1 includes premium', '>2% owner verification'] },
      { number: 4, name: '#4: Accountable Plan', irc: 'IRC §62(c)', docs: ['Written plan on file', 'Business connection proven', '60-day substantiation'] },
      { number: 5, name: '#5: Augusta Rule (14-Day Rental)', irc: 'IRC §280A(g)', docs: ['Board resolution on file', 'Fair rental rate documented', 'Meeting minutes/purpose'] },
      { number: 6, name: '#6: Asset Reimbursement', irc: 'IRC §162', docs: ['Asset use agreement', 'FMV rental rate documented', 'Business use percentage'] },
    ],
  },
  {
    id: 2,
    name: 'Phase 2: Core',
    color: 'bg-phase-deductions',
    targetSavings: '$12k-$30k',
    strategies: [
      { number: 7, name: '#7: Home Office Deduction', irc: 'IRC §280A', docs: ['Square footage calculation', 'Exclusive use documented', 'Direct/indirect expenses'] },
      { number: 8, name: '#8: Business Mileage', irc: 'IRC §162, §274', docs: ['Mileage log maintained', '2025 rate: $0.70/mile', 'Business purpose documented'] },
      { number: 9, name: '#9: Business Meals', irc: 'IRC §274(n)', docs: ['50% deduction applied', 'Business purpose noted', 'Receipt retention system'] },
      { number: 10, name: '#10: Technology & Software', irc: 'IRC §179', docs: ['Business use documented', 'Subscription tracking', 'Asset list maintained'] },
      { number: 11, name: '#11: Professional Development', irc: 'IRC §162', docs: ['Business connection clear', 'Receipt documentation', 'Maintains/improves skills'] },
      { number: 12, name: '#12: Family Employment', irc: 'IRC §162, §3121', docs: ['Reasonable wages paid', 'Time records maintained', 'W-2/W-4 on file'] },
    ],
  },
  {
    id: 3,
    name: 'Phase 3: Retirement & Benefits',
    color: 'bg-phase-retirement',
    targetSavings: '$35k-$100k+',
    strategies: [
      { number: 13, name: '#13: Solo 401(k) / SEP IRA', irc: 'IRC §401(k), §408', docs: ['Plan document on file', '2025 limit: $23,500 + $7,500', 'Contribution deadline noted'] },
      { number: 14, name: '#14: Profit Sharing', irc: 'IRC §401(a)', docs: ['Profit sharing formula set', 'Contribution calculation', 'Discrimination testing'] },
      { number: 15, name: '#15: Cash Balance Plan', irc: 'IRC §401(a)', docs: ['Actuarial study completed', 'Annual funding requirement', '2025 limit: up to $280,000+'] },
      { number: 16, name: '#16: Mega Backdoor Roth', irc: 'IRC §402(g), §415', docs: ['Plan allows after-tax contrib', 'In-plan Roth conversion setup', '2025 limit: $70k total cap'] },
      { number: 17, name: '#17: HSA Triple Tax', irc: 'IRC §223', docs: ['HDHP coverage verified', 'Investment strategy set', '2025 limit: $4,300/$8,550'] },
      { number: 18, name: '#18: Backdoor Roth IRA', irc: 'IRC §408A(d)(3)', docs: ['Non-deductible IRA contrib', 'Form 8606 filed', 'Pro-rata rule considered'] },
      { number: 19, name: '#19: Roth Conversions', irc: 'IRC §408A', docs: ['Tax bracket analysis', 'Conversion strategy timeline', 'Tax payment planning'] },
      { number: 20, name: '#20: Self-Directed Accounts', irc: 'IRC §408, §401', docs: ['Custodian established', 'Prohibited transaction review', 'UBIT considerations'] },
      { number: 21, name: '#21: QSEHRA/HRA', irc: 'IRC §9831', docs: ['Plan document current', 'Eligibility verified', 'Notice requirements met'] },
    ],
  },
  {
    id: 4,
    name: 'Phase 4: Credits & Multistate',
    color: 'bg-phase-credits',
    targetSavings: '$8k-$30k',
    strategies: [
      { number: 22, name: '#22: R&D Tax Credit', irc: 'IRC §41', docs: ['4-part test documentation', 'Qualified research expenses', 'Form 6765 preparation'] },
      { number: 23, name: '#23: WOTC', irc: 'IRC §51', docs: ['Form 8850 filed (28 days)', 'Target group certification', 'Wage/hour documentation'] },
      { number: 24, name: '#24: PTET Election', irc: 'State-Specific', docs: ['State election filed', 'Estimated payments made', 'SALT cap workaround calc'] },
      { number: 25, name: '#25: State Tax Planning', irc: 'Various', docs: ['Nexus analysis complete', 'Apportionment review', 'Credit/incentive evaluation'] },
      { number: 26, name: '#26: Energy Credits', irc: 'IRC §30D, §45L', docs: ['Clean vehicle qualification', 'Energy efficiency docs', 'Credit calculation'] },
    ],
  },
  {
    id: 5,
    name: 'Phase 5: Real Estate',
    color: 'bg-phase-realestate',
    targetSavings: '$30k-$150k+',
    strategies: [
      { number: 27, name: '#27: RE Professional Status', irc: 'IRC §469(c)(7)', docs: ['750+ hours documented', 'Material participation log', '>50% of services in RE'] },
      { number: 28, name: '#28: Cost Segregation Study', irc: 'IRC §168', docs: ['Engineering study complete', 'Component breakdown', 'Catch-up depreciation calc'] },
      { number: 29, name: '#29: STR Loophole', irc: 'IRC §469', docs: ['Average stay ≤7 days', 'Material participation met', 'Non-passive treatment docs'] },
      { number: 30, name: '#30: Self-Rental Loophole', irc: 'IRC §469(c)(2)', docs: ['Lease agreement on file', 'FMV rental rate', 'Recharacterization election'] },
      { number: 31, name: '#31: 1031 Exchange', irc: 'IRC §1031', docs: ['QI engaged before sale', '45-day ID requirement', '180-day closing deadline'] },
      { number: 32, name: '#32: PAL Grouping Election', irc: 'IRC §469', docs: ['Grouping statement filed', 'Economic unit analysis', 'Material participation log'] },
      { number: 33, name: '#33: Syndication Strategy', irc: 'IRC §469', docs: ['9(g) election filed', 'RE Pro status verified', 'K-1 loss allocation'] },
    ],
  },
  {
    id: 6,
    name: 'Phase 6: Acquisitions & Leverage',
    color: 'bg-phase-acquisitions',
    targetSavings: '$20k-$75k',
    strategies: [
      { number: 34, name: '#34: Heavy Vehicle Strategy', irc: 'IRC §179(b)(5)', docs: ['GVWR >6,000 lbs documented', 'Business use >50%', '2025 SUV limit: $31,300'] },
      { number: 35, name: '#35: Oil & Gas Investments', irc: 'IRC §263(c), §611', docs: ['IDC deduction calculated', 'Depletion allowance', 'K-1 partnership analysis'] },
      { number: 36, name: '#36: DST Investments', irc: 'IRC §1031', docs: ['DST due diligence', 'Passive income treatment', '1031 replacement property'] },
      { number: 37, name: '#37: Opportunity Zone', irc: 'IRC §1400Z-2', docs: ['180-day investment window', 'QOZ fund certification', 'Gain deferral election'] },
      { number: 38, name: '#38: Equipment Acquisition', irc: 'IRC §179, §168(k)', docs: ['Business purpose documented', 'Placed in service date', 'Financing vs. purchase analysis'] },
    ],
  },
  {
    id: 7,
    name: 'Phase 7: Exit & Wealth Transfer',
    color: 'bg-phase-exit',
    targetSavings: '$50k-$500k+',
    strategies: [
      { number: 39, name: '#39: QSBS Exclusion', irc: 'IRC §1202', docs: ['C-Corp issued stock', '5-year holding period', 'Qualified trade/business'] },
      { number: 40, name: '#40: Installment Sale', irc: 'IRC §453', docs: ['Sale agreement terms', 'Interest rate >AFR', 'Gain deferral schedule'] },
      { number: 41, name: '#41: Dynasty Trust', irc: 'State-Specific', docs: ['Trust document drafted', 'GST exemption applied', 'Trustee selection'] },
      { number: 42, name: '#42: GRAT/GRUT', irc: 'IRC §2702', docs: ['Annuity payment schedule', 'IRS 7520 rate used', 'Remainder value calculated'] },
      { number: 43, name: '#43: Life Insurance Strategy', irc: 'IRC §101', docs: ['Policy in force', 'ILIT if applicable', 'Premium payment schedule'] },
      { number: 44, name: '#44: Succession Planning', irc: 'Various', docs: ['Buy-sell agreement', 'Valuation method set', 'Funding mechanism'] },
    ],
  },
  {
    id: 8,
    name: 'Phase 8: Charitable & Philanthropic',
    color: 'bg-phase-charitable',
    targetSavings: '$10k-$100k+',
    strategies: [
      { number: 45, name: '#45: Charitable Lead Trust', irc: 'IRC §664', docs: ['CLT document drafted', 'Annual payment schedule', 'Remainder beneficiaries'] },
      { number: 46, name: '#46: Charitable Remainder Trust', irc: 'IRC §664', docs: ['CRT established', 'Unitrust vs annuity trust', 'Income beneficiary terms'] },
      { number: 47, name: '#47: Donor Advised Fund', irc: 'IRC §170', docs: ['DAF account open', 'Contribution documentation', 'Grant recommendations'] },
      { number: 48, name: '#48: Appreciated Stock Donation', irc: 'IRC §170(e)', docs: ['FMV appraisal if >$5k', 'Form 8283 prepared', 'Holding period >1 year'] },
      { number: 49, name: '#49: Private Foundation', irc: 'IRC §501(c)(3)', docs: ['Foundation established', 'Board governance', '5% distribution requirement'] },
      { number: 50, name: '#50: Qualified Charitable Distribution', irc: 'IRC §408(d)(8)', docs: ['Age 70½+ verified', 'Direct transfer to charity', 'Up to $105,000 limit'] },
    ],
  },
];

const defaultStrategyTracking = (): StrategyTrackingData => ({
  q1_active: false, q2_active: false, q3_active: false, q4_active: false,
  doc1_complete: false, doc2_complete: false, doc3_complete: false,
  estimated_savings: 0, notes: '',
});

const defaultMeeting = (): MeetingData => {
  const now = new Date();
  return {
    meeting_date: now.toISOString().split('T')[0],
    quarter: Math.ceil((now.getMonth() + 1) / 3),
    tax_year: now.getFullYear(),
    ytd_gross_revenue: 0,
    ytd_cogs: 0,
    ytd_operating_expenses: 0,
    ytd_net_income: 0,
    current_salary: 0,
    recommended_salary: 0,
    ytd_distributions: 0,
    retirement_contribution_401k: 0,
    retirement_contribution_profit_sharing: 0,
    retirement_contribution_cash_balance: 0,
    retirement_contribution_hsa: 0,
    federal_estimated_paid: 0,
    state_estimated_paid: 0,
    federal_estimated_due: 0,
    state_estimated_due: 0,
    general_notes: '',
    next_quarter_priorities: '',
  };
};

interface HistoricalMeeting {
  id: string;
  quarter: number;
  tax_year: number;
  updated_at: string;
}

export function QuarterlyReview({ clientName, companyName, clientId, savedData, onSave, onClose }: QuarterlyReviewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historicalMeetings, setHistoricalMeetings] = useState<HistoricalMeeting[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Main data state
  const [meeting, setMeeting] = useState<MeetingData>(defaultMeeting());
  const [strategies, setStrategies] = useState<Record<number, StrategyTrackingData>>({});
  const [phaseStatus, setPhaseStatus] = useState<Record<number, PhaseStatusData['status']>>({});
  const [actionItems, setActionItems] = useState<ActionItemData[]>([]);
  
  // File upload state
  const [uploading, setUploading] = useState(false);
  const [plFilePath, setPlFilePath] = useState('');
  const [plFileName, setPlFileName] = useState('');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meeting: true,
    pathway: true,
    financial: false,
    compensation: false,
    retirement: false,
    estTax: false,
    ...PHASES.reduce((acc, phase) => ({ ...acc, [`phase${phase.id}`]: false }), {}),
    actionItems: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load data on mount
  useEffect(() => {
    if (clientId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [clientId]);

  const loadData = async () => {
    if (!clientId || !user?.id) return;
    
    setLoading(true);
    try {
      // Load historical meetings list
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, quarter, tax_year, updated_at')
        .eq('client_id', clientId)
        .order('tax_year', { ascending: false })
        .order('quarter', { ascending: false });
      
      setHistoricalMeetings(meetings || []);
      
      // Load phase status
      const { data: phases } = await supabase
        .from('phase_status')
        .select('phase, status')
        .eq('client_id', clientId);
      
      const phaseMap: Record<number, PhaseStatusData['status']> = {};
      for (let i = 1; i <= 8; i++) {
        phaseMap[i] = 'not-started';
      }
      phases?.forEach(p => {
        phaseMap[p.phase] = p.status as PhaseStatusData['status'];
      });
      setPhaseStatus(phaseMap);
      
      // If there's a current quarter meeting, load it
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      const currentYear = new Date().getFullYear();
      
      const { data: currentMeeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('client_id', clientId)
        .eq('quarter', currentQuarter)
        .eq('tax_year', currentYear)
        .maybeSingle();
      
      if (currentMeeting) {
        setMeeting({
          id: currentMeeting.id,
          meeting_date: currentMeeting.meeting_date,
          quarter: currentMeeting.quarter,
          tax_year: currentMeeting.tax_year,
          ytd_gross_revenue: Number(currentMeeting.ytd_gross_revenue) || 0,
          ytd_cogs: Number(currentMeeting.ytd_cogs) || 0,
          ytd_operating_expenses: Number(currentMeeting.ytd_operating_expenses) || 0,
          ytd_net_income: Number(currentMeeting.ytd_net_income) || 0,
          current_salary: Number(currentMeeting.current_salary) || 0,
          recommended_salary: Number(currentMeeting.recommended_salary) || 0,
          ytd_distributions: Number(currentMeeting.ytd_distributions) || 0,
          retirement_contribution_401k: Number(currentMeeting.retirement_contribution_401k) || 0,
          retirement_contribution_profit_sharing: Number(currentMeeting.retirement_contribution_profit_sharing) || 0,
          retirement_contribution_cash_balance: Number(currentMeeting.retirement_contribution_cash_balance) || 0,
          retirement_contribution_hsa: Number(currentMeeting.retirement_contribution_hsa) || 0,
          federal_estimated_paid: Number(currentMeeting.federal_estimated_paid) || 0,
          state_estimated_paid: Number(currentMeeting.state_estimated_paid) || 0,
          federal_estimated_due: Number(currentMeeting.federal_estimated_due) || 0,
          state_estimated_due: Number(currentMeeting.state_estimated_due) || 0,
          general_notes: currentMeeting.general_notes || '',
          next_quarter_priorities: currentMeeting.next_quarter_priorities || '',
        });
        
        // Load strategy tracking for this meeting
        const { data: strategyData } = await supabase
          .from('strategy_tracking')
          .select('*')
          .eq('meeting_id', currentMeeting.id);
        
        const strategyMap: Record<number, StrategyTrackingData> = {};
        strategyData?.forEach(s => {
          strategyMap[s.strategy_number] = {
            q1_active: s.q1_active || false,
            q2_active: s.q2_active || false,
            q3_active: s.q3_active || false,
            q4_active: s.q4_active || false,
            doc1_complete: s.doc1_complete || false,
            doc2_complete: s.doc2_complete || false,
            doc3_complete: s.doc3_complete || false,
            estimated_savings: Number(s.estimated_savings) || 0,
            notes: s.notes || '',
          };
        });
        setStrategies(strategyMap);
        
        // Load action items
        const { data: items } = await supabase
          .from('action_items')
          .select('*')
          .eq('meeting_id', currentMeeting.id)
          .order('priority', { ascending: true });
        
        setActionItems(items?.map(item => ({
          id: item.id,
          description: item.description,
          responsible_party: item.responsible_party as 'client' | 'advisor' | null,
          due_date: item.due_date || '',
          status: item.status as 'pending' | 'in-progress' | 'complete',
          priority: item.priority || 2,
          strategy_number: item.strategy_number,
        })) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load meeting data',
        description: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalMeeting = async (meetingId: string) => {
    if (!clientId) return;
    
    setLoadingHistory(true);
    try {
      const { data: meetingData, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) throw error;

      if (meetingData) {
        setMeeting({
          id: meetingData.id,
          meeting_date: meetingData.meeting_date,
          quarter: meetingData.quarter,
          tax_year: meetingData.tax_year,
          ytd_gross_revenue: Number(meetingData.ytd_gross_revenue) || 0,
          ytd_cogs: Number(meetingData.ytd_cogs) || 0,
          ytd_operating_expenses: Number(meetingData.ytd_operating_expenses) || 0,
          ytd_net_income: Number(meetingData.ytd_net_income) || 0,
          current_salary: Number(meetingData.current_salary) || 0,
          recommended_salary: Number(meetingData.recommended_salary) || 0,
          ytd_distributions: Number(meetingData.ytd_distributions) || 0,
          retirement_contribution_401k: Number(meetingData.retirement_contribution_401k) || 0,
          retirement_contribution_profit_sharing: Number(meetingData.retirement_contribution_profit_sharing) || 0,
          retirement_contribution_cash_balance: Number(meetingData.retirement_contribution_cash_balance) || 0,
          retirement_contribution_hsa: Number(meetingData.retirement_contribution_hsa) || 0,
          federal_estimated_paid: Number(meetingData.federal_estimated_paid) || 0,
          state_estimated_paid: Number(meetingData.state_estimated_paid) || 0,
          federal_estimated_due: Number(meetingData.federal_estimated_due) || 0,
          state_estimated_due: Number(meetingData.state_estimated_due) || 0,
          general_notes: meetingData.general_notes || '',
          next_quarter_priorities: meetingData.next_quarter_priorities || '',
        });
        
        // Load strategy tracking
        const { data: strategyData } = await supabase
          .from('strategy_tracking')
          .select('*')
          .eq('meeting_id', meetingId);
        
        const strategyMap: Record<number, StrategyTrackingData> = {};
        strategyData?.forEach(s => {
          strategyMap[s.strategy_number] = {
            q1_active: s.q1_active || false,
            q2_active: s.q2_active || false,
            q3_active: s.q3_active || false,
            q4_active: s.q4_active || false,
            doc1_complete: s.doc1_complete || false,
            doc2_complete: s.doc2_complete || false,
            doc3_complete: s.doc3_complete || false,
            estimated_savings: Number(s.estimated_savings) || 0,
            notes: s.notes || '',
          };
        });
        setStrategies(strategyMap);
        
        // Load action items
        const { data: items } = await supabase
          .from('action_items')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('priority', { ascending: true });
        
        setActionItems(items?.map(item => ({
          id: item.id,
          description: item.description,
          responsible_party: item.responsible_party as 'client' | 'advisor' | null,
          due_date: item.due_date || '',
          status: item.status as 'pending' | 'in-progress' | 'complete',
          priority: item.priority || 2,
          strategy_number: item.strategy_number,
        })) || []);
        
        toast({
          title: 'Meeting loaded',
          description: `Loaded Q${meetingData.quarter} ${meetingData.tax_year} meeting.`,
        });
      }
    } catch (error: any) {
      console.error('Load historical meeting error:', error);
      toast({
        variant: 'destructive',
        title: 'Load failed',
        description: error.message || 'Failed to load meeting.',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!clientId || !user?.id) {
      toast({
        variant: 'destructive',
        title: 'Save unavailable',
        description: 'Client ID and authentication required.',
      });
      return;
    }

    setSaving(true);
    try {
      let meetingId = meeting.id;
      
      // Upsert meeting
      if (meetingId) {
        const { error } = await supabase
          .from('meetings')
          .update({
            meeting_date: meeting.meeting_date,
            ytd_gross_revenue: meeting.ytd_gross_revenue,
            ytd_cogs: meeting.ytd_cogs,
            ytd_operating_expenses: meeting.ytd_operating_expenses,
            ytd_net_income: meeting.ytd_net_income,
            current_salary: meeting.current_salary,
            recommended_salary: meeting.recommended_salary,
            ytd_distributions: meeting.ytd_distributions,
            retirement_contribution_401k: meeting.retirement_contribution_401k,
            retirement_contribution_profit_sharing: meeting.retirement_contribution_profit_sharing,
            retirement_contribution_cash_balance: meeting.retirement_contribution_cash_balance,
            retirement_contribution_hsa: meeting.retirement_contribution_hsa,
            federal_estimated_paid: meeting.federal_estimated_paid,
            state_estimated_paid: meeting.state_estimated_paid,
            federal_estimated_due: meeting.federal_estimated_due,
            state_estimated_due: meeting.state_estimated_due,
            general_notes: meeting.general_notes,
            next_quarter_priorities: meeting.next_quarter_priorities,
          })
          .eq('id', meetingId);
        if (error) throw error;
      } else {
        const { data: newMeeting, error } = await supabase
          .from('meetings')
          .insert({
            client_id: clientId,
            user_id: user.id,
            meeting_date: meeting.meeting_date,
            quarter: meeting.quarter,
            tax_year: meeting.tax_year,
            ytd_gross_revenue: meeting.ytd_gross_revenue,
            ytd_cogs: meeting.ytd_cogs,
            ytd_operating_expenses: meeting.ytd_operating_expenses,
            ytd_net_income: meeting.ytd_net_income,
            current_salary: meeting.current_salary,
            recommended_salary: meeting.recommended_salary,
            ytd_distributions: meeting.ytd_distributions,
            retirement_contribution_401k: meeting.retirement_contribution_401k,
            retirement_contribution_profit_sharing: meeting.retirement_contribution_profit_sharing,
            retirement_contribution_cash_balance: meeting.retirement_contribution_cash_balance,
            retirement_contribution_hsa: meeting.retirement_contribution_hsa,
            federal_estimated_paid: meeting.federal_estimated_paid,
            state_estimated_paid: meeting.state_estimated_paid,
            federal_estimated_due: meeting.federal_estimated_due,
            state_estimated_due: meeting.state_estimated_due,
            general_notes: meeting.general_notes,
            next_quarter_priorities: meeting.next_quarter_priorities,
          })
          .select()
          .single();
        if (error) throw error;
        meetingId = newMeeting.id;
        setMeeting(prev => ({ ...prev, id: meetingId }));
      }

      // Upsert strategy tracking
      const strategyUpdates = Object.entries(strategies).map(([stratNum, data]) => ({
        meeting_id: meetingId,
        strategy_number: parseInt(stratNum),
        q1_active: data.q1_active,
        q2_active: data.q2_active,
        q3_active: data.q3_active,
        q4_active: data.q4_active,
        doc1_complete: data.doc1_complete,
        doc2_complete: data.doc2_complete,
        doc3_complete: data.doc3_complete,
        estimated_savings: data.estimated_savings,
        notes: data.notes,
      }));

      if (strategyUpdates.length > 0) {
        const { error: strategyError } = await supabase
          .from('strategy_tracking')
          .upsert(strategyUpdates, { onConflict: 'meeting_id,strategy_number' });
        if (strategyError) throw strategyError;
      }

      // Upsert phase status
      const phaseUpdates = Object.entries(phaseStatus).map(([phase, status]) => ({
        client_id: clientId,
        phase: parseInt(phase),
        status,
      }));

      if (phaseUpdates.length > 0) {
        const { error: phaseError } = await supabase
          .from('phase_status')
          .upsert(phaseUpdates, { onConflict: 'client_id,phase' });
        if (phaseError) throw phaseError;
      }

      // Handle action items
      // Delete removed items
      if (meeting.id) {
        const existingIds = actionItems.filter(a => a.id).map(a => a.id);
        if (existingIds.length > 0) {
          await supabase
            .from('action_items')
            .delete()
            .eq('meeting_id', meetingId)
            .not('id', 'in', `(${existingIds.join(',')})`);
        }
      }

      // Upsert action items
      for (const item of actionItems) {
        if (item.id) {
          await supabase
            .from('action_items')
            .update({
              description: item.description,
              responsible_party: item.responsible_party,
              due_date: item.due_date || null,
              status: item.status,
              priority: item.priority,
              strategy_number: item.strategy_number,
            })
            .eq('id', item.id);
        } else if (item.description.trim()) {
          await supabase
            .from('action_items')
            .insert({
              meeting_id: meetingId,
              description: item.description,
              responsible_party: item.responsible_party,
              due_date: item.due_date || null,
              status: item.status,
              priority: item.priority,
              strategy_number: item.strategy_number,
            });
        }
      }

      const totalSavings = calculateTotalSavings();
      toast({
        title: 'Meeting saved',
        description: `Q${meeting.quarter} ${meeting.tax_year} meeting saved successfully.`,
      });
      
      onSave({ meeting, strategies, phaseStatus, actionItems }, totalSavings);
      await loadData(); // Refresh
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message || 'Failed to save meeting.',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalSavings = (): number => {
    return Object.values(strategies).reduce((total, s) => total + (s.estimated_savings || 0), 0);
  };

  const countActiveStrategies = (): number => {
    return Object.values(strategies).filter(s => s.q1_active || s.q2_active || s.q3_active || s.q4_active).length;
  };

  const calculatePathwayProgress = (): number => {
    const phaseValues: Record<string, number> = {
      'not-started': 0,
      'in-progress': 50,
      'complete': 100,
      'maintaining': 100,
    };
    let totalProgress = 0;
    Object.values(phaseStatus).forEach(status => {
      totalProgress += phaseValues[status] || 0;
    });
    return Math.round(totalProgress / 8);
  };

  const getCurrentPhase = (): string => {
    const phaseNames: Record<number, string> = {
      1: 'P1: Foundational',
      2: 'P2: Core',
      3: 'P3: Retirement',
      4: 'P4: Credits',
      5: 'P5: Real Estate',
      6: 'P6: Acquisitions',
      7: 'P7: Exit & Wealth',
      8: 'P8: Charitable',
    };
    for (let i = 1; i <= 8; i++) {
      if (phaseStatus[i] !== 'complete' && phaseStatus[i] !== 'maintaining') {
        return phaseNames[i];
      }
    }
    return 'Complete!';
  };

  const updateStrategy = (strategyNumber: number, field: keyof StrategyTrackingData, value: any) => {
    setStrategies(prev => ({
      ...prev,
      [strategyNumber]: {
        ...(prev[strategyNumber] || defaultStrategyTracking()),
        [field]: value,
      },
    }));
  };

  const getPhaseStatusColor = (status: string): string => {
    switch (status) {
      case 'complete': return 'bg-accent text-accent-foreground';
      case 'maintaining': return 'bg-success text-white';
      case 'in-progress': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-white/20 border-2 border-white/40 text-white';
    }
  };

  const formatCurrency = (value: number): string => {
    return value ? `$${value.toLocaleString()}` : '';
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  };

  const addActionItem = () => {
    setActionItems(prev => [...prev, {
      description: '',
      responsible_party: null,
      due_date: '',
      status: 'pending',
      priority: 2,
      strategy_number: null,
    }]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateActionItem = (index: number, field: keyof ActionItemData, value: any) => {
    setActionItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  if (loading) {
    return (
      <Card className="border-2 border-accent/30">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-accent/30 max-h-[85vh] overflow-y-auto">
      <CardHeader className="gradient-header text-primary-foreground sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-accent font-semibold tracking-wider">EIDUK PATHWAY™</div>
            <CardTitle className="font-display text-2xl">S-Corp Quarterly Review Workpaper</CardTitle>
            <p className="text-primary-foreground/80">Comprehensive 50-Strategy Tax Optimization Framework</p>
            <p className="text-sm text-primary-foreground/70 mt-1">
              {clientName}{companyName ? ` • ${companyName}` : ''}
            </p>
            <div className="text-accent font-display italic">Pay Less. Keep More. Build Wealth.</div>
          </div>
          
          {historicalMeetings.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                <History className="h-4 w-4" />
                <span>Past Meetings</span>
              </div>
              <Select 
                value={meeting.id || ''} 
                onValueChange={loadHistoricalMeeting}
                disabled={loadingHistory}
              >
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                  {loadingHistory ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <SelectValue placeholder="Load past meeting" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {historicalMeetings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      Q{m.quarter} {m.tax_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Meeting Information */}
        <Collapsible open={openSections.meeting} onOpenChange={() => toggleSection('meeting')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-primary">Meeting Information</h3>
            {openSections.meeting ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-secondary">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Quarter</Label>
                  <Select 
                    value={meeting.quarter.toString()} 
                    onValueChange={(v) => setMeeting(prev => ({ ...prev, quarter: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tax Year</Label>
                  <Select 
                    value={meeting.tax_year.toString()} 
                    onValueChange={(v) => setMeeting(prev => ({ ...prev, tax_year: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2026, 2025, 2024, 2023].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meeting Date</Label>
                  <Input 
                    type="date" 
                    value={meeting.meeting_date} 
                    onChange={(e) => setMeeting(prev => ({ ...prev, meeting_date: e.target.value }))} 
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Eiduk Pathway Dashboard */}
        <Collapsible open={openSections.pathway} onOpenChange={() => toggleSection('pathway')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full gradient-header text-primary-foreground p-3 rounded-lg">
            <h3 className="font-display text-lg font-semibold">The Eiduk Pathway™ Client Journey</h3>
            {openSections.pathway ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="gradient-header text-primary-foreground p-6 rounded-lg">
              <p className="text-sm opacity-90 mb-4">Systematic tax optimization through 8 strategic phases • 50 strategies • Building wealth while reducing taxes</p>
              
              {/* Phase Timeline */}
              <div className="flex flex-wrap justify-between items-start gap-2 mb-6">
                {PHASES.map((phase) => (
                  <div key={phase.id} className="flex-1 min-w-[100px] text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full ${getPhaseStatusColor(phaseStatus[phase.id] || 'not-started')} flex items-center justify-center font-bold text-lg mb-2`}>
                      P{phase.id}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide">{phase.name.replace(`Phase ${phase.id}: `, '')}</div>
                    <div className="text-xs opacity-80">{phase.strategies.length} Strategies</div>
                    <Select
                      value={phaseStatus[phase.id] || 'not-started'}
                      onValueChange={(value) => setPhaseStatus(prev => ({
                        ...prev,
                        [phase.id]: value as PhaseStatusData['status'],
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
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-accent p-6 rounded-lg text-center">
          <h3 className="font-display text-xl font-semibold text-primary mb-4">Quarterly Compliance Scorecard</h3>
          <Progress value={calculatePathwayProgress()} className="h-5 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-3 rounded-lg shadow-soft">
              <div className="text-xs text-muted-foreground uppercase">Compliance Score</div>
              <div className="text-2xl font-bold text-primary">{calculatePathwayProgress()}%</div>
            </div>
            <div className="bg-card p-3 rounded-lg shadow-soft">
              <div className="text-xs text-muted-foreground uppercase">Strategies Active</div>
              <div className="text-2xl font-bold text-secondary">{countActiveStrategies()}/50</div>
            </div>
            <div className="bg-card p-3 rounded-lg shadow-soft">
              <div className="text-xs text-muted-foreground uppercase">YTD Tax Savings</div>
              <div className="text-2xl font-bold text-success">${calculateTotalSavings().toLocaleString()}</div>
            </div>
            <div className="bg-card p-3 rounded-lg shadow-soft">
              <div className="text-xs text-muted-foreground uppercase">Quarter</div>
              <div className="text-2xl font-bold text-primary">Q{meeting.quarter}</div>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-primary">Financial Snapshot</h3>
            {openSections.financial ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>YTD Gross Revenue</Label>
                <Input 
                  value={formatCurrency(meeting.ytd_gross_revenue)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, ytd_gross_revenue: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>YTD COGS</Label>
                <Input 
                  value={formatCurrency(meeting.ytd_cogs)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, ytd_cogs: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>YTD Operating Expenses</Label>
                <Input 
                  value={formatCurrency(meeting.ytd_operating_expenses)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, ytd_operating_expenses: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>YTD Net Income</Label>
                <Input 
                  value={formatCurrency(meeting.ytd_net_income)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, ytd_net_income: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reasonable Compensation */}
        <Collapsible open={openSections.compensation} onOpenChange={() => toggleSection('compensation')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-primary">Reasonable Compensation Review</h3>
            {openSections.compensation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Current Salary</Label>
                <Input 
                  value={formatCurrency(meeting.current_salary)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, current_salary: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>Recommended Salary</Label>
                <Input 
                  value={formatCurrency(meeting.recommended_salary)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, recommended_salary: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>YTD Distributions</Label>
                <Input 
                  value={formatCurrency(meeting.ytd_distributions)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, ytd_distributions: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>Est. FICA Savings</Label>
                <Input 
                  value={formatCurrency(Math.round((meeting.current_salary - meeting.recommended_salary) * 0.153))} 
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Retirement Contributions */}
        <Collapsible open={openSections.retirement} onOpenChange={() => toggleSection('retirement')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-primary">Retirement Contributions</h3>
            {openSections.retirement ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>401(k) Contribution</Label>
                <Input 
                  value={formatCurrency(meeting.retirement_contribution_401k)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, retirement_contribution_401k: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>Profit Sharing</Label>
                <Input 
                  value={formatCurrency(meeting.retirement_contribution_profit_sharing)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, retirement_contribution_profit_sharing: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>Cash Balance</Label>
                <Input 
                  value={formatCurrency(meeting.retirement_contribution_cash_balance)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, retirement_contribution_cash_balance: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>HSA Contribution</Label>
                <Input 
                  value={formatCurrency(meeting.retirement_contribution_hsa)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, retirement_contribution_hsa: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Estimated Taxes */}
        <Collapsible open={openSections.estTax} onOpenChange={() => toggleSection('estTax')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors">
            <h3 className="font-display text-lg font-semibold text-primary">Estimated Taxes</h3>
            {openSections.estTax ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Federal Estimated Paid</Label>
                <Input 
                  value={formatCurrency(meeting.federal_estimated_paid)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, federal_estimated_paid: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>Federal Estimated Due</Label>
                <Input 
                  value={formatCurrency(meeting.federal_estimated_due)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, federal_estimated_due: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>State Estimated Paid</Label>
                <Input 
                  value={formatCurrency(meeting.state_estimated_paid)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, state_estimated_paid: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
              <div>
                <Label>State Estimated Due</Label>
                <Input 
                  value={formatCurrency(meeting.state_estimated_due)} 
                  onChange={(e) => setMeeting(prev => ({ ...prev, state_estimated_due: parseCurrency(e.target.value) }))} 
                  placeholder="$0" 
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Strategy Phases */}
        {PHASES.map((phase) => (
          <Collapsible key={phase.id} open={openSections[`phase${phase.id}`]} onOpenChange={() => toggleSection(`phase${phase.id}`)}>
            <CollapsibleTrigger className={`flex items-center justify-between w-full ${phase.color} text-white p-3 rounded-lg`}>
              <div className="flex items-center gap-3">
                <h3 className="font-display font-semibold">{phase.name}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {phase.strategies.length} Strategies • {phase.targetSavings}
                </Badge>
              </div>
              {openSections[`phase${phase.id}`] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
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
                      const strategyData = strategies[strategy.number] || defaultStrategyTracking();
                      return (
                        <tr key={strategy.number} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            <div className="font-semibold text-primary">{strategy.name}</div>
                            <div className="text-xs text-muted-foreground">{strategy.irc}</div>
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q1_active}
                              onCheckedChange={(checked) => updateStrategy(strategy.number, 'q1_active', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q2_active}
                              onCheckedChange={(checked) => updateStrategy(strategy.number, 'q2_active', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q3_active}
                              onCheckedChange={(checked) => updateStrategy(strategy.number, 'q3_active', !!checked)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={strategyData.q4_active}
                              onCheckedChange={(checked) => updateStrategy(strategy.number, 'q4_active', !!checked)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {strategy.docs.map((doc, idx) => (
                                <label key={idx} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <Checkbox
                                    checked={strategyData[`doc${idx + 1}_complete` as keyof StrategyTrackingData] as boolean}
                                    onCheckedChange={(checked) => updateStrategy(strategy.number, `doc${idx + 1}_complete` as keyof StrategyTrackingData, !!checked)}
                                    className="h-3 w-3"
                                  />
                                  <span className="text-muted-foreground">{doc}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              value={strategyData.estimated_savings ? `$${strategyData.estimated_savings.toLocaleString()}` : ''}
                              onChange={(e) => updateStrategy(strategy.number, 'estimated_savings', parseCurrency(e.target.value))}
                              placeholder="$0"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Textarea
                              value={strategyData.notes}
                              onChange={(e) => updateStrategy(strategy.number, 'notes', e.target.value)}
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
          <CollapsibleTrigger className="flex items-center justify-between w-full gradient-header text-primary-foreground p-3 rounded-lg">
            <h3 className="font-display text-lg font-semibold">Action Items & Next Steps</h3>
            {openSections.actionItems ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="md:col-span-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                        placeholder="Action item description..."
                      />
                    </div>
                    <Select
                      value={item.responsible_party || ''}
                      onValueChange={(v) => updateActionItem(index, 'responsible_party', v || null)}
                    >
                      <SelectTrigger><SelectValue placeholder="Assign to..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advisor">Advisor</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={item.due_date}
                      onChange={(e) => updateActionItem(index, 'due_date', e.target.value)}
                    />
                    <Select
                      value={item.status}
                      onValueChange={(v) => updateActionItem(index, 'status', v as ActionItemData['status'])}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeActionItem(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addActionItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Action Item
              </Button>
            </div>
            
            <div>
              <Label>General Notes</Label>
              <Textarea
                value={meeting.general_notes}
                onChange={(e) => setMeeting(prev => ({ ...prev, general_notes: e.target.value }))}
                placeholder="General meeting notes..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Next Quarter Priorities</Label>
              <Textarea
                value={meeting.next_quarter_priorities}
                onChange={(e) => setMeeting(prev => ({ ...prev, next_quarter_priorities: e.target.value }))}
                placeholder="Strategies to implement or review next quarter..."
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !clientId}
            className="bg-primary hover:bg-secondary"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Save Q{meeting.quarter} {meeting.tax_year} Meeting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
