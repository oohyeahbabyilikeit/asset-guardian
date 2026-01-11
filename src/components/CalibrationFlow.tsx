import { useState, useMemo } from 'react';
import { TeaserDashboard } from './TeaserDashboard';
import { CalibrationCard } from './CalibrationCard';
import { ScoreRevealAnimation } from './ScoreRevealAnimation';
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

type Phase = 'teaser' | 'reveal' | 'complete';

export function CalibrationFlow({
  baseInputs,
  brand,
  model,
  photoUrl,
  onComplete,
}: CalibrationFlowProps) {
  const [phase, setPhase] = useState<Phase>('teaser');
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
      // Small delay before transitioning to dashboard
      setTimeout(() => {
        onComplete(opterraResult, calibratedInputs);
      }, 800);
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

  return (
    <TeaserDashboard
      inputs={baseInputs}
      brand={brand}
      model={model}
      photoUrl={photoUrl}
    >
      <CalibrationCard
        hasSoftener={baseInputs.hasSoftener}
        defaultPeopleCount={baseInputs.peopleCount}
        onComplete={handleCalibrationComplete}
      />
    </TeaserDashboard>
  );
}
