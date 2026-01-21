

# Strategic Pivot: Quoting Engine → Triage & Outreach Engine

## Executive Summary

This refactor transforms the algorithm from a **Pricing Liability** to a **Triage Strength**. By removing dollar-guessing logic and replacing it with "Plumber Handshake" outputs, you focus on what the algorithm does best: physics-based diagnosis and lead qualification.

---

## Phase 1: The Purge (Remove Financial Liabilities)

### Task 1.1: Delete Cost Constants

**File: `src/lib/opterraAlgorithm.ts`**

Remove these hardcoded cost constants (lines 331-398):
- `baseCostGas`, `baseCostElectric`, `baseCostHybrid` from `TIER_PROFILES`
- `VENT_COST_ADDERS` (lines 374-378)
- `VENTING_SCENARIO_ADDERS` (lines 385-389)
- `CODE_UPGRADE_COSTS` (lines 393-398)

**File: `src/lib/opterraTanklessAlgorithm.ts`**

Remove `baseCostGas`, `baseCostElectric` from `TANKLESS_TIER_PROFILES` (lines 29-69)

### Task 1.2: Delete Financial Forecast Logic

**File: `src/lib/opterraAlgorithm.ts`**

- Delete `FinancialForecast` interface (lines 273-289)
- Delete `calculateTierCost` function (lines 1856-1899)
- Delete `calculateFinancialForecast` function (lines 1914-2048)
- Delete `optimizeEconomicDecision` function (lines 1737-1799)
- Remove `financial` from `OpterraResult` interface (line 323)

**File: `src/lib/opterraTanklessAlgorithm.ts`**

- Delete `getTanklessFinancials` function (lines 367-407)

### Task 1.3: Remove Financial UI Components

**Files to Update:**
- `src/components/RecommendationBanner.tsx` - Remove "Financial Outlook" card (lines 238-275)
- `src/components/ScoreSimulator.tsx` - Remove tier cost display (lines 257-277)
- `src/components/CostSavingsTracker.tsx` - Convert to "Risk Reduction" tracker (no dollar amounts)
- `src/components/MaintenanceChatInterface.tsx` - Remove dollar amounts from chat responses (lines 299-319)
- `src/components/FindingsSummaryPage.tsx` - Remove `estReplacementCost`, `monthlyBudget` references

---

## Phase 2: New Interface - "Plumber Handshake"

### Task 2.1: Create PlumberHandshake Interface

**File: `src/lib/opterraAlgorithm.ts`**

Replace `FinancialForecast` with:

```typescript
export interface PlumberHandshake {
  // The "Hook" - Why the homeowner should act NOW
  urgency: 'EMERGENCY' | 'PRIORITY' | 'ROUTINE' | 'MONITOR';
  headline: string; // e.g., "Critical Failure Risk: Anode Depleted"
  
  // The "Brief" - What the plumber needs to know (Lead Quality)
  technicalSummary: string; // e.g. "12yo Gas Unit, Basement, Atmospheric Vent"
  jobComplexity: 'STANDARD' | 'ELEVATED' | 'COMPLEX'; 
  codeAlerts: string[];     // e.g. ["Missing Thermal Expansion Tank"]
  
  // The "Script" - Questions homeowner should ask
  talkingPoints: string[];
  
  // Estimated timeline (no dollars)
  yearsRemaining: number;
  planningHorizon: 'IMMEDIATE' | 'THIS_YEAR' | '1_TO_3_YEARS' | '3_PLUS_YEARS';
}
```

### Task 2.2: Implement generatePlumberHandshake

**File: `src/lib/opterraAlgorithm.ts`**

New function to replace `calculateFinancialForecast`:

```typescript
function generatePlumberHandshake(
  data: ForensicInputs, 
  metrics: OpterraMetrics,
  verdict: Recommendation
): PlumberHandshake {
  const codeAlerts: string[] = [];
  const talkingPoints: string[] = [];
  let complexityScore = 0;

  // 1. Detect Complexity (The "Gotchas")
  if (!data.hasExpansionTank && data.isClosedLoop) {
    codeAlerts.push("Code Upgrade: Thermal Expansion Tank required");
    talkingPoints.push("Ask if my closed-loop system needs an expansion tank.");
    complexityScore += 2;
  }
  
  if (data.installLocation === 'ATTIC' || data.installLocation === 'CRAWLSPACE') {
    codeAlerts.push("Access: Difficult location - may require 2 technicians");
    complexityScore += 3;
  }
  
  if (data.ventType === 'POWER_VENT') {
    codeAlerts.push("Electrical: Power vent requires 120V outlet");
    complexityScore += 1;
  }
  
  if (metrics.shieldLife <= 0) {
    talkingPoints.push("My anode is depleted—can you check for internal rust?");
  }
  
  if (metrics.sedimentLbs > 10) {
    talkingPoints.push("There may be significant sediment—is flushing safe?");
  }

  // 2. Determine Urgency from verdict
  let urgency: PlumberHandshake['urgency'] = 'ROUTINE';
  if (verdict.action === 'REPLACE' && verdict.urgent) urgency = 'EMERGENCY';
  else if (verdict.action === 'REPLACE') urgency = 'PRIORITY';
  else if (verdict.action === 'REPAIR' && verdict.urgent) urgency = 'PRIORITY';
  else if (verdict.action === 'PASS') urgency = 'MONITOR';

  // 3. Planning horizon (no dollars, just timeline)
  const yearsRemaining = Math.max(0, Math.round(13 - metrics.bioAge));
  let planningHorizon: PlumberHandshake['planningHorizon'] = '3_PLUS_YEARS';
  if (yearsRemaining <= 0) planningHorizon = 'IMMEDIATE';
  else if (yearsRemaining <= 1) planningHorizon = 'THIS_YEAR';
  else if (yearsRemaining <= 3) planningHorizon = '1_TO_3_YEARS';

  return {
    urgency,
    headline: verdict.title,
    technicalSummary: `${data.calendarAge}yr ${data.manufacturer || 'Unknown'} ${data.fuelType} in ${data.installLocation}`,
    jobComplexity: complexityScore > 4 ? 'COMPLEX' : (complexityScore > 1 ? 'ELEVATED' : 'STANDARD'),
    codeAlerts,
    talkingPoints,
    yearsRemaining,
    planningHorizon
  };
}
```

---

## Phase 3: Repurpose TIER_PROFILES (Physical Characteristics)

### Task 3.1: Add Physical Traits, Remove Prices

**File: `src/lib/opterraAlgorithm.ts`**

Transform `TIER_PROFILES` to focus on physics, not cost:

```typescript
const TIER_PROFILES: Record<QualityTier, TierProfile> = {
  BUILDER: {
    tier: 'BUILDER',
    tierLabel: 'Builder Grade',
    warrantyYears: 6,
    ventType: 'ATMOSPHERIC',
    features: ['Basic glass-lined tank', 'Single anode rod', 'Standard thermostat'],
    // NEW: Physical traits for risk assessment
    insulationQuality: 'LOW',      // Affects standby loss
    anodeType: 'SINGLE',           // Affects protection duration
    failureMode: 'CATASTROPHIC',   // Cheap tanks tend to burst
    expectedLife: 10,              // Statistical mean
  },
  STANDARD: {
    tier: 'STANDARD',
    tierLabel: 'Standard',
    warrantyYears: 9,
    ventType: 'ATMOSPHERIC',
    features: ['Premium glass lining', 'Larger anode rod', 'Self-cleaning dip tube'],
    insulationQuality: 'MEDIUM',
    anodeType: 'SINGLE_LARGE',
    failureMode: 'GRADUAL',        // Tends to weep before burst
    expectedLife: 12,
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    tierLabel: 'Professional',
    warrantyYears: 12,
    ventType: 'ATMOSPHERIC',
    features: ['Dual anode rods', 'High-recovery burner', 'Brass drain valve'],
    insulationQuality: 'HIGH',
    anodeType: 'DUAL',
    failureMode: 'SLOW_LEAK',
    expectedLife: 14,
  },
  PREMIUM: {
    tier: 'PREMIUM',
    tierLabel: 'Premium / Lifetime',
    warrantyYears: 15,
    ventType: 'ATMOSPHERIC',
    features: ['Stainless steel tank OR Lifetime warranty', 'Powered anode', 'WiFi monitoring'],
    insulationQuality: 'VERY_HIGH',
    anodeType: 'POWERED',          // Never depletes
    failureMode: 'CONTROLLED',     // Built-in leak detection
    expectedLife: 18,
  },
};
```

---

## Phase 4: Replace Economic Logic with Technical Necessity

### Task 4.1: Replace optimizeEconomicDecision with optimizeTechnicalNecessity

**File: `src/lib/opterraAlgorithm.ts`**

New function focusing on physical responsibility, not economics:

```typescript
function optimizeTechnicalNecessity(
  rawVerdict: Recommendation, 
  metrics: OpterraMetrics, 
  data: ForensicInputs
): Recommendation {

  // RULE 1: The "Naked" Rule (Liability Protection)
  // If the tank has no anode protection, repairs are professionally irresponsible
  if (metrics.shieldLife <= 0 && rawVerdict.action === 'MAINTAIN') {
    return {
      action: 'REPLACE',
      title: 'End of Service Life',
      reason: 'Internal protection is depleted. Repairs at this stage typically fail within 6 months.',
      urgent: true,
      badgeColor: 'red',
      badge: 'REPLACE NOW'
    };
  }

  // RULE 2: The "Code Trap" (Complexity Protection)
  // If an old tank needs major code upgrades, push toward replacement consultation
  if (metrics.riskLevel >= 3 && data.calendarAge > 8 && !data.hasExpansionTank && data.isClosedLoop) {
    return {
      action: 'REPLACE',
      title: 'System Upgrade Required',
      reason: 'Unit requires critical safety upgrades that are best bundled with replacement.',
      urgent: false,
      badgeColor: 'orange',
      badge: 'CONSULT'
    };
  }

  // RULE 3: The "High Risk Location" Rule
  // Attic/upper floor with moderate failure risk = urgent action
  if (metrics.riskLevel >= 3 && 
      (data.installLocation === 'ATTIC' || data.installLocation === 'UPPER_FLOOR') && 
      rawVerdict.action !== 'PASS') {
    return {
      ...rawVerdict,
      urgent: true,
      note: 'Location increases urgency—water damage risk is significant.'
    };
  }

  return rawVerdict;
}
```

---

## Phase 5: Hard Water Tax Decision

### Option A: Keep but Simplify (Recommended)

The Hard Water Tax provides **user value** (awareness of hidden costs) without being a quote. Transform the display to remove specific dollar amounts:

**Current Display:**
```text
| 🔥 Energy  | 🧺 Appliances | 💧 Extra Soap | 🔧 Pipes |
|   $87/yr   |   $135/yr     |    $225/yr    | $115/yr  |
```

**Proposed Display:**
```text
| 🔥 Energy  | 🧺 Appliances | 💧 Soap & Detergent | 🔧 Pipes |
|   Moderate |   High Impact |    Significant      | Moderate |
```

Keep the recommendation logic (NONE/CONSIDER/RECOMMEND) but remove specific dollar amounts from the UI.

### Option B: Remove Entirely

If you want a complete financial purge, delete `calculateHardWaterTax` and `HardWaterTaxCard.tsx`.

---

## Phase 6: Update Edge Functions

### Task 6.1: Remove Dollar References from AI Prompts

**Files:**
- `supabase/functions/generate-replacement-rationale/index.ts` - Remove "The Economics" section (line 310)
- `supabase/functions/chat-water-heater/index.ts` - Remove financial context (lines 137-146)

Replace economic language with physics-based explanations:
- "At this stage, repair costs exceed value" → "At this stage, the tank's protective anode is depleted, making repairs unreliable"
- "Cost to replace: $X" → "Based on your unit's condition, here's what to discuss with your plumber"

---

## Impact Summary

| Component | Before | After |
|-----------|--------|-------|
| `OpterraResult.financial` | `FinancialForecast` (costs) | `PlumberHandshake` (scripts) |
| `TIER_PROFILES` | baseCostGas, etc. | insulationQuality, failureMode |
| `optimizeEconomicDecision` | Repair $ < 50% Replace $ | Physical responsibility check |
| `CostSavingsTracker` | "$3,000 saved" | "Risk reduced by 40%" |
| `HardWaterTax` card | "$562/yr loss" | "High impact on appliances" |

---

## Files Affected (Complete List)

### Algorithm Core (Delete + Replace)
1. `src/lib/opterraAlgorithm.ts` - Major refactor
2. `src/lib/opterraTanklessAlgorithm.ts` - Remove financials

### UI Components (Update)
3. `src/components/CommandCenter.tsx` - Use PlumberHandshake
4. `src/components/FindingsSummaryPage.tsx` - Remove dollar amounts
5. `src/components/RecommendationBanner.tsx` - Remove Financial Outlook
6. `src/components/ScoreSimulator.tsx` - Remove tier costs
7. `src/components/CostSavingsTracker.tsx` - Convert to risk %
8. `src/components/HardWaterTaxCard.tsx` - Qualitative labels
9. `src/components/MaintenanceChatInterface.tsx` - Remove $ from chat
10. `src/components/AlgorithmTestHarness.tsx` - Update test harness

### Edge Functions (Update)
11. `supabase/functions/generate-replacement-rationale/index.ts`
12. `supabase/functions/chat-water-heater/index.ts`

### Pricing Services (Delete Entirely)
13. `src/lib/pricingService.ts` - Delete or gut
14. `src/hooks/usePricing.ts` - Delete
15. `src/hooks/useTieredPricing.ts` - Delete
16. `src/components/TieredPricingDisplay.tsx` - Delete
17. `src/components/PriceBreakdown.tsx` - Delete

---

## Recommended Execution Order

1. **Phase 2 first** - Create `PlumberHandshake` interface (additive, no breaking changes)
2. **Phase 4** - Replace `optimizeEconomicDecision` with `optimizeTechnicalNecessity`
3. **Phase 3** - Update `TIER_PROFILES` (keep the old fields temporarily for backwards compat)
4. **Phase 6** - Update edge function prompts
5. **Phase 5** - Decide on Hard Water Tax approach
6. **Phase 1 last** - The Purge (delete everything in one sweep after UI is migrated)

This order minimizes breaking changes and lets you verify each phase before moving on.

