

# Hard Water Tax Card - Copy Refinements

## Overview
This plan implements your feedback to make the Hard Water Tax card more "grandma-friendly" by removing accountant-speak and using terminology that resonates with homeowners' daily concerns.

---

## Task 1: Simplify the ROI Math (Green "With a Softener" Box)

### Problem
- "amortized" is jargon homeowners won't understand
- "Pays for itself in ~8 yrs" feels like a long wait

### Solution
Replace payback period with a compelling **10-year total savings** figure that emphasizes the cumulative benefit.

### Changes to `src/components/HardWaterTaxCard.tsx`

**Lines 179-184** - Replace current ROI text:

```text
Current:
  "Softener cost: ~$250/yr amortized"
  "Pays for itself in ~8 yrs"

New:
  "Annual operating cost: ~$250"
  "10-Year Savings: $3,120" (calculated as netAnnualSavings × 10)
```

The 10-year framing is psychologically powerful because:
- It matches appliance lifespan expectations
- Larger numbers feel more tangible than abstract "payback periods"
- Homeowners think in decades when planning home improvements

---

## Task 2: Clarify "Asset Loss" → "Appliances"

### Problem
"Asset Loss" sounds like stock market terminology. Homeowners worry about their dishwasher, washing machine, and coffee maker—not "assets."

### Solution
Rename to **"Appliances"** (short, fits the grid) with a more relatable icon.

### Changes to `src/components/HardWaterTaxCard.tsx`

**Line 1** - Update imports:
- Replace `TrendingDown` with `WashingMachine` (lucide-react has this icon)

**Lines 151-155** - Update the Asset Loss cell:
```text
Current:
  Icon: TrendingDown (red, downward arrow)
  Label: "Asset Loss"

New:
  Icon: WashingMachine (red, recognizable appliance)
  Label: "Appliances"
```

---

## Task 3: Clarify "Fixture Wear" → "Pipes"

### Problem
"Fixture Wear" is vague. Homeowners hate leaky faucets and corroded pipes—but they don't think of them as "fixtures."

### Solution
Rename to **"Pipes"** (short, fits the grid). The Wrench icon can stay—it implies plumbing work needed.

### Changes to `src/components/HardWaterTaxCard.tsx`

**Lines 161-165** - Update the Fixture Wear cell:
```text
Current:
  Label: "Fixture Wear"

New:
  Label: "Pipes"
```

---

## Task 4: Improve "Extra Soap" Credibility (Documentation Only)

### Observation
$225/year for "Extra Soap" is a high number that may trigger skepticism.

### No Code Change Required
This is a training/talking point for technicians. The algorithm's calculation is defensible:
- Soft water lathers 50-70% more effectively
- A family of 4 uses ~$300-400/year in soap products
- Hard water can double usage in severe cases

**Technician Script**: "Soft water lathers better, so you use about half the shampoo and detergent. Think about how quickly you go through those Costco soap packs."

---

## Summary of File Changes

| File | Line(s) | Change |
|------|---------|--------|
| `HardWaterTaxCard.tsx` | 1 | Import `WashingMachine` instead of `TrendingDown` |
| `HardWaterTaxCard.tsx` | 152-154 | Change icon to `WashingMachine`, label to "Appliances" |
| `HardWaterTaxCard.tsx` | 164 | Change label from "Fixture Wear" to "Pipes" |
| `HardWaterTaxCard.tsx` | 179-184 | Replace "amortized" with "Annual operating cost", replace payback with 10-year savings |

---

## Visual Outcome

### Before (Current State)
```text
┌─────────────────────────────────────────────┐
│  With a Softener                   +$312/yr │
├─────────────────────────────────────────────┤
│  Softener cost: ~$250/yr amortized          │
│                         Pays for itself ~8yr│
└─────────────────────────────────────────────┘

│ 🔥 Energy │ 📉 Asset  │ 💧 Extra  │ 🔧 Fixture│
│   Loss    │   Loss    │   Soap    │   Wear   │
```

### After (Proposed)
```text
┌─────────────────────────────────────────────┐
│  With a Softener                   +$312/yr │
├─────────────────────────────────────────────┤
│  Annual operating cost: ~$250               │
│                    10-Year Savings: $3,120  │
└─────────────────────────────────────────────┘

│ 🔥 Energy │ 🧺 Appli- │ 💧 Extra  │ 🔧 Pipes │
│   Loss    │   ances   │   Soap    │          │
```

The changes make the card more scannable, relatable, and persuasive without changing the underlying math.

