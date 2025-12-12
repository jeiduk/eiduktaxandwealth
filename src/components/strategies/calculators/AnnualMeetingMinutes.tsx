import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle, Printer, Save, X } from 'lucide-react';

interface AnnualMeetingMinutesProps {
  clientName: string;
  companyName?: string;
  savedData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>, savings?: number) => void;
  onClose: () => void;
}

interface Director {
  name: string;
  address: string;
  present: boolean;
}

interface Shareholder {
  name: string;
  shares: string;
  representation: 'in-person' | 'proxy' | '';
}

interface WaiverSignature {
  name: string;
  date: string;
}

interface MeetingData {
  companyName: string;
  ein: string;
  stateOfFormation: string;
  businessAddress: string;
  entityType: 'scorp' | 'llc';
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  meetingType: 'annual' | 'special';
  fiscalYearEnd: string;
  
  // Quorum
  directors: Director[];
  shareholders: Shareholder[];
  quorumConfirmed: boolean;
  
  // Chairperson & Secretary
  chairperson: string;
  meetingSecretary: string;
  
  // Officer Elections
  officerElections: {
    president: string;
    vicePresident: string;
    secretary: string;
    treasurer: string;
  };
  
  // Resolutions
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
  
  compensationDetails: string;
  distributionsApproved: string;
  additionalBusiness: string;
  nextMeetingDate: string;
  nextMeetingTime: string;
  nextMeetingLocation: string;
  
  // Secretary Certification
  secretaryPrintName: string;
  secretaryDate: string;
  
  // Waiver of Notice
  waiverSignatures: WaiverSignature[];
}

const defaultDirectors: Director[] = [
  { name: '', address: '', present: true },
  { name: '', address: '', present: true },
  { name: '', address: '', present: false },
];

const defaultShareholders: Shareholder[] = [
  { name: '', shares: '', representation: 'in-person' },
  { name: '', shares: '', representation: 'in-person' },
  { name: '', shares: '', representation: '' },
];

const defaultWaiverSignatures: WaiverSignature[] = [
  { name: '', date: '' },
  { name: '', date: '' },
  { name: '', date: '' },
  { name: '', date: '' },
];

export function AnnualMeetingMinutes({ clientName, companyName, savedData, onSave, onClose }: AnnualMeetingMinutesProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<MeetingData>({
    companyName: (savedData.companyName as string) || companyName || '',
    ein: (savedData.ein as string) || '',
    stateOfFormation: (savedData.stateOfFormation as string) || '',
    businessAddress: (savedData.businessAddress as string) || '',
    entityType: (savedData.entityType as 'scorp' | 'llc') || 'scorp',
    meetingDate: (savedData.meetingDate as string) || '',
    meetingTime: (savedData.meetingTime as string) || '',
    meetingLocation: (savedData.meetingLocation as string) || '',
    meetingType: (savedData.meetingType as 'annual' | 'special') || 'annual',
    fiscalYearEnd: (savedData.fiscalYearEnd as string) || 'December 31',
    
    directors: (savedData.directors as Director[]) || defaultDirectors,
    shareholders: (savedData.shareholders as Shareholder[]) || defaultShareholders,
    quorumConfirmed: (savedData.quorumConfirmed as boolean) ?? true,
    
    chairperson: (savedData.chairperson as string) || '',
    meetingSecretary: (savedData.meetingSecretary as string) || '',
    
    officerElections: (savedData.officerElections as MeetingData['officerElections']) || {
      president: '',
      vicePresident: '',
      secretary: '',
      treasurer: '',
    },
    
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
    
    compensationDetails: (savedData.compensationDetails as string) || '',
    distributionsApproved: (savedData.distributionsApproved as string) || '',
    additionalBusiness: (savedData.additionalBusiness as string) || '',
    nextMeetingDate: (savedData.nextMeetingDate as string) || '',
    nextMeetingTime: (savedData.nextMeetingTime as string) || '',
    nextMeetingLocation: (savedData.nextMeetingLocation as string) || '',
    
    secretaryPrintName: (savedData.secretaryPrintName as string) || '',
    secretaryDate: (savedData.secretaryDate as string) || '',
    
    waiverSignatures: (savedData.waiverSignatures as WaiverSignature[]) || defaultWaiverSignatures,
  });

  const handleSave = () => {
    onSave(data as unknown as Record<string, unknown>);
  };

  const handlePrint = () => {
    window.print();
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

  const updateDirector = (index: number, field: keyof Director, value: string | boolean) => {
    setData(prev => ({
      ...prev,
      directors: prev.directors.map((d, i) => i === index ? { ...d, [field]: value } : d),
    }));
  };

  const updateShareholder = (index: number, field: keyof Shareholder, value: string) => {
    setData(prev => ({
      ...prev,
      shareholders: prev.shareholders.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const updateWaiverSignature = (index: number, field: keyof WaiverSignature, value: string) => {
    setData(prev => ({
      ...prev,
      waiverSignatures: prev.waiverSignatures.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const isScorp = data.entityType === 'scorp';
  const directorLabel = isScorp ? 'Directors' : 'Managers';
  const shareholderLabel = isScorp ? 'Shareholders' : 'Members';
  const sharesLabel = isScorp ? 'Shares' : 'Membership %';

  return (
    <div className="space-y-6">
      {/* Action Bar - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <h2 className="font-display text-xl font-semibold text-eiduk-navy">Annual Meeting Minutes</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print:p-0">
        <Card className="border-2 border-eiduk-gold/30 print:border-0 print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white print:bg-eiduk-navy">
            <div className="text-sm text-eiduk-gold font-semibold tracking-wider">EIDUK TAX & WEALTH</div>
            <CardTitle className="font-display text-2xl">Annual Meeting Minutes</CardTitle>
            <p className="text-white/80">
              {isScorp ? 'S-Corporation Board of Directors & Shareholders' : 'LLC Annual Meeting of Members'}
            </p>
            <div className="text-eiduk-gold font-display italic">Pay Less. Keep More. Build Wealth.</div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Alert Box */}
            <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg print:hidden">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-warning-foreground">Corporate Compliance Requirement:</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Annual meeting minutes are required to maintain corporate formalities and protect your liability shield.
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Type Toggle */}
            <div className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-4 rounded-lg print:hidden">
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

            {/* Entity Information */}
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <h3 className="font-display text-lg font-semibold text-yellow-800 mb-4">Entity Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Legal Entity Name</Label>
                  <Input
                    value={data.companyName}
                    onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Full legal name as registered"
                  />
                </div>
                <div>
                  <Label>EIN</Label>
                  <Input
                    value={data.ein}
                    onChange={(e) => setData(prev => ({ ...prev, ein: e.target.value }))}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <Label>State of {isScorp ? 'Incorporation' : 'Formation'}</Label>
                  <Input
                    value={data.stateOfFormation}
                    onChange={(e) => setData(prev => ({ ...prev, stateOfFormation: e.target.value }))}
                    placeholder="e.g., California, Illinois"
                  />
                </div>
                <div>
                  <Label>Principal Business Address</Label>
                  <Input
                    value={data.businessAddress}
                    onChange={(e) => setData(prev => ({ ...prev, businessAddress: e.target.value }))}
                    placeholder="Street, City, State ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Information */}
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-eiduk-blue">
              <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Meeting Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    value={data.meetingTime}
                    onChange={(e) => setData(prev => ({ ...prev, meetingTime: e.target.value }))}
                    placeholder="e.g., 8:00 AM"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={data.meetingLocation}
                    onChange={(e) => setData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                    placeholder="Principal Office, Virtual, etc."
                  />
                </div>
                <div>
                  <Label>Meeting Type</Label>
                  <select
                    value={data.meetingType}
                    onChange={(e) => setData(prev => ({ ...prev, meetingType: e.target.value as 'annual' | 'special' }))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="annual">Annual Meeting</option>
                    <option value="special">Special Meeting</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            {/* I. QUORUM */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                I. Quorum
              </h3>
              
              <h4 className="font-semibold text-eiduk-navy mb-3">{directorLabel} Present:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm mb-6">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border p-2 text-left w-16">Present</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.directors.map((director, index) => (
                      <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="border p-2 text-center">
                          <Checkbox
                            checked={director.present}
                            onCheckedChange={(checked) => updateDirector(index, 'present', !!checked)}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={director.name}
                            onChange={(e) => updateDirector(index, 'name', e.target.value)}
                            placeholder="Name"
                            className="border-0 bg-transparent h-8"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={director.address}
                            onChange={(e) => updateDirector(index, 'address', e.target.value)}
                            placeholder="Street, City, State ZIP"
                            className="border-0 bg-transparent h-8"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="font-semibold text-eiduk-navy mb-3">{shareholderLabel} Present or Represented by Proxy:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm mb-4">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border p-2 text-left">{shareholderLabel} Name</th>
                      <th className="border p-2 text-left w-32">{sharesLabel}</th>
                      <th className="border p-2 text-left w-40">Representation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shareholders.map((shareholder, index) => (
                      <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="border p-2">
                          <Input
                            value={shareholder.name}
                            onChange={(e) => updateShareholder(index, 'name', e.target.value)}
                            placeholder="Name"
                            className="border-0 bg-transparent h-8"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={shareholder.shares}
                            onChange={(e) => updateShareholder(index, 'shares', e.target.value)}
                            placeholder={isScorp ? "e.g., 500" : "e.g., 50%"}
                            className="border-0 bg-transparent h-8"
                          />
                        </td>
                        <td className="border p-2">
                          <select
                            value={shareholder.representation}
                            onChange={(e) => updateShareholder(index, 'representation', e.target.value)}
                            className="w-full h-8 px-2 rounded border-0 bg-transparent text-sm"
                          >
                            <option value="">Select</option>
                            <option value="in-person">In Person</option>
                            <option value="proxy">By Proxy</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={data.quorumConfirmed}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, quorumConfirmed: !!checked }))}
                  />
                  <p className="text-sm">
                    <strong>Quorum Statement:</strong> A quorum was declared present based on the presence of the {directorLabel} and {shareholderLabel} listed above. The following corporate actions were taken by appropriate motions duly made, seconded, and adopted by majority vote.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* II. Election of Chairperson and Secretary */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                II. Election of Chairperson and Secretary
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-eiduk-blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Chairperson of Meeting</Label>
                    <Input
                      value={data.chairperson}
                      onChange={(e) => setData(prev => ({ ...prev, chairperson: e.target.value }))}
                      placeholder="Name appointed as chairperson"
                    />
                  </div>
                  <div>
                    <Label>Secretary of Meeting</Label>
                    <Input
                      value={data.meetingSecretary}
                      onChange={(e) => setData(prev => ({ ...prev, meetingSecretary: e.target.value }))}
                      placeholder="Name to prepare record of proceedings"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* III. Officer Elections */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                III. Election of Officers
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

            <Separator />

            {/* IV. Resolutions */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                IV. Resolutions Adopted
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

            <Separator />

            {/* Next Meeting */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                V. Next Meeting
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm text-muted-foreground mb-4">
                  The next meeting of the Board of Directors and {shareholderLabel} will be held on:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Next Meeting Date</Label>
                    <Input
                      type="date"
                      value={data.nextMeetingDate}
                      onChange={(e) => setData(prev => ({ ...prev, nextMeetingDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      value={data.nextMeetingTime}
                      onChange={(e) => setData(prev => ({ ...prev, nextMeetingTime: e.target.value }))}
                      placeholder="e.g., 8:00 AM"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={data.nextMeetingLocation}
                      onChange={(e) => setData(prev => ({ ...prev, nextMeetingLocation: e.target.value }))}
                      placeholder="Corporation's place of business"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* VI. Adjournment */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                VI. Adjournment
              </h3>
              <p className="text-muted-foreground">
                There being no further business, the meeting was duly adjourned.
              </p>
            </div>

            <Separator />

            {/* Secretary's Certification */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h4 className="font-display text-lg font-semibold text-eiduk-navy text-center mb-2">
                Secretary's Certification
              </h4>
              <p className="text-sm text-muted-foreground text-center mb-6">
                I certify that the foregoing is a true and correct record of the proceedings of the meeting.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-b border-foreground h-10 mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Secretary Signature</p>
                  <Input
                    value={data.secretaryPrintName}
                    onChange={(e) => setData(prev => ({ ...prev, secretaryPrintName: e.target.value }))}
                    placeholder="Print Name"
                    className="text-center"
                  />
                </div>
                <div className="text-center">
                  <div className="border-b border-foreground h-10 mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Date</p>
                  <Input
                    type="date"
                    value={data.secretaryDate}
                    onChange={(e) => setData(prev => ({ ...prev, secretaryDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Waiver of Notice Section */}
            <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400 print:break-before-page">
              <h3 className="font-display text-xl font-semibold text-eiduk-navy text-center mb-2">
                Waiver of Notice of a Meeting of the<br />
                Board of Directors and {shareholderLabel}
              </h3>
              <p className="text-center font-semibold mb-1">of</p>
              <p className="text-center text-lg font-semibold mb-6">{data.companyName || '[Company Name]'}</p>
              
              <p className="text-sm mb-4">
                The undersigned Board of Directors and {shareholderLabel} of the above corporation hereby waive(s) notice of the {data.meetingType} meeting of the Board of Directors and {shareholderLabel} to be held on{' '}
                <strong>{data.meetingDate ? new Date(data.meetingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Meeting Date]'}</strong>
                , at <strong>{data.meetingTime || '[Time]'}</strong>, at the corporation's principal office.
              </p>
              
              <p className="text-sm mb-6">
                The undersigned further consent to the transaction of any business, in addition to the business stated above, that may come before the meeting.
              </p>
              
              <h4 className="font-semibold text-eiduk-navy mb-4">
                {isScorp ? 'Director and Shareholder' : 'Manager and Member'} Signatures:
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.waiverSignatures.map((sig, index) => (
                  <div key={index} className="text-center">
                    <div className="border-b border-foreground h-10 mb-2" />
                    <Input
                      value={sig.name}
                      onChange={(e) => updateWaiverSignature(index, 'name', e.target.value)}
                      placeholder={index < 2 ? "Print Name" : "Print Name (if applicable)"}
                      className="text-center mb-2"
                    />
                    <p className="text-xs text-muted-foreground mb-2">
                      {isScorp ? 'Director and Shareholder' : 'Manager and Member'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Date:</Label>
                      <Input
                        type="date"
                        value={sig.date}
                        onChange={(e) => updateWaiverSignature(index, 'date', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white p-6 rounded-lg text-center">
              <p className="font-display text-lg font-semibold">Eiduk Tax & Wealth</p>
              <p className="text-eiduk-gold font-semibold">Pay Less. Keep More. Build Wealth.</p>
              <p className="text-sm mt-2 opacity-90">
                John Eiduk, CPA, CFP®, MSCTA<br />
                847-917-8981 | john@eiduktaxandwealth.com
              </p>
            </div>

            {/* Actions - Hidden on print */}
            <div className="flex justify-end gap-3 pt-4 print:hidden">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print / Save as PDF
              </Button>
              <Button onClick={handleSave} className="bg-eiduk-navy hover:bg-eiduk-blue">
                <FileText className="h-4 w-4 mr-2" />
                Save Minutes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
