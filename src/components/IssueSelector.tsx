import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, repairOptions, getAvailableRepairs } from '@/data/repairOptions';
import { calculateOpterraRisk, ForensicInputs } from '@/lib/opterraAlgorithm';

interface IssueSelectorProps {
  onBack: () => void;
  onSimulate: (selectedRepairs: RepairOption[]) => void;
  currentInputs: ForensicInputs;
}

export function IssueSelector({ onBack, onSimulate, currentInputs }: IssueSelectorProps) {
  // Calculate metrics using CURRENT inputs (not static demo data)
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { failProb } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;

  // Derive health status from failProb
  const healthStatus = failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal';

  // Physical-only replacement: only require replacement for visible failures
  const replacementRequired = recommendation.action === 'REPLACE';

  // Get dynamically available repairs based on current system state
  const availableRepairs = getAvailableRepairs(currentInputs, opterraResult.metrics, recommendation);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    // Auto-select replacement if required
    replacementRequired ? new Set(['replace']) : new Set()
  );

  const fullReplacement = availableRepairs.find(r => r.isFullReplacement);
  const individualRepairs = availableRepairs.filter(r => !r.isFullReplacement);

  const isReplacementSelected = selectedIds.has('replace');

  const toggleRepair = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      
      // If selecting full replacement, clear all others
      if (id === 'replace') {
        if (next.has('replace')) {
          next.delete('replace');
        } else {
          next.clear();
          next.add('replace');
        }
      } else {
        // If selecting individual repair, remove full replacement
        next.delete('replace');
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      
      return next;
    });
  };

  const selectedRepairs = availableRepairs.filter(r => selectedIds.has(r.id));

  const handleContinue = () => {
    if (selectedRepairs.length > 0) {
      onSimulate(selectedRepairs);
    }
  };

  // Handle "No Repairs Needed" state
  if (recommendation.action === 'PASS' && availableRepairs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

        <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-foreground">System Status</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="relative p-6 max-w-md mx-auto text-center py-16">
          <CheckCircle2 className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-3">Assessment Complete</h2>
          <p className="text-muted-foreground mb-8">
            No urgent repairs identified at this time. Continue regular maintenance to keep your unit running well.
          </p>
          <Button onClick={onBack} variant="outline" className="w-full max-w-xs">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground">Select Repairs</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-6 max-w-md mx-auto pb-32">
        {/* Replacement Required Banner */}
        {replacementRequired && (
          <div className="mb-6 p-4 rounded-xl border-2 border-red-500/50 bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 text-sm mb-1">
                  Replacement Required
                </p>
                <p className="text-xs text-muted-foreground">
                  {recommendation.reason} Individual repairs are not available for this unit.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-sm mb-6">
          {replacementRequired 
            ? 'Full replacement is the only available option.'
            : availableRepairs.length > 0 
              ? 'What would you like to address?'
              : 'No repairs currently recommended.'
          }
        </p>

        {/* Full Replacement Option - ONLY show when replacement is required */}
        {fullReplacement && replacementRequired && (
          <button
            onClick={() => toggleRepair(fullReplacement.id)}
            className={`w-full text-left mb-6 p-4 rounded-xl border-2 transition-all ${
              isReplacementSelected
                ? 'border-red-500 bg-red-500/10'
                : 'border-red-500/50 bg-red-500/5 hover:border-red-500/70'
            }`}
            style={{
              boxShadow: isReplacementSelected
                ? '0 0 20px -4px rgba(239, 68, 68, 0.4)'
                : '0 0 20px -4px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReplacementSelected
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-red-500/50'
              }`}>
                {isReplacementSelected && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{fullReplacement.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{fullReplacement.description}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Eliminates all current failure risk</span>
                  </div>
                  {/* Code compliance section */}
                  <div className="mt-2 pt-2 border-t border-red-500/20">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1.5">Includes Required by State Law & Warranty:</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-red-400">•</span>
                      <span>PRV installation (pressure regulation)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-red-400">•</span>
                      <span>Expansion tank (thermal protection)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
                      State plumbing code and manufacturer warranties require these components for all new installations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* No divider needed - replacement and repairs are mutually exclusive now */}

        {/* Individual Repairs - hidden if replacement required */}
        {!replacementRequired && individualRepairs.length > 0 && (
          <div className="space-y-3">
            {individualRepairs.map((repair) => {
              const isSelected = selectedIds.has(repair.id);
              return (
                <button
                  key={repair.id}
                  onClick={() => toggleRepair(repair.id)}
                  disabled={isReplacementSelected}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isReplacementSelected
                      ? 'opacity-40 cursor-not-allowed border-border bg-card/50'
                      : isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{repair.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{repair.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleContinue}
            disabled={selectedRepairs.length === 0}
            className="w-full h-14 text-base font-semibold"
          >
            See Impact on System Health
          </Button>
        </div>
      </div>
    </div>
  );
}