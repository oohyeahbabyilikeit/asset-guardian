import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Gauge, Droplets, Shield, ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
import waterHeaterFallback from '@/assets/water-heater-realistic.png';

interface TechnicianFindingsPageProps {
  inputs: ForensicInputs;
  brand?: string;
  model?: string;
  photoUrl?: string;
  onContinue: () => void;
}

interface Finding {
  id: string;
  label: string;
  value: string;
  status: 'critical' | 'warning' | 'good';
  icon: React.ReactNode;
}

export function TechnicianFindingsPage({
  inputs,
  brand = 'Water Heater',
  model,
  photoUrl,
  onContinue,
}: TechnicianFindingsPageProps) {
  // Determine critical findings from the inspection
  const findings: Finding[] = [];

  // Pressure finding
  const pressureStatus = inputs.housePsi >= 80 ? 'critical' : inputs.housePsi >= 65 ? 'warning' : 'good';
  findings.push({
    id: 'pressure',
    label: 'Water Pressure',
    value: `${inputs.housePsi} PSI`,
    status: pressureStatus,
    icon: <Gauge className="w-4 h-4" />,
  });

  // Hardness finding
  const hardnessStatus = inputs.hardnessGPG >= 15 ? 'critical' : inputs.hardnessGPG >= 10 ? 'warning' : 'good';
  findings.push({
    id: 'hardness',
    label: 'Water Hardness',
    value: `${inputs.hardnessGPG} GPG`,
    status: hardnessStatus,
    icon: <Droplets className="w-4 h-4" />,
  });

  // PRV status
  const needsPrv = inputs.housePsi >= 65;
  if (needsPrv && !inputs.hasPrv) {
    findings.push({
      id: 'prv',
      label: 'Pressure Valve',
      value: 'Missing',
      status: 'critical',
      icon: <Shield className="w-4 h-4" />,
    });
  }

  // Expansion tank status
  const needsExpTank = inputs.isClosedLoop || inputs.hasPrv;
  if (needsExpTank && !inputs.hasExpTank) {
    findings.push({
      id: 'exp-tank',
      label: 'Expansion Tank',
      value: 'Missing',
      status: 'critical',
      icon: <Shield className="w-4 h-4" />,
    });
  }

  // Age finding
  const ageStatus = inputs.calendarAge >= 10 ? 'critical' : inputs.calendarAge >= 7 ? 'warning' : 'good';
  findings.push({
    id: 'age',
    label: 'Unit Age',
    value: `${inputs.calendarAge} years`,
    status: ageStatus,
    icon: <Calendar className="w-4 h-4" />,
  });

  // Rust finding
  if (inputs.visualRust) {
    findings.push({
      id: 'rust',
      label: 'Visible Corrosion',
      value: 'Detected',
      status: 'critical',
      icon: <AlertTriangle className="w-4 h-4" />,
    });
  }

  const criticalCount = findings.filter(f => f.status === 'critical').length;
  const warningCount = findings.filter(f => f.status === 'warning').length;
  const goodCount = findings.filter(f => f.status === 'good').length;

  const getStatusStyles = (status: 'critical' | 'warning' | 'good') => {
    switch (status) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' };
      case 'warning': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' };
      case 'good': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' };
    }
  };

  const getStatusIcon = (status: 'critical' | 'warning' | 'good') => {
    switch (status) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'good': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const locationLabels: Record<string, string> = {
    BASEMENT: 'Basement',
    GARAGE: 'Garage',
    ATTIC: 'Attic',
    UTILITY: 'Utility Room',
    MAIN_LIVING: 'Main Living',
    UPPER_FLOOR: 'Upper Floor',
    CRAWLSPACE: 'Crawlspace',
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Hero Section with Photo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Photo with gradient overlay */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src={photoUrl || waterHeaterFallback} 
            alt="Your water heater"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/50 to-slate-950" />
          
          {/* Step indicator overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <Badge variant="outline" className="bg-slate-950/60 backdrop-blur-sm border-slate-700 text-slate-300 text-xs">
              Step 1 of 2
            </Badge>
            <div className="flex gap-1.5">
              <div className="w-8 h-1 rounded-full bg-primary" />
              <div className="w-8 h-1 rounded-full bg-slate-700" />
            </div>
          </div>
        </div>

        {/* Unit Info Card - overlapping the photo */}
        <div className="px-4 -mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{brand}</p>
                {model && <p className="text-sm text-slate-400">{model}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {inputs.calendarAge}<span className="text-sm font-normal text-slate-400 ml-1">yrs</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-500">{inputs.tankCapacity} gallon</span>
              <span className="text-slate-700">•</span>
              <span className="text-xs text-slate-500">{locationLabels[inputs.location] || inputs.location}</span>
              {inputs.hasSoftener && (
                <>
                  <span className="text-slate-700">•</span>
                  <span className="text-xs text-primary">Softener installed</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 px-4 pt-5 pb-4 space-y-4 overflow-y-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-base font-semibold text-white">Technician Observations</h2>
          <p className="text-xs text-slate-500 mt-0.5">On-site inspection findings</p>
        </motion.div>

        {/* Status Summary Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-2"
        >
          {goodCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{goodCount} Good</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">{warningCount} Warning</span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-red-400">{criticalCount} Critical</span>
            </div>
          )}
        </motion.div>

        {/* Findings Grid */}
        <div className="space-y-2">
          {findings.map((finding, index) => {
            const styles = getStatusStyles(finding.status);
            return (
              <motion.div
                key={finding.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl ${styles.bg} border ${styles.border}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${styles.icon}`}>
                    {finding.icon}
                  </div>
                  <span className="text-sm text-slate-200">{finding.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${styles.text}`}>{finding.value}</span>
                  <div className={styles.icon}>
                    {getStatusIcon(finding.status)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Safety Equipment */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-2"
        >
          <p className="text-xs text-slate-500 mb-2">Safety Equipment</p>
          <div className="flex flex-wrap gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              inputs.hasPrv 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {inputs.hasPrv ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              PRV
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              inputs.hasExpTank 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {inputs.hasExpTank ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              Expansion Tank
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/80"
      >
        <p className="text-xs text-slate-500 text-center mb-3">
          Answer 3 quick questions to generate your personalized health report
        </p>
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full h-12 text-base font-medium rounded-xl bg-primary hover:bg-primary/90"
        >
          Continue to Health Report
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
