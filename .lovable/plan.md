

# Remove Numerical Bio-Age & Percentage Risk from Customer Copy

## Problem
Several places in the codebase still expose raw numerical values (bio-age, failure %, repair economics) to customers. The selected text:

> "At 11 years with 18.4 years of biological wear, repair costs outweigh remaining service life."

This exposes internal metrics that are confusing and anxiety-inducing for homeowners.

---

## Locations to Update

### 1. Algorithm Core Recommendations
**File: `src/lib/opterraAlgorithm.ts`**

| Line | Current Text | Proposed Text |
|------|--------------|---------------|
| 1492 | `"Unit has exceeded its statistical service life (${data.calendarAge} years / ${metrics.failProb.toFixed(0)}% risk)."` | `"Your unit has reached the end of its expected service life and is no longer reliable."` |
| 1541 | `"At ${data.calendarAge} years with ${metrics.bioAge.toFixed(1)} years of biological wear, repair costs outweigh remaining service life."` | `"Your unit shows significant wear. At this stage, repairs won't meaningfully extend its life."` |

### 2. FindingsSummaryPage
**File: `src/components/FindingsSummaryPage.tsx`**

| Line | Current Text | Proposed Text |
|------|--------------|---------------|
| 1063 | `"${currentInputs.calendarAge} years old with ${metrics.bioAge.toFixed(0)}-year wear"` | Use qualitative: `"Elevated wear for its age"` or `"Significant environmental stress"` |
| 1245 | `"At ${age} years old with a biological age of ${bioAge.toFixed(1)} years, your unit has exceeded..."` | `"Based on its condition and wear level, your unit has exceeded its designed service life."` |

### 3. SafetyAssessmentPage
**File: `src/components/SafetyAssessmentPage.tsx`**

| Line | Current Text | Proposed Text |
|------|--------------|---------------|
| 231 | `"At ${Math.round(bioAge)} biological years, repairs would cost more than the life they'd add."` | `"Given its current condition, repairs won't add meaningful life to the unit."` |

### 4. OptionsAssessmentDrawer
**File: `src/components/OptionsAssessmentDrawer.tsx`**

| Lines | Current Text | Proposed Text |
|-------|--------------|---------------|
| 85 | `"Your unit is ${Math.round(metrics.bioAge)} years old biologically – well past..."` | `"Your unit is showing high wear – well past the typical 8-12 year lifespan."` |
| 87 | `"At ${Math.round(metrics.bioAge)} biological years..."` | `"Your unit is entering its later years based on wear."` |
| 89 | `"Your unit is ${Math.round(metrics.bioAge)} biological years old..."` | `"Your unit is still within its prime lifespan."` |

### 5. Edge Functions (AI Prompts)
**Files to update:**
- `supabase/functions/generate-replacement-rationale/index.ts` (line 235)
- `supabase/functions/generate-maintain-rationale/index.ts` (line 206)
- `supabase/functions/generate-findings/index.ts` (line 240)

**Change**: Replace raw bio-age numbers with qualitative labels in the context passed to the LLM:

```typescript
// Before:
- Biological Age: ${ctx.bioAge.toFixed(1)} years

// After:
- Wear Level: ${ctx.bioAge > ctx.calendarAge + 5 ? 'High' : ctx.bioAge > ctx.calendarAge + 2 ? 'Elevated' : 'Normal'}
- Condition: ${ctx.healthScore > 70 ? 'Good' : ctx.healthScore > 40 ? 'Fair' : 'Poor'}
```

Also add prompt instructions to NOT output specific numbers or percentages.

---

## Qualitative Labels Reference

| Internal Metric | Customer-Facing Label |
|-----------------|----------------------|
| bioAge > chronoAge + 5 | "High wear" or "Significant wear" |
| bioAge > chronoAge + 2 | "Elevated wear" |
| bioAge ≤ chronoAge + 2 | "Normal wear" |
| failProb > 30% | "High risk" |
| failProb > 15% | "Medium risk" |
| failProb ≤ 15% | "Low risk" |

---

## Summary

| File | Changes |
|------|---------|
| `src/lib/opterraAlgorithm.ts` | 2 recommendation reason strings |
| `src/components/FindingsSummaryPage.tsx` | 2 finding strings |
| `src/components/SafetyAssessmentPage.tsx` | 1 description string |
| `src/components/OptionsAssessmentDrawer.tsx` | 3 context strings |
| `supabase/functions/generate-replacement-rationale/index.ts` | Convert bioAge to qualitative |
| `supabase/functions/generate-maintain-rationale/index.ts` | Convert bioAge to qualitative |
| `supabase/functions/generate-findings/index.ts` | Convert bioAge to qualitative |

This removes all exposed numerical bio-age values, failure percentages, and "repair economics" language from customer-facing copy while keeping the algorithm's internal calculations intact.

