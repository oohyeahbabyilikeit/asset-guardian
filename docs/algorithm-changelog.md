# Algorithm Version History

This document contains the changelog for the OPTERRA Risk Calculation Engine.

---

## v9.1.7 (Zombie Expansion Tank Bypass Fix)

**FIX "Zombie Expansion Tank Bypass":**
- Added `housePsi` proxy defaulting to 60 PSI when not provided — without this, closed-loop systems with no expansion tank silently skipped ALL pressure penalties (`isTransient` was always false when `housePsi` was undefined)
- Waterlogged expansion tanks (dead bladder) previously bypassed both mechanical stress calculations
- A homeowner with a dead expansion tank now correctly receives pressure cycling and thermal expansion penalties
- Aligns main stress calculations with `getPressureProfile()` which already used the functional check

---

## v9.1.6 (Sediment-Aware Naked Floor)

**FIX "Sediment Blindspot":**
- Naked aging floor now scales with sediment load: `floor = 2.0 + sedimentLbs × 0.15`
- 0 lbs sediment → 2.0x floor (unchanged), 5.5 lbs → 2.825x, 10 lbs → 3.5x
- Physics: more sediment insulates the tank bottom, creating hot spots that accelerate bare-steel corrosion
- Optimized path gets half the sediment penalty (maintenance reduces sediment impact)
- Prevents unrealistic projections for neglected naked tanks with heavy sediment

---

## v9.1.5 (Compounding Stress Projection)

**FIX "Flat Projection":**
- Replaced flat `remainingCapacity / nakedStress` division with iterative year-by-year simulation
- Each projected year of naked exposure compounds degradation at 3% annually
- Models real-world physics: sediment accumulation, wall thinning, and scale buildup accelerate over time
- Applied to both naked-only tanks and the post-anode-depletion phase of protected tanks
- Protected phase remains linear (anode prevents compounding corrosion)
- Hard cap of 15 years remains as safety net

**Impact:**
| Scenario | Before (flat) | After (3% compound) |
|----------|---------------|---------------------|
| 5yr naked, stress 2.0x | 5.6 yr | ~5.1 yr |
| 3yr naked, stress 2.0x | 6.6 yr | ~5.9 yr |
| 10yr naked, stress 3.5x | 1.8 yr | ~1.7 yr |

---

## v9.1.2 (Gemini Physics Audit - 4 Corrections)

**Validated by Gemini AI Physics Review (2026-02-02)**

**FIX 1 "Unreachable Verdict":**
- Lowered `LIMIT_FAILPROB_FRAGILE` threshold from 60% to 45%
- With Weibull(η=13, β=3.2), hazard rate at Age 15 was only ~30%
- The old threshold was unreachable before age-out (Age 21 to hit 60%)
- Now properly triggers "End of Service Life" at practical ages

**FIX 2 "Dynamic ETA":**
- Weibull ETA now scales with warranty tier
- 6-year tank: η=13.0 (baseline)
- 9-year tank: η=14.5 (+1.5)
- 12-year tank: η=16.0 (+3.0)
- 15-year tank: η=17.5 (+4.5)
- Reflects physical reality: premium tanks have better glass and dual anodes

**FIX 3 "Soft Water Naked Penalty":**
- Increased conductivity multiplier from 2.5x to 4.0x
- Research shows soft water corrodes bare steel at 4-5x the rate of hard water
- Hard water forms passivating calcium carbonate scale
- Soft water accelerates ion transfer per Nernst's Principle

**FIX 4 "Pressure Duty Cycle":**
- Increased closed-loop dampener from 0.25 to 0.50
- Reflects cumulative fatigue damage from daily thermal expansion cycles
- Open-loop systems retain 0.25 dampener (less frequent cycling)

---

## v9.1.1 (Closed-Loop Detection Alignment)

**Problem Solved:**
The v9.1 Young Tank Override gate used a narrower definition of "closed loop" than the UI's infrastructure detector. Tanks with PRVs or recirc pumps (which CREATE closed-loop conditions) were slipping through to "End of Service Life" replacement.

**Root Cause:**
The algorithm only checked `data.isClosedLoop`, but PRVs and recirc pumps create closed-loop conditions even when `isClosedLoop` is explicitly `false`. The UI correctly identified these as code violations, but the algorithm didn't protect them.

**Solution:**
1. **Unified Closed-Loop Detection**: Updated `needsInfrastructure` check to use `isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump`
2. **Safety Net Gate**: Added catch-all before Tier 2A - young tanks (≤6 years) with high failProb but no identified cause now get `MAINTAIN` ("Elevated Wear Detected") instead of `REPLACE`

**Expected Behavior:**
| Scenario | Before v9.1.1 | After v9.1.1 |
|----------|---------------|--------------|
| 4yr tank, PRV creates closed loop, no exp tank | REPLACE (End of Service Life) | REPAIR (Infrastructure Required) |
| 4yr tank, recirc pump, no exp tank | REPLACE | REPAIR (Infrastructure Required) |
| 4yr tank, high failProb, no identified cause | REPLACE | MAINTAIN (needs inspection) |
| 8yr tank, same issues | REPLACE (correctly) | REPLACE (correctly) |

---

## v9.1 (Young Tank Override Gate)

**Problem Solved:**
The v9.0 anode physics corrections made the algorithm too aggressive on young tanks with softeners. A 3-year-old tank with a softener from Day 1 would show a depleted anode (3 years × 3.0x = 9 anode-years consumed vs 4 year capacity), pushing failProb above 60% and triggering "End of Service Life" replacement.

**Root Cause:**
The v9.0 changes correctly model anode physics, but the failProb threshold (60%) in Tier 2A didn't account for the new aggressive calculation. Young tanks with softeners legitimately have depleted anodes, but they're still **young enough to save** with an anode replacement.

**Solution: "Young Tank Override" Priority Gate (Tier 1.9)**
```
If tank is ≤ 6 years old AND has no physical breach (no rust/leak):
  → Cannot trigger "End of Service Life"
  → Redirect to REPAIR with "Anode Service Required" or "Infrastructure Upgrade Required"
```

**Technical Necessity Principle:**
A 3-year-old tank with a depleted anode is NOT at end of life - it needs an anode replacement. The steel hasn't failed; only the sacrificial protection has.

**Expected Behavior:**
| Scenario | Before v9.1 | After v9.1 |
|----------|-------------|------------|
| 3yr tank, softener, closed-loop, no exp tank | REPLACE (failProb 65%) | REPAIR (Anode Service) |
| 5yr tank, softener, high pressure, no PRV | REPLACE (failProb 55%) | REPAIR (Infrastructure) |
| 8yr tank, same issues | REPLACE (too old) | REPLACE (correctly) |
| 3yr tank, visual rust | REPLACE (breach) | REPLACE (correctly) |

---

## v9.0 (Anode Shield Life Physics Correction)

**Critical Algorithm Fixes:**
- **FIX "Marketing Math"**: Reduced anode baseline from 6→4 years per rod. Industry standard is inspect at 2-4 years. The "6-year warranty" is designed so the rod dies at Year 4 and the steel tank survives Years 4-6 naked.
- **FIX "Hard Water Penalty"**: REMOVED penalty for hard water on anode life. Calcium carbonate scale (passivation) actually PROTECTS the anode by coating the rod and tank wall, slowing electrochemical reactions.
- **FIX "Time Machine Bug"**: History-aware burn rate using `yearsWithoutSoftener`. Old logic applied current decay rate to entire past life, generating false alarms when new softener was installed on old tank.
- **CHANGE Decay Math**: Switched from additive penalties to multiplicative burn rate. Softener (3.0×) + Galvanic (2.5×) + Recirc (1.25×) now compound correctly.

**Physics Model Changes:**
| Factor | v8.x (Wrong) | v9.0 (Correct) |
|--------|--------------|----------------|
| Base Single Rod | 6.0 years | **4.0 years** |
| Base Dual Rods | 12.0 years | **7.5 years** (parallel surface area) |
| Hard Water | +0.02× per GPG penalty | **No penalty** (passivation protects) |
| Softener | +1.4 additive | **3.0× multiplier** |
| Recirc Pump | +0.5 additive | **1.25× multiplier** |
| Math | Additive | **Multiplicative** |
| History | Current rate × entire age | **Split: (normal years × historical) + (softener years × current)** |

**Validation Scenarios (Before → After):**
| Scenario | v8.x Result | v9.0 Result |
|----------|-------------|-------------|
| 5yr tank, no issues | ~1yr remaining | ~0 (naked - triggers anode warning) |
| 3yr tank + new softener (installed today) | Negative (false alarm) | ~1yr remaining (correct) |
| 4yr tank, dual anode, 20 GPG hard water | ~0 (hard water killed it) | ~3.5yr remaining (correct) |
| 2yr tank + softener since Day 1 | ~2yr remaining | ~0 (3× burn = 6 effective years) |

**Physics References:**
- NACE International SP0169: Cathodic protection standards
- AWWA Research Foundation: Water heater anode rod studies
- Bradford White Technical Bulletin: 2-4 year inspection recommendation

---

## v8.5 (Young Tank Infrastructure Gate)

**New Decision Paths:**
- **"Infrastructure First" Gate**: Young tanks (≤6 years) with high bio-age due to correctable stress (missing expansion tank or PRV) now get REPAIR recommendations instead of REPLACE
  - Condition: Young tank + high bio-age + correctable stress + failProb < 50%
  - Returns "Protect Your Investment" with urgent SERVICE badge
  - Allows homeowners to install code-required infrastructure and run to failure

- **"Managed Decline" Path**: Young tanks with depleted anodes in low-risk locations (garage, basement) can "Run to Failure OK"
  - Condition: Young tank + depleted anode + low-risk location + infrastructure OK
  - Returns PASS with MONITOR badge and estimated years remaining
  - Honest messaging about running to failure with reduced stress

- **"Naked Rule" Exception**: Modified to allow infrastructure repairs on young tanks (≤6 years)
  - Previously: All naked tanks with MAINTAIN → forced REPLACE
  - Now: Young tanks with infrastructure repairs (expansion tank, PRV) allowed through
  - Note added: "Anode protection is depleted. Infrastructure fix will extend remaining life but monitor closely."

**Philosophy:**
- Distinguishes between **correctable stress** (missing infrastructure) and **irreversible damage** (years of naked exposure)
- Creates service opportunities (expansion tank install) instead of "replace or nothing"
- Location-aware: High-risk locations still push toward replacement

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
