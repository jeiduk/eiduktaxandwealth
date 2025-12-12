import { Button } from '@/components/ui/button';
import { X, Printer, Mail, Send, Loader2 } from 'lucide-react';

interface Roadmap {
  id: string;
  title: string;
  service_level?: string;
  phase1_title: string;
  phase1_description: string;
  phase1_tasks: string[];
  phase2_title: string;
  phase2_description: string;
  phase2_tasks: string[];
  phase3_title: string;
  phase3_description: string;
  phase3_tasks: string[];
  phase4_title: string;
  phase4_description: string;
  phase4_tasks: string[];
  phase5_title: string;
  phase5_description: string;
  phase5_tasks: string[];
  phase6_title: string;
  phase6_description: string;
  phase6_tasks: string[];
  estimated_savings_min: number;
  estimated_savings_max: number;
  created_at: string;
}

interface RoadmapPreviewProps {
  roadmap: Roadmap;
  clientName: string;
  companyName?: string;
  clientEmail?: string;
  onClose: () => void;
  onSend?: () => void;
  sending?: boolean;
  showSendButton?: boolean;
}

const PHASE_TIMING = [
  'Week 1–2',
  'Week 2–4',
  'Week 4–6',
  'Week 6–8',
  'Week 8–10',
  'Week 10–12',
];

export function RoadmapPreview({ roadmap, clientName, companyName, clientEmail, onClose, onSend, sending, showSendButton }: RoadmapPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Welcome to Eiduk Tax & Wealth - Your 90-Day Roadmap');
    const body = encodeURIComponent(`Hi,\n\nWelcome! Please find your complete 90-Day Roadmap and onboarding information.\n\nThis packet contains everything you need to get started and maximize your tax savings.\n\nLooking forward to working with you!\n\nBest regards,\nJohn Eiduk, CPA, CFP®, MSCTA\nEiduk Tax & Wealth\n847-917-8981\njohn@eiduktaxandwealth.com`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const phases = [
    { title: roadmap.phase1_title, description: roadmap.phase1_description, tasks: roadmap.phase1_tasks },
    { title: roadmap.phase2_title, description: roadmap.phase2_description, tasks: roadmap.phase2_tasks },
    { title: roadmap.phase3_title, description: roadmap.phase3_description, tasks: roadmap.phase3_tasks },
    { title: roadmap.phase4_title, description: roadmap.phase4_description, tasks: roadmap.phase4_tasks },
    { title: roadmap.phase5_title, description: roadmap.phase5_description, tasks: roadmap.phase5_tasks },
    { title: roadmap.phase6_title, description: roadmap.phase6_description, tasks: roadmap.phase6_tasks },
  ];

  return (
    <div className="fixed inset-0 bg-eiduk-cream z-50 overflow-auto print:static print:bg-white">
      {/* Controls - Hidden on print */}
      <div className="print:hidden fixed top-4 right-4 flex items-center gap-2 z-50">
        {showSendButton && onSend && (
          <Button 
            size="sm" 
            onClick={onSend}
            disabled={sending || !clientEmail}
            className="bg-gradient-to-r from-eiduk-gold to-yellow-500 text-eiduk-navy border-none hover:opacity-90 font-semibold"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? 'Sending...' : `Send to ${clientEmail}`}
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEmail}
          className="bg-gradient-to-r from-eiduk-blue to-eiduk-navy text-white border-none hover:opacity-90"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="bg-gradient-to-r from-eiduk-light-blue to-eiduk-blue text-white border-none hover:opacity-90"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print to PDF
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/50">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Send Preview Banner */}
      {showSendButton && (
        <div className="print:hidden fixed top-4 left-4 z-50 bg-eiduk-navy/95 text-white px-4 py-2 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">Preview Mode</p>
          <p className="text-xs text-white/80">This is exactly what {clientName} will see when they open the magic link.</p>
        </div>
      )}

      {/* Roadmap Content - Matches HTML template exactly */}
      <div className="max-w-[900px] mx-auto p-5 pt-20 print:p-0 print:pt-0 print:max-w-full">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(30,58,95,0.08)] overflow-hidden print:shadow-none print:rounded-none">
          
          {/* Header - Matching template */}
          <div 
            className="relative text-center py-12 px-10"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)',
            }}
          >
            {/* Subtle pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10">
              <div className="font-display text-sm tracking-[3px] uppercase text-eiduk-gold mb-4">
                Eiduk Tax & Wealth
              </div>
              <h1 className="font-display text-4xl font-bold text-white mb-3">
                Welcome to Your Tax Advisory Partnership!
              </h1>
              <p className="text-lg text-white/90 max-w-[600px] mx-auto">
                Your Strategic Tax Optimization Starts Today
              </p>
              <div className="font-display text-lg font-semibold text-eiduk-gold mt-5">
                Pay Less. Keep More. Build Wealth.
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-10 md:p-12">
            {/* Client Info Box */}
            <div className="bg-eiduk-cream rounded-2xl p-6 mb-8 border-l-4 border-eiduk-blue">
              <h3 className="font-display text-lg font-semibold text-eiduk-navy mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-eiduk-navy">Client Name:</span>
                  <p className="text-foreground">{clientName}</p>
                </div>
                {companyName && (
                  <div>
                    <span className="text-sm font-semibold text-eiduk-navy">Business Name:</span>
                    <p className="text-foreground">{companyName}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-eiduk-navy">Engagement Date:</span>
                  <p className="text-foreground">{formatDate(roadmap.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-eiduk-navy">Service Level:</span>
                  <p className="text-foreground">{roadmap.service_level || 'Tax Advisory'}</p>
                </div>
              </div>
            </div>

            {/* Savings Box */}
            <div 
              className="rounded-2xl p-8 text-center mb-10 border-2 border-eiduk-gold"
              style={{
                background: 'linear-gradient(135deg, rgba(201, 162, 39, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
              }}
            >
              <h2 className="font-display text-2xl text-eiduk-navy mb-3">
                Projected Annual Tax Savings
                <span className="ml-2 inline-block bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white text-xs px-3 py-1 rounded-full align-middle">
                  The Eiduk Pathway™
                </span>
              </h2>
              <div className="font-display text-[40px] font-bold text-eiduk-gold my-4">
                {formatCurrency(roadmap.estimated_savings_min)} – {formatCurrency(roadmap.estimated_savings_max)}+
              </div>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Based on your business profile and The Eiduk Pathway™ systematic implementation.
              </p>
            </div>

            {/* What's Included */}
            <div className="mb-10">
              <h2 
                className="text-white font-display text-lg font-semibold p-4 rounded-lg mb-6"
                style={{ background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)' }}
              >
                What's Included in Your Service
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceCard 
                  emoji="🎯" 
                  title="Strategic Tax Planning"
                  items={['Quarterly strategic planning sessions', 'Year-end tax optimization review', 'Multi-year tax projection modeling']}
                />
                <ServiceCard 
                  emoji="📊" 
                  title="S-Corp Foundation Setup"
                  items={['Reasonable compensation analysis', 'Accountable plan implementation', 'Home office deduction']}
                />
                <ServiceCard 
                  emoji="📁" 
                  title="Complete Tax Compliance"
                  items={['Corporate tax return (1120S)', 'Personal tax return (1040)', 'Quarterly estimated tax guidance']}
                />
                <ServiceCard 
                  emoji="💼" 
                  title="Ongoing Advisory Support"
                  items={['Unlimited email support', 'Priority phone consultations', 'Document review and feedback']}
                />
              </div>
            </div>

            {/* 90-Day Timeline Header */}
            <h2 
              className="text-white font-display text-lg font-semibold p-4 rounded-lg mb-6"
              style={{ background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)' }}
            >
              Your 90-Day Success Roadmap
            </h2>

            {/* Timeline */}
            <div className="relative">
              {phases.map((phase, index) => (
                <PhaseCard
                  key={index}
                  phaseNumber={index + 1}
                  title={phase.title}
                  description={phase.description}
                  tasks={phase.tasks}
                  timing={PHASE_TIMING[index]}
                  isLast={index === phases.length - 1}
                  isCelebration={index === 5}
                />
              ))}
            </div>

            {/* Help Box */}
            <div 
              className="rounded-xl p-6 mt-10 border-l-4 border-success"
              style={{
                background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              }}
            >
              <h3 className="font-display text-xl text-eiduk-navy mb-3">
                ✅ We're With You Every Step
              </h3>
              <p className="text-[15px] leading-relaxed text-foreground">
                Don't worry about remembering all of this! Our team will guide you through each phase and remind you when action is needed. 
                We'll send you exactly what you need, when you need it. Your only job is to respond promptly when we reach out.
              </p>
            </div>

            {/* Contact Card */}
            <div 
              className="rounded-2xl p-9 mt-10 text-center text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)',
              }}
            >
              <h3 className="font-display text-[22px] text-white mb-4">
                Questions? We're Here to Help
              </h3>
              <p className="text-base mb-2">
                <strong>John Eiduk, CPA, CFP®, MSCTA</strong>
              </p>
              <p className="text-base mb-2">
                847-917-8981 | <a href="mailto:john@eiduktaxandwealth.com" className="text-eiduk-gold font-semibold hover:underline">john@eiduktaxandwealth.com</a>
              </p>
              <p className="mt-4">
                <a href="https://eiduktaxandwealth.com" className="text-eiduk-gold font-semibold hover:underline">eiduktaxandwealth.com</a>
              </p>
              <div className="font-display text-lg font-semibold text-eiduk-gold mt-5">
                Pay Less. Keep More. Build Wealth.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ emoji, title, items }: { emoji: string; title: string; items: string[] }) {
  return (
    <div className="bg-white border border-border/50 rounded-xl p-5 shadow-sm border-l-4 border-l-eiduk-blue">
      <h4 className="font-semibold text-eiduk-navy mb-3">{emoji} {title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

interface PhaseCardProps {
  phaseNumber: number;
  title: string;
  description: string;
  tasks: string[];
  timing: string;
  isLast: boolean;
  isCelebration?: boolean;
}

function PhaseCard({ phaseNumber, title, description, tasks, timing, isLast, isCelebration }: PhaseCardProps) {
  return (
    <div className="flex mb-8 last:mb-0 relative">
      {/* Phase Marker */}
      <div className="flex-shrink-0 w-20 text-center relative">
        <div 
          className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white text-2xl mx-auto relative z-[2]"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--eiduk-blue)) 0%, hsl(var(--eiduk-navy)) 100%)',
          }}
        >
          {isCelebration ? '🎉' : phaseNumber}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div 
            className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[3px] h-[calc(100%+30px)] z-[1] hidden md:block"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--eiduk-blue)) 0%, hsl(var(--eiduk-light-blue)) 100%)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-border/50 border-l-4 border-l-eiduk-blue rounded-xl p-6 ml-5 shadow-[0_2px_8px_rgba(30,58,95,0.06)]">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
          <div className="font-display text-xl font-semibold text-eiduk-navy">
            {title}
          </div>
          <div className="bg-eiduk-cream text-eiduk-navy px-3.5 py-1.5 rounded-full text-[13px] font-semibold">
            {timing}
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4 text-[15px] leading-relaxed">
          {description}
        </p>

        {/* Tasks */}
        <div className="bg-eiduk-cream rounded-lg p-4">
          <div className="font-bold text-eiduk-navy text-sm mb-2.5 flex items-center gap-2">
            📋 {isCelebration ? "What You'll Need to Do:" : "What You'll Need to Provide:"}
          </div>
          <ul className="list-none m-0 p-0">
            {tasks.map((task, index) => (
              <li 
                key={index} 
                className="py-2 pl-6 relative text-sm text-foreground border-b border-black/5 last:border-b-0 last:pb-0"
              >
                <span className="absolute left-0 text-eiduk-blue text-base">☐</span>
                {task}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
