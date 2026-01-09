import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, X, Check, Download, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  generateAuditFindings,
  type AuditFinding,
  type AssetData
} from '@/data/mockAsset';
import { generatePDF } from '@/lib/pdfGenerator';
import { calculateOpterraRisk, type ForensicInputs } from '@/lib/opterraAlgorithm';
import { RecommendationBadge } from './RecommendationBadge';

interface ForensicReportProps {
  onBack: () => void;
  asset: AssetData;
  inputs: ForensicInputs;
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

function EvidenceLockerSection({ findings }: { findings: AuditFinding[] }) {
  return (
    <section className="clean-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Section 2: Evidence Locker
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Tap rows to expand details
      </p>

      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        {findings.map((finding) => (
          <EvidenceItem key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}


function VerdictSection({ failProb, recommendation, onDownloadPDF }: {
  failProb: number; 
  recommendation: ReturnType<typeof calculateOpterraRisk>['verdict'];
  onDownloadPDF: () => void;
}) {
  return (
    <section className="clean-card mx-4 mb-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Section 3: Summary & Statistics
      </h3>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">
          Statistical Failure Rate
        </p>
        <p className="text-5xl font-black text-red-600">
          {failProb.toFixed(0)}%
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Based on industry data for similar units
        </p>
        
        <div className="mt-6 pt-4 border-t border-border">
          <RecommendationBadge recommendation={recommendation} />
        </div>
      </div>

      <Button
        onClick={onDownloadPDF}
        variant="outline"
        className="w-full mt-4 h-12 rounded-xl"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Report PDF
      </Button>
    </section>
  );
}

export function ForensicReport({ onBack, asset, inputs }: ForensicReportProps) {
  // Calculate all metrics using v7.2 algorithm
  const opterraResult = calculateOpterraRisk(inputs);
  const { failProb, bioAge, sedimentLbs, shieldLife, stressFactors } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;
  const financial = opterraResult.financial;

  // Generate dynamic audit findings based on current inputs
  const auditFindings = generateAuditFindings(inputs, { sedimentLbs, shieldLife, bioAge, stressFactors });

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
        {/* Risk Analysis Summary */}
        <section className="clean-card mx-4 mb-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Section 1: Risk Analysis
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground">Biological Age</div>
              <div className="text-lg font-bold font-mono">{bioAge.toFixed(1)} yrs</div>
              <div className="text-[10px] text-muted-foreground">vs {inputs.calendarAge} calendar</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground">Shield Life</div>
              <div className="text-lg font-bold font-mono">{shieldLife.toFixed(1)} yrs</div>
              <div className="text-[10px] text-muted-foreground">anode protection</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground">Sediment Load</div>
              <div className="text-lg font-bold font-mono">{sedimentLbs.toFixed(1)} lbs</div>
              <div className="text-[10px] text-muted-foreground">estimated buildup*</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground">Stress Factor</div>
              <div className="text-lg font-bold font-mono">{stressFactors.total.toFixed(2)}×</div>
              <div className="text-[10px] text-muted-foreground">combined multiplier</div>
            </div>
            
            {/* Tier Detection - v7.2 */}
            <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/30 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Detected Quality Tier</div>
                  <div className="text-sm font-bold text-primary">{financial.currentTier.tierLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Original Warranty</div>
                  <div className="text-sm font-bold">{financial.currentTier.warrantyYears} years</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Tier based on warranty length and venting type
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">
            *Sediment estimates assume ~50% removal per flush. Neglected tanks may retain more sediment.
          </p>
        </section>
        
        <EvidenceLockerSection findings={auditFindings} />
        <VerdictSection failProb={failProb} recommendation={recommendation} onDownloadPDF={handleDownloadPDF} />
      </div>
    </div>
  );
}
