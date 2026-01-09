import { Link } from "react-router-dom";
import { FileText, Scale, Shield, ArrowRight, Building2, User, Clock, BarChart3, ClipboardCheck, CheckCircle, ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  {
    number: 1,
    title: "Business Info",
    description: "Enter industry, NAICS code, state, revenue, net income, and employee count",
    icon: Building2,
  },
  {
    number: 2,
    title: "Owner Role & Experience",
    description: "Document credentials, experience, hours worked, and current compensation",
    icon: User,
  },
  {
    number: 3,
    title: "Time Allocation",
    description: "Distribute time across roles: CEO/Strategic, Operations, Sales, Technical, Admin",
    icon: Clock,
  },
  {
    number: 4,
    title: "Market Wage Review",
    description: "Review and adjust state-adjusted hourly rates based on market data",
    icon: BarChart3,
  },
  {
    number: 5,
    title: "IRS Factors Evaluation",
    description: "Assess 10 judicially recognized factors with qualitative notes",
    icon: ClipboardCheck,
  },
  {
    number: 6,
    title: "Advisor Judgment",
    description: "Review calculated ranges and select final wage with professional justification",
    icon: CheckCircle,
  },
];

const faqs = [
  {
    question: "What is reasonable compensation for S Corp owners?",
    answer: "Reasonable compensation is the amount that would ordinarily be paid for like services by like enterprises under like circumstances, as defined in Treasury Regulation §1.162-7(b)(3). For S Corporation shareholders who perform services, the IRS requires that they receive \"reasonable\" compensation as W-2 wages before taking distributions to avoid payroll tax avoidance.",
  },
  {
    question: "Why is documentation important?",
    answer: "The IRS Job Aid for Valuation Professionals specifically emphasizes the importance of contemporaneous documentation—records created at the time the compensation decision is made. If the IRS ever questions your compensation, having a Defense File created at the time of the decision demonstrates thoughtful analysis rather than after-the-fact justification.",
  },
  {
    question: "What factors do courts consider when evaluating reasonable compensation?",
    answer: "Courts have identified multiple factors including: employee training, experience, and credentials; duties and responsibilities; time devoted to the business; comparable compensation paid by similar companies; complexity and scope of the business; prevailing economic conditions; and the company's dividend history. This tool addresses all 10 factors recognized by the IRS.",
  },
  {
    question: "Does this tool replace professional tax advice?",
    answer: "No. The Reasonable Comp Defense File™ supports professional judgment but does not replace it. Final compensation decisions are made by the advisor based on the client's full facts and circumstances. This tool provides structured documentation and market data to support—not automate—that professional analysis.",
  },
  {
    question: "What data sources are used for market comparisons?",
    answer: "The tool references Bureau of Labor Statistics (BLS) Occupational Employment Statistics, industry salary surveys, and geographic cost-of-living adjustments. Market rates are presented as ranges (10th to 90th percentile) to reflect real-world compensation variability. You can also add custom data sources like RCReports, Payscale, or industry-specific surveys.",
  },
  {
    question: "How does the Defense File help if compensation is ever questioned?",
    answer: "The Defense File provides a complete audit trail showing: (1) what data was considered, (2) how different valuation approaches were applied, (3) which judicial factors were evaluated, and (4) why the final compensation was selected. This contemporaneous documentation shifts the narrative from \"justify yourself\" to \"here's how we arrived at this decision.\"",
  },
];

export default function ReasonableCompLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-eiduk-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display text-lg font-bold text-eiduk-navy tracking-tight">
                Eiduk Tax & Wealth
              </div>
              <div className="text-xs font-semibold text-eiduk-gold tracking-wide">
                Pay Less. Keep More. Build Wealth.
              </div>
            </div>
            <div className="hidden md:block w-px h-9 bg-slate-200" />
            <div className="hidden md:flex items-center gap-2 bg-eiduk-blue/10 px-3 py-2 rounded-lg">
              <FileText className="w-4 h-4 text-eiduk-blue" />
              <span className="text-sm font-semibold text-eiduk-navy">Defense File™</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">John Eiduk, CPA, CFP®</span>
              <span>847-917-8981</span>
            </div>
            <Link to="/reasonable-comp">
              <Button className="bg-eiduk-blue hover:bg-eiduk-navy">
                Go to App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-7 bg-gradient-to-br from-eiduk-blue to-eiduk-lightBlue rounded-2xl flex items-center justify-center shadow-lg shadow-eiduk-blue/25">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-eiduk-navy mb-3 tracking-tight">
            Reasonable Comp Defense File™
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Reasonable Compensation Determination & Supporting Analysis
          </p>

          {/* Quote Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto shadow-sm mb-14">
            <p className="font-display text-xl md:text-2xl italic text-eiduk-navy leading-relaxed">
              "We're not trying to win an argument with the IRS after the fact.
              <br />
              <span className="text-eiduk-blue">We're documenting a reasonable decision before there's ever a question.</span>"
            </p>
          </div>
        </section>

        {/* Value Props */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          <div className="bg-white border border-slate-200 rounded-xl p-7 text-center hover:border-eiduk-blue hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 bg-eiduk-blue/10 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-eiduk-blue" />
            </div>
            <h3 className="font-bold text-eiduk-navy mb-2">Judicial Standards</h3>
            <p className="text-sm text-muted-foreground">Consistent with factors recognized by U.S. Tax Courts</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-7 text-center hover:border-eiduk-blue hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 bg-eiduk-blue/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-eiduk-blue" />
            </div>
            <h3 className="font-bold text-eiduk-navy mb-2">Contemporaneous Record</h3>
            <p className="text-sm text-muted-foreground">Documentation created at the time of the decision</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-7 text-center hover:border-eiduk-blue hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 bg-eiduk-blue/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-eiduk-blue" />
            </div>
            <h3 className="font-bold text-eiduk-navy mb-2">Professional Judgment</h3>
            <p className="text-sm text-muted-foreground">Supports—never replaces—advisor expertise</p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="font-display text-3xl font-bold text-eiduk-navy text-center mb-2">How It Works</h2>
          <p className="text-muted-foreground text-center mb-10">Create your Defense File in 6 simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative bg-white border border-slate-200 rounded-xl p-6 pt-8">
                  <div className="absolute -top-3 left-5 w-7 h-7 bg-eiduk-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <div className="w-11 h-11 bg-eiduk-blue/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-eiduk-blue" />
                  </div>
                  <h4 className="font-bold text-eiduk-navy mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-bold text-eiduk-navy text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center mb-10">Common questions about reasonable compensation documentation</p>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-5 text-left font-semibold text-eiduk-navy hover:bg-eiduk-cream hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-white border border-slate-200 rounded-2xl p-12 shadow-lg">
          <Link to="/reasonable-comp">
            <Button size="lg" className="bg-eiduk-blue hover:bg-eiduk-navy text-lg px-10 py-6 h-auto shadow-lg shadow-eiduk-blue/30 hover:-translate-y-0.5 transition-all">
              <FileText className="w-5 h-5 mr-3" />
              Start Defense File
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Takes approximately 10-15 minutes to complete
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="mb-6">
            <div className="font-display text-xl font-bold text-eiduk-navy mb-1">Eiduk Tax & Wealth</div>
            <div className="text-sm font-semibold text-eiduk-gold mb-2">Pay Less. Keep More. Build Wealth.</div>
            <div className="text-sm text-muted-foreground">John Eiduk, CPA, CFP® · 847-917-8981 · www.eiduktaxandwealth.com</div>
          </div>
          <div className="w-16 h-px bg-slate-200 mx-auto my-6" />
          <div className="text-sm font-semibold text-eiduk-blue mb-3">Reasonable Comp Defense File™</div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-5 leading-relaxed">
            This tool is designed to assist tax professionals in documenting reasonable compensation determinations. 
            It does not constitute tax advice. Final compensation decisions should be made by qualified professionals 
            based on the client's complete facts and circumstances.
          </p>
          <p className="text-xs text-muted-foreground opacity-70">
            © {new Date().getFullYear()} Eiduk Tax & Wealth. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
