import { useState, useMemo } from 'react';
import { CalibrationCard } from './CalibrationCard';
import { ScoreRevealAnimation } from './ScoreRevealAnimation';
import { TeaserDashboard } from './TeaserDashboard';
import { calculateOpterraRisk, type ForensicInputs, type OpterraResult, type UsageType } from '@/lib/opterraAlgorithm';

type FlushHistory = 'never' | 'recent' | 'unknown';
type SoftenerAge = 'new' | 'came_with_house' | 'old';

interface CalibrationData {
  peopleCount: number;
  usageType: UsageType;
  flushHistory: FlushHistory;
  softenerAge?: SoftenerAge;
}

interface CalibrationFlowProps {
  baseInputs: ForensicInputs;
  brand?: string;
  model?: string;
  photoUrl?: string;
  onComplete: (result: OpterraResult, calibratedInputs: ForensicInputs) => void;
}

type Phase = 'calibrate' | 'reveal' | 'complete';

export function CalibrationFlow({
  baseInputs,
  brand,
  model,
  photoUrl,
  onComplete,
}: CalibrationFlowProps) {
  const [phase, setPhase] = useState<Phase>('calibrate');
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);

  // Map calibration data to ForensicInputs adjustments
  const mapCalibrationToInputs = (data: CalibrationData): Partial<ForensicInputs> => {
    // Map flush history to years
    const lastFlushYearsAgo = (() => {
      switch (data.flushHistory) {
        case 'recent': return 0.5;
        case 'never': return Math.min(baseInputs.calendarAge, 10);
        case 'unknown': return Math.min(baseInputs.calendarAge, 5); // Conservative
      }
    })();

    return {
      peopleCount: data.peopleCount,
      usageType: data.usageType,
      lastFlushYearsAgo,
      // Anode defaults to conservative estimate based on age
      lastAnodeReplaceYearsAgo: Math.min(baseInputs.calendarAge, 6),
    };
  };

  // Calculate the final inputs and result when calibration is complete
  const calibratedInputs = useMemo(() => {
    if (!calibrationData) return null;
    
    const adjustments = mapCalibrationToInputs(calibrationData);
    return {
      ...baseInputs,
      ...adjustments,
    };
  }, [calibrationData, baseInputs]);

  const opterraResult = useMemo(() => {
    if (!calibratedInputs) return null;
    return calculateOpterraRisk(calibratedInputs);
  }, [calibratedInputs]);

  const handleCalibrationComplete = (data: CalibrationData) => {
    setCalibrationData(data);
    setPhase('reveal');
  };

  const handleRevealComplete = () => {
    setPhase('complete');
    if (opterraResult && calibratedInputs) {
      // Navigate immediately when user clicks "View Your Report"
      onComplete(opterraResult, calibratedInputs);
    }
  };

  // Render based on phase
  if (phase === 'reveal' && opterraResult) {
    return (
      <ScoreRevealAnimation
        result={opterraResult}
        onComplete={handleRevealComplete}
      />
    );
  }

  // Show TeaserDashboard blurred behind CalibrationCard
  return (
    <div className="relative min-h-screen">
      {/* Blurred TeaserDashboard background */}
      <div className="absolute inset-0 filter blur-sm brightness-50 pointer-events-none overflow-hidden">
        <TeaserDashboard
          inputs={baseInputs}
          brand={brand}
          model={model}
          photoUrl={photoUrl}
        />
      </div>
      
      {/* CalibrationCard overlay */}
      <div className="relative z-10">
        <CalibrationCard
          hasSoftener={baseInputs.hasSoftener}
          defaultPeopleCount={baseInputs.peopleCount}
          photoUrl={photoUrl}
          brand={brand}
          onComplete={handleCalibrationComplete}
        />
      </div>
    </div>
  );
}
