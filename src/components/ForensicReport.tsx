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
  const paperPercent = (paperAge / 15) * 100;
  const bioPercent = (biologicalAge / 15) * 100;

  return (
    <section className="clean-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Section 1: Age Dilation
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        High pressure is aging your unit at <span className="text-red-600 font-bold">{factor}</span> speed.
      </p>

      <div className="space-y-4">
        {/* Paper Age */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Paper Age</span>
            <span className="font-medium">{paperAge} Years</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000"
              style={{ width: `${paperPercent}%` }}
            />
          </div>
        </div>

        {/* Biological Age */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Real Age</span>
            <span className="font-medium text-red-600">
              {biologicalAge} Years (Expired)
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
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
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {finding.passed ? (
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <X className="w-4 h-4 text-red-600" />
            </div>
          )}
          <div className="text-left">
            <span className={cn(
              "text-sm font-medium",
              finding.passed ? "text-foreground" : "text-red-600"
            )}>
              {finding.name}
            </span>
            <p className={cn(
              "text-xs",
              finding.passed ? "text-green-600" : "text-red-600"
            )}>
              {finding.value}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in-up">
          {finding.photoUrl && (
            <div className="mb-3 rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs">Photo Evidence</span>
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
    <section className="clean-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Section 2: Evidence Locker
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Tap rows to expand details
      </p>

      <div className="rounded-2xl border border-border overflow-hidden bg-card">
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
    <section className="clean-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Section 3: The Verdict
      </h3>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">
          Actuarial Failure Probability
        </p>
        <p className="text-5xl font-black text-red-600">
          {failureProbability}%
        </p>
        
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Recommendation
          </p>
          <p className="font-bold text-xl text-red-600">
            {recommendation}
          </p>
        </div>
      </div>

      <Button
        onClick={onDownloadPDF}
        variant="outline"
        className="w-full mt-4 h-12 rounded-xl"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Insurance PDF
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
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold pr-16">
            Forensic Audit
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
