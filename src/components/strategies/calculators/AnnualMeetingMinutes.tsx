import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle } from 'lucide-react';

interface AnnualMeetingMinutesProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface MeetingData {
  companyName: string;
  entityType: 'scorp' | 'llc';
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  fiscalYearEnd: string;
  attendees: string;
  shareholderNames: string;
  officerNames: string;
  resolutions: {
    electOfficers: boolean;
    approveMinutes: boolean;
    reviewFinancials: boolean;
    approveCompensation: boolean;
    authorizeContracts: boolean;
    authorizeBanking: boolean;
    approveTaxElections: boolean;
    approveRetirement: boolean;
    approveDistributions: boolean;
  };
  officerElections: {
    president: string;
    vicePresident: string;
    secretary: string;
    treasurer: string;
  };
  compensationDetails: string;
  distributionsApproved: string;
  additionalBusiness: string;
  nextMeetingDate: string;
}

export function AnnualMeetingMinutes({ clientName, companyName, savedData, onSave, onClose }: AnnualMeetingMinutesProps) {
  const [data, setData] = useState<MeetingData>({
    companyName: (savedData.companyName as string) || companyName || '',
    entityType: (savedData.entityType as 'scorp' | 'llc') || 'scorp',
    meetingDate: (savedData.meetingDate as string) || '',
    meetingTime: (savedData.meetingTime as string) || '',
    meetingLocation: (savedData.meetingLocation as string) || '',
    fiscalYearEnd: (savedData.fiscalYearEnd as string) || 'December 31',
    attendees: (savedData.attendees as string) || '',
    shareholderNames: (savedData.shareholderNames as string) || '',
    officerNames: (savedData.officerNames as string) || '',
    resolutions: (savedData.resolutions as MeetingData['resolutions']) || {
      electOfficers: true,
      approveMinutes: true,
      reviewFinancials: true,
      approveCompensation: true,
      authorizeContracts: false,
      authorizeBanking: false,
      approveTaxElections: true,
      approveRetirement: false,
      approveDistributions: false,
    },
    officerElections: (savedData.officerElections as MeetingData['officerElections']) || {
      president: '',
      vicePresident: '',
      secretary: '',
      treasurer: '',
    },
    compensationDetails: (savedData.compensationDetails as string) || '',
    distributionsApproved: (savedData.distributionsApproved as string) || '',
    additionalBusiness: (savedData.additionalBusiness as string) || '',
    nextMeetingDate: (savedData.nextMeetingDate as string) || '',
  });

  const handleSave = () => {
    onSave(data as unknown as Record<string, unknown>);
  };

  const toggleResolution = (key: keyof MeetingData['resolutions']) => {
    setData(prev => ({
      ...prev,
      resolutions: {
        ...prev.resolutions,
        [key]: !prev.resolutions[key],
      },
    }));
  };

  return (
    <Card className="border-2 border-eiduk-gold/30">
      <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white">
        <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK TAX & WEALTH</div>
        <CardTitle className="font-display text-2xl">Annual Meeting Minutes</CardTitle>
        <p className="text-white/80">Formal Documentation for S-Corp & LLC Entities</p>
        <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Alert Box */}
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-warning-foreground">Corporate Compliance Requirement:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Annual meeting minutes are required to maintain corporate formalities and protect your liability shield.
                Document all major business decisions and officer elections.
              </p>
            </div>
          </div>
        </div>

        {/* Entity Type Toggle */}
        <div className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-4 rounded-lg">
          <div className="flex items-center justify-center gap-4">
            <span className="text-white font-semibold">Entity Type:</span>
            <div className="flex bg-white/15 rounded-lg overflow-hidden">
              <button
                onClick={() => setData(prev => ({ ...prev, entityType: 'scorp' }))}
                className={`px-6 py-2 font-semibold transition-colors ${
                  data.entityType === 'scorp' 
                    ? 'bg-white text-eiduk-navy' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                S-Corporation
              </button>
              <button
                onClick={() => setData(prev => ({ ...prev, entityType: 'llc' }))}
                className={`px-6 py-2 font-semibold transition-colors ${
                  data.entityType === 'llc' 
                    ? 'bg-white text-eiduk-navy' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                LLC
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Information */}
        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
          <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Meeting Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={data.companyName}
                onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fiscal Year End</Label>
              <Input
                value={data.fiscalYearEnd}
                onChange={(e) => setData(prev => ({ ...prev, fiscalYearEnd: e.target.value }))}
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
            <div>
              <Label>Meeting Time</Label>
              <Input
                type="time"
                value={data.meetingTime}
                onChange={(e) => setData(prev => ({ ...prev, meetingTime: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Meeting Location</Label>
              <Input
                value={data.meetingLocation}
                onChange={(e) => setData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                placeholder="e.g., Principal Office, 123 Main St, City, State"
              />
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <h3 className="font-display text-lg font-semibold text-eiduk-navy bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Attendance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{data.entityType === 'scorp' ? 'Shareholders Present' : 'Members Present'}</Label>
              <Textarea
                value={data.shareholderNames}
                onChange={(e) => setData(prev => ({ ...prev, shareholderNames: e.target.value }))}
                placeholder="List names and ownership percentages..."
              />
            </div>
            <div>
              <Label>{data.entityType === 'scorp' ? 'Officers Present' : 'Managers Present'}</Label>
              <Textarea
                value={data.officerNames}
                onChange={(e) => setData(prev => ({ ...prev, officerNames: e.target.value }))}
                placeholder="List officers/managers and titles..."
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Resolutions */}
        <div>
          <h3 className="font-display text-lg font-semibold text-eiduk-navy bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
            Resolutions Adopted
          </h3>
          <div className="space-y-3">
            {[
              { key: 'electOfficers', label: 'Election of Officers/Managers' },
              { key: 'approveMinutes', label: 'Approval of Prior Year Minutes' },
              { key: 'reviewFinancials', label: 'Review & Approval of Financial Statements' },
              { key: 'approveCompensation', label: 'Approval of Officer/Member Compensation' },
              { key: 'authorizeContracts', label: 'Authorization of Contracts' },
              { key: 'authorizeBanking', label: 'Banking Resolutions' },
              { key: 'approveTaxElections', label: 'Tax Elections & Filings' },
              { key: 'approveRetirement', label: 'Retirement Plan Contributions' },
              { key: 'approveDistributions', label: 'Distributions/Dividends' },
            ].map(item => (
              <div 
                key={item.key}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  data.resolutions[item.key as keyof MeetingData['resolutions']] 
                    ? 'bg-success/10 border border-success/20' 
                    : 'bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={data.resolutions[item.key as keyof MeetingData['resolutions']]}
                  onCheckedChange={() => toggleResolution(item.key as keyof MeetingData['resolutions'])}
                />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Officer Elections */}
        {data.resolutions.electOfficers && (
          <div>
            <h3 className="font-display text-lg font-semibold text-eiduk-navy bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-3 rounded-lg mb-4">
              Officer Elections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>President</Label>
                <Input
                  value={data.officerElections.president}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    officerElections: { ...prev.officerElections, president: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>Vice President</Label>
                <Input
                  value={data.officerElections.vicePresident}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    officerElections: { ...prev.officerElections, vicePresident: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>Secretary</Label>
                <Input
                  value={data.officerElections.secretary}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    officerElections: { ...prev.officerElections, secretary: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>Treasurer</Label>
                <Input
                  value={data.officerElections.treasurer}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    officerElections: { ...prev.officerElections, treasurer: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Compensation Details */}
        {data.resolutions.approveCompensation && (
          <div>
            <Label>Compensation Details</Label>
            <Textarea
              value={data.compensationDetails}
              onChange={(e) => setData(prev => ({ ...prev, compensationDetails: e.target.value }))}
              placeholder="Document approved compensation amounts for each officer/member..."
            />
          </div>
        )}

        {/* Distributions */}
        {data.resolutions.approveDistributions && (
          <div>
            <Label>Distributions Approved</Label>
            <Textarea
              value={data.distributionsApproved}
              onChange={(e) => setData(prev => ({ ...prev, distributionsApproved: e.target.value }))}
              placeholder="Document approved distribution amounts..."
            />
          </div>
        )}

        {/* Additional Business */}
        <div>
          <Label>Additional Business Discussed</Label>
          <Textarea
            value={data.additionalBusiness}
            onChange={(e) => setData(prev => ({ ...prev, additionalBusiness: e.target.value }))}
            placeholder="Document any other business matters discussed..."
          />
        </div>

        {/* Next Meeting */}
        <div>
          <Label>Next Annual Meeting Date</Label>
          <Input
            type="date"
            value={data.nextMeetingDate}
            onChange={(e) => setData(prev => ({ ...prev, nextMeetingDate: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
            <FileText className="h-4 w-4 mr-2" />
            Save Minutes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
