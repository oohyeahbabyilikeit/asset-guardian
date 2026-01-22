
# Show Services That Affect Anode Calculations in Service History

## Problem
The service history shows only `flush`, `anode_replacement`, and `inspection` events - but many other services directly impact the anode life calculation:
- Softener installation (1.4x decay multiplier)
- Circulation pump installation (0.5x decay)
- Expansion tank installation (reduces pressure stress)
- PRV installation (reduces pressure stress)

When these services happen, they should be logged and visible so users understand why their health projections changed.

## Solution

### 1. Expand ServiceEvent Types
**File:** `src/types/serviceHistory.ts`

Add new event types that affect algorithm calculations:
```typescript
export interface ServiceEvent {
  id: string;
  type: 
    | 'flush' 
    | 'anode_replacement' 
    | 'inspection' 
    | 'repair'
    | 'softener_install'      // NEW: Affects anode decay rate
    | 'circ_pump_install'     // NEW: Affects anode decay rate
    | 'exp_tank_install'      // NEW: Affects pressure stress
    | 'exp_tank_replace'      // NEW: Affects pressure stress
    | 'prv_install'           // NEW: Affects pressure stress
    | 'prv_replace'           // NEW: Affects pressure stress
    | 'descale';              // NEW: For tankless units
  date: string;
  // ... rest unchanged
}
```

### 2. Update Service History Display
**File:** `src/components/ServiceHistory.tsx`

Add visual representation for the new event types with appropriate icons and colors:

| Event Type | Icon | Color | Label |
|------------|------|-------|-------|
| `softener_install` | Droplets | Purple | "Softener Installed" |
| `circ_pump_install` | Zap | Yellow | "Circ Pump Installed" |
| `exp_tank_install` | Shield | Blue | "Expansion Tank Installed" |
| `prv_install` | Gauge | Green | "PRV Installed" |

### 3. Add "Impact Badge" to Service Events
Show how each service affected the calculation:

```text
┌─────────────────────────────────────────────┐
│ 🛡 Anode Replaced                           │
│ Jan 15, 2024                                │
│ ┌─────────────────────────────────────────┐ │
│ │ ⬆ Shield Life: 0yr → 6yr                │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 💧 Softener Installed                       │
│ Mar 8, 2023                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ ⚠ Anode decay: +1.4x (soft water)       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 🛡 Expansion Tank Installed                 │
│ Feb 1, 2023                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ ⬆ Pressure stress: 7x → 1x              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 4. Update the "Add Service" Flow
When adding a service event, show the expected impact:
- For anode replacement: "Resets shield life to ~6 years"
- For softener install: "Note: Soft water accelerates anode wear by 1.4x"
- For expansion tank: "Reduces aging rate by up to 7x"

### 5. Update getServiceEventTypes()
**File:** `src/lib/maintenanceCalculations.ts`

Include infrastructure services in the list:
```typescript
// Tank water heaters
return [
  { value: 'flush', label: 'Tank Flush' },
  { value: 'anode_replacement', label: 'Anode Replacement' },
  { value: 'softener_install', label: 'Softener Installation' },
  { value: 'circ_pump_install', label: 'Circulation Pump Install' },
  { value: 'exp_tank_install', label: 'Expansion Tank Install' },
  { value: 'prv_install', label: 'PRV Install' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'repair', label: 'Repair' },
];
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/serviceHistory.ts` | Add new event types to `ServiceEvent.type` union |
| `src/components/ServiceHistory.tsx` | Add icons/colors/labels for new types; add impact badge display |
| `src/lib/maintenanceCalculations.ts` | Update `getServiceEventTypes()` to include new types |

## Benefits
1. **Transparency**: Users see exactly what services affect their health score
2. **Education**: Impact badges explain the "why" behind calculation changes
3. **Trust**: Full audit trail of what affects the algorithm
4. **Actionable**: Users understand the trade-offs (e.g., softener helps scale but hurts anode)
