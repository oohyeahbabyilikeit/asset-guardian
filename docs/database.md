# Database Schema

PostgreSQL database managed via Lovable Cloud with Row Level Security (RLS).

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │   user_roles    │
│─────────────────│       │─────────────────│
│ id (PK, FK→auth)│◄──────│ user_id (FK)    │
│ email           │       │ role (enum)     │
│ full_name       │       └─────────────────┘
│ company_name    │
│ license_number  │
│ phone           │
└────────┬────────┘
         │
         │ owner_id
         ▼
┌─────────────────┐       ┌─────────────────┐
│   properties    │       │ contractor_     │
│─────────────────│◄──────│ property_rels   │
│ id (PK)         │       │─────────────────│
│ address_line1   │       │ contractor_id   │
│ city, state, zip│       │ property_id     │
│ property_type   │       │ relationship_   │
│ year_built      │       │   type          │
└────────┬────────┘       └─────────────────┘
         │
         │ property_id
         ▼
┌─────────────────┐       ┌─────────────────┐
│  water_heaters  │       │ water_softeners │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ property_id(FK) │       │ property_id(FK) │
│ manufacturer    │       │ manufacturer    │
│ model_number    │       │ capacity_grains │
│ fuel_type       │       │ control_head    │
│ tank_capacity   │       │ resin_type      │
│ vent_type       │       └─────────────────┘
│ warranty_years  │
│ has_softener    │
│ has_exp_tank    │
│ has_prv         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ assess- │ │ service_    │
│ ments   │ │ events      │
└────┬────┘ └─────────────┘
     │
     ▼
┌─────────────────┐
│     quotes      │
└─────────────────┘
```

---

## Core Tables

### profiles
User profile data (linked to auth.users).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Same as auth.users.id |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| company_name | TEXT | For contractors |
| license_number | TEXT | Contractor license |
| phone | TEXT | Contact number |
| preferred_contractor_id | UUID (FK) | Homeowner's preferred contractor |

**Trigger**: `handle_new_user()` creates profile on signup.

---

### properties
Physical property addresses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| owner_id | UUID (FK→profiles) | Property owner |
| address_line1 | TEXT | Street address |
| city, state, zip | TEXT | Location |
| property_type | TEXT | single_family, multi_unit, commercial |
| year_built | INTEGER | Construction year |
| square_footage | INTEGER | Size |
| is_primary | BOOLEAN | Primary residence |

---

### water_heaters
Water heater asset records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| property_id | UUID (FK) | |
| manufacturer | TEXT | Brand name |
| model_number | TEXT | Model # |
| serial_number | TEXT | Serial # |
| fuel_type | TEXT | GAS, ELECTRIC, PROPANE |
| tank_capacity_gallons | INTEGER | Tank size |
| vent_type | TEXT | ATMOSPHERIC, POWER_VENT, DIRECT_VENT |
| warranty_years | INTEGER | Original warranty |
| calendar_age_years | INTEGER | Age in years |
| quality_tier | TEXT | ECONOMY, STANDARD, PROFESSIONAL |
| has_softener | BOOLEAN | Water softener present |
| has_exp_tank | BOOLEAN | Expansion tank present |
| has_prv | BOOLEAN | PRV present |
| has_circ_pump | BOOLEAN | Circulation pump |
| is_closed_loop | BOOLEAN | Closed loop system |
| is_finished_area | BOOLEAN | In finished space |
| temp_setting | TEXT | LOW, MEDIUM, HIGH, VERY_HIGH |
| location | TEXT | Garage, Basement, etc. |
| photo_urls | JSONB | Array of photo URLs |

---

### water_softeners
Water softener asset records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| property_id | UUID (FK) | |
| manufacturer | TEXT | |
| model_number | TEXT | |
| capacity_grains | INTEGER | Softener capacity |
| control_head | TEXT | TIMER, DEMAND, SMART |
| resin_type | TEXT | STANDARD, FINE_MESH |
| has_carbon_filter | BOOLEAN | |
| visual_height | TEXT | Approx size indicator |

---

### assessments
Water heater health assessments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| water_heater_id | UUID (FK) | |
| assessor_id | UUID (FK→profiles) | Who performed assessment |
| source | ENUM | homeowner_onboarding, contractor_inspection |
| forensic_inputs | JSONB | ForensicInputs object |
| opterra_result | JSONB | OpterraMetrics + Vitals |
| health_score | INTEGER | 0-100 |
| bio_age | INTEGER | Biological age in years |
| fail_probability | DECIMAL | 0-1 |
| risk_level | INTEGER | 1-5 |
| symptoms | JSONB | Array of reported issues |
| photos | JSONB | Array of photo metadata |
| recommendation_title | TEXT | |
| recommendation_action | TEXT | |
| status | TEXT | active, resolved |

---

### service_events
Maintenance and service history.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| water_heater_id | UUID (FK) | |
| event_type | ENUM | inspection, flush, anode_replacement, etc. |
| event_date | TIMESTAMP | When service occurred |
| performed_by | UUID (FK→profiles) | Technician |
| cost_usd | DECIMAL | Service cost |
| health_score_before | INTEGER | Pre-service score |
| health_score_after | INTEGER | Post-service score |
| notes | TEXT | |
| photos | JSONB | |

**Event Types**:
- inspection
- flush
- anode_replacement
- repair
- thermostat_adjustment
- prv_install
- exp_tank_install
- replacement

---

### quotes
Replacement/repair quotes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| water_heater_id | UUID (FK) | |
| assessment_id | UUID (FK) | Related assessment |
| contractor_id | UUID (FK→profiles) | |
| quote_type | TEXT | replacement, repair |
| unit_manufacturer | TEXT | |
| unit_model | TEXT | |
| unit_price_usd | DECIMAL | |
| labor_cost_usd | DECIMAL | |
| materials_cost_usd | DECIMAL | |
| permit_cost_usd | DECIMAL | |
| discount_usd | DECIMAL | |
| total_usd | DECIMAL | |
| estimated_hours | DECIMAL | |
| warranty_terms | TEXT | |
| status | TEXT | draft, sent, accepted, declined |
| valid_until | TIMESTAMP | |

---

### unit_prices
Cached water heater pricing data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| model_number | TEXT | |
| manufacturer | TEXT | |
| fuel_type | TEXT | |
| capacity_gallons | INTEGER | |
| vent_type | TEXT | |
| warranty_years | INTEGER | |
| quality_tier | TEXT | |
| retail_price_usd | DECIMAL | |
| wholesale_price_usd | DECIMAL | |
| confidence_score | INTEGER | 0-100 |
| price_source | TEXT | AI_ESTIMATE, MANUAL, API |
| lookup_date | TIMESTAMP | |

---

### contractor_install_presets
Pre-configured installation pricing for contractors.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| contractor_id | UUID (FK→profiles) | |
| vent_type | TEXT | |
| complexity | TEXT | SIMPLE, STANDARD, COMPLEX |
| labor_cost_usd | DECIMAL | |
| materials_cost_usd | DECIMAL | |
| permit_cost_usd | DECIMAL | |
| estimated_hours | DECIMAL | |
| description | TEXT | |

---

## Supporting Tables

### contractor_property_relationships
Links contractors to properties they've serviced.

| Column | Type | Description |
|--------|------|-------------|
| contractor_id | UUID (FK) | |
| property_id | UUID (FK) | |
| relationship_type | TEXT | quote, service, preferred |
| expires_at | TIMESTAMP | Auto-expires after 1 year |

**Triggers**:
- `create_relationship_on_quote()` - Creates relationship when quote is created
- `create_relationship_on_service()` - Creates relationship on service event

---

### price_lookup_cache
Caches AI pricing lookups to reduce API calls.

| Column | Type | Description |
|--------|------|-------------|
| lookup_key | TEXT | Hash of lookup params |
| lookup_type | TEXT | MODEL or SPECS |
| result_json | JSONB | Cached response |
| expires_at | TIMESTAMP | Cache expiry (7 days) |

---

### user_roles
Role-based access control.

| Column | Type |
|--------|------|
| user_id | UUID (FK) |
| role | ENUM: admin, contractor, homeowner |

**Helper Function**:
```sql
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
```

---

## Enums

```sql
CREATE TYPE app_role AS ENUM ('admin', 'contractor', 'homeowner');

CREATE TYPE assessment_source AS ENUM (
  'homeowner_onboarding',
  'homeowner_update', 
  'contractor_inspection'
);

CREATE TYPE service_event_type AS ENUM (
  'inspection',
  'flush',
  'anode_replacement',
  'repair',
  'thermostat_adjustment',
  'prv_install',
  'exp_tank_install',
  'replacement'
);
```

---

## Row Level Security

All tables have RLS enabled. Key policies:

### Homeowner Access
- Can view/edit own properties and assets
- Can view assessments and quotes for their properties

### Contractor Access  
- Can view properties they have a relationship with
- Can create assessments and quotes
- Can log service events

### Helper Functions
```sql
-- Check if contractor has valid relationship
contractor_has_relationship(_contractor_id, _property_id) RETURNS BOOLEAN

-- Check user role
has_role(_user_id, _role) RETURNS BOOLEAN
```
