/**
 * Random Scenario Generator for Opterra Algorithm
 * 
 * Generates realistic water heater scenarios with proper physics-based constraints
 */

import type { ForensicInputs, FuelType, TempSetting, LocationType, VentType, UsageType, ExpansionTankStatus, LeakSource, ConnectionType, RoomVolumeType, AirFilterStatus } from './opterraAlgorithm';

export interface GeneratedScenario {
  name: string;
  inputs: ForensicInputs;
  brand: string;
  model: string;
  serialNumber: string;
}

// Realistic brand/model combinations
const BRANDS: Record<FuelType, { brand: string; models: string[] }[]> = {
  GAS: [
    { brand: 'Rheem', models: ['Performance Platinum', 'Professional Classic', 'Marathon'] },
    { brand: 'A.O. Smith', models: ['ProLine XE', 'Signature 300', 'Voltex'] },
    { brand: 'Bradford White', models: ['Defender Safety System', 'eF Series', 'AeroTherm'] },
    { brand: 'State', models: ['ProLine', 'Select', 'Premier'] },
  ],
  ELECTRIC: [
    { brand: 'Rheem', models: ['Performance Plus', 'Gladiator', 'ProTerra'] },
    { brand: 'A.O. Smith', models: ['Signature 100', 'ProLine', 'Voltex'] },
    { brand: 'Whirlpool', models: ['Energy Smart', 'Performance', 'Hybrid'] },
    { brand: 'GE', models: ['GeoSpring', 'Smart', 'Profile'] },
  ],
  HYBRID: [
    { brand: 'Rheem', models: ['ProTerra Hybrid', 'Performance Platinum Hybrid'] },
    { brand: 'A.O. Smith', models: ['Voltex', 'Signature Premier'] },
    { brand: 'Bradford White', models: ['AeroTherm'] },
    { brand: 'GE', models: ['GeoSpring'] },
  ],
  TANKLESS_GAS: [
    { brand: 'Rinnai', models: ['RU199iN', 'RU160iN', 'Sensei'] },
    { brand: 'Navien', models: ['NPE-240A', 'NPE-180A', 'NPN-U'] },
    { brand: 'Noritz', models: ['NR98-SV', 'NRC1111-DV', 'EZ111'] },
    { brand: 'Takagi', models: ['T-H3-DV-N', 'T-KJr2-IN-NG'] },
  ],
  TANKLESS_ELECTRIC: [
    { brand: 'Stiebel Eltron', models: ['Tempra 36', 'Tempra 24', 'DHC-E'] },
    { brand: 'EcoSmart', models: ['ECO 27', 'ECO 18', 'ECO 11'] },
    { brand: 'Rheem', models: ['RTEX-24', 'RTEX-18', 'Performance'] },
  ],
};

// Scenario archetypes with weighted probability
const ARCHETYPES = [
  { name: 'The Perfect Install', weight: 0.15, config: { ageRange: [1, 3], condition: 'excellent' } },
  { name: 'The Healthy Veteran', weight: 0.10, config: { ageRange: [4, 7], condition: 'good' } },
  { name: 'The Pressure Cooker', weight: 0.10, config: { ageRange: [3, 8], condition: 'stressed', pressure: 'high' } },
  { name: 'The Sediment Bomb', weight: 0.10, config: { ageRange: [5, 10], condition: 'neglected', hardness: 'high' } },
  { name: 'The Zombie Tank', weight: 0.08, config: { ageRange: [8, 14], condition: 'critical' } },
  { name: 'The Attic Bomb', weight: 0.08, config: { ageRange: [6, 12], location: 'ATTIC', condition: 'risky' } },
  { name: 'The Hard Water Victim', weight: 0.10, config: { ageRange: [4, 9], hardness: 'extreme' } },
  { name: 'The Frat House', weight: 0.07, config: { ageRange: [3, 7], usage: 'extreme' } },
  { name: 'The Grandma Special', weight: 0.07, config: { ageRange: [8, 15], usage: 'minimal' } },
  { name: 'The Ticking Clock', weight: 0.08, config: { ageRange: [10, 14], condition: 'expiring' } },
  { name: 'The Leaker', weight: 0.07, config: { ageRange: [6, 12], condition: 'leaking' } },
];

/**
 * Generate a specific test scenario: Young tank (2 years) in closed-loop system missing expansion tank
 * This tests the "Infrastructure First" gate - should return REPAIR, not REPLACE
 */
export function generateYoungTankMissingExpansionScenario(): GeneratedScenario {
  const fuelType: FuelType = 'GAS';
  const brandData = BRANDS[fuelType][0]; // Rheem
  
  const inputs: ForensicInputs = {
    calendarAge: 2,
    warrantyYears: 12,
    housePsi: 75, // Moderate pressure, but closed-loop causes spikes
    tempSetting: 'NORMAL',
    location: 'GARAGE',
    isFinishedArea: false,
    fuelType,
    hardnessGPG: 12,
    streetHardnessGPG: 12,
    peopleCount: 4,
    usageType: 'normal',
    tankCapacity: 50,
    ventType: 'ATMOSPHERIC',
    hasSoftener: false,
    hasCircPump: false,
    hasExpTank: false, // KEY: Missing expansion tank
    expTankStatus: 'MISSING',
    hasPrv: true,
    isClosedLoop: true, // KEY: Closed-loop system
    hasDrainPan: true,
    visualRust: false,
    isLeaking: false,
    leakSource: 'NONE',
    connectionType: 'DIELECTRIC',
    lastFlushYearsAgo: 1, // Well maintained
    lastAnodeReplaceYearsAgo: undefined, // Original anode still good at 2 years
  };
  
  return {
    name: 'Young Tank - Missing Expansion (TEST)',
    inputs,
    brand: brandData.brand,
    model: brandData.models[0],
    serialNumber: `RH-${new Date().getFullYear() - 2}-TEST`,
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

export function generateRandomScenario(): GeneratedScenario {
  const archetype = weightedPick(ARCHETYPES);
  const config = archetype.config;
  
  // Pick fuel type - tank water heaters only for demo scenarios
  const fuelTypeWeights = [
    { type: 'GAS' as FuelType, weight: 0.55 },
    { type: 'ELECTRIC' as FuelType, weight: 0.45 },
  ];
  const fuelType = weightedPick(fuelTypeWeights).type;
  const isTankless = false;
  const isHybrid = false;
  
  // Pick brand/model
  const brandData = pick(BRANDS[fuelType]);
  const model = pick(brandData.models);
  
  // Generate age based on archetype
  const calendarAge = rand(config.ageRange[0], config.ageRange[1]);
  
  // Generate warranty based on age (older units likely had shorter warranties)
  const warrantyYears = calendarAge > 8 ? pick([6, 9]) : pick([6, 9, 12]);
  
  // Location with weighted probability
  const locationWeights = [
    { loc: 'GARAGE' as LocationType, weight: 0.30 },
    { loc: 'BASEMENT' as LocationType, weight: 0.25 },
    { loc: 'UTILITY' as LocationType, weight: 0.20 },
    { loc: 'ATTIC' as LocationType, weight: 0.10 },
    { loc: 'MAIN_LIVING' as LocationType, weight: 0.10 },
    { loc: 'CRAWLSPACE' as LocationType, weight: 0.05 },
  ];
  const location = config.location as LocationType || weightedPick(locationWeights).loc;
  const isFinishedArea = ['MAIN_LIVING', 'UPPER_FLOOR'].includes(location) || Math.random() > 0.7;
  
  // Pressure based on archetype
  let housePsi: number;
  if (config.pressure === 'high') {
    housePsi = rand(85, 110);
  } else if (config.condition === 'excellent') {
    housePsi = rand(45, 60);
  } else {
    housePsi = rand(50, 85);
  }
  
  // Hardness based on archetype
  let hardnessGPG: number;
  if (config.hardness === 'extreme') {
    hardnessGPG = rand(20, 35);
  } else if (config.hardness === 'high') {
    hardnessGPG = rand(15, 25);
  } else {
    hardnessGPG = rand(5, 18);
  }
  
  // Usage based on archetype
  let peopleCount: number;
  let usageType: UsageType;
  if (config.usage === 'extreme') {
    peopleCount = rand(5, 8);
    usageType = 'heavy';
  } else if (config.usage === 'minimal') {
    peopleCount = rand(1, 2);
    usageType = 'light';
  } else {
    peopleCount = rand(2, 5);
    usageType = pick(['light', 'normal', 'heavy']);
  }
  
  // Equipment based on condition
  const hasSoftener = hardnessGPG > 15 ? Math.random() > 0.6 : Math.random() > 0.8;
  const hasCircPump = Math.random() > 0.85;
  const isClosedLoop = Math.random() > 0.7;
  
  let hasExpTank = false;
  let expTankStatus: ExpansionTankStatus = 'MISSING';
  if (isClosedLoop || housePsi > 70) {
    hasExpTank = Math.random() > 0.4;
    if (hasExpTank) {
      // Older tanks are often waterlogged
      expTankStatus = calendarAge > 6 && Math.random() > 0.5 ? 'WATERLOGGED' : 'FUNCTIONAL';
    }
  }
  
  const hasPrv = housePsi > 75 ? Math.random() > 0.3 : Math.random() > 0.7;
  
  // Visual condition based on archetype
  let visualRust = false;
  let isLeaking = false;
  let leakSource: LeakSource = 'NONE';
  
  if (config.condition === 'critical' || config.condition === 'leaking') {
    visualRust = Math.random() > 0.3;
    if (config.condition === 'leaking') {
      isLeaking = true;
      leakSource = pick(['TANK_BODY', 'FITTING_VALVE', 'DRAIN_PAN']);
    }
  } else if (calendarAge > 10) {
    visualRust = Math.random() > 0.5;
  }
  
  // Temperature setting
  const tempSetting: TempSetting = calendarAge > 8 && Math.random() > 0.7 ? 'HOT' : pick(['LOW', 'NORMAL', 'NORMAL', 'NORMAL']);
  
  // Capacity
  const tankCapacity = isTankless ? 0 : pick([40, 50, 50, 50, 75, 80]);
  
  // Vent type for gas units
  const ventType: VentType = fuelType === 'GAS' ? pick(['ATMOSPHERIC', 'ATMOSPHERIC', 'POWER_VENT', 'DIRECT_VENT']) : 'ATMOSPHERIC';
  
  // Connection type
  const connectionType: ConnectionType = calendarAge > 8 ? pick(['DIELECTRIC', 'BRASS', 'DIRECT_COPPER']) : 'DIELECTRIC';
  
  // Room volume for hybrid
  const roomVolumeType: RoomVolumeType = isHybrid ? pick(['OPEN', 'CLOSET_LOUVERED', 'CLOSET_SEALED']) : 'OPEN';
  
  // Service history
  const lastFlushYearsAgo = config.condition === 'excellent' ? randFloat(0.5, 2) : 
    config.condition === 'neglected' ? undefined : 
    calendarAge > 3 ? randFloat(2, Math.min(calendarAge, 8)) : undefined;
  
  const lastAnodeReplaceYearsAgo = config.condition === 'excellent' && calendarAge > 4 ? randFloat(1, 3) :
    calendarAge > 6 ? randFloat(3, Math.min(calendarAge - 2, 10)) : undefined;
  
  // Drain pan
  const hasDrainPan = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(location) ? Math.random() > 0.3 : Math.random() > 0.7;
  
  // Tankless-specific
  const lastDescaleYearsAgo = isTankless && calendarAge > 2 ? randFloat(1, Math.min(calendarAge, 5)) : undefined;
  const errorCodeCount = isTankless && config.condition !== 'excellent' ? rand(0, 5) : 0;
  const ratedFlowGPM = isTankless ? pick([7.5, 8.4, 9.5, 10.0]) : undefined;
  
  // Hybrid-specific
  const airFilterStatus: AirFilterStatus | undefined = isHybrid ? pick(['CLEAN', 'CLEAN', 'DIRTY', 'CLOGGED'] as AirFilterStatus[]) : undefined;
  const isCondensateClear = isHybrid ? Math.random() > 0.2 : undefined;
  
  const inputs: ForensicInputs = {
    calendarAge,
    warrantyYears,
    housePsi,
    tempSetting,
    location,
    isFinishedArea,
    fuelType,
    hardnessGPG,
    streetHardnessGPG: hardnessGPG,
    peopleCount,
    usageType,
    tankCapacity,
    ventType,
    hasSoftener,
    hasCircPump,
    hasExpTank,
    expTankStatus,
    hasPrv,
    isClosedLoop,
    hasDrainPan,
    visualRust,
    isLeaking,
    leakSource,
    connectionType,
    lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo,
    // Hybrid
    airFilterStatus,
    isCondensateClear,
    roomVolumeType,
    // Tankless
    lastDescaleYearsAgo,
    errorCodeCount,
    ratedFlowGPM,
  };
  
  // Generate serial number
  const year = new Date().getFullYear() - calendarAge;
  const serialNumber = `${brandData.brand.substring(0, 2).toUpperCase()}-${year}-${rand(1000, 9999)}`;
  
  return {
    name: archetype.name,
    inputs,
    brand: brandData.brand,
    model,
    serialNumber,
  };
}
