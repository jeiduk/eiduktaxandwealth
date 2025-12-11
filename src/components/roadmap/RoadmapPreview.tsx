import { Button } from '@/components/ui/button';
import { X, Download, Printer } from 'lucide-react';

interface Roadmap {
  id: string;
  title: string;
  phase1_title: string;
  phase1_description: string;
  phase1_tasks: string[];
  phase2_title: string;
  phase2_description: string;
  phase2_tasks: string[];
  phase3_title: string;
  phase3_description: string;
  phase3_tasks: string[];
  estimated_savings_min: number;
  estimated_savings_max: number;
}

interface RoadmapPreviewProps {
  roadmap: Roadmap;
  clientName: string;
  onClose: () => void;
}

export function RoadmapPreview({ roadmap, clientName, onClose }: RoadmapPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
      {/* Controls - Hidden on print */}
      <div className="print:hidden fixed top-4 right-4 flex items-center gap-2 z-50">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Roadmap Preview Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="bg-background rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-eiduk-navy to-eiduk-blue p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  {roadmap.title}
                </h1>
                <p className="text-white/80 text-lg">
                  Prepared for {clientName}
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold text-eiduk-gold">
                  Eiduk
                </div>
                <div className="text-white/80 text-sm">Tax & Wealth</div>
              </div>
            </div>

            {/* Estimated Savings */}
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <p className="text-white/80 text-sm uppercase tracking-wider mb-2">
                Estimated Annual Tax Savings
              </p>
              <div className="font-display text-4xl font-bold text-eiduk-gold">
                ${roadmap.estimated_savings_min.toLocaleString()} - ${roadmap.estimated_savings_max.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-8">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-eiduk-navy via-eiduk-blue to-eiduk-gold hidden md:block" />

              {/* Phase 1 */}
              <PhaseCard
                phaseNumber={1}
                title={roadmap.phase1_title}
                description={roadmap.phase1_description}
                tasks={roadmap.phase1_tasks}
                days="Days 1-30"
                color="bg-eiduk-navy"
              />

              {/* Phase 2 */}
              <PhaseCard
                phaseNumber={2}
                title={roadmap.phase2_title}
                description={roadmap.phase2_description}
                tasks={roadmap.phase2_tasks}
                days="Days 31-60"
                color="bg-eiduk-blue"
              />

              {/* Phase 3 */}
              <PhaseCard
                phaseNumber={3}
                title={roadmap.phase3_title}
                description={roadmap.phase3_description}
                tasks={roadmap.phase3_tasks}
                days="Days 61-90"
                color="bg-eiduk-gold"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-eiduk-cream p-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Your journey to tax optimization starts here.
            </p>
            <p className="font-display text-lg font-semibold text-eiduk-navy">
              Eiduk Tax & Wealth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhaseCardProps {
  phaseNumber: number;
  title: string;
  description: string;
  tasks: string[];
  days: string;
  color: string;
}

function PhaseCard({ phaseNumber, title, description, tasks, days, color }: PhaseCardProps) {
  return (
    <div className="relative flex gap-6 mb-8 last:mb-0">
      {/* Phase Number Circle */}
      <div className={`w-12 h-12 rounded-full ${color} text-white flex items-center justify-center font-display font-bold text-xl shrink-0 z-10`}>
        {phaseNumber}
      </div>

      {/* Content */}
      <div className="flex-1 bg-card border rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {days}
            </span>
            <h3 className="font-display text-xl font-bold text-foreground mt-1">
              {title}
            </h3>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4">{description}</p>

        <ul className="space-y-2">
          {tasks.map((task, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full ${color} mt-2 shrink-0`} />
              <span className="text-foreground">{task}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
