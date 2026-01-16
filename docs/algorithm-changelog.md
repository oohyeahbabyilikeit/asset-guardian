# Algorithm Version History

This document contains the changelog for the OPTERRA Risk Calculation Engine.

---

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
