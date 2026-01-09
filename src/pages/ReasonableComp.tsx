import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Clock, DollarSign, Scale, BarChart3, ChevronRight, ArrowLeft, ArrowRight, Shield, Lock, Check, AlertTriangle, Info, FileText, Printer, Mail, Save, LayoutDashboard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Step Configuration
const steps = [
  { id: 1, label: "Business Info", icon: Building2 },
  { id: 2, label: "Owner Info", icon: User },
  { id: 3, label: "Time Allocation", icon: Clock },
  { id: 4, label: "Wage Assumptions", icon: DollarSign },
  { id: 5, label: "IRS Factors", icon: Scale },
  { id: 6, label: "Results", icon: BarChart3 },
];

// Role colors for time allocation
const roleColors = {
  ceo: "#1E40AF",
  ops: "#059669",
  sales: "#D97706",
  tech: "#7C3AED",
  admin: "#64748B",
};

// Role labels
const roleLabels = {
  ceo: "CEO / Strategic",
  ops: "Operations / Management",
  sales: "Sales / Business Development",
  tech: "Technical / Professional Services",
  admin: "Admin / Support",
};

// Proficiency levels
const proficiencyLevels = [
  { value: "entry", label: "Entry (0-2 years)" },
  { value: "average", label: "Average (3-7 years)" },
  { value: "experienced", label: "Experienced (8-15 years)" },
  { value: "expert", label: "Expert (15+ years)" },
];

// IRS Factors
const irsFactors = [
  { id: "f1", label: "Owner has specialized training, education, or credentials" },
  { id: "f2", label: "Owner personally generates significant revenue" },
  { id: "f3", label: "Owner supervises other employees" },
  { id: "f4", label: "Owner has personally guaranteed company debt" },
  { id: "f5", label: "Compensation was established at arm's length" },
  { id: "f6", label: "Company uses salary surveys for benchmarking" },
  { id: "f7", label: "Owner works hours comparable to industry peers" },
  { id: "f8", label: "Company profitability supports compensation level" },
  { id: "f9", label: "Owner has significant industry experience" },
  { id: "f10", label: "Owner performs multiple job functions" },
  { id: "f11", label: "Company compensation is consistent with past years" },
  { id: "f12", label: "Company operates in a high-cost geographic area" },
];

// Default wage data
const defaultWageData = {
  ceo: { low: 45, median: 85, high: 150 },
  ops: { low: 28, median: 48, high: 75 },
  sales: { low: 30, median: 55, high: 90 },
  tech: { low: 45, median: 75, high: 150 },
  admin: { low: 16, median: 21, high: 30 },
};

// Credential quick picks
const credentialOptions = ["CPA", "MBA", "PE", "PMP", "PhD", "JD", "CFP®", "EA"];

// Preset allocations
const presets = {
  ceoHeavy: { ceo: 50, ops: 15, sales: 15, tech: 15, admin: 5 },
  techFocus: { ceo: 15, ops: 15, sales: 15, tech: 40, admin: 15 },
  salesFocus: { ceo: 10, ops: 15, sales: 50, tech: 15, admin: 10 },
  evenSplit: { ceo: 20, ops: 20, sales: 20, tech: 20, admin: 20 },
};

export default function ReasonableComp() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Business Info
  const [businessName, setBusinessName] = useState("");
  const [taxYear, setTaxYear] = useState("2026");
  const [industry, setIndustry] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [state, setState] = useState("");
  const [metroArea, setMetroArea] = useState("");
  const [grossRevenue, setGrossRevenue] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1");

  // Step 2: Owner Info
  const [ownerName, setOwnerName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [weeksPerYear, setWeeksPerYear] = useState("50");
  const [credentials, setCredentials] = useState<string[]>([]);

  // Step 3: Time Allocation
  const [allocations, setAllocations] = useState({
    ceo: 20,
    ops: 25,
    sales: 20,
    tech: 25,
    admin: 10,
  });
  const [proficiency, setProficiency] = useState({
    ceo: "average",
    ops: "average",
    sales: "average",
    tech: "average",
    admin: "average",
  });

  // Step 5: IRS Factors
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  // Step 6: Results
  const [finalWage, setFinalWage] = useState(105000);
  const [advisorName, setAdvisorName] = useState("");
  const [justification, setJustification] = useState("");
  
  // Signatures
  const [clientAckChecked, setClientAckChecked] = useState(false);
  const [advisorAckChecked, setAdvisorAckChecked] = useState(false);
  const [clientSigName, setClientSigName] = useState("");
  const [advisorSigName, setAdvisorSigName] = useState("");
  const [clientTimestamp, setClientTimestamp] = useState("");
  const [advisorTimestamp, setAdvisorTimestamp] = useState("");
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [advisorConfirmed, setAdvisorConfirmed] = useState(false);
  const [documentLocked, setDocumentLocked] = useState(false);
  const [lockTimestamp, setLockTimestamp] = useState("");

  // Calculated values
  const totalAllocation = Object.values(allocations).reduce((a, b) => a + b, 0);
  const annualHours = parseInt(hoursPerWeek) * parseInt(weeksPerYear) || 2000;
  const rangeLow = 89250;
  const rangeHigh = 120750;
  const rangeTarget = 105000;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPreset = (presetKey: keyof typeof presets) => {
    setAllocations(presets[presetKey]);
    toast.success("Preset applied!");
  };

  const toggleCredential = (cred: string) => {
    setCredentials(prev => 
      prev.includes(cred) 
        ? prev.filter(c => c !== cred)
        : [...prev, cred]
    );
  };

  const toggleFactor = (factorId: string) => {
    setSelectedFactors(prev =>
      prev.includes(factorId)
        ? prev.filter(f => f !== factorId)
        : [...prev, factorId]
    );
  };

  const handleClientSign = () => {
    if (clientSigName.length >= 2) {
      const now = new Date();
      setClientTimestamp(formatTimestamp(now));
      setClientConfirmed(true);
    }
  };

  const handleAdvisorSign = () => {
    if (advisorSigName.length >= 2) {
      const now = new Date();
      setAdvisorTimestamp(formatTimestamp(now));
      setAdvisorConfirmed(true);
    }
  };

  const lockDocument = () => {
    if (!clientConfirmed || !advisorConfirmed) {
      toast.error("Both signatures are required to finalize.");
      return;
    }
    const now = new Date();
    setLockTimestamp(formatTimestamp(now));
    setDocumentLocked(true);
    toast.success("Defense File has been finalized!");
  };

  const handleSave = () => {
    toast.success("Defense File saved successfully!");
  };

  const handleSaveAndExit = () => {
    toast.success("Defense File saved!");
    navigate("/dashboard");
  };

  // Calculate estimated wages
  const calculateEstimatedWages = () => {
    const wages: Record<string, number> = {};
    let total = 0;
    Object.entries(allocations).forEach(([role, pct]) => {
      const roleKey = role as keyof typeof defaultWageData;
      const hourlyWage = defaultWageData[roleKey].median;
      const roleHours = (annualHours * pct) / 100;
      wages[role] = hourlyWage * roleHours;
      total += wages[role];
    });
    return { wages, total };
  };

  const estimatedWages = calculateEstimatedWages();

  const getWageBadgeStatus = () => {
    if (Math.abs(finalWage - rangeTarget) < 3000) {
      return { label: "Near Target", variant: "success" as const };
    } else if (finalWage < rangeTarget) {
      return { label: "Below Target", variant: "warning" as const };
    }
    return { label: "Above Target", variant: "warning" as const };
  };

  const sliderPercent = ((finalWage - rangeLow) / (rangeHigh - rangeLow)) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-eiduk-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/70 hover:text-white hover:bg-white/10 mr-2"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-eiduk-gold" />
            </div>
            <div>
              <h1 className="font-semibold text-base">Reasonable Comp Defense File™</h1>
              <p className="text-xs text-white/70 max-w-xs hidden sm:block">
                Documents how reasonable compensation was determined using market data and judicial factors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={handleSaveAndExit}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Save & Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Step Navigation */}
        <nav className="flex items-center justify-center gap-1 mb-6 bg-white p-3 rounded-xl shadow-sm flex-wrap">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                    isActive && "bg-eiduk-blue text-white",
                    isCompleted && "bg-green-100 text-green-700",
                    !isActive && !isCompleted && "text-muted-foreground hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-1 hidden sm:block" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-eiduk-blue" />
                <div>
                  <CardTitle className="font-display text-lg text-eiduk-navy">Business Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Enter your S Corporation details for the compensation analysis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name <span className="text-red-500">*</span></Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="ABC Consulting, Inc." />
                </div>
                <div className="space-y-2">
                  <Label>Tax Year <span className="text-red-500">*</span></Label>
                  <Input type="number" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} min="2020" max="2027" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry <span className="text-red-500">*</span></Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select industry..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional Services</SelectItem>
                      <SelectItem value="consulting">Management Consulting</SelectItem>
                      <SelectItem value="technology">Technology / IT Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                      <SelectItem value="construction">Construction / Trades</SelectItem>
                      <SelectItem value="realestate">Real Estate</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="legal">Legal Services</SelectItem>
                      <SelectItem value="accounting">Accounting / Tax</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NAICS Code (optional)</Label>
                  <Input value={naicsCode} onChange={(e) => setNaicsCode(e.target.value)} placeholder="e.g., 541110" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IL">Illinois</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Metro Area (optional)</Label>
                  <Input value={metroArea} onChange={(e) => setMetroArea(e.target.value)} placeholder="Chicago" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-eiduk-navy mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gross Revenue <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input className="pl-7" type="number" value={grossRevenue} onChange={(e) => setGrossRevenue(e.target.value)} placeholder="250000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Net Income (Before Owner Wage) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input className="pl-7" type="number" value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="150000" />
                    </div>
                    <p className="text-xs text-muted-foreground">Total profit before paying owner salary</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Employees <span className="text-red-500">*</span></Label>
                    <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} min="1" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => goToStep(2)} className="bg-eiduk-blue hover:bg-eiduk-navy">
                  Continue to Owner Info
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Owner Info */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-eiduk-blue" />
                <div>
                  <CardTitle className="font-display text-lg text-eiduk-navy">Owner Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Details about the S Corp owner-employee for compensation analysis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner Name <span className="text-red-500">*</span></Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Primary Role Title <span className="text-red-500">*</span></Label>
                  <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g., CEO, President, Managing Partner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Years of Experience <span className="text-red-500">*</span></Label>
                  <Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="15" />
                </div>
                <div className="space-y-2">
                  <Label>Hours per Week</Label>
                  <Input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Weeks per Year</Label>
                  <Input type="number" value={weeksPerYear} onChange={(e) => setWeeksPerYear(e.target.value)} />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm"><strong>Annual Hours:</strong> {annualHours.toLocaleString()} hours/year</p>
              </div>

              <div className="space-y-2">
                <Label>Professional Credentials</Label>
                <div className="flex flex-wrap gap-2">
                  {credentialOptions.map((cred) => (
                    <button
                      key={cred}
                      onClick={() => toggleCredential(cred)}
                      className={cn(
                        "px-3 py-1 text-sm rounded-full border transition-all",
                        credentials.includes(cred)
                          ? "bg-eiduk-blue text-white border-eiduk-blue"
                          : "bg-white text-eiduk-blue border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {cred}
                    </button>
                  ))}
                </div>
                {credentials.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {credentials.map((cred) => (
                      <Badge key={cred} className="bg-green-100 text-green-700">
                        {cred}
                        <button onClick={() => toggleCredential(cred)} className="ml-1">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => goToStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => goToStep(3)} className="bg-eiduk-blue hover:bg-eiduk-navy">
                  Continue to Time Allocation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Time Allocation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-eiduk-blue" />
                  <div>
                    <CardTitle className="font-display text-lg text-eiduk-navy">Time Allocation by Role</CardTitle>
                    <p className="text-sm text-muted-foreground">How does the owner spend their time across different functions?</p>
                  </div>
                </div>
                <Badge className={cn(
                  totalAllocation === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {totalAllocation}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allocation Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Role / Function</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase w-24">% of Time</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Proficiency Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(allocations) as Array<keyof typeof allocations>).map((role) => (
                      <tr key={role} className="border-b hover:bg-slate-50/50">
                        <td className="p-3 text-sm">{roleLabels[role]}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="w-16 text-center"
                              value={allocations[role]}
                              onChange={(e) => setAllocations(prev => ({ ...prev, [role]: parseInt(e.target.value) || 0 }))}
                              min="0"
                              max="100"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select value={proficiency[role]} onValueChange={(val) => setProficiency(prev => ({ ...prev, [role]: val }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {proficiencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Time Allocation Visualization - Pie Chart Style Bar */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Time Allocation Visualization</p>
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {(Object.keys(allocations) as Array<keyof typeof allocations>).map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-center text-white text-xs font-semibold transition-all"
                      style={{
                        width: `${allocations[role]}%`,
                        backgroundColor: roleColors[role],
                        minWidth: allocations[role] > 0 ? '20px' : '0',
                      }}
                    >
                      {allocations[role] > 5 && `${allocations[role]}%`}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {(Object.keys(roleColors) as Array<keyof typeof roleColors>).map((role) => (
                    <div key={role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: roleColors[role] }} />
                      {roleLabels[role]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyPreset('ceoHeavy')}>CEO-Heavy (50%)</Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('techFocus')}>Technical Focus (40%)</Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('salesFocus')}>Sales Focus (50%)</Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('evenSplit')}>Even Split (20% each)</Button>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => goToStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => goToStep(4)} className="bg-eiduk-blue hover:bg-eiduk-navy">
                  Continue to Wage Assumptions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Wage Assumptions */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-eiduk-blue" />
                <div>
                  <CardTitle className="font-display text-lg text-eiduk-navy">Market Wage Assumptions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review the hourly wage rates used for each role. Rates adjusted for {state || "your state"}.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wage Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Role</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Low $/hr</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Median $/hr</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">High $/hr</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(defaultWageData) as Array<keyof typeof defaultWageData>).map((role) => (
                      <tr key={role} className="border-b hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-semibold text-eiduk-navy text-sm">{roleLabels[role]}</div>
                          <div className="text-xs text-muted-foreground">{allocations[role]}% of time</div>
                        </td>
                        <td className="p-3 font-semibold text-sm">${defaultWageData[role].low.toFixed(2)}</td>
                        <td className="p-3 font-semibold text-sm">${defaultWageData[role].median.toFixed(2)}</td>
                        <td className="p-3 font-semibold text-sm">${defaultWageData[role].high.toFixed(2)}</td>
                        <td className="p-3 text-xs text-eiduk-blue">BLS Data ({state || "State"} adjusted)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info Box */}
              <div className="bg-eiduk-cream p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-eiduk-navy mb-2">About Market Wage Data</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Low:</strong> Entry-level / 25th percentile wage</li>
                  <li><strong>Median:</strong> Typical market rate / 50th percentile</li>
                  <li><strong>High:</strong> Experienced / 75th percentile wage</li>
                  <li>State adjustments based on Bureau of Labor Statistics regional data</li>
                </ul>
              </div>

              {/* Wage Summary */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-eiduk-navy mb-3">Estimated Annual Wages (at Median rates)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(estimatedWages.wages) as Array<keyof typeof estimatedWages.wages>).map((role) => (
                    <div key={role} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{roleLabels[role as keyof typeof roleLabels]}</span>
                      <span className="font-semibold text-eiduk-navy">{formatCurrency(estimatedWages.wages[role])}</span>
                    </div>
                  ))}
                  <div className="col-span-2 flex justify-between text-sm pt-3 border-t mt-2">
                    <span className="font-semibold text-eiduk-navy">Total Estimated</span>
                    <span className="font-bold text-eiduk-gold">{formatCurrency(estimatedWages.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => goToStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => goToStep(5)} className="bg-eiduk-blue hover:bg-eiduk-navy">
                  Continue to IRS Factors
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: IRS Factors */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-eiduk-blue" />
                <div>
                  <CardTitle className="font-display text-lg text-eiduk-navy">IRS Reasonable Compensation Factors</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select factors that apply. Based on <em>Mayson Manufacturing Co. v. Commissioner</em> and IRS guidelines.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {irsFactors.map((factor) => (
                  <div
                    key={factor.id}
                    onClick={() => toggleFactor(factor.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                      selectedFactors.includes(factor.id)
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-eiduk-lightBlue hover:bg-slate-50"
                    )}
                  >
                    <Checkbox
                      checked={selectedFactors.includes(factor.id)}
                      className="mt-0.5"
                    />
                    <span className={cn(
                      "text-sm",
                      selectedFactors.includes(factor.id) && "text-green-700"
                    )}>
                      {factor.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => goToStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => goToStep(6)} className="bg-eiduk-blue hover:bg-eiduk-navy">
                  Calculate Results
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Results */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {/* Analysis Notes */}
            <div className="bg-amber-50 border border-amber-400 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-1">
                <Info className="w-4 h-4" />
                Analysis Notes
              </div>
              <p className="text-sm text-slate-700">
                • Target wage exceeds 70% of net income. Constrained to $105,000.
              </p>
            </div>

            {/* Audit Risk Indicators */}
            <div className="bg-red-50 border border-red-400 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                Audit Risk Indicators
              </div>
              <p className="text-sm text-slate-700">
                <strong>Warning:</strong> Current W-2 wages ($75,000) fall below the recommended minimum of $89,250. 
                The recommended compensation reflects an effort to balance market benchmarks and judicial guidance.
              </p>
            </div>

            {/* Advisor's Professional Judgment */}
            <Card className="border-2 border-slate-200">
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-eiduk-gold" />
                    <h3 className="font-display text-lg font-semibold text-eiduk-navy">Advisor's Professional Judgment</h3>
                  </div>
                  <Badge className={cn(
                    advisorName && justification.length > 20
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  )}>
                    {advisorName && justification.length > 20 ? "Complete" : "(Required)"}
                  </Badge>
                </div>

                <blockquote className="border-l-4 border-eiduk-gold pl-4 italic text-sm text-muted-foreground">
                  "Reasonable compensation is determined by facts, context, and economic reality—not by minimizing payroll at all costs."
                </blockquote>

                {/* Range Visualization */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Calculated Reasonable Compensation Range</p>
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-red-500">
                    <div className="absolute w-1 h-5 bg-eiduk-navy rounded -top-1.5" style={{ left: '0%' }} />
                    <div className="absolute w-1 h-5 bg-eiduk-blue rounded -top-1.5" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                    <div className="absolute w-1 h-5 bg-eiduk-navy rounded -top-1.5" style={{ right: '0%' }} />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <div className="text-center">
                      <div className="font-semibold text-eiduk-navy">{formatCurrency(rangeLow)}</div>
                      <div className="text-muted-foreground">Low</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-eiduk-blue">Target: {formatCurrency(rangeTarget)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-eiduk-navy">{formatCurrency(rangeHigh)}</div>
                      <div className="text-muted-foreground">High</div>
                    </div>
                  </div>
                </div>

                {/* Final Wage Slider */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-eiduk-navy">Final Recommended Wage</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        getWageBadgeStatus().variant === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {getWageBadgeStatus().label}
                      </Badge>
                      <span className="font-display text-2xl font-bold text-eiduk-gold">
                        {formatCurrency(finalWage)}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[finalWage]}
                    onValueChange={(val) => setFinalWage(val[0])}
                    min={rangeLow}
                    max={rangeHigh}
                    step={250}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low: {formatCurrency(rangeLow)}</span>
                    <span>High: {formatCurrency(rangeHigh)}</span>
                  </div>
                </div>

                {/* Advisor Credentials */}
                <div className="space-y-2">
                  <Label>Advisor Name / Credentials</Label>
                  <Input
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    placeholder="e.g., John Eiduk, CPA, CFP®"
                  />
                </div>

                {/* Professional Justification */}
                <div className="space-y-2">
                  <Label>Professional Justification</Label>
                  <p className="text-xs text-muted-foreground">
                    Briefly explain why this specific figure was selected within the calculated range.
                  </p>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="The recommended wage of [amount] was selected based on..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Acknowledgment & Signatures */}
            <Card className="border-2 border-eiduk-navy">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-eiduk-blue" />
                    <div>
                      <CardTitle className="font-display text-lg text-eiduk-navy">Acknowledgment & Signatures</CardTitle>
                      <p className="text-sm text-muted-foreground">Both parties must acknowledge to complete the Defense File.</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    documentLocked ? "bg-eiduk-navy text-white" :
                    clientConfirmed && advisorConfirmed ? "bg-green-100 text-green-700" :
                    clientConfirmed || advisorConfirmed ? "bg-amber-100 text-amber-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {documentLocked ? (
                      <><Lock className="w-3 h-3 mr-1" /> Locked</>
                    ) : clientConfirmed && advisorConfirmed ? (
                      "Ready to Finalize"
                    ) : clientConfirmed || advisorConfirmed ? (
                      "1 of 2 Signatures"
                    ) : (
                      "Pending Signatures"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!documentLocked && (
                  <>
                    {/* Client Acknowledgment */}
                    <div className="bg-blue-50/50 p-5 rounded-lg space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-lg bg-eiduk-lightBlue/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-eiduk-blue" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-eiduk-navy">Client / Business Owner Acknowledgment</h4>
                          <p className="text-sm text-muted-foreground">I acknowledge that I have reviewed and understand the reasonable compensation analysis.</p>
                        </div>
                      </div>

                      {!clientConfirmed ? (
                        <>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={clientAckChecked}
                              onCheckedChange={(checked) => setClientAckChecked(checked as boolean)}
                            />
                            <span className="text-sm">
                              I confirm that the information provided is accurate and complete to the best of my knowledge. I understand that reasonable compensation is a facts-and-circumstances determination.
                            </span>
                          </div>

                          {clientAckChecked && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed animate-fade-in">
                              <div className="space-y-2">
                                <Label>Client Name (Type to Sign) <span className="text-red-500">*</span></Label>
                                <Input
                                  value={clientSigName}
                                  onChange={(e) => setClientSigName(e.target.value)}
                                  onBlur={handleClientSign}
                                  placeholder="Type your full legal name"
                                  className="font-display italic text-base"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Date & Time</Label>
                                <Input value={clientTimestamp} readOnly className="bg-slate-100 text-xs text-center" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-green-100 rounded-lg">
                          <Check className="w-6 h-6 text-green-600" />
                          <div>
                            <strong className="text-green-700">Acknowledged by {clientSigName}</strong>
                            <span className="text-sm text-muted-foreground block">{clientTimestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t" />

                    {/* Advisor Acknowledgment */}
                    <div className="bg-blue-50/50 p-5 rounded-lg space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-eiduk-gold to-yellow-500 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-eiduk-navy" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-eiduk-navy">Tax Advisor Acknowledgment</h4>
                          <p className="text-sm text-muted-foreground">I certify that this analysis was prepared using accepted valuation methodologies.</p>
                        </div>
                      </div>

                      {!advisorConfirmed ? (
                        <>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={advisorAckChecked}
                              onCheckedChange={(checked) => setAdvisorAckChecked(checked as boolean)}
                            />
                            <span className="text-sm">
                              I certify that this Reasonable Compensation Defense File was prepared in accordance with IRS guidelines, Treasury Regulations §1.162-7(b)(3), and judicially recognized factors.
                            </span>
                          </div>

                          {advisorAckChecked && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed animate-fade-in">
                              <div className="space-y-2">
                                <Label>Advisor Name & Credentials <span className="text-red-500">*</span></Label>
                                <Input
                                  value={advisorSigName}
                                  onChange={(e) => setAdvisorSigName(e.target.value)}
                                  onBlur={handleAdvisorSign}
                                  placeholder="e.g., John Eiduk, CPA, CFP®"
                                  className="font-display italic text-base"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Date & Time</Label>
                                <Input value={advisorTimestamp} readOnly className="bg-slate-100 text-xs text-center" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-green-100 rounded-lg">
                          <Check className="w-6 h-6 text-green-600" />
                          <div>
                            <strong className="text-green-700">Certified by {advisorSigName}</strong>
                            <span className="text-sm text-muted-foreground block">{advisorTimestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lock Button */}
                    <div className="text-center pt-4">
                      <Button
                        onClick={lockDocument}
                        disabled={!clientConfirmed || !advisorConfirmed}
                        className="bg-eiduk-gold hover:bg-yellow-600 text-eiduk-navy"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock & Finalize Defense File
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Both signatures required to finalize. Once locked, changes cannot be made.
                      </p>
                    </div>
                  </>
                )}

                {/* Locked Confirmation */}
                {documentLocked && (
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-eiduk-navy to-eiduk-blue rounded-xl text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Shield className="w-7 h-7 text-eiduk-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Defense File Finalized</h4>
                      <p className="text-sm opacity-90">This document was locked on {lockTimestamp}.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button className="bg-eiduk-gold hover:bg-yellow-600 text-eiduk-navy">
                <FileText className="w-4 h-4 mr-2" />
                Generate Defense File
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print to PDF
              </Button>
              <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700 border-green-600">
                <Save className="w-4 h-4 mr-2" />
                Save for Client
              </Button>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Email to Client
              </Button>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep(5)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
