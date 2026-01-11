import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, AlertTriangle, CheckCircle2, XCircle, Gauge, Droplets, Shield, Camera, ClipboardList, ArrowRight, BarChart3, Clock, Wrench } from 'lucide-react';
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
    icon: <AlertTriangle className="w-4 h-4" />,
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

  const getStatusColor = (status: 'critical' | 'warning' | 'good') => {
    switch (status) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'good': return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getStatusIcon = (status: 'critical' | 'warning' | 'good') => {
    switch (status) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'good': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with Step Indicator */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Step 1 of 2
            </span>
          </div>
          <span className="text-xs text-slate-500">Field Observations</span>
        </div>
      </div>
      
      {/* Section Title */}
      <div className="px-4 pt-4">
        <h1 className="text-xl font-semibold text-white">What Your Technician Found</h1>
        <p className="text-sm text-slate-400 mt-1">On-site observations from today's inspection</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Hero Photo Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <div className="relative aspect-[4/3] bg-slate-900">
              <img 
                src={photoUrl || waterHeaterFallback} 
                alt="Your water heater"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
                  <Camera className="w-3 h-3 mr-1" />
                  Your Unit
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white font-semibold text-lg">{brand}</p>
                    {model && <p className="text-slate-300 text-sm">{model}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {inputs.calendarAge} <span className="text-sm font-normal">yrs</span>
                    </p>
                    <p className="text-slate-300 text-xs">
                      {inputs.tankCapacity} gal • {locationLabels[inputs.location] || inputs.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Summary Badge */}
        {(criticalCount > 0 || warningCount > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            {criticalCount > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                <XCircle className="w-3 h-3 mr-1" />
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {warningCount} Warning
              </Badge>
            )}
          </motion.div>
        )}

        {/* Findings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Technician Findings
              </h3>
              <div className="space-y-2">
                {findings.map((finding, index) => (
                  <motion.div
                    key={finding.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(finding.status)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {finding.icon}
                      </div>
                      <span className="text-sm font-medium text-white">{finding.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{finding.value}</span>
                      {getStatusIcon(finding.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Equipment Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Safety Equipment
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${inputs.hasPrv ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {inputs.hasPrv ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  PRV
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${inputs.hasExpTank ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {inputs.hasExpTank ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  Expansion Tank
                </div>
                {inputs.hasSoftener && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-500/20 text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Water Softener
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CTA Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm"
      >
        <div className="text-center mb-3">
          <p className="text-xs text-slate-500 mb-1">
            These are your technician's raw observations
          </p>
          <p className="text-sm text-slate-300">
            Answer 3 quick questions to generate your personalized health report
          </p>
        </div>
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
        >
          Generate My Health Report
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
