import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, X, Check, Download, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  demoAsset, 
  demoHealthScore, 
  demoAuditFindings,
  getAgingFactor,
  type AuditFinding 
} from '@/data/mockAsset';
import { generatePDF } from '@/lib/pdfGenerator';

interface ForensicReportProps {
  onBack: () => void;
}

function AgeDilationSection() {
  const { paperAge, biologicalAge } = demoAsset;
  const factor = getAgingFactor(paperAge, biologicalAge);
  const paperPercent = (paperAge / 15) * 100; // Assuming 15 years max
  const bioPercent = (biologicalAge / 15) * 100;

  return (
    <section className="glass-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Section 1: Age Dilation
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 italic">
        "High pressure is aging your unit at <span className="text-status-critical font-mono">{factor}</span> speed."
      </p>

      <div className="space-y-3">
        {/* Paper Age */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">PAPER AGE</span>
            <span className="font-mono">{paperAge} Years</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/50 rounded-full transition-all duration-1000"
              style={{ width: `${paperPercent}%` }}
            />
          </div>
        </div>

        {/* Biological Age */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">REAL AGE</span>
            <span className="font-mono text-status-critical">
              {biologicalAge} Years (EXPIRED)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-status-critical rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(bioPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceItem({ finding }: { finding: AuditFinding }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-2 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {finding.passed ? (
            <Check className="w-4 h-4 text-status-optimal" />
          ) : (
            <X className="w-4 h-4 text-status-critical" />
          )}
          <span className={cn(
            "text-sm font-medium",
            finding.passed ? "text-foreground" : "text-status-critical"
          )}>
            {finding.name}: {finding.value}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 animate-fade-in-up">
          {finding.photoUrl && (
            <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs">PHOTO EVIDENCE</span>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {finding.details}
          </p>
        </div>
      )}
    </div>
  );
}

function EvidenceLockerSection() {
  return (
    <section className="glass-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Section 2: Evidence Locker
      </h3>
      <p className="text-xs text-muted-foreground/60 mb-3">
        (Tap rows to expand proof)
      </p>

      <div className="rounded-lg border border-border/30 overflow-hidden">
        {demoAuditFindings.map((finding) => (
          <EvidenceItem key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function VerdictSection({ onDownloadPDF }: { onDownloadPDF: () => void }) {
  const { failureProbability, recommendation } = demoHealthScore;

  return (
    <section className="glass-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Section 3: The Verdict
      </h3>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">
          ACTUARIAL FAILURE PROBABILITY
        </p>
        <p className="font-mono text-4xl font-bold text-status-critical">
          {failureProbability}%
        </p>
        
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-1">
            RECOMMENDATION
          </p>
          <p className="font-semibold text-lg text-status-critical">
            {recommendation}
          </p>
        </div>
      </div>

      <Button
        onClick={onDownloadPDF}
        variant="outline"
        className="w-full mt-4 border-primary/50 text-primary hover:bg-primary/10"
      >
        <Download className="w-4 h-4 mr-2" />
        DOWNLOAD INSURANCE PDF
      </Button>
    </section>
  );
}

export function ForensicReport({ onBack }: ForensicReportProps) {
  const handleDownloadPDF = () => {
    generatePDF();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">BACK</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold pr-16">
            FORENSIC AUDIT
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="pt-4 animate-fade-in-up">
        <AgeDilationSection />
        <EvidenceLockerSection />
        <VerdictSection onDownloadPDF={handleDownloadPDF} />
      </div>
    </div>
  );
}
