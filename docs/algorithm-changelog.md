# Algorithm Version History

This document contains the changelog for the OPTERRA Risk Calculation Engine.

---

## v8.4 (Actuarial Restructure - Gemini Review)

**Critical Bug Fix:**
- **"Valve Trap"**: Moved fitting leak detection from Tier 1 to Tier 3
  - Fitting leaks now only recommend REPAIR after passing Safety & Economic checks
  - Added "Fragility Filter": Tanks >12yr or >50% failProb get REPLACE ("Too Fragile to Service") instead of REPAIR
  - Reason: Applying torque to corroded fittings on a zombie tank can rupture the vessel

**Threshold Adjustments:**
- **Attic Liability**: Tightened from 25% → 15% failProb
  - High-consequence locations require lower risk tolerance (Risk = Probability × Consequence)
- **Sediment Safe Band**: Narrowed from 5-15 lbs to 5-10 lbs
  - Added "Do Not Disturb" MONITOR warning for 10-15 lb range (clog risk)

**Economic Independence:**
- **Removed budgetUrgency Override**: Financial urgency no longer changes the technical verdict
  - Budget now only affects messaging tone and financing options shown
  - A customer's bank balance does not change the laws of physics

**New Verdict:**
- **"Too Fragile to Service"**: Explicit REPLACE recommendation for zombie tanks with repairable component failures

---

## v8.3 (Anode Life Calibration)
- **FIX "Compound Extremes"**: Capped total `anodeDecayRate` at 8.0x to prevent unrealistic compound effects from stacking all penalties.
- **FIX "Galvanic Overreach"**: Reduced direct copper galvanic penalty from 3.0x to 2.5x per NACE corrosion data.
- **FIX "Softener Sledgehammer"**: Softener penalty now scales with softening efficiency (0.7-1.4x) instead of flat 1.4x. Partial softening gets proportionally reduced penalty.
- **FIX "Phantom Protection"**: Added 0.5-year floor on `shieldLife` for non-depleted anodes. New anodes always show at least 6 months of protection.

## v8.2 (Scientific Defensibility)
- **FIX "Arrhenius Violation"**: Replaced `sqrt()` temperature dampening with proper exponential `2^((temp-120)/18)`. 140°F now correctly shows 2.15x corrosion rate (was 1.22x). 110°F shows 0.68x (was 0.89x).
- **FIX "Naked Gap" Conductivity**: Added 2.5x conductivity penalty for soft water in naked phase. Once anode depletes, bare steel corrodes faster in high-conductivity (soft) water than resistive (hard) water.
- **FIX "Sediment Fuel-Type Differentiation"**: Gas/propane heaters get full sediment stress (burst risk). Electric heaters get 20% (element burial, not burst). Hybrid gets 40% (lower operating temps).
- **FIX "Weibull Recalibration"**: Changed from (η=11.5, β=2.2) to (η=13.0, β=3.2) for cliff-edge corrosion fatigue modeling. Young tanks show lower risk; bio age 40+ can now reach 80%+ failure probability.

## v8.1 (Critical Fixes)
- **FIX "Statistical Ceiling"**: Raised `MAX_BIO_AGE` from 25 to 50. Old cap limited `failProb` to ~40%, making the 85% STATISTICAL_CAP unreachable. Now catastrophically stressed tanks correctly show 60-85% failure probability.
- **FIX "Silent Killer"**: Transient pressure penalty now applies INDEPENDENTLY of static PSI. A tank cycling 60→120→60 PSI (closed loop, no expansion tank) now correctly shows ~1.4x pressure stress instead of 1.0.
- **FIX "Suppressible Fatigue"**: Moved `loopPenalty` (thermal expansion) from `chemicalStress` to `mechanicalStress`. Metal fatigue from tank flexing cannot be prevented by an anode rod - it's physics, not electrochemistry.
- **FIX "Doomsday Projection"**: Years remaining calculation now uses phase-aware aging. A 2-year tank with active anode projects using `protectedStress` rate, only switching to `nakedStress` after projected anode depletion.

## v8.0 (Critical Bug Fixes)
- **FIX "Perfect Tank Inversion"**: Protected phase now uses multiplicative formula `mech * (1 + (chem - 1) * 0.1)` instead of additive `mech + (chem * 0.1)`. Fixes bug where protected tank aged FASTER than naked tank under ideal conditions.
- **FIX "Lazarus Effect"**: Added `yearsWithoutAnode` and `yearsWithoutSoftener` inputs to track ACTUAL exposure history. Prevents new anode/softener from retroactively "healing" past damage.
- **FIX "Softener Double Dip"**: Hardness penalty on anode decay now uses `effectiveHardness` (what anode experiences) instead of `hardnessGPG` (street water). Users with softeners no longer get penalized for both treatment AND problem.
- **FIX "Hybrid Suffocation Category Error"**: Removed `hybridSuffocationPenalty` and `compressorPenalty` from `chemicalStress`. These affect operating EFFICIENCY (cost), not TANK CORROSION (leak risk). Added separate `hybridEfficiency` metric for UI display.
- **FIX "Sediment Cliff"**: Replaced discrete flush efficiency jumps (50%→25%→5%) with linear interpolation from 50% at age 0 to 5% at age 8+. Eliminates erratic scoring at boundary ages.

## v7.2
- **TIER MATCHING**: Added quality tier detection (BUILDER/STANDARD/PROFESSIONAL/PREMIUM)
- **LIKE-FOR-LIKE**: Replacement quotes now match original unit quality tier
- **VENTING COSTS**: Added Power Vent (+$800) and Direct Vent (+$600) adders
- **UPGRADE OFFERS**: Financial forecast now includes upgrade vs like-for-like options

## v7.1
- **ANODE FIX**: Unified AGE_ANODE_LIMIT to 8 years (was 6 in algorithm, 8 in repair options)
- **ANODE FIX**: Added hardnessGPG factor to anode decay rate calculation

## v7.0
- **FIX "GRANDMA PARADOX"**: Lowered occupancy floor from 1.0 to 0.4 so single residents get credit for low wear
- **FIX "FRAT HOUSE AGGRESSION"**: Capped usageIntensity at 4.0x and anode usage penalty at 2.0x
- **FIX "SOAP MATH"**: Renamed local usageIntensity to styleMultiplier in HardWaterTax for clarity
- **NEW**: Added plumbingProtection ($10/GPG) line item to HardWaterTax for realistic ROI

## v6.9
- **USAGE CALIBRATION**: peopleCount and usageType now affect ALL calculations

## v6.6
- **PHYSICS FIX**: Implemented "Duty Cycle" logic (0.25 dampener) for Thermal Expansion

## v6.5
- **ARRHENIUS ADJUSTMENT**: Lowered 'HOT' (140°F) penalty from 2.0x to 1.5x

## v6.4
- **PHYSICS FIX**: Quadratic Sediment Stress (Soft Start curve)
- **NEW FEATURE**: Financial Forecasting Engine (Budget & Date Prediction)

## v6.2
- **ARCHITECTURE**: Split recommendation into getRawRecommendation + optimizeEconomicDecision
- **ECONOMIC LAYER**: Added ROI logic for repair vs. replacement decisions

## v6.1
- **PHYSICS ADAPTER**: Added 'getEffectivePressure' to calculate internal tank stress

---

## Tankless Algorithm (v7.x)

### Physics Model
Unlike tank water heaters which are Pressure Vessels (failing via fatigue/bursting),
Tankless units are Flow Engines (failing via fouling/clogging).

- Primary Stressor: Scale Accumulation (Heat Exchanger Insulation)
- Secondary Stressor: Flow Restriction (Inlet Screen/Calcification)
- Mechanical Stress: Ignition Cycles (Usage Intensity)

### Key Physics Shifts
- Sediment → Scale: Track "Heat Exchanger Blockage %" instead of "pounds of sediment"
- Pressure → Flow: Track "Flow Degradation" (Rated GPM vs. Actual GPM)
- Anode → Valves: Maintenance eligibility determined by Isolation Valves

### Notable Fixes
- **v7.10**: Fixed flow rate null check so 0 GPM is processed correctly
- **v7.10**: Changed scale stress divisor from 10 to 30 to prevent 100x multiplier explosion
- **v7.9**: Added "Point of No Return" for never-flushed old units (descale liability)
- **v7.8**: Added gas starvation detection for undersized gas lines
- **v7.7**: Raised LIMIT_SCALE_LOCKOUT from 40 to 60 (3-Year Lockout Fix)
- **v7.6**: Fixed "Tankless Insulator" - only use measured flow loss, don't infer from scale

---

## Softener Algorithm

### Physics Model
Usage-based wear model with three independent "clocks":
1. **Valve Seals** - Mechanical wear from regeneration cycles
2. **Resin Bed** - Chemical degradation (chlorine, iron, heat)
3. **Salt Bridge** - Maintenance-driven

### Resin Decay Rates
- Chlorine baseline: 1%/year
- Chloramine: +50% faster (1.5%/year)
- High iron: +30% penalty
- High temp (>120°F): +20% penalty
