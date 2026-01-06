import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, repairOptions } from '@/data/repairOptions';
import { demoForensicInputs, demoAsset } from '@/data/mockAsset';
import { calculateRiskDilation, calculateOpterraRisk, getRecommendation, getLocationRiskLevel } from '@/lib/opterraAlgorithm';

interface IssueSelectorProps {
  onBack: () => void;
  onSimulate: (selectedRepairs: RepairOption[]) => void;
}

// Calculate all metrics using v4.0 algorithm
const opterraResult = calculateOpterraRisk(demoForensicInputs);
const { sedimentLbs, estDamage, failProb } = opterraResult.metrics;

// Derive health status from failProb
const healthStatus = failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal';

// Get recommendation from the v4.0 algorithm
const riskDilation = calculateRiskDilation(demoAsset.paperAge, demoForensicInputs);
const locationRiskLevel = getLocationRiskLevel(demoAsset.location);
const recommendation = getRecommendation(
  riskDilation.forensicRisk,
  riskDilation.biologicalAge,
  sedimentLbs,
  estDamage,
  locationRiskLevel
);

// Check if replacement is required (repairs locked) - v4.0 uses REPLACE_* prefixes
const isReplaceAction = recommendation.action.startsWith('REPLACE_');
const replacementRequired = isReplaceAction && !recommendation.canRepair;

export function IssueSelector({ onBack, onSimulate }: IssueSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    // Auto-select replacement if required
    replacementRequired ? new Set(['replace']) : new Set()
  );

  const fullReplacement = repairOptions.find(r => r.isFullReplacement);
  const individualRepairs = repairOptions.filter(r => !r.isFullReplacement);

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

  const selectedRepairs = repairOptions.filter(r => selectedIds.has(r.id));

  const handleContinue = () => {
    if (selectedRepairs.length > 0) {
      onSimulate(selectedRepairs);
    }
  };

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
                  {recommendation.script} Individual repairs are not available for this unit.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-sm mb-6">
          {replacementRequired 
            ? 'Full replacement is the only available option.'
            : 'What would you like to address?'
          }
        </p>

        {/* Full Replacement Option */}
        {fullReplacement && (
          <button
            onClick={() => toggleRepair(fullReplacement.id)}
            className={`w-full text-left mb-6 p-4 rounded-xl border-2 transition-all ${
              isReplacementSelected
                ? 'border-primary bg-primary/10'
                : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500/70'
            }`}
            style={{
              boxShadow: isReplacementSelected
                ? '0 0 20px -4px hsl(var(--primary) / 0.4)'
                : '0 0 20px -4px rgba(245, 158, 11, 0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReplacementSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-amber-500/50'
              }`}>
                {isReplacementSelected && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{fullReplacement.name}</span>
                  {healthStatus === 'critical' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{fullReplacement.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resets all risk to zero</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Divider - only show if repairs are available */}
        {!replacementRequired && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR FIX INDIVIDUAL ISSUES</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* Individual Repairs - hidden if replacement required */}
        {!replacementRequired && (
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
