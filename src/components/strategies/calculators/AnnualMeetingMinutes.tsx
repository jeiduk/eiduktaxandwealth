import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle, Printer, Save, X, Upload, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AnnualMeetingMinutesProps {
  clientId: string;
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

interface CompensationEntry {
  name: string;
  position: string;
  annualWages: string;
}

interface DistributionEntry {
  date: string;
  amount: string;
  recipient: string;
  notes: string;
}

interface FinancialHighlight {
  metric: string;
  amount: string;
  notes: string;
}

interface MeetingData {
  companyName: string;
  ein: string;
  stateOfFormation: string;
  businessAddress: string;
  stateCodeReference: string;
  entityType: 'scorp' | 'llc';
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  meetingType: 'annual' | 'special';
  documentType: 'formal' | 'written-consent';
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
    approveAccountablePlan: boolean;
  };
  
  // Detailed Resolution Data for Audit Defense
  compensationEntries: CompensationEntry[];
  compensationMethodology: string;
  compensationVote: { inFavor: string; opposed: string; abstained: string };
  
  distributionEntries: DistributionEntry[];
  aaaBalance: string;
  sCorpStatusMaintained: boolean;
  
  financialHighlights: FinancialHighlight[];
  financialStatementsApproved: boolean;
  
  accountablePlanEffectiveDate: string;
  accountablePlanVote: { inFavor: string; opposed: string; abstained: string };
  
  bankingInstitutions: string;
  authorizedSigners: string;
  noBankingChanges: boolean;
  
  // Corporate Formalities Checklist
  corporateFormalities: {
    bylawsOnFile: boolean;
    articlesOnFile: boolean;
    einOnFile: boolean;
    form2553OnFile: boolean;
    priorMinutesOnFile: boolean;
    registeredAgentCurrent: boolean;
  };
  
  // Documentation Attached
  documentationAttached: {
    compensationStudy: boolean;
    financialStatements: boolean;
    priorMinutes: boolean;
    accountablePlanPolicy: boolean;
  };
  
  // Uploaded Document File Paths
  uploadedDocuments: {
    compensationStudy: { name: string; path: string } | null;
    financialStatements: { name: string; path: string } | null;
    priorMinutes: { name: string; path: string } | null;
    accountablePlanPolicy: { name: string; path: string } | null;
  };
  
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

const defaultCompensationEntries: CompensationEntry[] = [
  { name: '', position: 'President, manages all operations', annualWages: '' },
  { name: '', position: '', annualWages: '' },
];

const defaultDistributionEntries: DistributionEntry[] = [
  { date: '', amount: '', recipient: 'Pro-rata to all', notes: '' },
  { date: '', amount: '', recipient: 'Pro-rata to all', notes: '' },
];

const defaultFinancialHighlights: FinancialHighlight[] = [
  { metric: 'Annual Revenue', amount: '', notes: '' },
  { metric: 'Total Expenses', amount: '', notes: '' },
  { metric: 'Net Income', amount: '', notes: '' },
];

export function AnnualMeetingMinutes({ clientId, clientName, companyName, savedData, onSave, onClose }: AnnualMeetingMinutesProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [data, setData] = useState<MeetingData>({
    companyName: (savedData.companyName as string) || companyName || '',
    ein: (savedData.ein as string) || '',
    stateOfFormation: (savedData.stateOfFormation as string) || '',
    businessAddress: (savedData.businessAddress as string) || '',
    stateCodeReference: (savedData.stateCodeReference as string) || '',
    entityType: (savedData.entityType as 'scorp' | 'llc') || 'scorp',
    meetingDate: (savedData.meetingDate as string) || '',
    meetingTime: (savedData.meetingTime as string) || '',
    meetingLocation: (savedData.meetingLocation as string) || '',
    meetingType: (savedData.meetingType as 'annual' | 'special') || 'annual',
    documentType: (savedData.documentType as 'formal' | 'written-consent') || 'formal',
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
      approveAccountablePlan: true,
    },
    
    // Detailed Resolution Data
    compensationEntries: (savedData.compensationEntries as CompensationEntry[]) || defaultCompensationEntries,
    compensationMethodology: (savedData.compensationMethodology as string) || '',
    compensationVote: (savedData.compensationVote as { inFavor: string; opposed: string; abstained: string }) || { inFavor: '2', opposed: '0', abstained: '0' },
    
    distributionEntries: (savedData.distributionEntries as DistributionEntry[]) || defaultDistributionEntries,
    aaaBalance: (savedData.aaaBalance as string) || '',
    sCorpStatusMaintained: (savedData.sCorpStatusMaintained as boolean) ?? true,
    
    financialHighlights: (savedData.financialHighlights as FinancialHighlight[]) || defaultFinancialHighlights,
    financialStatementsApproved: (savedData.financialStatementsApproved as boolean) ?? true,
    
    accountablePlanEffectiveDate: (savedData.accountablePlanEffectiveDate as string) || '',
    accountablePlanVote: (savedData.accountablePlanVote as { inFavor: string; opposed: string; abstained: string }) || { inFavor: '2', opposed: '0', abstained: '0' },
    
    bankingInstitutions: (savedData.bankingInstitutions as string) || '',
    authorizedSigners: (savedData.authorizedSigners as string) || '',
    noBankingChanges: (savedData.noBankingChanges as boolean) ?? true,
    
    corporateFormalities: (savedData.corporateFormalities as MeetingData['corporateFormalities']) || {
      bylawsOnFile: true,
      articlesOnFile: true,
      einOnFile: true,
      form2553OnFile: true,
      priorMinutesOnFile: true,
      registeredAgentCurrent: true,
    },
    
    documentationAttached: (savedData.documentationAttached as MeetingData['documentationAttached']) || {
      compensationStudy: false,
      financialStatements: false,
      priorMinutes: false,
      accountablePlanPolicy: false,
    },
    
    uploadedDocuments: (savedData.uploadedDocuments as MeetingData['uploadedDocuments']) || {
      compensationStudy: null,
      financialStatements: null,
      priorMinutes: null,
      accountablePlanPolicy: null,
    },
    
    additionalBusiness: (savedData.additionalBusiness as string) || '',
    nextMeetingDate: (savedData.nextMeetingDate as string) || '',
    nextMeetingTime: (savedData.nextMeetingTime as string) || '',
    nextMeetingLocation: (savedData.nextMeetingLocation as string) || '',
    
    secretaryPrintName: (savedData.secretaryPrintName as string) || '',
    secretaryDate: (savedData.secretaryDate as string) || '',
    
    waiverSignatures: (savedData.waiverSignatures as WaiverSignature[]) || defaultWaiverSignatures,
  });
  
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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

  const updateCompensationEntry = (index: number, field: keyof CompensationEntry, value: string) => {
    setData(prev => ({
      ...prev,
      compensationEntries: prev.compensationEntries.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  const updateDistributionEntry = (index: number, field: keyof DistributionEntry, value: string) => {
    setData(prev => ({
      ...prev,
      distributionEntries: prev.distributionEntries.map((d, i) => i === index ? { ...d, [field]: value } : d),
    }));
  };

  const updateFinancialHighlight = (index: number, field: keyof FinancialHighlight, value: string) => {
    setData(prev => ({
      ...prev,
      financialHighlights: prev.financialHighlights.map((f, i) => i === index ? { ...f, [field]: value } : f),
    }));
  };

  const handleDocumentUpload = async (
    docType: keyof MeetingData['uploadedDocuments'],
    file: File
  ) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please log in to upload documents.',
      });
      return;
    }

    setUploadingDoc(docType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/annual-minutes/${docType}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: docError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          user_id: user.id,
          name: file.name,
          file_path: fileName,
          file_type: fileExt || null,
          file_size: file.size,
          category: 'Annual Meeting Minutes',
        });

      if (docError) throw docError;

      // Update local state
      setData(prev => ({
        ...prev,
        uploadedDocuments: {
          ...prev.uploadedDocuments,
          [docType]: { name: file.name, path: fileName },
        },
        documentationAttached: {
          ...prev.documentationAttached,
          [docType]: true,
        },
      }));

      toast({
        title: 'Document uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleRemoveDocument = async (docType: keyof MeetingData['uploadedDocuments']) => {
    const doc = data.uploadedDocuments[docType];
    if (!doc) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([doc.path]);

      if (storageError) throw storageError;

      // Delete from database
      await supabase
        .from('client_documents')
        .delete()
        .eq('file_path', doc.path);

      // Update local state
      setData(prev => ({
        ...prev,
        uploadedDocuments: {
          ...prev.uploadedDocuments,
          [docType]: null,
        },
        documentationAttached: {
          ...prev.documentationAttached,
          [docType]: false,
        },
      }));

      toast({
        title: 'Document removed',
        description: 'The document has been removed.',
      });
    } catch (error: unknown) {
      console.error('Remove error:', error);
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Failed to remove document',
      });
    }
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
                  { key: 'approveCompensation', label: 'Approval of Officer/Member Compensation (IRC §3121)' },
                  { key: 'authorizeContracts', label: 'Authorization of Contracts' },
                  { key: 'authorizeBanking', label: 'Banking Resolutions' },
                  { key: 'approveTaxElections', label: 'Tax Elections & Filings' },
                  { key: 'approveRetirement', label: 'Retirement Plan Contributions' },
                  { key: 'approveDistributions', label: 'Distributions/Dividends' },
                  { key: 'approveAccountablePlan', label: 'Accountable Plan Reaffirmation (IRC §62(c))' },
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

            {/* V. Reasonable Compensation - IRC §3121 */}
            {data.resolutions.approveCompensation && (
              <div>
                <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                  V. Reasonable Compensation — IRC §3121
                </h3>
                
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-eiduk-blue space-y-4">
                  <div className="text-sm space-y-2">
                    <p><strong>WHEREAS</strong>, the corporation is organized as an S-Corporation and subject to Internal Revenue Code requirements for reasonable compensation;</p>
                    <p><strong>WHEREAS</strong>, shareholder-employees who perform services for the company must receive reasonable compensation;</p>
                    <p><strong>WHEREAS</strong>, the Board has reviewed industry standards, duties performed, qualifications, and time devoted to company business;</p>
                    <p><strong>NOW, THEREFORE, BE IT RESOLVED</strong>, that the following W-2 wages are approved as reasonable compensation:</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-eiduk-navy text-white">
                          <th className="border p-2 text-left">Shareholder-Employee</th>
                          <th className="border p-2 text-left">Position/Duties</th>
                          <th className="border p-2 text-left w-40">Annual W-2 Wages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.compensationEntries.map((entry, index) => (
                          <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="border p-2">
                              <Input
                                value={entry.name}
                                onChange={(e) => updateCompensationEntry(index, 'name', e.target.value)}
                                placeholder="Name"
                                className="border-0 bg-transparent h-8"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={entry.position}
                                onChange={(e) => updateCompensationEntry(index, 'position', e.target.value)}
                                placeholder="Position & duties"
                                className="border-0 bg-transparent h-8"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={entry.annualWages}
                                onChange={(e) => updateCompensationEntry(index, 'annualWages', e.target.value)}
                                placeholder="$"
                                className="border-0 bg-transparent h-8"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="text-sm"><strong>RESOLVED FURTHER</strong>, that this compensation has been determined based on reasonable compensation studies and industry benchmarks, and all required payroll taxes shall be withheld and paid as required by law.</p>
                  
                  <div>
                    <Label>Compensation Methodology/Basis</Label>
                    <Textarea
                      value={data.compensationMethodology}
                      onChange={(e) => setData(prev => ({ ...prev, compensationMethodology: e.target.value }))}
                      placeholder="e.g., RCReports analysis, BLS data, industry comparables, hours worked, experience level"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="font-semibold">Vote:</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">In Favor</Label>
                        <Input
                          value={data.compensationVote.inFavor}
                          onChange={(e) => setData(prev => ({ ...prev, compensationVote: { ...prev.compensationVote, inFavor: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Opposed</Label>
                        <Input
                          value={data.compensationVote.opposed}
                          onChange={(e) => setData(prev => ({ ...prev, compensationVote: { ...prev.compensationVote, opposed: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Abstained</Label>
                        <Input
                          value={data.compensationVote.abstained}
                          onChange={(e) => setData(prev => ({ ...prev, compensationVote: { ...prev.compensationVote, abstained: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-success mt-2">Resolution PASSED</p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* VI. Distribution of Profits */}
            {data.resolutions.approveDistributions && (
              <div>
                <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                  VI. Distribution of Profits
                </h3>
                
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 space-y-4">
                  <p className="text-sm"><strong>RESOLVED:</strong> The {shareholderLabel} are authorized to withdraw profits distributions as cash is available.</p>
                  
                  <div>
                    <Label className="font-semibold">Distributions Approved for Current Year:</Label>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-green-600 text-white">
                            <th className="border p-2 text-left">Date</th>
                            <th className="border p-2 text-left">Amount</th>
                            <th className="border p-2 text-left">Recipient(s)</th>
                            <th className="border p-2 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.distributionEntries.map((entry, index) => (
                            <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border p-2">
                                <Input
                                  type="date"
                                  value={entry.date}
                                  onChange={(e) => updateDistributionEntry(index, 'date', e.target.value)}
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  value={entry.amount}
                                  onChange={(e) => updateDistributionEntry(index, 'amount', e.target.value)}
                                  placeholder="$"
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  value={entry.recipient}
                                  onChange={(e) => updateDistributionEntry(index, 'recipient', e.target.value)}
                                  placeholder="Pro-rata to all"
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  value={entry.notes}
                                  onChange={(e) => updateDistributionEntry(index, 'notes', e.target.value)}
                                  placeholder="Notes"
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <Label>AAA (Accumulated Adjustments Account) Balance Notes</Label>
                    <Textarea
                      value={data.aaaBalance}
                      onChange={(e) => setData(prev => ({ ...prev, aaaBalance: e.target.value }))}
                      placeholder="Beginning balance, adjustments, ending balance"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white p-3 rounded border">
                    <Checkbox
                      checked={data.sCorpStatusMaintained}
                      onCheckedChange={(checked) => setData(prev => ({ ...prev, sCorpStatusMaintained: !!checked }))}
                    />
                    <span className="text-sm">S-Corporation status maintained (no second class of stock, all shareholders remain eligible, distributions pro-rata)</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* VII. Financial Review */}
            {data.resolutions.reviewFinancials && (
              <div>
                <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                  VII. Financial Review
                </h3>
                
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={data.financialStatementsApproved}
                      onCheckedChange={(checked) => setData(prev => ({ ...prev, financialStatementsApproved: !!checked }))}
                    />
                    <span className="text-sm">Annual financial statements presented, reviewed, and approved</span>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Key Financial Highlights:</Label>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-purple-600 text-white">
                            <th className="border p-2 text-left">Metric</th>
                            <th className="border p-2 text-left w-40">Amount</th>
                            <th className="border p-2 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.financialHighlights.map((highlight, index) => (
                            <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border p-2">
                                <Input
                                  value={highlight.metric}
                                  onChange={(e) => updateFinancialHighlight(index, 'metric', e.target.value)}
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  value={highlight.amount}
                                  onChange={(e) => updateFinancialHighlight(index, 'amount', e.target.value)}
                                  placeholder="$"
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  value={highlight.notes}
                                  onChange={(e) => updateFinancialHighlight(index, 'notes', e.target.value)}
                                  placeholder="Notes"
                                  className="border-0 bg-transparent h-8"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* VIII. Accountable Plan Reaffirmation - IRC §62(c) */}
            {data.resolutions.approveAccountablePlan && (
              <div>
                <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                  VIII. Accountable Plan Reaffirmation — IRC §62(c)
                </h3>
                
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 space-y-4">
                  <div className="text-sm space-y-2">
                    <p><strong>WHEREAS</strong>, Treasury Regulation §1.62-2 permits employers to establish accountable plans for reimbursement of ordinary and necessary business expenses;</p>
                    <p><strong>WHEREAS</strong>, reimbursements made under a properly administered accountable plan are excluded from employees' gross income and not subject to employment taxes;</p>
                    <p><strong>NOW, THEREFORE, BE IT RESOLVED</strong>, that the company hereby reaffirms its accountable plan policy with the following requirements:</p>
                  </div>
                  
                  <ul className="text-sm list-disc list-inside space-y-1 bg-white p-3 rounded border">
                    <li>Expenses must have a business connection</li>
                    <li>Expenses must be substantiated within 60 days</li>
                    <li>Excess amounts must be returned within 120 days</li>
                    <li>Mileage reimbursed at IRS standard rate</li>
                  </ul>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Accountable Plan Effective Date</Label>
                      <Input
                        type="date"
                        value={data.accountablePlanEffectiveDate}
                        onChange={(e) => setData(prev => ({ ...prev, accountablePlanEffectiveDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="font-semibold">Vote:</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">In Favor</Label>
                        <Input
                          value={data.accountablePlanVote.inFavor}
                          onChange={(e) => setData(prev => ({ ...prev, accountablePlanVote: { ...prev.accountablePlanVote, inFavor: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Opposed</Label>
                        <Input
                          value={data.accountablePlanVote.opposed}
                          onChange={(e) => setData(prev => ({ ...prev, accountablePlanVote: { ...prev.accountablePlanVote, opposed: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Abstained</Label>
                        <Input
                          value={data.accountablePlanVote.abstained}
                          onChange={(e) => setData(prev => ({ ...prev, accountablePlanVote: { ...prev.accountablePlanVote, abstained: e.target.value } }))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-success mt-2">Resolution PASSED</p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* IX. Banking & Authorized Signers */}
            {data.resolutions.authorizeBanking && (
              <div>
                <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                  IX. Banking & Authorized Signers
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={data.noBankingChanges}
                      onCheckedChange={(checked) => setData(prev => ({ ...prev, noBankingChanges: !!checked }))}
                    />
                    <span className="text-sm">No changes to banking relationships or authorized signers</span>
                  </div>
                  
                  {!data.noBankingChanges && (
                    <div className="space-y-4">
                      <div>
                        <Label>Bank/Credit Union Name(s)</Label>
                        <Textarea
                          value={data.bankingInstitutions}
                          onChange={(e) => setData(prev => ({ ...prev, bankingInstitutions: e.target.value }))}
                          placeholder="List all banking institutions"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Authorized Signers</Label>
                        <Textarea
                          value={data.authorizedSigners}
                          onChange={(e) => setData(prev => ({ ...prev, authorizedSigners: e.target.value }))}
                          placeholder="List all persons authorized to sign checks, make wire transfers, and conduct banking business"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* X. Corporate Formalities Checklist */}
            <div>
              <h3 className="font-display text-lg font-semibold text-white bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-3 rounded-lg mb-4">
                X. Corporate Formalities Checklist
              </h3>
              
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 space-y-3">
                {[
                  { key: 'bylawsOnFile', label: 'Corporate bylaws on file and current' },
                  { key: 'articlesOnFile', label: 'Articles of incorporation on file' },
                  { key: 'einOnFile', label: 'EIN letter on file' },
                  { key: 'form2553OnFile', label: 'Form 2553 (S-Corp election) on file' },
                  { key: 'priorMinutesOnFile', label: 'Prior year minutes on file' },
                  { key: 'registeredAgentCurrent', label: 'Registered agent current' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3">
                    <Checkbox
                      checked={data.corporateFormalities[item.key as keyof typeof data.corporateFormalities]}
                      onCheckedChange={(checked) => setData(prev => ({
                        ...prev,
                        corporateFormalities: { ...prev.corporateFormalities, [item.key]: !!checked }
                      }))}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border print:hidden">
                <Label className="font-semibold">Documentation Attached (Upload Files):</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {[
                    { key: 'compensationStudy', label: 'Reasonable Compensation Study' },
                    { key: 'financialStatements', label: 'Financial Statements' },
                    { key: 'priorMinutes', label: 'Prior Year Minutes' },
                    { key: 'accountablePlanPolicy', label: 'Accountable Plan Policy' },
                  ].map(item => {
                    const docKey = item.key as keyof MeetingData['uploadedDocuments'];
                    const uploadedDoc = data.uploadedDocuments[docKey];
                    const isUploading = uploadingDoc === item.key;
                    
                    return (
                      <div key={item.key} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          {uploadedDoc && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                        
                        {uploadedDoc ? (
                          <div className="flex items-center gap-2 bg-success/10 p-2 rounded border border-success/20">
                            <FileText className="h-4 w-4 text-eiduk-blue flex-shrink-0" />
                            <span className="text-sm truncate flex-1">{uploadedDoc.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDocument(docKey)}
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-eiduk-blue/50 hover:bg-muted/30 transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(docKey, file);
                                e.target.value = '';
                              }}
                            />
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-eiduk-blue" />
                                <span className="text-sm text-muted-foreground">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload file</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Print-only documentation list */}
              <div className="hidden print:block mt-4 bg-gray-50 p-4 rounded-lg border">
                <Label className="font-semibold">Documentation Attached:</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { key: 'compensationStudy', label: 'Reasonable Compensation Study' },
                    { key: 'financialStatements', label: 'Financial Statements' },
                    { key: 'priorMinutes', label: 'Prior Year Minutes' },
                    { key: 'accountablePlanPolicy', label: 'Accountable Plan Policy' },
                  ].map(item => {
                    const docKey = item.key as keyof MeetingData['documentationAttached'];
                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        {data.documentationAttached[docKey] ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <div className="h-4 w-4 border rounded" />
                        )}
                        <span className="text-sm">{item.label}</span>
                        {data.uploadedDocuments[item.key as keyof MeetingData['uploadedDocuments']]?.name && (
                          <span className="text-xs text-muted-foreground">
                            ({data.uploadedDocuments[item.key as keyof MeetingData['uploadedDocuments']]?.name})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

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
                XI. Next Meeting
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
                XII. Adjournment
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
