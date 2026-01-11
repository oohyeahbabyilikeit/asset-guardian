import { Camera, Gauge, Droplets, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
import waterHeaterImage from '@/assets/water-heater-realistic.png';

interface TeaserDashboardProps {
  inputs: ForensicInputs;
  brand?: string;
  model?: string;
  photoUrl?: string;
  children?: React.ReactNode; // For CalibrationCard overlay
}

export function TeaserDashboard({ 
  inputs, 
  brand = 'Unknown', 
  model,
  photoUrl,
  children 
}: TeaserDashboardProps) {
  const pressureStatus = inputs.housePsi >= 80 ? 'critical' : inputs.housePsi >= 60 ? 'warning' : 'good';
  const hardnessStatus = inputs.hardnessGPG >= 15 ? 'critical' : inputs.hardnessGPG >= 10 ? 'warning' : 'good';
  
  const getStatusColor = (status: 'critical' | 'warning' | 'good') => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'good': return 'text-green-500';
    }
  };
  
  const getStatusBadge = (status: 'critical' | 'warning' | 'good', label: string) => {
    switch (status) {
      case 'critical': return <Badge variant="destructive" className="text-xs">{label}</Badge>;
      case 'warning': return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">{label}</Badge>;
      case 'good': return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">{label}</Badge>;
    }
  };

  const locationLabels: Record<string, string> = {
    BASEMENT: 'Basement',
    GARAGE: 'Garage',
    ATTIC: 'Attic',
    UTILITY: 'Utility Room',
    EXTERIOR: 'Outdoor',
    MAIN_LIVING: 'Main Living',
    UPPER_FLOOR: 'Upper Floor',
    CRAWLSPACE: 'Crawlspace',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-primary font-medium">LIVE SCAN RESULTS</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Forensic Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Your technician just completed their inspection</p>
      </div>

      {/* Hero Photo Card */}
      <Card className="bg-slate-800/50 border-slate-700 overflow-hidden mb-4">
        <div className="relative aspect-[4/3] bg-slate-900">
          <img 
            src={photoUrl || waterHeaterImage} 
            alt="Water heater inspection"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
              <Camera className="w-3 h-3 mr-1" />
              Technician Photo
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white font-semibold text-lg">{brand}</p>
                {model && <p className="text-slate-300 text-sm">{model}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{inputs.calendarAge} <span className="text-sm font-normal">yrs</span></p>
                <p className="text-slate-300 text-xs">{inputs.tankCapacity} gallon • {locationLabels[inputs.location] || inputs.location}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hard Data Grid */}
      <Card className="bg-slate-800/50 border-slate-700 mb-4">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Mechanical Readings</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Pressure */}
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className={`w-4 h-4 ${getStatusColor(pressureStatus)}`} />
                <span className="text-xs text-slate-400">Pressure</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${getStatusColor(pressureStatus)}`}>
                  {inputs.housePsi}
                </span>
                <span className="text-xs text-slate-500">PSI</span>
              </div>
              {getStatusBadge(pressureStatus, pressureStatus === 'critical' ? 'EXTREME' : pressureStatus === 'warning' ? 'HIGH' : 'NORMAL')}
            </div>

            {/* Hardness */}
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className={`w-4 h-4 ${getStatusColor(hardnessStatus)}`} />
                <span className="text-xs text-slate-400">Hardness</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${getStatusColor(hardnessStatus)}`}>
                  {inputs.hardnessGPG}
                </span>
                <span className="text-xs text-slate-500">GPG</span>
              </div>
              {getStatusBadge(hardnessStatus, hardnessStatus === 'critical' ? 'VERY HARD' : hardnessStatus === 'warning' ? 'HARD' : 'SOFT')}
            </div>
          </div>

          {/* Equipment Status */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Safety Equipment</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${inputs.hasPrv ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {inputs.hasPrv ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                PRV
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${inputs.hasExpTank ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {inputs.hasExpTank ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Expansion Tank
              </div>
              {inputs.hasSoftener && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400">
                  <CheckCircle className="w-3 h-3" />
                  Softener
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blurred Score Section with Calibration Overlay */}
      <div className="relative">
        {/* The blurred background content */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          <CardContent className="p-6">
            <div className="filter blur-lg pointer-events-none select-none">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Health Score</p>
                  <div className="text-6xl font-bold text-white">42</div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Projected Failure</p>
                  <div className="text-xl font-semibold text-red-400">2-3 Years</div>
                </div>
                <div className="flex justify-center gap-2">
                  <Badge variant="destructive">CRITICAL</Badge>
                  <Badge className="bg-amber-500/20 text-amber-500">ACTION NEEDED</Badge>
                </div>
              </div>
            </div>
            
            {/* Calculating overlay when no children */}
            {!children && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-600">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm text-slate-300 animate-pulse">Calculating Physics...</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calibration Card Overlay (passed as children) */}
        {children}
      </div>
    </div>
  );
}
