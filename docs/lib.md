# Business Logic & Utilities

Core algorithms, calculations, and service integrations.

---

## Opterra Algorithm

### opterraAlgorithm.ts
`src/lib/opterraAlgorithm.ts`

The core risk assessment algorithm for tank water heaters.

```typescript
interface ForensicInputs {
  calendarAge: number;          // Years since manufacture
  fuelType: 'GAS' | 'ELECTRIC' | 'PROPANE';
  capacityGallons: number;
  warrantyYears: number;
  qualityTier: 'ECONOMY' | 'STANDARD' | 'PROFESSIONAL';
  ventType: VentType;
  
  // Infrastructure
  hasSoftener: boolean;
  hasExpansionTank: boolean;
  hasPRV: boolean;
  hasCircPump: boolean;
  isClosedLoop: boolean;
  
  // Environment
  isFinishedArea: boolean;
  tempSetting: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  
  // Usage
  peopleCount: number;
  usageType: 'LOW' | 'NORMAL' | 'HIGH';
  
  // Maintenance
  lastFlushYearsAgo: number;
  lastAnodeCheckYearsAgo: number;
  
  // Water Quality
  waterHardnessGPG: number;
}
```

**Output**:
```typescript
interface OpterraMetrics {
  healthScore: number;           // 0-100
  bioAge: number;                // Effective age in years
  failProbability: number;       // 0-1
  monthsToAction: number;        // Estimated time to failure/service
  riskLevel: 1 | 2 | 3 | 4 | 5;
}

interface OpterraVitals {
  ageStatus: 'GOOD' | 'FAIR' | 'POOR';
  efficiencyStatus: 'GOOD' | 'FAIR' | 'POOR';
  maintenanceStatus: 'CURRENT' | 'DUE' | 'OVERDUE';
  infrastructureScore: number;    // 0-100
  waterQualityImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

### opterraTanklessAlgorithm.ts
`src/lib/opterraTanklessAlgorithm.ts`

Specialized algorithm for tankless water heaters. Considers:
- Flow rate vs demand
- Descaling frequency
- Error code history
- Inlet filter condition

---

### softenerAlgorithm.ts
`src/lib/softenerAlgorithm.ts`

Health assessment for water softeners.

---

## Infrastructure Issues

### infrastructureIssues.ts
`src/lib/infrastructureIssues.ts`

Detects code violations and recommended upgrades.

```typescript
interface InfrastructureIssue {
  id: string;
  name: string;
  friendlyName: string;
  category: 'VIOLATION' | 'INFRASTRUCTURE' | 'OPTIMIZATION';
  costMin: number;
  costMax: number;
  description: string;
  includedInTiers: QualityTier[];
}

// Detection function
function getInfrastructureIssues(
  inputs: ForensicInputs, 
  metrics: OpterraMetrics
): InfrastructureIssue[];
```

**Detected Issues**:
| Issue | Category | Trigger |
|-------|----------|---------|
| Missing Expansion Tank | VIOLATION | Closed loop + no tank |
| No PRV | INFRASTRUCTURE | PSI > 80 |
| Softener Service Due | OPTIMIZATION | Salt low or aged |

---

## Maintenance Calculations

### maintenanceCalculations.ts
`src/lib/maintenanceCalculations.ts`

Generates maintenance schedules based on unit type and condition.

```typescript
interface MaintenanceTask {
  type: string;
  label: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  benefit: string;
  dueInMonths?: number;
}

function calculateMaintenanceSchedule(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceSchedule;
```

---

## Serial Number Decoding

### serialDecoder.ts
`src/lib/serialDecoder.ts`

Decodes manufacture date from serial numbers.

```typescript
function decodeSerialNumber(
  brand: string, 
  serial: string
): DecodedSerial;

interface DecodedSerial {
  year: number;
  month?: number;
  ageYears: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}
```

**Supported Brands**:
- Rheem/Ruud (MMYY format)
- A.O. Smith/State (YYWW format)
- Bradford White (letter codes)
- Rinnai, Navien, Noritz, Takagi

---

## Pricing Service

### pricingService.ts
`src/lib/pricingService.ts`

AI-powered pricing with contractor presets.

```typescript
// Look up unit price by model
async function lookupPriceByModel(
  modelNumber: string
): Promise<PriceResult>;

// Generate full replacement quote
async function generateQuote(
  inputs: ForensicInputs,
  contractorId: string,
  complexity: 'SIMPLE' | 'STANDARD' | 'COMPLEX'
): Promise<TotalQuote>;

// Get contractor's saved install presets
async function getInstallPresets(
  contractorId: string
): Promise<InstallPreset[]>;
```

---

## Water Quality Service

### services/waterQualityService.ts
`src/lib/services/waterQualityService.ts`

Fetches water hardness data by location.

```typescript
// From GPS coordinates
async function getHardnessFromCoordinates(
  lat: number, 
  lng: number
): Promise<WaterQualityData>;

// From ZIP code
async function getHardnessFromZipCode(
  zipCode: string
): Promise<WaterQualityData>;

// Classification helpers
function getHardnessLabel(gpg: number): string;
// "Soft" | "Slightly Hard" | "Moderately Hard" | "Hard" | "Very Hard"
```

---

## Offline Database

### offlineDb.ts
`src/lib/offlineDb.ts`

IndexedDB wrapper for offline persistence.

```typescript
// Save inspection for later sync
async function saveInspectionOffline(
  id: string,
  data: TechnicianInspectionData,
  propertyId?: string
): Promise<void>;

// Get pending inspections
async function getPendingInspections(): Promise<PendingInspection[]>;

// Photo storage
async function savePhotoOffline(
  inspectionId: string,
  blob: Blob,
  type: string
): Promise<string>;
```

---

## Utilities

### utils.ts
`src/lib/utils.ts`

General utilities (Tailwind `cn()` helper, etc.)

```typescript
import { cn } from "@/lib/utils";

// Merge class names with conflict resolution
cn("px-4 py-2", condition && "bg-primary", "text-white");
```

### unitTypeContent.ts
`src/lib/unitTypeContent.ts`

Copy/content for different water heater types (titles, descriptions, icons).

### pdfGenerator.ts
`src/lib/pdfGenerator.ts`

Generates PDF health certificates using jsPDF.

```typescript
async function generatePDF(): Promise<void>;
// Downloads a PDF with asset info, health assessment, and recommendations
```
