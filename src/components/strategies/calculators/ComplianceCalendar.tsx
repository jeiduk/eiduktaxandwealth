import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ComplianceCalendarProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface TaskData {
  completed: boolean;
  notes?: string;
}

interface CalendarData {
  businessName: string;
  taxYear: string;
  entityType: string;
  ein: string;
  monthlyTasks: {
    bookkeeping: TaskData;
    payroll: TaskData;
    expense: TaskData;
    mileage: TaskData;
    familyTimesheet: TaskData;
  };
  quarterlyTasks: {
    estimatedTax: TaskData;
    strategicMeeting: TaskData;
    boardMeeting: TaskData;
    form941: TaskData;
  };
  annualTasks: {
    w2s1099s: TaskData;
    annualMeeting: TaskData;
    corporateReport: TaskData;
    businessLicense: TaskData;
  };
}

const MONTHLY_TASKS = [
  { id: 'bookkeeping', title: 'Monthly Bookkeeping Submission', deadline: '5th of each month', description: 'Submit bank statements, credit card statements, and receipts' },
  { id: 'payroll', title: 'Payroll Processing & Reporting', deadline: 'As scheduled', description: 'Process payroll and ensure tax deposits are timely' },
  { id: 'expense', title: 'Expense Reimbursement Submission', deadline: '10th of each month', description: 'Submit Accountable Plan expense reimbursement form with documentation' },
  { id: 'mileage', title: 'Mileage Tracking', deadline: 'Ongoing', description: 'Track all business mileage with date, locations, purpose, and miles' },
  { id: 'familyTimesheet', title: 'Child/Family Time Sheet', deadline: '10th of each month', description: 'Submit time sheets for employed children or family members' },
];

const QUARTERLY_TASKS = [
  { id: 'estimatedTax', title: 'Estimated Tax Payments', deadline: '4/15, 6/15, 9/15, 1/15', description: 'Pay quarterly estimated taxes for personal income tax liability' },
  { id: 'strategicMeeting', title: 'Quarterly Strategic Planning Meeting', deadline: 'End of quarter', description: '60-90 minute session to review YTD performance and plan next quarter' },
  { id: 'boardMeeting', title: 'Board/Advisory Meeting & Minutes', deadline: 'Quarterly', description: 'Conduct quarterly board meeting and document minutes' },
  { id: 'form941', title: 'Quarterly 941 Filing', deadline: 'Last day of month after quarter', description: 'File Form 941 for quarterly payroll tax reporting' },
];

const ANNUAL_TASKS = [
  { id: 'w2s1099s', title: 'W-2s and 1099s', deadline: 'January 31', description: 'Issue W-2s to employees and 1099s to contractors' },
  { id: 'annualMeeting', title: 'Annual Shareholder Meeting', deadline: 'Annually', description: 'Hold annual shareholder meeting and document minutes' },
  { id: 'corporateReport', title: 'Annual Corporate Report', deadline: 'Varies by state', description: 'File annual report with Secretary of State' },
  { id: 'businessLicense', title: 'Business License Renewal', deadline: 'Varies', description: 'Renew business licenses and permits as required' },
];

export function ComplianceCalendar({ clientName, companyName, savedData, onSave, onClose }: ComplianceCalendarProps) {
  const [data, setData] = useState<CalendarData>({
    businessName: (savedData.businessName as string) || companyName || '',
    taxYear: (savedData.taxYear as string) || new Date().getFullYear().toString(),
    entityType: (savedData.entityType as string) || 'S-Corporation',
    ein: (savedData.ein as string) || '',
    monthlyTasks: (savedData.monthlyTasks as CalendarData['monthlyTasks']) || {
      bookkeeping: { completed: false },
      payroll: { completed: false },
      expense: { completed: false },
      mileage: { completed: false },
      familyTimesheet: { completed: false },
    },
    quarterlyTasks: (savedData.quarterlyTasks as CalendarData['quarterlyTasks']) || {
      estimatedTax: { completed: false },
      strategicMeeting: { completed: false },
      boardMeeting: { completed: false },
      form941: { completed: false },
    },
    annualTasks: (savedData.annualTasks as CalendarData['annualTasks']) || {
      w2s1099s: { completed: false },
      annualMeeting: { completed: false },
      corporateReport: { completed: false },
      businessLicense: { completed: false },
    },
  });

  const handleSave = () => {
    onSave(data as unknown as Record<string, unknown>);
  };

  const toggleTask = (category: 'monthlyTasks' | 'quarterlyTasks' | 'annualTasks', taskId: string) => {
    setData(prev => {
      const currentCategory = prev[category];
      const currentTask = currentCategory[taskId as keyof typeof currentCategory] as TaskData;
      return {
        ...prev,
        [category]: {
          ...currentCategory,
          [taskId]: {
            ...currentTask,
            completed: !currentTask.completed,
          },
        },
      };
    });
  };

  const calculateProgress = () => {
    const allTasks = [
      ...Object.values(data.monthlyTasks),
      ...Object.values(data.quarterlyTasks),
      ...Object.values(data.annualTasks),
    ];
    const completed = allTasks.filter(t => t.completed).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  return (
    <Card className="border-2 border-eiduk-gold/30">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
        <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK TAX & WEALTH</div>
        <CardTitle className="font-display text-2xl">Monthly Compliance Calendar</CardTitle>
        <p className="text-white/80">S-Corporation Owner's Complete Annual Tax & Compliance Guide</p>
        <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Client Information */}
        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
          <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input
                value={data.businessName}
                onChange={(e) => setData(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tax Year</Label>
              <Input
                value={data.taxYear}
                onChange={(e) => setData(prev => ({ ...prev, taxYear: e.target.value }))}
              />
            </div>
            <div>
              <Label>Entity Type</Label>
              <Input
                value={data.entityType}
                onChange={(e) => setData(prev => ({ ...prev, entityType: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tax ID (EIN)</Label>
              <Input
                value={data.ein}
                onChange={(e) => setData(prev => ({ ...prev, ein: e.target.value }))}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <span className="font-semibold">Compliance Progress</span>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1 bg-success/10 border-success text-success">
            {calculateProgress()}% Complete
          </Badge>
        </div>

        {/* Important Note */}
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-warning-foreground">Important Note:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                This calendar outlines ALL submission deadlines and requirements for S-Corporation owners. 
                Review this calendar at the beginning of each month to stay compliant.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Monthly Tasks */}
        <div>
          <div className="flex items-center justify-between bg-gradient-to-r from-eiduk-blue to-eiduk-navy text-white p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-display font-semibold">MONTHLY TASKS</span>
            </div>
            <Badge className="bg-white/20 text-white">Every Month</Badge>
          </div>
          <div className="space-y-3">
            {MONTHLY_TASKS.map(task => (
              <div 
                key={task.id}
                className={`p-4 rounded-lg border-l-4 ${
                  data.monthlyTasks[task.id as keyof typeof data.monthlyTasks]?.completed 
                    ? 'bg-success/5 border-success' 
                    : 'bg-card border-eiduk-blue'
                } border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-display font-semibold text-eiduk-navy">{task.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Deadline: {task.deadline}</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={data.monthlyTasks[task.id as keyof typeof data.monthlyTasks]?.completed}
                    onCheckedChange={() => toggleTask('monthlyTasks', task.id)}
                    className="h-6 w-6"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quarterly Tasks */}
        <div>
          <div className="flex items-center justify-between bg-gradient-to-r from-eiduk-blue to-eiduk-navy text-white p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-display font-semibold">QUARTERLY TASKS</span>
            </div>
            <Badge className="bg-white/20 text-white">Every Quarter</Badge>
          </div>
          <div className="space-y-3">
            {QUARTERLY_TASKS.map(task => (
              <div 
                key={task.id}
                className={`p-4 rounded-lg border-l-4 ${
                  data.quarterlyTasks[task.id as keyof typeof data.quarterlyTasks]?.completed 
                    ? 'bg-success/5 border-success' 
                    : 'bg-card border-eiduk-blue'
                } border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-display font-semibold text-eiduk-navy">{task.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Deadline: {task.deadline}</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={data.quarterlyTasks[task.id as keyof typeof data.quarterlyTasks]?.completed}
                    onCheckedChange={() => toggleTask('quarterlyTasks', task.id)}
                    className="h-6 w-6"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Annual Tasks */}
        <div>
          <div className="flex items-center justify-between bg-gradient-to-r from-eiduk-blue to-eiduk-navy text-white p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-display font-semibold">ANNUAL TASKS</span>
            </div>
            <Badge className="bg-white/20 text-white">Yearly</Badge>
          </div>
          <div className="space-y-3">
            {ANNUAL_TASKS.map(task => (
              <div 
                key={task.id}
                className={`p-4 rounded-lg border-l-4 ${
                  data.annualTasks[task.id as keyof typeof data.annualTasks]?.completed 
                    ? 'bg-success/5 border-success' 
                    : 'bg-card border-eiduk-blue'
                } border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-display font-semibold text-eiduk-navy">{task.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Deadline: {task.deadline}</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={data.annualTasks[task.id as keyof typeof data.annualTasks]?.completed}
                    onCheckedChange={() => toggleTask('annualTasks', task.id)}
                    className="h-6 w-6"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
            <FileText className="h-4 w-4 mr-2" />
            Save Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
