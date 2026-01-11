# Type Definitions

TypeScript interfaces and types used throughout the application.

---

## Core Algorithm Types

### ForensicInputs
`src/lib/opterraAlgorithm.ts`

Primary input for the Opterra risk assessment algorithm.

```typescript
interface ForensicInputs {
  // Unit Identification
  calendarAge: number;              // Years since manufacture
  fuelType: 'GAS' | 'ELECTRIC' | 'PROPANE';
  capacityGallons: number;          // Tank size (0 for tankless)
  warrantyYears: number;            // Original warranty length
  qualityTier: QualityTier;
  ventType: VentType;
  
  // Infrastructure Flags
  hasSoftener: boolean;
  hasExpansionTank: boolean;
  hasPRV: boolean;                  // Pressure Reducing Valve
  hasCircPump: boolean;             // Circulation/recirculation pump
  isClosedLoop: boolean;            // Closed loop plumbing system
  
  // Environment
  isFinishedArea: boolean;          // In finished living space (higher risk)
  tempSetting: TempSetting;
  
  // Usage
  peopleCount: number;
  usageType: 'LOW' | 'NORMAL' | 'HIGH';
  
  // Maintenance History
  lastFlushYearsAgo: number;
  lastAnodeCheckYearsAgo: number;
  
  // Water Quality
  waterHardnessGPG: number;         // Grains per gallon
}

type QualityTier = 'ECONOMY' | 'STANDARD' | 'PROFESSIONAL';

type VentType = 
  | 'ATMOSPHERIC' 
  | 'POWER_VENT' 
  | 'DIRECT_VENT' 
  | 'POWER_DIRECT' 
  | 'CONDENSING'
  | 'TANKLESS';

type TempSetting = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
```

---

### OpterraMetrics
`src/lib/opterraAlgorithm.ts`

Algorithm output metrics.

```typescript
interface OpterraMetrics {
  healthScore: number;              // 0-100 (higher = healthier)
  bioAge: number;                   // Effective age accounting for wear
  failProbability: number;          // 0-1 probability of near-term failure
  monthsToAction: number;           // Estimated months until service/replacement needed
  riskLevel: 1 | 2 | 3 | 4 | 5;    // 1 = lowest risk
}

interface OpterraVitals {
  ageStatus: StatusLevel;
  efficiencyStatus: StatusLevel;
  maintenanceStatus: 'CURRENT' | 'DUE' | 'OVERDUE';
  infrastructureScore: number;      // 0-100
  waterQualityImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

type StatusLevel = 'GOOD' | 'FAIR' | 'POOR';
```

---

## Technician Inspection Types

`src/types/technicianInspection.ts`

### TechnicianInspectionData
Complete inspection state object.

```typescript
interface TechnicianInspectionData {
  address: AddressData;
  buildingType: BuildingType;
  location: LocationCondition;
  unitType: UnitTypeSelection;
  assetScan: AssetScanData;
  softener: SoftenerInspection;
  tankless: TanklessInspection;
  hybrid: HybridInspection;
  pressure: PressureData;
  context: InstallationContext;
  notes: string;
  photos: InspectionPhoto[];
}
```

### AddressData
```typescript
interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  unit?: string;
  verified: boolean;
  coordinates?: { lat: number; lng: number };
}
```

### BuildingType
```typescript
interface BuildingType {
  type: 'SINGLE_FAMILY' | 'MULTI_UNIT' | 'COMMERCIAL';
  unitCount?: number;               // For multi-unit
  floors?: number;
}
```

### LocationCondition
```typescript
interface LocationCondition {
  location: HeaterLocation;
  isFinishedArea?: boolean;         // Required - in finished living space
  tempSetting?: TempSetting;        // Required - dial setting
  accessibility: 'EASY' | 'MODERATE' | 'DIFFICULT';
  hasWaterDamage: boolean;
  hasDrainPan: boolean;
}

type HeaterLocation = 
  | 'GARAGE' 
  | 'BASEMENT' 
  | 'UTILITY_CLOSET' 
  | 'ATTIC' 
  | 'OUTDOOR' 
  | 'MECHANICAL_ROOM'
  | 'OTHER';
```

### UnitTypeSelection
```typescript
interface UnitTypeSelection {
  isTankless: boolean;
  isHybrid: boolean;                // Heat pump water heater
  fuelType?: 'GAS' | 'ELECTRIC' | 'PROPANE';
}
```

### AssetScanData
```typescript
interface AssetScanData {
  scanned: boolean;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  manufactureYear?: number;
  capacityGallons?: number;
  flowRateGPM?: number;             // Tankless only
  warrantyYears?: number;
  fuelType?: 'GAS' | 'ELECTRIC' | 'PROPANE';
  ventType?: VentType;
  qualityTier?: QualityTier;
  confidence?: number;
  photoUrl?: string;
  manualEntry: boolean;
}
```

### SoftenerInspection
```typescript
interface SoftenerInspection {
  hasSoftener?: boolean;            // undefined = not answered yet
  saltStatus?: 'FULL' | 'LOW' | 'EMPTY' | 'BRIDGED';
  qualityTier?: 'ECONOMY' | 'STANDARD' | 'PREMIUM';
  controlHead?: 'TIMER' | 'DEMAND' | 'SMART';
  resinCondition?: 'GOOD' | 'FAIR' | 'POOR';
  ageYears?: number;
  brand?: string;
  photoUrl?: string;
}
```

### TanklessInspection
```typescript
interface TanklessInspection {
  hasIsolationValves: boolean;
  lastDescale?: number;             // Years ago
  errorCodes?: string[];
  flowRateGPM?: number;
  inletFilterCondition?: 'CLEAN' | 'DIRTY' | 'CLOGGED';
}
```

### HybridInspection
```typescript
interface HybridInspection {
  airFilterCondition?: 'CLEAN' | 'DIRTY' | 'CLOGGED';
  condensateDrainClear?: boolean;
  compressorOperating?: boolean;
  evaporatorCondition?: 'GOOD' | 'FAIR' | 'POOR';
}
```

### PressureData
```typescript
interface PressureData {
  psiReading?: number;              // 20-150 typical
  flowRateGPM?: number;             // 0-12 typical
  measuredHardnessGPG?: number;     // 0-30 typical
  hasPRV: boolean;
  hasExpansionTank: boolean;
  hasCircPump: boolean;
  isClosedLoop: boolean;
}
```

### InstallationContext
```typescript
interface InstallationContext {
  photos: {
    type: 'overview' | 'connections' | 'venting' | 'clearance';
    url: string;
  }[];
  detected: {
    expansionTank: boolean;
    prv: boolean;
    circPump: boolean;
    drainPan: boolean;
  };
}
```

---

## Onboarding Types

`src/types/onboarding.ts`

### OnboardingData
Homeowner onboarding state.

```typescript
interface OnboardingData {
  peopleCount: number;
  symptoms: Symptom[];
  yearsAtAddress: number;
  lastFlushYearsAgo: number;
  lastAnodeCheckYearsAgo: number;
  hasSoftener: boolean;
  usageType: 'LOW' | 'NORMAL' | 'HIGH';
}

type Symptom = 
  | 'LUKEWARM_WATER'
  | 'SLOW_RECOVERY'
  | 'RUSTY_WATER'
  | 'STRANGE_NOISES'
  | 'LEAKING'
  | 'HIGH_BILLS'
  | 'NONE';
```

---

## Service History Types

`src/types/serviceHistory.ts`

```typescript
interface ServiceEvent {
  id: string;
  eventType: ServiceEventType;
  eventDate: Date;
  performedBy?: string;             // Profile ID
  costUsd?: number;
  healthScoreBefore?: number;
  healthScoreAfter?: number;
  notes?: string;
  photos?: string[];
}

type ServiceEventType = 
  | 'inspection'
  | 'flush'
  | 'anode_replacement'
  | 'repair'
  | 'thermostat_adjustment'
  | 'prv_install'
  | 'exp_tank_install'
  | 'replacement';
```

---

## Pricing Types

`src/lib/pricingService.ts`

```typescript
interface PriceResult {
  retailPrice: number;
  wholesalePrice?: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  manufacturer?: string;
  modelNumber?: string;
  confidence: number;               // 0-100
  source: 'DATABASE' | 'AI_ESTIMATE' | 'CACHE';
  lastUpdated: string;
}

interface InstallPreset {
  id: string;
  ventType: VentType;
  complexity: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
  laborCostUsd: number;
  materialsCostUsd: number;
  permitCostUsd: number;
  estimatedHours: number;
  description?: string;
}

interface TotalQuote {
  unitPrice: PriceRange;
  installCost: PriceRange;
  infraCost: PriceRange;
  totalCost: PriceRange;
  breakdown: QuoteLineItem[];
  validUntil: Date;
}

interface PriceRange {
  low: number;
  high: number;
  mid: number;
}
```

---

## Infrastructure Types

`src/lib/infrastructureIssues.ts`

```typescript
interface InfrastructureIssue {
  id: string;
  name: string;                     // Internal identifier
  friendlyName: string;             // Display name
  category: IssueCategory;
  costMin: number;
  costMax: number;
  description: string;
  includedInTiers: QualityTier[];   // Which pricing tiers include this fix
}

type IssueCategory = 'VIOLATION' | 'INFRASTRUCTURE' | 'OPTIMIZATION';
```

---

## Database Types

Auto-generated in `src/integrations/supabase/types.ts`.

Key table types:
- `Tables<'profiles'>` - User profile row
- `Tables<'properties'>` - Property row
- `Tables<'water_heaters'>` - Water heater row
- `Tables<'assessments'>` - Assessment row
- `Tables<'quotes'>` - Quote row
- `Tables<'service_events'>` - Service event row

Usage:
```typescript
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type NewWaterHeater = TablesInsert<'water_heaters'>;
```
