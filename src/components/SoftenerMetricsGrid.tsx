import React from 'react';
import { Card } from '@/components/ui/card';
import { Gauge, Droplets, Clock, Package } from 'lucide-react';

interface SoftenerMetricsGridProps {
  odometer: number;
  resinHealth: number;
  regenIntervalDays: number;
  saltUsageLbsPerMonth: number;
}

export function SoftenerMetricsGrid({
  odometer,
  resinHealth,
  regenIntervalDays,
  saltUsageLbsPerMonth,
}: SoftenerMetricsGridProps) {
  const getOdometerStatus = () => {
    if (odometer < 600) return { status: 'optimal', label: 'Healthy', color: 'text-green-500' };
    if (odometer < 1500) return { status: 'warning', label: 'Maintenance Due', color: 'text-yellow-500' };
    return { status: 'critical', label: 'End of Life', color: 'text-red-500' };
  };

  const getResinStatus = () => {
    if (resinHealth >= 75) return { status: 'optimal', label: 'Strong', color: 'text-green-500' };
    if (resinHealth >= 40) return { status: 'warning', label: 'Degrading', color: 'text-yellow-500' };
    return { status: 'critical', label: 'Failed', color: 'text-red-500' };
  };

  const getRegenStatus = () => {
    if (regenIntervalDays >= 5) return { status: 'optimal', label: 'Efficient', color: 'text-green-500' };
    if (regenIntervalDays >= 3) return { status: 'warning', label: 'Frequent', color: 'text-yellow-500' };
    return { status: 'critical', label: 'Wasteful', color: 'text-red-500' };
  };

  const odometerInfo = getOdometerStatus();
  const resinInfo = getResinStatus();
  const regenInfo = getRegenStatus();

  const metrics = [
    {
      icon: Gauge,
      label: 'Odometer',
      value: `${odometer.toLocaleString()}`,
      unit: 'cycles',
      status: odometerInfo.label,
      statusColor: odometerInfo.color,
      sublabel: odometer < 600 ? `${600 - odometer} until service` : odometer < 1500 ? `${1500 - odometer} until EOL` : 'Replace soon',
    },
    {
      icon: Droplets,
      label: 'Resin Health',
      value: `${resinHealth}`,
      unit: '%',
      status: resinInfo.label,
      statusColor: resinInfo.color,
      sublabel: resinHealth > 50 ? 'Ion exchange active' : 'Capacity reduced',
    },
    {
      icon: Clock,
      label: 'Regen Interval',
      value: `${regenIntervalDays.toFixed(1)}`,
      unit: 'days',
      status: regenInfo.label,
      statusColor: regenInfo.color,
      sublabel: `${Math.round(365 / regenIntervalDays)} cycles/year`,
    },
    {
      icon: Package,
      label: 'Salt Usage',
      value: `${Math.round(saltUsageLbsPerMonth)}`,
      unit: 'lbs/mo',
      status: saltUsageLbsPerMonth > 60 ? 'High' : 'Normal',
      statusColor: saltUsageLbsPerMonth > 60 ? 'text-yellow-500' : 'text-green-500',
      sublabel: `~${Math.ceil(saltUsageLbsPerMonth / 40)} bag${Math.ceil(saltUsageLbsPerMonth / 40) > 1 ? 's' : ''}/month`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4 bg-card border-border">
          <div className="flex items-start justify-between mb-2">
            <metric.icon className="h-5 w-5 text-muted-foreground" />
            <span className={`text-xs font-medium ${metric.statusColor}`}>
              {metric.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {metric.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {metric.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {metric.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.sublabel}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
