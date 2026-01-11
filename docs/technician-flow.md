# Technician Inspection Flow

Detailed guide to the multi-step technician inspection process.

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICIAN INSPECTION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ Address  │──▶│ Building │──▶│ Location │──▶│ Unit Type│    │
│  │ Lookup   │   │ Type     │   │ Details  │   │ Selection│    │
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘    │
│                                                     │          │
│                                    ┌────────────────┼──────────┤
│                                    ▼                ▼          │
│                              ┌──────────┐    ┌──────────┐     │
│                              │ Tankless │    │ Hybrid   │     │
│                              │ Check    │    │ Check    │     │
│                              └────┬─────┘    └────┬─────┘     │
│                                   │               │            │
│                                   └───────┬───────┘            │
│                                           ▼                    │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ Asset    │──▶│ Softener │──▶│ Pressure │──▶│ Review   │    │
│  │ Scan     │   │ Check    │   │ & Infra  │   │ Summary  │    │
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘    │
│                                                     │          │
│                                                     ▼          │
│                                              ┌──────────┐     │
│                                              │ Handoff  │     │
│                                              │ Complete │     │
│                                              └──────────┘     │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step Details

### Step 1: Address Lookup
`src/components/steps/technician/AddressLookupStep.tsx`

**Purpose**: Capture property address and verify location.

**Fields**:
- Street address (required)
- City, State, ZIP (required)
- Unit/Apt number (optional)
- GPS coordinates (auto-captured)

**Validation**:
- All address fields must be filled
- Optional: Address verification via geocoding

**Data Captured**:
```typescript
{
  street: "123 Main St",
  city: "Phoenix",
  state: "AZ",
  zip: "85001",
  unit: "Apt 2B",
  verified: true,
  coordinates: { lat: 33.4484, lng: -112.0740 }
}
```

---

### Step 2: Building Type
`src/components/steps/technician/BuildingTypeStep.tsx`

**Purpose**: Classify the property type.

**Options**:
| Type | Description | Additional Fields |
|------|-------------|-------------------|
| Single Family | Standalone home | None |
| Multi-Unit | Apartment/condo | Unit count |
| Commercial | Business property | Floors, type |

**Impact on Algorithm**:
- Commercial properties get different risk weights
- Multi-unit affects usage calculations

---

### Step 3: Location Details
`src/components/steps/technician/LocationStep.tsx`

**Purpose**: Document where water heater is installed.

**Required Fields** (must be answered):
- **Heater Location**: Garage, Basement, Attic, Utility Closet, etc.
- **Finished Area**: Yes/No - Is it in finished living space?
- **Temp Dial Setting**: LOW, MEDIUM, HIGH, VERY_HIGH

**Additional Fields**:
- Accessibility rating
- Water damage observed
- Drain pan present

**Why Required**:
- `isFinishedArea` affects damage risk scoring
- `tempSetting` affects efficiency and wear calculations

---

### Step 4: Unit Type Selection
`src/components/steps/technician/UnitTypeStep.tsx`

**Purpose**: Identify water heater type and fuel source.

**Primary Selection**:
- Tank (traditional)
- Tankless (on-demand)
- Hybrid (heat pump)

**Fuel Type**:
- Gas (Natural Gas)
- Electric
- Propane

**Conditional Logic**:
- Selecting "Tankless" enables Step 7 (TanklessCheckStep)
- Selecting "Hybrid" enables Step 8 (HybridCheckStep)

---

### Step 5: Asset Scan
`src/components/steps/technician/AssetScanStep.tsx`

**Purpose**: Capture water heater specifications via AI OCR.

**Primary Method** (Camera):
1. Point camera at data plate label
2. AI extracts: Brand, Model, Serial, Capacity, Warranty
3. Technician verifies/corrects extracted data

**Fallback** (Manual Entry):
- Toggle to manual mode
- Enter specifications by hand
- Lower confidence score applied

**AI Extraction Fields**:
```typescript
{
  brand: "Rheem",
  modelNumber: "XG50T06EC36U1",
  serialNumber: "M031234567",
  fuelType: "GAS",
  capacityGallons: 50,
  warrantyYears: 6,
  manufactureYear: 2019,  // Decoded from serial
  ventType: "POWER_VENT",
  qualityTier: "STANDARD",
  confidence: 92
}
```

---

### Step 6: Softener Check
`src/components/steps/technician/SoftenerCheckStep.tsx`

**Purpose**: Document water softener presence and condition.

**Required Answer** (Yes/No buttons):
- "Is there a water softener?" - Must select Yes or No

**If Yes - Additional Fields**:
- Salt status: Full, Low, Empty, Bridged
- Control head type: Timer, Demand, Smart
- Resin condition: Good, Fair, Poor
- Age estimate
- Brand (optional photo scan)

**Impact on Algorithm**:
- `hasSoftener: true` reduces hard water damage risk
- Salt status affects maintenance recommendations

---

### Step 7: Tankless Check (Conditional)
`src/components/steps/technician/TanklessCheckStep.tsx`

**Only shown if**: `unitType.isTankless === true`

**Purpose**: Tankless-specific inspection points.

**Fields**:
- Isolation valves present (for descaling)
- Last descale date (years ago)
- Error codes displayed (AI reads from screen)
- Inlet filter condition (photo scan)
- Current flow rate reading

**Descale Logic**:
- No isolation valves = VIOLATION issue flagged
- Last descale > 2 years = maintenance recommendation

---

### Step 8: Hybrid Check (Conditional)
`src/components/steps/technician/HybridCheckStep.tsx`

**Only shown if**: `unitType.isHybrid === true`

**Purpose**: Heat pump water heater specific checks.

**Fields**:
- Air filter condition (photo scan)
- Condensate drain clear
- Compressor operating
- Evaporator coil condition

**Critical Checks**:
- Clogged air filter = immediate maintenance needed
- Blocked condensate = potential water damage risk

---

### Step 9: Pressure & Infrastructure
`src/components/steps/technician/PressureStep.tsx`

**Purpose**: Measure water pressure and document infrastructure.

**Measurements** (Sliders):
- PSI Reading: 20-150 (warns if > 80)
- Flow Rate: 0-12 GPM
- Water Hardness: 0-30 GPG

**Infrastructure Checkboxes**:
- PRV (Pressure Reducing Valve) present
- Expansion tank present
- Circulation pump present
- Closed loop system

**Automatic Detections**:
- High PSI + No PRV = VIOLATION
- Closed loop + No expansion tank = VIOLATION

---

### Step 10: Review Summary
`src/components/steps/technician/ReviewStep.tsx`

**Purpose**: Review all collected data before submission.

**Displays**:
- Property summary
- Unit specifications
- Infrastructure status
- Detected issues
- Preliminary health score
- Recommended actions

**Actions**:
- Edit any previous step
- Add inspection notes
- Capture additional photos
- Submit inspection

---

### Step 11: Handoff
`src/components/steps/technician/HandoffStep.tsx`

**Purpose**: Complete inspection and transition to customer.

**Options**:
- Generate PDF report
- Send to customer email
- Schedule follow-up
- Create quote

**Offline Mode**:
- Saves to IndexedDB if offline
- Shows sync indicator
- Auto-syncs when connection restored

---

## State Management

### TechnicianFlow Component
Manages all step state via `useState`:

```typescript
const [data, setData] = useState<TechnicianInspectionData>(
  DEFAULT_TECHNICIAN_INSPECTION
);
const [currentStep, setCurrentStep] = useState(0);

const updateData = (stepData: Partial<TechnicianInspectionData>) => {
  setData(prev => ({ ...prev, ...stepData }));
};
```

### Step Navigation
```typescript
const handleNext = () => setCurrentStep(prev => prev + 1);
const handleBack = () => setCurrentStep(prev => prev - 1);

// Conditional step skipping
const getNextStep = () => {
  if (currentStep === 4 && !data.unitType.isTankless) {
    return 6; // Skip tankless step
  }
  return currentStep + 1;
};
```

---

## Offline Behavior

### Save Progress
```typescript
import { saveInspectionOffline } from '@/lib/offlineDb';

const saveProgress = async () => {
  await saveInspectionOffline(inspectionId, data);
};
```

### Photo Storage
```typescript
import { savePhotoOffline } from '@/lib/offlineDb';

const handlePhotoCapture = async (blob: Blob) => {
  const photoId = await savePhotoOffline(inspectionId, blob, 'asset_scan');
  updateData({ 
    assetScan: { ...data.assetScan, photoUrl: photoId } 
  });
};
```

### Sync Queue
- Photos and inspections added to sync queue
- `useOfflineSync` hook monitors queue
- Auto-syncs when online
- Shows pending count in UI

---

## Algorithm Integration

After inspection completion:

```typescript
import { runOpterraAlgorithm } from '@/lib/opterraAlgorithm';

const forensicInputs = mapToForensicInputs(data);
const { metrics, vitals } = runOpterraAlgorithm(forensicInputs);

// metrics.healthScore, metrics.riskLevel, etc.
```

The mapping function (`src/types/technicianMapper.ts`) converts `TechnicianInspectionData` to `ForensicInputs`.
