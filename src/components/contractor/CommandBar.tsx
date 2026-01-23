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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-card via-card to-card/80 shadow-xl shadow-black/20 overflow-hidden">
      {/* Hot Lead Section */}
      {hotLead ? (
        <button
          onClick={onViewHotLead}
          className={cn(
            'w-full flex items-center gap-4 p-4',
            'bg-gradient-to-r from-rose-950/40 via-rose-950/20 to-transparent',
            'hover:from-rose-950/50 transition-all duration-200',
            'border-b border-white/5'
          )}
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 shadow-lg shadow-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-foreground truncate">
                {hotLead.customerName}
              </span>
              {urgencyLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/40">
                  {urgencyLabel}
                </span>
              )}
            </div>
            {hotLeadSequence && (
              <p className="text-xs text-muted-foreground">
                Step {hotLeadSequence.currentStep}/{hotLeadSequence.totalSteps} active
              </p>
            )}
            {!hotLeadSequence && (
              <p className="text-xs text-rose-400/80">Priority action required</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCallHotLead();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-4 shrink-0 shadow-lg shadow-emerald-600/30 font-medium"
          >
            <Phone className="w-4 h-4" />
            Call
          </Button>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted/50 border border-white/5 shrink-0">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">No priority leads right now</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        {/* Pipeline */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Pipeline</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((level) => (
              <DollarSign
                key={level}
                className={cn(
                  'w-4 h-4 transition-all',
                  level <= pipelineValue
                    ? 'text-emerald-400'
                    : 'text-muted-foreground/20'
                )}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Active Sequences */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-violet-400">{activeSequences}</span>
            <span className="text-[10px] text-muted-foreground/70 ml-1.5">Active</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Weekly Wins */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg border',
            weeklyWins > 0 
              ? 'bg-amber-500/20 border-amber-500/30' 
              : 'bg-muted/50 border-white/5'
          )}>
            <Trophy className={cn(
              'w-3.5 h-3.5',
              weeklyWins > 0 ? 'text-amber-400' : 'text-muted-foreground'
            )} />
          </div>
          <div className="text-left">
            <span className={cn(
              'text-sm font-bold',
              weeklyWins > 0 ? 'text-amber-400' : 'text-muted-foreground'
            )}>
              {weeklyWins}
            </span>
            <span className="text-[10px] text-muted-foreground/70 ml-1.5">Won</span>
          </div>
        </div>
      </div>
    </div>
  );
}
