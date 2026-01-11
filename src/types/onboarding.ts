import type { ForensicInputs, UsageType, SoftenerSaltStatus } from '@/lib/opterraAlgorithm';
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
  softenerSaltStatus: SoftenerSaltStatus;   // NEW v7.6: Quick visual check
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
  softenerSaltStatus: 'UNKNOWN',
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
    softenerSaltStatus: onboarding.softenerSaltStatus, // NEW v7.6
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
  
  // Calculate softener age with priority logic:
  // 1. If homeowner installed it, use their stated age
  // 2. If pre-existing, use MAX of technician's visual age estimate vs residency fallback
  // This fixes the "softener age blind spot" where inherited old units were under-aged
  let softenerAge: number;
  if (onboarding.softenerWasHereWhenMoved === true) {
    // Pre-existing softener: Use technician's visual assessment as floor
    // Fall back to yearsAtAddress + 3 if tech didn't assess
    const residencyFallback = onboarding.yearsAtAddress + 3;
    softenerAge = Math.max(baseInputs.ageYears, residencyFallback);
  } else if (onboarding.softenerInstallYearsAgo !== null) {
    // Homeowner knows when it was installed
    softenerAge = onboarding.softenerInstallYearsAgo;
  } else {
    softenerAge = baseInputs.ageYears;
  }
  
  // Determine if user has professional salt service (suppresses salt alerts)
  const hasProfessionalService = onboarding.softenerServiceFrequency === 'professional';
  
  return {
    ...baseInputs,
    people: onboarding.peopleCount,
    ageYears: softenerAge,
    isCityWater: onboarding.waterSource === 'city',
    hasProfessionalService,  // NEW v1.4: Suppress salt alerts if professional service
    // v1.1: Visual proxies default to conservative values
    // These will be updated by technician inspection or user input
    visualHeight: baseInputs.visualHeight,
    controlHead: baseInputs.controlHead,
    visualIron: onboarding.waterSource === 'well' && onboarding.symptoms.discoloredWater,
    // v1.2: New fields — default to null/OK, technician will update
    carbonAgeYears: null,       // Will come from technician inspection
    saltLevelState: 'OK',       // Will come from visual inspection
    // hardnessGPG: will come from API
    // hasCarbonFilter: will come from technician inspection
  };
}
