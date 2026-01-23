import { cn } from '@/lib/utils';
import { Phone, DollarSign, Zap, Trophy, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CategorizedOpportunity } from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';

interface CommandBarProps {
  hotLead: CategorizedOpportunity | null;
  hotLeadSequence: NurturingSequence | null;
  pipelineValue: number; // 1-4 scale
  activeSequences: number;
  weeklyWins: number;
  onCallHotLead: () => void;
  onViewHotLead: () => void;
}

export function CommandBar({
  hotLead,
  hotLeadSequence,
  pipelineValue,
  activeSequences,
  weeklyWins,
  onCallHotLead,
  onViewHotLead,
}: CommandBarProps) {
  const isLeaking = hotLead?.forensicInputs?.isLeaking;
  const urgencyLabel = isLeaking ? 'LEAKING' : hotLead?.priority === 'critical' ? 'CRITICAL' : null;
  
  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-card via-card to-card overflow-hidden">
      <div className="flex items-stretch">
        {/* Hot Lead Section */}
        {hotLead ? (
          <button
            onClick={onViewHotLead}
            className={cn(
              'flex-1 flex items-center gap-3 px-4 py-3',
              'bg-gradient-to-r from-rose-950/50 to-transparent',
              'hover:from-rose-950/70 transition-colors',
              'border-r border-border/50'
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 animate-pulse shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {hotLead.customerName.split(' ')[0]}
                </span>
                {urgencyLabel && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {urgencyLabel}
                  </span>
                )}
              </div>
              {hotLeadSequence && (
                <p className="text-[11px] text-muted-foreground">
                  Step {hotLeadSequence.currentStep}/{hotLeadSequence.totalSteps}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCallHotLead();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 h-8 px-3 shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ) : (
          <div className="flex-1 flex items-center gap-2 px-4 py-3 border-r border-border/50">
            <span className="text-sm text-muted-foreground">No priority leads</span>
          </div>
        )}

        {/* Stats Section */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/20">
          {/* Pipeline */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((level) => (
              <DollarSign
                key={level}
                className={cn(
                  'w-3.5 h-3.5 transition-all',
                  level <= pipelineValue
                    ? 'text-emerald-400'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>

          {/* Active Sequences */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-violet-500/20">
              <Zap className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-violet-400">{activeSequences}</span>
          </div>

          {/* Weekly Wins */}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'flex items-center justify-center w-5 h-5 rounded',
              weeklyWins > 0 ? 'bg-amber-500/20' : 'bg-muted'
            )}>
              <Trophy className={cn(
                'w-3 h-3',
                weeklyWins > 0 ? 'text-amber-400' : 'text-muted-foreground'
              )} />
            </div>
            <span className={cn(
              'text-sm font-semibold',
              weeklyWins > 0 ? 'text-amber-400' : 'text-muted-foreground'
            )}>
              {weeklyWins}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
