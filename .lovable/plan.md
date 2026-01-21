

# Redesign HealthGauge for Homeowner Clarity

## Goal
Transform the technical "stress factors" display into homeowner-friendly insights while preserving the data for technical users.

## Changes to `src/components/HealthGauge.tsx`

### 1. Replace "Stress Factors" with "What We Found"
Replace the multiplier grid with a plain-English findings list:

**Before:**
```
Stress Factors
Pressure         1.00x ✓
Thermal Cycling  1.02x ✓
Sediment         1.25x ⚠
Circulation      1.00x ✓
Closed Loop      1.00x ✓
Usage Impact     +20% wear
Combined Aging Rate  1.28x
```

**After:**
```
What We Found

✅ Water pressure is normal
⚠️ Sediment is building up faster than normal
✅ No unusual stress on the system

Your unit is aging about 28% faster than ideal.
```

### 2. Create Helper Function for Plain-English Findings
Add a function that translates metrics into homeowner language:

```typescript
function getPlainEnglishFindings(metrics: OpterraMetrics, isTankless: boolean): Finding[] {
  const findings: Finding[] = [];
  
  // Pressure
  if (metrics.stressFactors.pressure > 1.15) {
    findings.push({
      status: metrics.stressFactors.pressure > 1.5 ? 'critical' : 'warning',
      message: 'Water pressure is too high - this strains your tank'
    });
  } else {
    findings.push({ status: 'good', message: 'Water pressure is normal' });
  }
  
  // Sediment (tank) or Scale (tankless)
  if (isTankless) {
    if (metrics.stressFactors.chemical > 1.15) {
      findings.push({
        status: metrics.stressFactors.chemical > 1.5 ? 'critical' : 'warning',
        message: 'Mineral scale is building up inside'
      });
    }
  } else {
    if (metrics.stressFactors.sediment > 1.15) {
      findings.push({
        status: metrics.stressFactors.sediment > 1.5 ? 'critical' : 'warning',
        message: 'Sediment is collecting at the bottom'
      });
    }
  }
  
  // Usage impact
  if (metrics.stressFactors.usageIntensity > 1.15) {
    findings.push({
      status: 'info',
      message: `Heavy use is adding extra wear`
    });
  }
  
  // Only show issues, not "all good" for every factor
  return findings;
}
```

### 3. Simplify Combined Aging Rate Display
Replace technical "1.28x" with plain language:

```typescript
function getAgingRateSummary(agingRate: number): string {
  if (agingRate <= 1.1) return "Your unit is aging normally";
  if (agingRate <= 1.3) return "Your unit is aging slightly faster than normal";
  if (agingRate <= 1.8) return "Your unit is aging faster than normal";
  if (agingRate <= 2.5) return "Your unit is aging much faster than normal";
  return "Your unit is under severe stress";
}
```

### 4. Add Optional Technical Details Accordion
For plumbers or curious homeowners, add a collapsible "Technical Details" section at the bottom that contains the raw stress factor multipliers.

```tsx
<Collapsible>
  <CollapsibleTrigger className="text-xs text-muted-foreground flex items-center gap-1">
    <ChevronRight className="w-3 h-3" />
    Technical details
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Original StressFactorItem components here */}
  </CollapsibleContent>
</Collapsible>
```

### 5. Keep What Works
- Health score header (19/100 with bar) - intuitive
- Status badge ("On Borrowed Time") - clear
- Breach photo when relevant - visual evidence
- 5-Year Projection Chart - tells a story
- Infrastructure violation buttons - actionable

## New UI Structure

```
┌─────────────────────────────────────────┐
│ System Health                    19/100 │
│ [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
│          [ On Borrowed Time ]           │
├─────────────────────────────────────────┤
│ What We Found                           │
│ ✅ Water pressure is normal             │
│ ⚠️ Sediment is building up              │
│ ✅ No unusual thermal stress            │
│                                         │
│ Your unit is aging about 28% faster     │
│ than normal.                            │
├─────────────────────────────────────────┤
│ [VIOLATION] Missing Expansion Tank  →   │
├─────────────────────────────────────────┤
│ 5-Year Health Projection                │
│ [Chart stays the same]                  │
├─────────────────────────────────────────┤
│ ▶ Technical details                     │
└─────────────────────────────────────────┘
```

## Files to Modify
- `src/components/HealthGauge.tsx` - Main changes

## Outcome
- Homeowners understand their situation without needing an engineering degree
- The important data is still there for technicians (in accordion)
- Aligns with your "grandma-friendly" and "consultative messaging" UX principles

