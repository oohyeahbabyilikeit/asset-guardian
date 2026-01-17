import type { ForensicInputs, UsageType, SoftenerSaltStatus } from '@/lib/opterraAlgorithm';

// Symptom flags that map to algorithm inputs
export interface Symptoms {
  notEnoughHotWater: boolean;
  lukewarmWater: boolean;
  bangingPopping: boolean;
  rumblingNoise: boolean;
  discoloredWater: boolean;
  rottenEggSmell: boolean;
  visibleMoisture: boolean;
  higherBills: boolean;
}

// Extended water heater inputs with ownership context and symptoms
export interface OnboardingData {
  // Step 1: Household
  peopleCount: number;
  usageType: UsageType;
  
  // Step 2: Residency
  yearsAtAddress: number;
  
  // Step 3: Water Heater History
  lastFlushYearsAgo: number | null;      // null = never/unknown
  lastAnodeReplaceYearsAgo: number | null; // null = never/unknown
  isAnnuallyMaintained?: boolean;        // NEW v7.7: Has tank been flushed yearly?
  lastDescaleYearsAgo?: number | null;   // NEW v7.9: Tankless only
  
  // Step 4: Softener Context - SIMPLIFIED (Gatekeeper approach)
  hasSoftener: boolean;
  softenerSaltStatus: SoftenerSaltStatus;   // Quick visual check: OK, EMPTY, UNKNOWN
  waterSource: 'city' | 'well' | null;      // null = not answered yet
  sanitizerType?: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';  // From ZIP lookup
  
  // Step 5: Symptoms
  symptoms: Symptoms;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  peopleCount: 3,
  usageType: 'normal',
  yearsAtAddress: 5,
  lastFlushYearsAgo: null,
  lastAnodeReplaceYearsAgo: null,
  isAnnuallyMaintained: false,
  lastDescaleYearsAgo: null,
  hasSoftener: false,
  softenerSaltStatus: 'UNKNOWN',
  waterSource: null,
  sanitizerType: 'UNKNOWN',
  symptoms: {
    notEnoughHotWater: false,
    lukewarmWater: false,
    bangingPopping: false,
    rumblingNoise: false,
    discoloredWater: false,
    rottenEggSmell: false,
    visibleMoisture: false,
    higherBills: false,
  },
};

// Map onboarding data to ForensicInputs
export function mapOnboardingToForensicInputs(
  onboarding: OnboardingData,
  baseInputs: ForensicInputs
): ForensicInputs {
  // Map symptoms to visual inspection flags
  const visualRust = onboarding.symptoms.discoloredWater || onboarding.symptoms.rottenEggSmell;
  const isLeaking = onboarding.symptoms.visibleMoisture;
  
  // Conservative defaults for "unknown" service history
  const lastFlushYearsAgo = onboarding.lastFlushYearsAgo ?? 
    Math.min(onboarding.yearsAtAddress, 5); // Assume never flushed if unknown
  
  const lastAnodeReplaceYearsAgo = onboarding.lastAnodeReplaceYearsAgo ??
    Math.min(onboarding.yearsAtAddress, 6); // Assume never replaced if unknown
  
  return {
    ...baseInputs,
    peopleCount: onboarding.peopleCount,
    usageType: onboarding.usageType,
    hasSoftener: onboarding.hasSoftener,
    softenerSaltStatus: onboarding.softenerSaltStatus,
    lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo,
    isAnnuallyMaintained: onboarding.isAnnuallyMaintained,
    lastDescaleYearsAgo: onboarding.lastDescaleYearsAgo ?? undefined,
    visualRust,
    isLeaking,
  };
}
