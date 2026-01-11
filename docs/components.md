# Components Guide

## Overview

Components are organized into three categories:
1. **Feature Components** - Full-featured UI sections
2. **Step Components** - Multi-step wizard screens
3. **UI Primitives** - Reusable shadcn/ui elements

---

## Feature Components

### CommandCenter
`src/components/CommandCenter.tsx`

The main dashboard hub after onboarding. Displays:
- Health gauge visualization
- Vitals grid (key metrics)
- Action dock (quick actions)
- Maintenance recommendations

**Used by**: `Index.tsx` when user has completed onboarding

---

### TechnicianFlow
`src/components/TechnicianFlow.tsx`

Multi-step inspection wizard for plumbing contractors. Manages state across 10+ inspection steps.

**Key Props**: None (manages internal state)

**State Structure**:
```typescript
interface TechnicianInspectionData {
  address: AddressData;
  buildingType: BuildingType;
  location: LocationCondition;
  unitType: UnitTypeSelection;
  // ... see types/technicianInspection.ts
}
```

---

### OnboardingFlow
`src/components/OnboardingFlow.tsx`

Homeowner-facing onboarding wizard. Simpler than TechnicianFlow, captures:
- Household size
- Water heater symptoms
- Residency duration

---

### HealthGauge
`src/components/HealthGauge.tsx`

Circular gauge visualization showing water heater health score (0-100).

**Props**:
```typescript
interface Props {
  score: number;        // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

---

### VitalsGrid
`src/components/VitalsGrid.tsx`

Grid of diagnostic metrics (age, efficiency, risk level, etc.)

**Props**:
```typescript
interface Props {
  vitals: OpterraVitals;
  metrics: OpterraMetrics;
}
```

---

### ActionDock
`src/components/ActionDock.tsx`

Floating action buttons for quick actions (schedule service, view report, etc.)

---

### TieredPricingDisplay
`src/components/TieredPricingDisplay.tsx`

Displays replacement options across three quality tiers:
- **Essential** - Basic compliant installation
- **Recommended** - Best value with key upgrades
- **Premium** - Full infrastructure overhaul

---

### ForensicReport
`src/components/ForensicReport.tsx`

Detailed diagnostic report showing all assessment findings, risk factors, and recommendations.

---

### InteractiveWaterHeaterDiagram
`src/components/InteractiveWaterHeaterDiagram.tsx`

SVG-based interactive diagram highlighting water heater components and potential issues.

---

## Step Components (Technician)

Located in `src/components/steps/technician/`:

| Step | File | Purpose |
|------|------|---------|
| 1 | `AddressLookupStep.tsx` | Property address entry |
| 2 | `BuildingTypeStep.tsx` | Single family, multi-unit, commercial |
| 3 | `LocationStep.tsx` | Where water heater is installed |
| 4 | `UnitTypeStep.tsx` | Tank, tankless, hybrid selection |
| 5 | `AssetScanStep.tsx` | Data plate photo + AI OCR |
| 6 | `SoftenerCheckStep.tsx` | Water softener presence/condition |
| 7 | `TanklessCheckStep.tsx` | Tankless-specific inspection |
| 8 | `HybridCheckStep.tsx` | Hybrid/heat pump inspection |
| 9 | `PressureStep.tsx` | PSI reading, flow rate, hardness |
| 10 | `ReviewStep.tsx` | Summary before submission |
| 11 | `HandoffStep.tsx` | Handoff to customer |

---

## Step Components (Homeowner)

Located in `src/components/steps/`:

| Step | File | Purpose |
|------|------|---------|
| 1 | `HouseholdStep.tsx` | Number of people |
| 2 | `SymptomsStep.tsx` | Current issues/symptoms |
| 3 | `ResidencyStep.tsx` | Years at address |
| 4 | `HeaterHistoryStep.tsx` | Maintenance history |
| 5 | `SoftenerContextStep.tsx` | Softener awareness |

---

## UI Primitives

All shadcn/ui components in `src/components/ui/`:

- `Button`, `Card`, `Input`, `Label`
- `Dialog`, `Drawer`, `Sheet`
- `Select`, `Slider`, `Switch`, `Checkbox`
- `Tabs`, `Accordion`, `Collapsible`
- `Progress`, `Badge`, `Avatar`
- `Toast`, `Sonner` (notifications)
- And more...

### Custom UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `QuickSelectChips` | `ui/QuickSelectChips.tsx` | Horizontal scrolling chip selector |
| `ScanHeroCard` | `ui/ScanHeroCard.tsx` | Camera scan prompt card |
| `StatusToggleRow` | `ui/StatusToggleRow.tsx` | Labeled toggle with status indicator |

---

## Component Patterns

### Controlled Step Pattern
All step components follow this pattern:

```typescript
interface StepProps<T> {
  data: T;
  onUpdate: (updates: Partial<T>) => void;
  onNext: () => void;
  onBack?: () => void;
}
```

### Conditional Rendering
Steps render conditionally based on previous answers:
```typescript
// TanklessCheckStep only shows if unitType.isTankless
{data.unitType.isTankless && <TanklessCheckStep ... />}
```

### Validation Pattern
Steps disable "Continue" until required fields are filled:
```typescript
<Button 
  onClick={onNext} 
  disabled={!isValid}
>
  Continue
</Button>
```
