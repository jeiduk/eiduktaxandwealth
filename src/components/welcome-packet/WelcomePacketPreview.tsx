import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Mail } from 'lucide-react';

interface WelcomePacket {
  id: string;
  service_level: string;
  engagement_date: string;
  projected_savings_min: number;
  projected_savings_max: number;
  status: string;
  created_at: string;
}

interface WelcomePacketPreviewProps {
  packet: WelcomePacket;
  clientName: string;
  companyName?: string;
  onClose: () => void;
}

export function WelcomePacketPreview({ packet, clientName, companyName, onClose }: WelcomePacketPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Welcome to Eiduk Tax & Wealth - Your Client Resource Package');
    const body = encodeURIComponent(`Dear ${clientName},\n\nWelcome! Please find your complete Client Welcome Packet at the link below.\n\nThis packet contains everything you need to get started and maximize your tax savings.\n\nI'm excited to work with you!\n\nBest regards,\nJohn Eiduk, CPA, CFP®, MSCTA\nEiduk Tax & Wealth\n847-917-8981\njohn@eiduktaxandwealth.com`);
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

  return (
    <div className="min-h-screen bg-cream">
      {/* Action Buttons - Hidden in print */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEmail} className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-eiduk-navy hover:bg-eiduk-blue">
              <Printer className="h-4 w-4" />
              Print to PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome Packet Content */}
      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div 
            className="p-10 text-center text-white relative"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%)' }}
          >
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="relative z-10">
              <p className="text-eiduk-gold text-sm font-semibold tracking-[3px] uppercase mb-4">
                Eiduk Tax & Wealth
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                Welcome to Your Tax Advisory Partnership!
              </h1>
              <h2 className="text-lg text-white/90 mb-5">
                Your Strategic Tax Optimization Starts Today
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto leading-relaxed">
                Thank you for choosing us as your tax and wealth advisory partner. We're committed to delivering 
                exceptional value through systematic, compliant tax strategies designed specifically for S-Corporation 
                business owners.
              </p>
              <p className="text-eiduk-gold font-display text-lg font-semibold mt-5">
                Pay Less. Keep More. Build Wealth.
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-10">
            {/* Client Info Box */}
            <div className="bg-cream rounded-2xl p-6 mb-8 border-l-4 border-eiduk-blue">
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
                  <p className="text-foreground">{formatDate(packet.engagement_date)}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-eiduk-navy">Service Level:</span>
                  <p className="text-foreground">{packet.service_level}</p>
                </div>
              </div>
            </div>

            {/* Savings Highlight */}
            <div className="bg-gradient-to-br from-eiduk-gold/10 to-eiduk-gold/5 rounded-2xl p-8 text-center border-2 border-eiduk-gold mb-8">
              <h3 className="font-display text-xl text-eiduk-navy mb-2">
                Projected Annual Tax Savings
                <span className="ml-2 inline-block bg-gradient-to-r from-eiduk-navy to-eiduk-blue text-white text-xs px-3 py-1 rounded-full">
                  The Eiduk Pathway™
                </span>
              </h3>
              <p className="font-display text-4xl md:text-5xl font-bold text-eiduk-gold my-4">
                {formatCurrency(packet.projected_savings_min)} – {formatCurrency(packet.projected_savings_max)}+
              </p>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Based on your business profile and The Eiduk Pathway™ systematic implementation, 
                most S-Corp clients achieve significant tax savings in their first year.
              </p>
            </div>

            {/* What's Included Section */}
            <div className="mb-8">
              <h2 
                className="text-white font-display text-lg font-semibold p-4 rounded-lg mb-6"
                style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%)' }}
              >
                What's Included in Your Service
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceCard 
                  emoji="🎯" 
                  title="Strategic Tax Planning"
                  items={[
                    'Quarterly strategic planning sessions',
                    'Year-end tax optimization review',
                    'Multi-year tax projection modeling',
                    'Custom strategy implementation roadmap'
                  ]}
                />
                <ServiceCard 
                  emoji="📊" 
                  title="S-Corp Foundation Setup"
                  items={[
                    'Reasonable compensation analysis',
                    'Accountable plan implementation',
                    'Home office deduction',
                    'Health insurance optimization'
                  ]}
                />
                <ServiceCard 
                  emoji="📁" 
                  title="Complete Tax Compliance"
                  items={[
                    'Corporate tax return preparation (1120S)',
                    'Personal tax return preparation (1040)',
                    'Quarterly estimated tax guidance',
                    'IRS correspondence support'
                  ]}
                />
                <ServiceCard 
                  emoji="💼" 
                  title="Ongoing Advisory Support"
                  items={[
                    'Unlimited email support',
                    'Priority phone consultations',
                    'Document review and feedback',
                    'Major decision tax guidance'
                  ]}
                />
              </div>
            </div>

            {/* 90-Day Timeline */}
            <div className="mb-8">
              <h2 
                className="text-white font-display text-lg font-semibold p-4 rounded-lg mb-6"
                style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%)' }}
              >
                Your 90-Day Success Timeline
              </h2>
              <div className="bg-cream rounded-2xl p-6 border border-eiduk-blue/20">
                <h3 className="font-display text-xl text-center text-eiduk-navy mb-6">
                  What to Expect in Your First 90 Days
                </h3>
                <div className="space-y-4">
                  <TimelineItem week="Week 1–2" title="Initial Setup & Documentation" description="Complete engagement paperwork, gather documents, review strategies, set up portal access." />
                  <TimelineItem week="Week 2–4" title="S-Corp Foundation Implementation" description="Implement foundation strategies, optimize payroll, establish policies, set up reimbursement systems." />
                  <TimelineItem week="Week 4–6" title="Bookkeeping & Accounting Integration" description="Review current system, optimize chart of accounts, connect bank feeds, set up reporting." />
                  <TimelineItem week="Week 6–8" title="Advanced Strategy Implementation" description="Implement advanced strategies, analyze retirement options, plan equipment purchases." />
                  <TimelineItem week="Week 8–10" title="Compliance Systems & Documentation" description="Establish corporate records, conduct first board meeting, process first reimbursements." />
                  <TimelineItem week="Week 10–12" title="Optimization & Planning" description="90-day review meeting, measure tax savings, year-end projection, celebrate success!" />
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-eiduk-blue/10 to-eiduk-blue/5 rounded-2xl p-6 border border-eiduk-blue/20 mb-8">
              <h3 className="font-display text-xl text-eiduk-navy mb-4">🚀 Your Immediate Next Steps</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-eiduk-gold font-bold">1.</span>
                  <span><strong className="text-eiduk-navy">Review Your Tax & Wealth Blueprint™</strong> – Understand your selected strategies and projected savings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-eiduk-gold font-bold">2.</span>
                  <span><strong className="text-eiduk-navy">Gather Initial Documents</strong> – Prior year tax returns, current year P&L, business formation docs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-eiduk-gold font-bold">3.</span>
                  <span><strong className="text-eiduk-navy">Schedule Kickoff Meeting</strong> – We'll walk through everything, answer questions, and begin implementation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-eiduk-gold font-bold">4.</span>
                  <span><strong className="text-eiduk-navy">Complete Portal Setup</strong> – Access your secure client portal for document sharing</span>
                </li>
              </ul>
            </div>

            {/* Contact Card */}
            <div className="bg-cream rounded-2xl p-6 border-l-4 border-eiduk-blue mb-8">
              <h3 className="font-display text-xl text-eiduk-navy mb-4">Your Advisory Team Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <strong className="text-sm text-eiduk-navy block mb-2">📞 Phone Support</strong>
                  <p className="text-sm text-muted-foreground">847-917-8981</p>
                  <p className="text-xs text-muted-foreground">Mon–Fri, 9–5 CST</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <strong className="text-sm text-eiduk-navy block mb-2">📧 Email Support</strong>
                  <p className="text-sm text-muted-foreground">john@eiduktaxandwealth.com</p>
                  <p className="text-xs text-muted-foreground">Response: 1 business day</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <strong className="text-sm text-eiduk-navy block mb-2">🌐 Website</strong>
                  <p className="text-sm text-muted-foreground">eiduktaxandwealth.com</p>
                  <p className="text-xs text-muted-foreground">Portal & resources</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <strong className="text-sm text-eiduk-navy block mb-2">📍 Office</strong>
                  <p className="text-sm text-muted-foreground">Palatine, Illinois</p>
                  <p className="text-xs text-muted-foreground">By appointment</p>
                </div>
              </div>
            </div>

            {/* Closing Message */}
            <div className="bg-gradient-to-br from-eiduk-gold/10 to-eiduk-gold/5 rounded-2xl p-8 text-center border border-eiduk-gold mb-8">
              <h3 className="font-display text-2xl text-eiduk-navy mb-4">We're Excited to Work with You!</h3>
              <p className="text-muted-foreground max-w-xl mx-auto mb-4">
                Your decision to invest in proactive tax planning is one of the best financial decisions you'll make. 
                We're committed to delivering exceptional value and helping you achieve significant, sustainable tax savings.
              </p>
              <p className="font-display text-xl text-eiduk-gold font-semibold">
                Let's get started on your path to {formatCurrency(packet.projected_savings_min)}+ in annual tax savings!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="p-8 text-center text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%)' }}
          >
            <p className="font-semibold text-lg">John Eiduk, CPA, CFP®, MSCTA</p>
            <p className="text-white/80 text-sm">Founder, Eiduk Tax & Wealth</p>
            <p className="text-white/80 text-sm mt-2">
              847-917-8981 | john@eiduktaxandwealth.com | eiduktaxandwealth.com
            </p>
            <p className="text-eiduk-gold font-display font-semibold mt-4">
              Pay Less. Keep More. Build Wealth.
            </p>
            <p className="text-white/50 text-xs mt-4">
              © 2025 Eiduk Tax & Wealth. All rights reserved.
            </p>
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

function TimelineItem({ week, title, description }: { week: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
      <div 
        className="text-white text-xs font-semibold px-3 py-2 rounded-lg text-center min-w-[70px]"
        style={{ background: 'linear-gradient(135deg, #2C5AA0 0%, #1E3A5F 100%)' }}
      >
        {week}
      </div>
      <div className="flex-1">
        <strong className="text-eiduk-navy block text-sm">{title}</strong>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
