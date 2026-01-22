

# Database Cleanup Plan: Final Polish

## Goal
Add missing foreign key constraints to `maintenance_notification_requests` table to complete referential integrity.

---

## Migration: Add Missing Foreign Keys

```sql
-- Add foreign key constraints to maintenance_notification_requests
-- These are optional columns (nullable) so we use ON DELETE SET NULL

-- 1. Link to water_heaters
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_water_heater_id_fkey
FOREIGN KEY (water_heater_id) REFERENCES water_heaters(id) ON DELETE SET NULL;

-- 2. Link to properties
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_property_id_fkey
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

-- 3. Link to contractor profiles
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add index for water_heater_id lookups (missing)
CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_water_heater 
ON maintenance_notification_requests(water_heater_id);
```

---

## Files to Update

| File | Changes |
|------|---------|
| `supabase/migrations/new` | Add the 3 foreign keys + 1 index |
| No code changes needed | TypeScript types auto-regenerate |

---

## Current Schema Summary: water_heaters Table

### Core Identity (4 columns)
| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `property_id` | uuid | NO | - | FK -> properties |
| `created_by` | uuid | YES | - | FK -> profiles |
| `created_at` / `updated_at` | timestamptz | NO | now() | Auto-trigger |

### Asset Info (6 columns)
| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `manufacturer` | text | - | - |
| `model_number` | text | - | - |
| `serial_number` | text | - | - |
| `fuel_type` | text | 'GAS' | Valid: GAS, ELECTRIC, HYBRID, TANKLESS_* |
| `tank_capacity_gallons` | integer | 50 | CHECK: 20-120 |
| `warranty_years` | integer | 6 | CHECK: 1-15 |

### Installation Context (6 columns)
| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `vent_type` | text | 'ATMOSPHERIC' | Valid: ATMOSPHERIC, POWER_VENT, DIRECT_VENT |
| `venting_scenario` | text | - | Valid: SHARED_FLUE, ORPHANED_FLUE, DIRECT_VENT |
| `location` | text | 'GARAGE' | Valid: ATTIC, UPPER_FLOOR, etc. |
| `is_finished_area` | boolean | false | - |
| `building_type` | text | 'residential' | Valid: residential, multifamily, commercial |
| `quality_tier` | text | 'STANDARD' | Valid: BUILDER, STANDARD, PROFESSIONAL, PREMIUM |

### Condition Flags (8 columns)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `install_date` | date | - | Used with serial to derive age |
| `calendar_age_years` | numeric | - | CHECK: 0-50 |
| `visual_rust` | boolean | false | Algorithm input |
| `is_leaking` | boolean | false | Algorithm input |
| `leak_source` | text | - | Valid: NONE, TANK_BODY, FITTING_VALVE, DRAIN_PAN |
| `temp_setting` | text | 'NORMAL' | Valid: LOW, NORMAL, HOT |
| `anode_count` | integer | 1 | CHECK: 1 or 2 |
| `nipple_material` | text | - | Valid: STEEL, STAINLESS_BRASS, FACTORY_PROTECTED |

### Equipment Flags (8 columns)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `has_exp_tank` | boolean | false | Expansion tank present |
| `exp_tank_status` | text | - | Valid: FUNCTIONAL, WATERLOGGED, MISSING |
| `has_prv` | boolean | false | Pressure relief valve |
| `has_circ_pump` | boolean | false | Recirculation pump |
| `is_closed_loop` | boolean | false | No thermal expansion relief |
| `has_drain_pan` | boolean | false | Attic safety feature |
| `connection_type` | text | - | Valid: DIELECTRIC, BRASS, DIRECT_COPPER |
| `has_softener` | boolean | false | Water softener present |

### Water Quality (4 columns)
| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `house_psi` | numeric | 60 | CHECK: 20-150 |
| `street_hardness_gpg` | numeric | - | CHECK: >= 0 |
| `measured_hardness_gpg` | numeric | - | CHECK: >= 0 (test strip) |

### Hybrid/Tankless Fields (9 columns - for future use)
| Column | Type | Notes |
|--------|------|-------|
| `air_filter_status` | text | Hybrid only |
| `is_condensate_clear` | boolean | Hybrid only |
| `room_volume_type` | text | Hybrid only |
| `inlet_filter_status` | text | Tankless only |
| `flame_rod_status` | text | Tankless only |
| `error_code_count` | integer | Tankless only |
| `gas_line_size` | text | Tankless only |
| `last_descale_years_ago` | numeric | Tankless only |
| `rated_flow_gpm` | numeric | Tankless only |

### Other
| Column | Type | Notes |
|--------|------|-------|
| `photo_urls` | jsonb | Array of photo URLs |
| `notes` | text | Free-form notes |

---

## Validation Constraints Summary

| Constraint Name | Rule |
|-----------------|------|
| `warranty_years_range` | 1-15 years (or NULL) |
| `calendar_age_range` | 0-50 years (or NULL) |
| `tank_capacity_range` | 20-120 gallons |
| `house_psi_range` | 20-150 PSI (or NULL) |
| `anode_count_valid` | 1 or 2 (or NULL) |
| `hardness_non_negative` | >= 0 (street hardness) |
| `measured_hardness_non_negative` | >= 0 (test strip) |

---

## Foreign Key Relationships

```text
properties (1) -----> (*) water_heaters
                           |
                           +-----> (*) assessments
                           +-----> (*) service_events
                           +-----> (*) quotes
                           +-----> (*) leads
                           +-----> (*) maintenance_notification_requests (FK MISSING - TO ADD)
```

---

## RLS Policies Review

The 7 `USING(true)` warnings are intentional for these use cases:
- **water_districts**: Public lookup table (anyone can check water hardness)
- **unit_prices**: Public retail prices (authenticated users can read)
- **leads INSERT**: Anyone can submit a lead (public form)
- **contractor_install_presets/service_prices**: Authenticated read access
- **price_lookup_cache**: Internal cache table

No security issues - these are by design.

---

## Expected Outcome

After this final migration:
- All water_heater references have proper foreign key constraints
- Orphan prevention on all related tables
- Schema is 100% ready for external app integration
- Clean referential integrity across the entire data model

---

## Integration Readiness Checklist

| Requirement | Status |
|-------------|--------|
| All tank algorithm inputs have DB columns | Done |
| Data validation at insert time | Done |
| Foreign key integrity | After this migration |
| Indexed for query performance | Done |
| TypeScript types match DB | Done |
| Updated_at auto-trigger | Done |
| Tank-only view available | Done |
| RLS policies appropriate | Done |

