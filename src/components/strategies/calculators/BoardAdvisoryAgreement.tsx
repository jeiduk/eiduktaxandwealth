import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle } from 'lucide-react';

interface BoardAdvisoryAgreementProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface AgreementData {
  effectiveDate: string;
  companyName: string;
  companyEin: string;
  companyAddress1: string;
  companyAddress2: string;
  advisorName: string;
  advisorSsn: string;
  advisorAddress1: string;
  advisorAddress2: string;
  relationship: string;
  expertise: string;
  meetingsPerYear: string;
  hoursPerMeeting: string;
  additionalHours: string;
  meetingFormats: {
    inPerson: boolean;
    advisorLocation: boolean;
    virtual: boolean;
    phone: boolean;
  };
  compensationStructure: {
    perMeeting: boolean;
    perMeetingAmount: string;
    retainer: boolean;
    retainerAmount: string;
    hourly: boolean;
    hourlyAmount: string;
  };
  paymentDays: string;
  paymentFrequency: string;
  conflicts: string;
  termYears: string;
  noticeDays: string;
}

export function BoardAdvisoryAgreement({ clientName, companyName, savedData, onSave, onClose }: BoardAdvisoryAgreementProps) {
  const [data, setData] = useState<AgreementData>({
    effectiveDate: (savedData.effectiveDate as string) || '',
    companyName: (savedData.companyName as string) || companyName || '',
    companyEin: (savedData.companyEin as string) || '',
    companyAddress1: (savedData.companyAddress1 as string) || '',
    companyAddress2: (savedData.companyAddress2 as string) || '',
    advisorName: (savedData.advisorName as string) || '',
    advisorSsn: (savedData.advisorSsn as string) || '',
    advisorAddress1: (savedData.advisorAddress1 as string) || '',
    advisorAddress2: (savedData.advisorAddress2 as string) || '',
    relationship: (savedData.relationship as string) || '',
    expertise: (savedData.expertise as string) || '',
    meetingsPerYear: (savedData.meetingsPerYear as string) || '4',
    hoursPerMeeting: (savedData.hoursPerMeeting as string) || '2',
    additionalHours: (savedData.additionalHours as string) || '10',
    meetingFormats: (savedData.meetingFormats as AgreementData['meetingFormats']) || {
      inPerson: true,
      advisorLocation: false,
      virtual: true,
      phone: false,
    },
    compensationStructure: (savedData.compensationStructure as AgreementData['compensationStructure']) || {
      perMeeting: false,
      perMeetingAmount: '',
      retainer: true,
      retainerAmount: '',
      hourly: false,
      hourlyAmount: '',
    },
    paymentDays: (savedData.paymentDays as string) || '30',
    paymentFrequency: (savedData.paymentFrequency as string) || 'quarterly',
    conflicts: (savedData.conflicts as string) || '',
    termYears: (savedData.termYears as string) || '1',
    noticeDays: (savedData.noticeDays as string) || '30',
  });

  const handleSave = () => {
    // Calculate estimated savings based on compensation
    let totalComp = 0;
    if (data.compensationStructure.retainer && data.compensationStructure.retainerAmount) {
      totalComp = parseFloat(data.compensationStructure.retainerAmount) || 0;
    } else if (data.compensationStructure.perMeeting && data.compensationStructure.perMeetingAmount) {
      const perMeeting = parseFloat(data.compensationStructure.perMeetingAmount) || 0;
      const meetings = parseInt(data.meetingsPerYear) || 4;
      totalComp = perMeeting * meetings;
    }
    // Estimated tax savings at ~25% marginal rate (business deduction)
    const savings = Math.round(totalComp * 0.25);
    onSave(data as unknown as Record<string, unknown>, savings);
  };

  return (
    <Card className="border-2 border-eiduk-gold/30">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
        <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK TAX & WEALTH</div>
        <CardTitle className="font-display text-2xl">Board of Advisors Agreement</CardTitle>
        <p className="text-white/80">Advisory Services Contract for Business Guidance and Strategic Support</p>
        <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Alert Box */}
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-warning-foreground">Purpose:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                This agreement establishes a formal advisory relationship with reasonable compensation for legitimate 
                business guidance. Proper documentation supports tax deduction of advisory fees and demonstrates 
                business purpose for IRS compliance. <span className="text-purple-600 font-semibold">#5 Family Employment IRC §162</span>
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Date & Parties */}
        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
          <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Agreement Date & Parties</h3>
          
          <div className="mb-4">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={data.effectiveDate}
              onChange={(e) => setData(prev => ({ ...prev, effectiveDate: e.target.value }))}
            />
          </div>

          <h4 className="font-semibold text-eiduk-navy mt-6 mb-3">Company Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={data.companyName}
                onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div>
              <Label>EIN</Label>
              <Input
                value={data.companyEin}
                onChange={(e) => setData(prev => ({ ...prev, companyEin: e.target.value }))}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={data.companyAddress1}
                onChange={(e) => setData(prev => ({ ...prev, companyAddress1: e.target.value }))}
              />
            </div>
            <div>
              <Label>City, State, ZIP</Label>
              <Input
                value={data.companyAddress2}
                onChange={(e) => setData(prev => ({ ...prev, companyAddress2: e.target.value }))}
              />
            </div>
          </div>

          <h4 className="font-semibold text-eiduk-navy mt-6 mb-3">Advisor Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Advisor Name</Label>
              <Input
                value={data.advisorName}
                onChange={(e) => setData(prev => ({ ...prev, advisorName: e.target.value }))}
              />
            </div>
            <div>
              <Label>SSN/EIN</Label>
              <Input
                value={data.advisorSsn}
                onChange={(e) => setData(prev => ({ ...prev, advisorSsn: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={data.advisorAddress1}
                onChange={(e) => setData(prev => ({ ...prev, advisorAddress1: e.target.value }))}
              />
            </div>
            <div>
              <Label>City, State, ZIP</Label>
              <Input
                value={data.advisorAddress2}
                onChange={(e) => setData(prev => ({ ...prev, advisorAddress2: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Relationship to Company</Label>
              <Input
                value={data.relationship}
                onChange={(e) => setData(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder="e.g., Spouse, Parent, Industry Expert"
              />
            </div>
          </div>
        </div>

        {/* Advisory Services */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Advisory Services
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            The Advisor agrees to provide business advisory services including strategic planning, industry expertise, 
            financial review, business development, risk assessment, and operational efficiency recommendations.
          </p>
          <div>
            <Label>Specific Areas of Expertise (Critical for IRS Documentation)</Label>
            <Textarea
              value={data.expertise}
              onChange={(e) => setData(prev => ({ ...prev, expertise: e.target.value }))}
              placeholder="Describe the specific expertise, qualifications, and unique value this advisor brings to the company. Be detailed - this supports the reasonableness of compensation."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Separator />

        {/* Meetings & Time Commitment */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Meetings & Time Commitment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Regular Meetings Per Year</Label>
              <Input
                type="number"
                value={data.meetingsPerYear}
                onChange={(e) => setData(prev => ({ ...prev, meetingsPerYear: e.target.value }))}
                placeholder="e.g., 4"
              />
            </div>
            <div>
              <Label>Hours Per Meeting</Label>
              <Input
                type="number"
                value={data.hoursPerMeeting}
                onChange={(e) => setData(prev => ({ ...prev, hoursPerMeeting: e.target.value }))}
                placeholder="e.g., 2"
              />
            </div>
            <div>
              <Label>Additional Consultation Hours</Label>
              <Input
                type="number"
                value={data.additionalHours}
                onChange={(e) => setData(prev => ({ ...prev, additionalHours: e.target.value }))}
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <Label>Meeting Format (check all that apply)</Label>
          <div className="space-y-2 mt-2">
            {[
              { key: 'inPerson', label: 'In person at Company location' },
              { key: 'advisorLocation', label: "At Advisor's location or other agreed venue" },
              { key: 'virtual', label: 'Virtually via video conference' },
              { key: 'phone', label: 'By telephone conference' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Checkbox
                  checked={data.meetingFormats[item.key as keyof typeof data.meetingFormats]}
                  onCheckedChange={(checked) => setData(prev => ({
                    ...prev,
                    meetingFormats: { ...prev.meetingFormats, [item.key]: checked }
                  }))}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Compensation */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Compensation
          </h3>
          
          <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue space-y-4">
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <Checkbox
                checked={data.compensationStructure.perMeeting}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, perMeeting: !!checked }
                }))}
              />
              <span className="font-semibold">Per Meeting Fee: $</span>
              <Input
                className="w-32"
                value={data.compensationStructure.perMeetingAmount}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, perMeetingAmount: e.target.value }
                }))}
                placeholder="0.00"
              />
              <span>per meeting attended</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <Checkbox
                checked={data.compensationStructure.retainer}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, retainer: !!checked }
                }))}
              />
              <span className="font-semibold">Annual Retainer: $</span>
              <Input
                className="w-32"
                value={data.compensationStructure.retainerAmount}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, retainerAmount: e.target.value }
                }))}
                placeholder="0.00"
              />
              <span>per year</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <Checkbox
                checked={data.compensationStructure.hourly}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, hourly: !!checked }
                }))}
              />
              <span className="font-semibold">Hourly Rate: $</span>
              <Input
                className="w-32"
                value={data.compensationStructure.hourlyAmount}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  compensationStructure: { ...prev.compensationStructure, hourlyAmount: e.target.value }
                }))}
                placeholder="0.00"
              />
              <span>per hour for additional consultation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Payment Terms (Days)</Label>
                <Input
                  type="number"
                  value={data.paymentDays}
                  onChange={(e) => setData(prev => ({ ...prev, paymentDays: e.target.value }))}
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <Label>Payment Frequency</Label>
                <Select 
                  value={data.paymentFrequency} 
                  onValueChange={(value) => setData(prev => ({ ...prev, paymentFrequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">After Each Meeting</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg mt-4">
            <strong className="text-warning-foreground">IRS Compliance Note:</strong>
            <p className="text-sm text-muted-foreground mt-1">
              Advisory fees must be reasonable and commensurate with the value of services provided. 
              Document the advisor's qualifications, time commitment, and market rates for comparable services. 
              For family members, be especially careful to establish arm's-length compensation.
            </p>
          </div>
        </div>

        <Separator />

        {/* Term and Termination */}
        <div>
          <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Term and Termination
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Initial Term (Years)</Label>
              <Input
                type="number"
                value={data.termYears}
                onChange={(e) => setData(prev => ({ ...prev, termYears: e.target.value }))}
                placeholder="e.g., 1"
              />
            </div>
            <div>
              <Label>Termination Notice (Days)</Label>
              <Input
                type="number"
                value={data.noticeDays}
                onChange={(e) => setData(prev => ({ ...prev, noticeDays: e.target.value }))}
                placeholder="e.g., 30"
              />
            </div>
          </div>
        </div>

        {/* Conflicts of Interest */}
        <div>
          <Label>Current or Potential Conflicts of Interest (if any)</Label>
          <Textarea
            value={data.conflicts}
            onChange={(e) => setData(prev => ({ ...prev, conflicts: e.target.value }))}
            placeholder="Disclose any current or potential conflicts of interest, competing businesses, or other relationships that may affect objectivity..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
            <FileText className="h-4 w-4 mr-2" />
            Save Agreement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
