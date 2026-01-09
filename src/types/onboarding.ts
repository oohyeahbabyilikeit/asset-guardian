import type { ForensicInputs, UsageType } from '@/lib/opterraAlgorithm';
import type { SoftenerInputs } from '@/lib/softenerAlgorithm';

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
  
  // Step 4: Softener Context (if applicable)
  hasSoftener: boolean;
  softenerWasHereWhenMoved: boolean | null; // null = not sure
  softenerInstallYearsAgo: number | null;   // null if was here when moved
  softenerServiceFrequency: 'professional' | 'diy_salt' | 'never' | 'unknown';
  waterSource: 'city' | 'well' | null;      // null = not answered yet
  
  // Step 5: Symptoms
  symptoms: Symptoms;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  peopleCount: 3,
  usageType: 'normal',
  yearsAtAddress: 5,
  lastFlushYearsAgo: null,
  lastAnodeReplaceYearsAgo: null,
  hasSoftener: false,
  softenerWasHereWhenMoved: null,
  softenerInstallYearsAgo: null,
  softenerServiceFrequency: 'unknown',
  waterSource: null,
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
    lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo,
    visualRust,
    isLeaking,
  };
}

// Map onboarding data to SoftenerInputs
export function mapOnboardingToSoftenerInputs(
  onboarding: OnboardingData,
  baseInputs: SoftenerInputs
): SoftenerInputs {
  if (!onboarding.hasSoftener) {
    return baseInputs;
  }
  
  // Calculate softener age
  let softenerAge: number;
  if (onboarding.softenerWasHereWhenMoved === true) {
    // Was here when moved - assume it's older
    softenerAge = onboarding.yearsAtAddress + 3; // Conservative estimate
  } else if (onboarding.softenerInstallYearsAgo !== null) {
    softenerAge = onboarding.softenerInstallYearsAgo;
  } else {
    softenerAge = baseInputs.ageYears;
  }
  
  return {
    ...baseInputs,
    people: onboarding.peopleCount,
    ageYears: softenerAge,
    isCityWater: onboarding.waterSource === 'city',
    // hardnessGPG: will come from API
    // hasCarbonFilter: will come from technician inspection
  };
}
