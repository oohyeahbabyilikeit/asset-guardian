import React from 'react';
import { Card } from '@/components/ui/card';
import { Cpu, Wind, Droplets, Zap, Thermometer, Gauge } from 'lucide-react';

interface HeatPumpMetricsGridProps {
  compressorHealth: number;
  filterCondition: 'clean' | 'dirty' | 'clogged';
  condensateClear: boolean;
  energySavingsPercent: number;
  operatingMode: 'heat-pump' | 'hybrid' | 'electric';
  ambientTemp: number;
}

export function HeatPumpMetricsGrid({
  compressorHealth,
  filterCondition,
  condensateClear,
  energySavingsPercent,
  operatingMode,
  ambientTemp,
}: HeatPumpMetricsGridProps) {
  
  const getCompressorStatus = () => {
    if (compressorHealth >= 80) return { status: 'Optimal', color: 'text-status-optimal' };
    if (compressorHealth >= 50) return { status: 'Fair', color: 'text-status-warning' };
    return { status: 'Poor', color: 'text-status-critical' };
  };

  const getFilterStatus = () => {
    switch (filterCondition) {
      case 'clean': return { status: 'Clean', color: 'text-status-optimal', days: '90+ days' };
      case 'dirty': return { status: 'Dirty', color: 'text-status-warning', days: '~30 days' };
      case 'clogged': return { status: 'Clogged', color: 'text-status-critical', days: 'Replace now' };
    }
  };

  const getModeInfo = () => {
    switch (operatingMode) {
      case 'heat-pump': return { label: 'Heat Pump', efficiency: 'Maximum', color: 'text-status-optimal' };
      case 'hybrid': return { label: 'Hybrid', efficiency: 'Balanced', color: 'text-blue-400' };
      case 'electric': return { label: 'Electric', efficiency: 'Backup', color: 'text-status-warning' };
    }
  };

  const compressorInfo = getCompressorStatus();
  const filterInfo = getFilterStatus();
  const modeInfo = getModeInfo();
  const isAmbientOptimal = ambientTemp >= 40 && ambientTemp <= 90;

  const metrics = [
    {
      icon: Cpu,
      label: 'Compressor',
      value: `${compressorHealth}%`,
      status: compressorInfo.status,
      statusColor: compressorInfo.color,
      sublabel: 'Heat pump unit health',
    },
    {
      icon: Wind,
      label: 'Air Filter',
      value: filterInfo.status,
      status: filterInfo.days,
      statusColor: filterInfo.color,
      sublabel: 'Filter condition',
    },
    {
      icon: Droplets,
      label: 'Condensate',
      value: condensateClear ? 'Clear' : 'Blocked',
      status: condensateClear ? 'OK' : 'Service',
      statusColor: condensateClear ? 'text-status-optimal' : 'text-status-critical',
      sublabel: 'Drain line status',
    },
    {
      icon: Zap,
      label: 'Energy Savings',
      value: `${energySavingsPercent}%`,
      status: energySavingsPercent >= 50 ? 'Excellent' : energySavingsPercent >= 30 ? 'Good' : 'Low',
      statusColor: energySavingsPercent >= 50 ? 'text-status-optimal' : energySavingsPercent >= 30 ? 'text-status-warning' : 'text-status-critical',
      sublabel: 'vs. standard electric',
    },
    {
      icon: Gauge,
      label: 'Mode',
      value: modeInfo.label,
      status: modeInfo.efficiency,
      statusColor: modeInfo.color,
      sublabel: 'Operating mode',
    },
    {
      icon: Thermometer,
      label: 'Ambient',
      value: `${ambientTemp}°F`,
      status: isAmbientOptimal ? 'Optimal' : 'Out of range',
      statusColor: isAmbientOptimal ? 'text-status-optimal' : 'text-status-warning',
      sublabel: '40-90°F ideal',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="p-3 bg-card border-border/50">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-md bg-muted">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{metric.value}</p>
                <p className={`text-xs font-medium ${metric.statusColor}`}>{metric.status}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
