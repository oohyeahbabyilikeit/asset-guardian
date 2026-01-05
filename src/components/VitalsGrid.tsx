import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Gauge, Clock, Weight, Shield } from 'lucide-react';
import { type VitalsData, getStatusClass } from '@/data/mockAsset';

interface VitalsGridProps {
  vitals: VitalsData;
}

interface VitalCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  status: 'critical' | 'warning' | 'optimal';
  statusLabel: string;
}

function VitalCard({ icon, label, value, subValue, status, statusLabel }: VitalCardProps) {
  return (
    <div className="glass-card relative overflow-hidden group">
      {/* Status indicator bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        status === 'critical' && 'bg-status-critical',
        status === 'warning' && 'bg-status-warning',
        status === 'optimal' && 'bg-status-optimal'
      )} />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        {status !== 'optimal' ? (
          <AlertTriangle className={cn("w-4 h-4", getStatusClass(status))} />
        ) : (
          <Check className="w-4 h-4 text-status-optimal" />
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn(
          "font-mono text-2xl font-bold",
          getStatusClass(status)
        )}>
          {value}
        </span>
        <span className={cn(
          "text-xs uppercase px-1.5 py-0.5 rounded",
          status === 'critical' && 'bg-status-critical/20 text-status-critical',
          status === 'warning' && 'bg-status-warning/20 text-status-warning',
          status === 'optimal' && 'bg-status-optimal/20 text-status-optimal'
        )}>
          {statusLabel}
        </span>
      </div>

      {subValue && (
        <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
      )}

      {/* Hover shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-shimmer" />
    </div>
  );
}

export function VitalsGrid({ vitals }: VitalsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <VitalCard
        icon={<Gauge className="w-4 h-4" />}
        label="Pressure"
        value={`${vitals.pressure.current} PSI`}
        subValue={`Limit: ${vitals.pressure.limit} PSI`}
        status={vitals.pressure.status}
        statusLabel="HIGH"
      />

      <VitalCard
        icon={<Clock className="w-4 h-4" />}
        label="Biological Age"
        value={`${vitals.biologicalAge.real} YRS`}
        subValue={`Real Age: ${vitals.biologicalAge.paper} Yrs`}
        status={vitals.biologicalAge.status}
        statusLabel="OLD"
      />

      <VitalCard
        icon={<Weight className="w-4 h-4" />}
        label="Sediment Load"
        value={`${vitals.sedimentLoad.pounds} LBS`}
        subValue={`Est. Gas Loss: $${vitals.sedimentLoad.gasLossEstimate}`}
        status={vitals.sedimentLoad.status}
        statusLabel="HIGH"
      />

      <VitalCard
        icon={<Shield className="w-4 h-4" />}
        label="Liability Status"
        value={vitals.liabilityStatus.insured ? 'INSURED' : 'UNINSURED'}
        subValue={`Loc: ${vitals.liabilityStatus.location}`}
        status={vitals.liabilityStatus.status}
        statusLabel="RISK"
      />
    </div>
  );
}
