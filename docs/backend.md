# Backend Architecture Documentation

> Comprehensive technical reference for the Opterra Water Heater Platform backend systems.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema & Relationships](#database-schema--relationships)
3. [Edge Functions Reference](#edge-functions-reference)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Offline Sync Architecture](#offline-sync-architecture)
6. [Frontend-Backend Integration](#frontend-backend-integration)
7. [Type Mappers Reference](#type-mappers-reference)
8. [Security Model](#security-model)
9. [Environment & Secrets](#environment--secrets)
10. [Common Patterns & Best Practices](#common-patterns--best-practices)

---

## Architecture Overview

### System Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (React/Vite)"]
        UI[React Components]
        Hooks[Custom Hooks]
        IDB[(IndexedDB)]
        RQ[React Query Cache]
    end

    subgraph SupabaseClient["Supabase Client SDK"]
        Auth[Auth Client]
        DB[Database Client]
        FN[Functions Client]
        RT[Realtime Client]
    end

    subgraph LovableCloud["Lovable Cloud (Supabase)"]
        subgraph EdgeFunctions["Edge Functions"]
            AI_Vision[AI Vision Functions]
            AI_Content[AI Content Functions]
            Data_Ops[Data Operations]
        end
        
        subgraph Database["PostgreSQL"]
            Tables[(Tables)]
            RLS[RLS Policies]
            Triggers[Triggers/Functions]
        end
        
        Storage[(File Storage)]
    end

    subgraph External["External Services"]
        LovableAI[Lovable AI Gateway]
    end

    UI --> Hooks
    Hooks --> IDB
    Hooks --> RQ
    Hooks --> SupabaseClient
    
    Auth --> Database
    DB --> Database
    FN --> EdgeFunctions
    RT --> Database
    
    EdgeFunctions --> LovableAI
    EdgeFunctions --> Database
    
    IDB -.->|Sync Queue| Data_Ops
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | UI framework and build tool |
| **Styling** | Tailwind CSS + shadcn/ui | Component library and styling |
| **State** | React Query + useState | Server and local state management |
| **Offline** | IndexedDB (idb) | Offline data persistence |
| **Backend** | Supabase (Lovable Cloud) | Database, auth, edge functions |
| **AI** | Lovable AI Gateway | Vision and content generation |
| **Database** | PostgreSQL 15 | Relational data storage |

---

## Database Schema & Relationships

### Entity Relationship Diagram

```mermaid
erDiagram
    %% Identity Layer
    profiles ||--o{ user_roles : "has"
    profiles ||--o{ properties : "owns"
    profiles ||--o{ contractor_property_relationships : "contractor"
    profiles ||--o{ leads : "assigned_to"
    profiles ||--o{ quotes : "created_by"
    profiles ||--o{ service_events : "performed_by"
    
    %% Property Layer
    properties ||--o{ water_heaters : "contains"
    properties ||--o{ water_softeners : "contains"
    properties ||--o{ contractor_property_relationships : "grants_access"
    properties ||--o{ leads : "references"
    
    %% Asset Layer
    water_heaters ||--o{ assessments : "evaluated_by"
    water_heaters ||--o{ service_events : "serviced_by"
    water_heaters ||--o{ quotes : "quoted_for"
    water_heaters ||--o{ leads : "references"
    
    %% Assessment Layer
    assessments ||--o{ quotes : "generates"
    
    %% Maintenance Layer
    maintenance_notification_requests }o--|| water_heaters : "for"
    maintenance_notification_requests }o--|| properties : "at"
    
    %% Contractor Config
    contractor_install_presets }o--|| profiles : "belongs_to"
    contractor_service_prices }o--|| profiles : "belongs_to"
    
    %% Lookup Tables (no relationships)
    unit_prices
    price_lookup_cache
    water_districts

    %% Table Definitions
    profiles {
        uuid id PK
        string email
        string full_name
        string phone
        string company_name
        string license_number
        uuid preferred_contractor_id FK
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        enum role "admin|contractor|homeowner"
    }
    
    properties {
        uuid id PK
        uuid owner_id FK
        string address_line1
        string city
        string state
        string zip_code
        string property_type
        boolean is_primary
    }
    
    water_heaters {
        uuid id PK
        uuid property_id FK
        uuid created_by FK
        string fuel_type
        number tank_capacity_gallons
        string vent_type
        string manufacturer
        string model_number
        string serial_number
        number calendar_age_years
        string location
        number house_psi
        boolean has_prv
        boolean has_exp_tank
        boolean has_softener
        string quality_tier
    }
    
    water_softeners {
        uuid id PK
        uuid property_id FK
        uuid created_by FK
        string manufacturer
        string model_number
        number capacity_grains
        string salt_status
        string visual_condition
    }
    
    assessments {
        uuid id PK
        uuid water_heater_id FK
        uuid assessor_id FK
        enum source
        json forensic_inputs
        json opterra_result
        number health_score
        number bio_age
        number fail_probability
        string recommendation_action
    }
    
    service_events {
        uuid id PK
        uuid water_heater_id FK
        uuid performed_by FK
        enum event_type
        date event_date
        number cost_usd
        number health_score_before
        number health_score_after
    }
    
    quotes {
        uuid id PK
        uuid water_heater_id FK
        uuid contractor_id FK
        uuid assessment_id FK
        string quote_type
        number unit_price_usd
        number labor_cost_usd
        number total_usd
        string status
    }
    
    leads {
        uuid id PK
        string customer_name
        string customer_phone
        string customer_email
        string capture_source
        json capture_context
        uuid property_id FK
        uuid water_heater_id FK
        uuid contractor_id FK
        boolean opt_in_alerts
    }
    
    maintenance_notification_requests {
        uuid id PK
        string customer_name
        string customer_phone
        string maintenance_type
        date due_date
        uuid property_id FK
        uuid water_heater_id FK
    }
    
    contractor_property_relationships {
        uuid id PK
        uuid contractor_id FK
        uuid property_id FK
        string relationship_type
        timestamp expires_at
    }
    
    contractor_install_presets {
        uuid id PK
        uuid contractor_id FK
        string vent_type
        string complexity
        number labor_cost_usd
        number materials_cost_usd
        number permit_cost_usd
    }
    
    contractor_service_prices {
        uuid id PK
        uuid contractor_id FK
        string service_type
        string unit_type
        number price_usd
        number estimated_minutes
    }
    
    unit_prices {
        uuid id PK
        string fuel_type
        number capacity_gallons
        string vent_type
        number warranty_years
        string quality_tier
        number retail_price_usd
        number wholesale_price_usd
    }
    
    water_districts {
        string zip_code PK
        string utility_name
        number hardness_gpg
        string sanitizer_type
        number confidence
    }
```

### Relationship Chains

#### 1. Identity Chain
```
auth.users (Supabase managed)
    ↓ (trigger: create_profile_on_signup)
profiles
    ↓
user_roles (role assignment)
```

**Key Points:**
- `profiles.id` matches `auth.users.id` (1:1 relationship)
- No direct FK to `auth.users` - uses trigger-based sync
- `user_roles` enables multi-role assignment (admin, contractor, homeowner)

#### 2. Property Hierarchy Chain
```
profiles (owner)
    ↓ owner_id
properties
    ├─→ water_heaters (property_id)
    └─→ water_softeners (property_id)
```

**Key Points:**
- One owner can have multiple properties
- Each property can have multiple water heaters and softeners
- `created_by` tracks which user added the asset

#### 3. Assessment & Service Chain
```
water_heaters
    ├─→ assessments (evaluations over time)
    │       ↓
    │   quotes (generated from assessments)
    │
    └─→ service_events (maintenance history)
```

**Key Points:**
- Assessments store `forensic_inputs` and `opterra_result` as JSON
- Quotes link to both `water_heater_id` and optionally `assessment_id`
- Service events track all maintenance with before/after health scores

#### 4. Lead Generation Chain
```
Various UI Touch Points
    ↓ submitLead()
leads table
    │
    ├── capture_source: 'findings_summary' | 'replacement_quote' | 'maintenance_notify' | etc.
    ├── property_id (optional)
    ├── water_heater_id (optional)
    └── contractor_id (assigned contractor)
```

**Key Points:**
- Leads are captured WITHOUT authentication requirement
- `capture_source` enum tracks where lead originated
- `capture_context` JSON stores inspection data, scores, etc.

#### 5. Contractor Access Chain
```
contractor (profiles with contractor role)
    ↓
contractor_property_relationships
    ↓ (grants access via RLS)
properties → water_heaters → assessments
```

**Key Points:**
- Relationships created automatically when:
  - Contractor submits inspection (`sync-inspection`)
  - Contractor creates quote
  - Contractor performs service
- Default expiration: 1 year from creation
- `contractor_has_relationship()` function checks access

### Foreign Key Reference Table

| Child Table | FK Column | Parent Table | Cascade? |
|-------------|-----------|--------------|----------|
| `profiles` | `preferred_contractor_id` | `profiles` | No |
| `user_roles` | `user_id` | (auth.users) | No |
| `properties` | `owner_id` | `profiles` | No |
| `water_heaters` | `property_id` | `properties` | No |
| `water_heaters` | `created_by` | `profiles` | No |
| `water_softeners` | `property_id` | `properties` | No |
| `water_softeners` | `created_by` | `profiles` | No |
| `assessments` | `water_heater_id` | `water_heaters` | No |
| `assessments` | `assessor_id` | `profiles` | No |
| `service_events` | `water_heater_id` | `water_heaters` | No |
| `service_events` | `performed_by` | `profiles` | No |
| `quotes` | `water_heater_id` | `water_heaters` | No |
| `quotes` | `contractor_id` | `profiles` | No |
| `quotes` | `assessment_id` | `assessments` | No |
| `leads` | `property_id` | `properties` | No |
| `leads` | `water_heater_id` | `water_heaters` | No |
| `leads` | `contractor_id` | `profiles` | No |
| `contractor_property_relationships` | `property_id` | `properties` | No |

### Table Categories

| Category | Tables | Purpose |
|----------|--------|---------|
| **Identity** | `profiles`, `user_roles` | User accounts and permissions |
| **Property** | `properties` | Physical locations |
| **Assets** | `water_heaters`, `water_softeners` | Equipment inventory |
| **Assessments** | `assessments` | Condition evaluations |
| **Service History** | `service_events` | Maintenance records |
| **Commercial** | `quotes`, `leads`, `maintenance_notification_requests` | Business operations |
| **Contractor Config** | `contractor_install_presets`, `contractor_service_prices` | Pricing/labor config |
| **Lookup/Cache** | `unit_prices`, `price_lookup_cache`, `water_districts` | Reference data |
| **Access Control** | `contractor_property_relationships` | Permission grants |

---

## Edge Functions Reference

### Overview Table

| Function | Category | AI Model | Caching | Auth Required |
|----------|----------|----------|---------|---------------|
| `scan-data-plate` | Vision | gemini-2.5-flash | No | No |
| `analyze-unit-condition` | Vision | gemini-2.5-flash | No | No |
| `analyze-filter-condition` | Vision | gemini-2.5-flash | No | No |
| `analyze-installation-context` | Vision | gemini-2.5-flash | No | No |
| `read-error-codes` | Vision | gemini-2.5-flash | No | No |
| `analyze-water-quality` | Content | gemini-2.5-flash | 365 days | No |
| `generate-findings` | Content | gemini-2.5-flash | No | No |
| `generate-replacement-rationale` | Content | gemini-2.5-flash | No | No |
| `generate-maintain-rationale` | Content | gemini-2.5-flash | No | No |
| `generate-educational-content` | Content | gemini-2.5-flash | No | No |
| `chat-water-heater` | Content | gemini-2.5-flash | No | No |
| `sync-inspection` | Data Ops | None | No | Yes |
| `install-presets` | Data Ops | None | No | Yes |
| `lookup-price` | Data Ops | gemini-2.5-flash | 30 days | No |
| `seed-prices` | Data Ops | None | No | Admin |

### AI Vision Functions

#### `scan-data-plate`

**Purpose:** OCR extraction from water heater data plate labels.

**Request:**
```typescript
interface ScanDataPlateRequest {
  imageBase64: string;  // Base64 encoded image (JPEG/PNG)
}
```

**Response:**
```typescript
interface ScanDataPlateResponse {
  success: boolean;
  data?: {
    manufacturer: string;
    modelNumber: string;
    serialNumber: string;
    fuelType: 'GAS' | 'ELECTRIC' | 'PROPANE' | 'HEAT_PUMP';
    tankCapacity: number;  // gallons
    warrantyYears: number;
    ventType: 'ATMOSPHERIC' | 'POWER_VENT' | 'DIRECT_VENT' | 'CONCENTRIC';
    btuInput?: number;
    voltageRating?: string;
    manufactureDate?: string;
    certifications?: string[];
  };
  rawText?: string;
  confidence: number;  // 0-100
  error?: string;
}
```

**AI Prompt Strategy:**
- Structured JSON extraction
- Brand-specific decoding rules
- Serial number → manufacture date parsing
- BTU/wattage validation

---

#### `analyze-unit-condition`

**Purpose:** Visual assessment of water heater physical condition.

**Request:**
```typescript
interface AnalyzeConditionRequest {
  imageBase64: string;
  unitType?: 'tank' | 'tankless';
}
```

**Response:**
```typescript
interface AnalyzeConditionResponse {
  success: boolean;
  condition?: {
    overallScore: number;  // 1-10
    rustLevel: 'none' | 'surface' | 'moderate' | 'severe';
    leakIndicators: string[];
    sedimentSigns: boolean;
    ventingConcerns: string[];
    connectionCondition: 'good' | 'fair' | 'poor';
    recommendations: string[];
  };
  confidence: number;
  error?: string;
}
```

---

#### `analyze-filter-condition`

**Purpose:** Assess cleanliness of tankless inlet filters.

**Request:**
```typescript
interface AnalyzeFilterRequest {
  imageBase64: string;
}
```

**Response:**
```typescript
interface AnalyzeFilterResponse {
  success: boolean;
  filterStatus?: 'CLEAN' | 'MODERATE' | 'DIRTY' | 'CLOGGED';
  debrisType?: string[];
  replacementUrgency: 'none' | 'soon' | 'immediate';
  confidence: number;
  error?: string;
}
```

---

#### `analyze-installation-context`

**Purpose:** Detect infrastructure issues from installation photos.

**Request:**
```typescript
interface AnalyzeInstallationRequest {
  imageBase64: string;
  currentInputs?: Partial<ForensicInputs>;
}
```

**Response:**
```typescript
interface AnalyzeInstallationResponse {
  success: boolean;
  detectedIssues?: {
    missingPrv: boolean;
    missingExpTank: boolean;
    improperVenting: boolean;
    inadequateDrainPan: boolean;
    dielectricCorrosion: boolean;
    flexConnectorAge: boolean;
  };
  recommendations: string[];
  confidence: number;
  error?: string;
}
```

---

#### `read-error-codes`

**Purpose:** Read and interpret tankless error code displays.

**Request:**
```typescript
interface ReadErrorCodesRequest {
  imageBase64: string;
  manufacturer?: string;
}
```

**Response:**
```typescript
interface ReadErrorCodesResponse {
  success: boolean;
  codes?: Array<{
    code: string;
    meaning: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    action: string;
  }>;
  displayReading: string;
  confidence: number;
  error?: string;
}
```

---

### AI Content Functions

#### `analyze-water-quality`

**Purpose:** Look up water hardness and treatment recommendations by ZIP code.

**Request:**
```typescript
interface WaterQualityRequest {
  zipCode: string;
}
```

**Response:**
```typescript
interface WaterQualityResponse {
  success: boolean;
  zipCode: string;
  utilityName?: string;
  hardnessGPG: number;
  hardnessCategory: 'soft' | 'moderate' | 'hard' | 'very_hard';
  sanitizerType: 'chlorine' | 'chloramine' | 'none';
  recommendation: string;
  confidence: number;
  cached: boolean;
  error?: string;
}
```

**Caching:** Results stored in `water_districts` table for 365 days.

---

#### `generate-findings`

**Purpose:** Create personalized finding cards based on inspection data.

**Request:**
```typescript
interface GenerateFindingsRequest {
  inputs: ForensicInputs;
  opterraResult: OpterraResult;
  findingTypes: string[];  // e.g., ['age', 'pressure', 'sediment']
}
```

**Response:**
```typescript
interface GenerateFindingsResponse {
  success: boolean;
  findings: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    icon: string;
    actionable: boolean;
  }>;
  error?: string;
}
```

---

#### `generate-replacement-rationale`

**Purpose:** Explain why replacement is recommended.

**Request:**
```typescript
interface ReplacementRationaleRequest {
  inputs: ForensicInputs;
  opterraResult: OpterraResult;
  isSafetyReplacement: boolean;
}
```

**Response:**
```typescript
interface ReplacementRationaleResponse {
  success: boolean;
  headline: string;
  bullets: string[];
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'immediate';
  error?: string;
}
```

---

#### `generate-maintain-rationale`

**Purpose:** Explain why maintenance is the recommended path.

**Request:**
```typescript
interface MaintainRationaleRequest {
  inputs: ForensicInputs;
  opterraResult: OpterraResult;
  maintenanceTasks: string[];
}
```

**Response:**
```typescript
interface MaintainRationaleResponse {
  success: boolean;
  headline: string;
  benefits: string[];
  lifeExtension: string;
  costSavings: string;
  error?: string;
}
```

---

#### `generate-educational-content`

**Purpose:** Generate topic-specific educational content.

**Request:**
```typescript
interface EducationalContentRequest {
  topic: string;  // e.g., 'anode_rod', 'prv', 'expansion_tank'
  context?: Partial<ForensicInputs>;
}
```

**Response:**
```typescript
interface EducationalContentResponse {
  success: boolean;
  title: string;
  content: string;  // Markdown formatted
  keyPoints: string[];
  relatedTopics: string[];
  error?: string;
}
```

---

#### `chat-water-heater`

**Purpose:** Conversational AI assistant for water heater questions.

**Request:**
```typescript
interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: {
    inputs?: Partial<ForensicInputs>;
    opterraResult?: Partial<OpterraResult>;
  };
}
```

**Response:**
```typescript
interface ChatResponse {
  success: boolean;
  reply: string;
  suggestedActions?: string[];
  error?: string;
}
```

---

### Data Operations Functions

#### `sync-inspection`

**Purpose:** Full inspection sync from technician flow to database.

**Request:**
```typescript
interface SyncInspectionRequest {
  inspection: TechnicianInspectionData;
  contractorId: string;
}
```

**Response:**
```typescript
interface SyncInspectionResponse {
  success: boolean;
  propertyId?: string;
  waterHeaterId?: string;
  softenerId?: string;
  assessmentId?: string;
  relationshipId?: string;
  error?: string;
}
```

**Database Operations:**
1. Upsert `properties` (by address)
2. Upsert `water_heaters` (by property + serial/model)
3. Upsert `water_softeners` (if present)
4. Insert `assessments` (new record each sync)
5. Upsert `contractor_property_relationships` (1 year expiration)

---

#### `install-presets`

**Purpose:** CRUD operations for contractor installation presets.

**Request:**
```typescript
interface InstallPresetsRequest {
  action: 'list' | 'get' | 'create' | 'update' | 'delete';
  contractorId: string;
  presetId?: string;
  data?: Partial<ContractorInstallPreset>;
}
```

**Response:**
```typescript
interface InstallPresetsResponse {
  success: boolean;
  presets?: ContractorInstallPreset[];
  preset?: ContractorInstallPreset;
  error?: string;
}
```

---

#### `lookup-price`

**Purpose:** AI-assisted price lookup with caching.

**Request:**
```typescript
interface LookupPriceRequest {
  fuelType: string;
  tankCapacity: number;
  ventType: string;
  warrantyYears: number;
  qualityTier?: string;
}
```

**Response:**
```typescript
interface LookupPriceResponse {
  success: boolean;
  price?: {
    retailPrice: number;
    wholesalePrice?: number;
    confidence: number;
    source: 'cache' | 'database' | 'ai_lookup';
  };
  error?: string;
}
```

**Caching:** Results stored in `price_lookup_cache` for 30 days.

---

#### `seed-prices`

**Purpose:** Seed unit_prices table with baseline data.

**Request:**
```typescript
interface SeedPricesRequest {
  force?: boolean;  // Override existing data
}
```

**Response:**
```typescript
interface SeedPricesResponse {
  success: boolean;
  insertedCount: number;
  message: string;
  error?: string;
}
```

---

## Data Flow Diagrams

### Technician Inspection Flow

```mermaid
sequenceDiagram
    participant Tech as Technician UI
    participant Hook as useOfflineSync
    participant IDB as IndexedDB
    participant Net as Network Check
    participant EF as sync-inspection
    participant DB as PostgreSQL

    Tech->>Tech: Complete TechnicianFlow steps
    Tech->>Hook: saveInspection(data)
    Hook->>IDB: Store in 'inspections' table
    Hook->>Net: Check navigator.onLine
    
    alt Online
        Hook->>EF: POST /sync-inspection
        EF->>DB: Upsert properties
        EF->>DB: Upsert water_heaters
        EF->>DB: Upsert water_softeners
        EF->>DB: Insert assessments
        EF->>DB: Upsert contractor_relationships
        EF-->>Hook: { success, ids }
        Hook->>IDB: Mark synced
    else Offline
        Hook->>IDB: Add to syncQueue
        Note over IDB: Retry on reconnect
    end
```

### Lead Capture Flow

```mermaid
sequenceDiagram
    participant UI as Contact Form
    participant LS as leadService.ts
    participant SC as Supabase Client
    participant DB as leads table

    UI->>UI: User fills form
    UI->>LS: submitLead(data)
    LS->>LS: Validate phone format
    LS->>SC: supabase.from('leads').insert()
    SC->>DB: INSERT with capture_source, context
    DB-->>SC: { id }
    SC-->>LS: { success, leadId }
    LS-->>UI: Show success state
    UI->>UI: markLeadCaptured(key)
```

### AI Vision Analysis Flow

```mermaid
sequenceDiagram
    participant Cam as Camera Hook
    participant Comp as React Component
    participant EF as Edge Function
    participant AI as Lovable AI Gateway
    participant State as Component State

    Comp->>Cam: Capture photo
    Cam-->>Comp: base64 image
    Comp->>EF: invoke('scan-data-plate', { imageBase64 })
    EF->>AI: POST /v1/chat/completions
    Note over AI: Vision model processes image
    AI-->>EF: JSON response
    EF->>EF: Parse and validate
    EF-->>Comp: Structured data
    Comp->>State: Update form fields
```

### Opterra Algorithm Flow

```mermaid
flowchart TD
    subgraph Inputs
        FI[ForensicInputs]
        TI[TechnicianInspectionData]
    end

    subgraph Mapping
        MAP[mapTechnicianToForensicInputs]
    end

    subgraph Algorithm["Opterra Algorithm (Frontend)"]
        TANK[calculateOpterraRisk]
        TLESS[calculateTanklessRisk]
        
        subgraph Metrics
            BIO[Biological Age]
            FAIL[Failure Probability]
            HEALTH[Health Score]
            RISK[Risk Level]
        end
    end

    subgraph Output
        REC[Recommendation]
        MAIN[Maintenance Tasks]
        PRICE[Tiered Pricing]
    end

    TI --> MAP
    MAP --> FI
    FI --> TANK
    FI --> TLESS
    
    TANK --> Metrics
    TLESS --> Metrics
    
    Metrics --> REC
    REC --> MAIN
    REC --> PRICE
```

---

## Offline Sync Architecture

### IndexedDB Schema

```typescript
// src/lib/offlineDb.ts

interface OfflineDB {
  inspections: {
    key: string;  // UUID
    value: {
      id: string;
      data: TechnicianInspectionData;
      createdAt: Date;
      syncedAt?: Date;
      syncStatus: 'pending' | 'synced' | 'failed';
      retryCount: number;
    };
    indexes: {
      'by-status': string;
      'by-created': Date;
    };
  };
  
  photos: {
    key: string;  // UUID
    value: {
      id: string;
      inspectionId: string;
      blob: Blob;
      type: 'data_plate' | 'condition' | 'filter' | 'installation';
      uploadedUrl?: string;
    };
    indexes: {
      'by-inspection': string;
    };
  };
  
  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      table: string;
      payload: unknown;
      priority: number;
      createdAt: Date;
      attempts: number;
    };
    indexes: {
      'by-priority': number;
    };
  };
}
```

### Sync Hook Behavior

```typescript
// src/hooks/useOfflineSync.ts

interface UseOfflineSyncResult {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  
  saveInspection: (data: TechnicianInspectionData) => Promise<string>;
  syncNow: () => Promise<SyncResult>;
  clearPending: () => Promise<void>;
}

// Automatic behaviors:
// 1. Listen for 'online' event → trigger syncNow()
// 2. Retry failed syncs with exponential backoff
// 3. Photo upload before inspection sync
// 4. Transaction rollback on partial failure
```

### Sync Queue Priority

| Priority | Operation Type | Example |
|----------|----------------|---------|
| 1 (High) | Photo uploads | Data plate images |
| 2 | Inspection creates | New assessments |
| 3 | Inspection updates | Edited data |
| 4 (Low) | Lead captures | Contact submissions |

---

## Frontend-Backend Integration

### Calling Edge Functions

```typescript
import { supabase } from '@/integrations/supabase/client';

// Standard invocation
const { data, error } = await supabase.functions.invoke('scan-data-plate', {
  body: { imageBase64: base64String },
});

// With custom headers
const { data, error } = await supabase.functions.invoke('sync-inspection', {
  body: { inspection: techData, contractorId },
  headers: {
    'x-custom-header': 'value',
  },
});

// Error handling
if (error) {
  if (error.message.includes('402')) {
    // AI quota exceeded
  } else if (error.message.includes('429')) {
    // Rate limited
  }
}
```

### Database Queries with RLS

```typescript
import { supabase } from '@/integrations/supabase/client';

// User's properties (RLS auto-filters by owner_id = auth.uid())
const { data: properties } = await supabase
  .from('properties')
  .select(`
    *,
    water_heaters (
      *,
      assessments (
        *
      )
    )
  `);

// Contractor access (RLS checks contractor_has_relationship)
const { data: clientProperties } = await supabase
  .from('properties')
  .select('*')
  .order('created_at', { ascending: false });

// Public table (no RLS)
const { data: prices } = await supabase
  .from('unit_prices')
  .select('*')
  .eq('fuel_type', 'GAS')
  .eq('capacity_gallons', 50);
```

### Realtime Subscriptions

```typescript
import { supabase } from '@/integrations/supabase/client';

// Subscribe to assessment changes
const channel = supabase
  .channel('assessment-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'assessments',
      filter: `water_heater_id=eq.${waterHeaterId}`,
    },
    (payload) => {
      console.log('Assessment changed:', payload);
      refetch(); // React Query refetch
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## Type Mappers Reference

### Location: `src/types/technicianMapper.ts`

#### `mapTechnicianToForensicInputs()`

Converts technician inspection data to algorithm-ready inputs.

```typescript
function mapTechnicianToForensicInputs(
  tech: TechnicianInspectionData,
  homeownerOverrides?: Partial<ForensicInputs>
): ForensicInputs
```

**Key Mappings:**
| Technician Field | ForensicInputs Field | Transform |
|------------------|----------------------|-----------|
| `serialDecoded.age` | `calendarAge` | Direct |
| `housePsi` | `housePsi` | Direct |
| `hasPrv` | `prvInstalled` | Direct |
| `hasExpTank` | `expTankPresent` | Direct |
| `expTankStatus` | `expTankStatus` | Direct |
| `hasDrainPan` | `drainPan` | Boolean |
| `conditionScan.rustLevel` | `visualRust` | Enum to boolean |
| `filterScan.status` | `inletFilterStatus` | Direct |
| `softener.present` | `hasSoftener` | Direct |
| (derived) | `estimatedHardness` | From ZIP lookup |

---

#### `mapTechnicianToAssetDisplay()`

Converts inspection data to UI display format.

```typescript
function mapTechnicianToAssetDisplay(
  tech: TechnicianInspectionData
): AssetDisplayData

interface AssetDisplayData {
  id: string;
  type: string;        // "Gas Water Heater", "Electric Tank", etc.
  brand: string;
  model: string;
  serial: string;
  ageLabel: string;    // "8 years old"
  locationLabel: string;
  installYear: number;
  _specs: {
    capacity?: number;
    flowGpm?: number;
    fuelType: string;
  };
}
```

---

### Location: `src/lib/syncMappers.ts`

#### `mapInspectionToWaterHeater()`

Prepares water heater record for database insert.

```typescript
function mapInspectionToWaterHeater(
  inspection: TechnicianInspectionData,
  propertyId: string,
  createdBy: string
): TablesInsert<'water_heaters'>
```

---

#### `mapInspectionToSoftener()`

Prepares water softener record for database insert.

```typescript
function mapInspectionToSoftener(
  inspection: TechnicianInspectionData,
  propertyId: string,
  createdBy: string
): TablesInsert<'water_softeners'> | null
```

---

#### `mapInspectionToAssessment()`

Prepares assessment record for database insert.

```typescript
function mapInspectionToAssessment(
  inspection: TechnicianInspectionData,
  waterHeaterId: string,
  assessorId: string,
  opterraResult: OpterraResult
): TablesInsert<'assessments'>
```

---

## Security Model

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Own row | Trigger | Own row | — |
| `properties` | Owner OR Contractor | Owner | Owner | Owner |
| `water_heaters` | Via property | Via property | Via property | Via property |
| `water_softeners` | Via property | Via property | Via property | Via property |
| `assessments` | Via property | Assessor | — | — |
| `service_events` | Via property | Performer | — | — |
| `quotes` | Via property | Contractor | Contractor | — |
| `leads` | Assigned contractor | Anon allowed | Assigned | — |
| `maintenance_notification_requests` | — | Anon allowed | — | — |
| `unit_prices` | Public | Admin | Admin | Admin |
| `water_districts` | Public | Service role | Service role | — |
| `contractor_*` | Own records | Own records | Own records | Own records |

### Helper Functions

```sql
-- Check if user has a specific role
CREATE FUNCTION has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check contractor access to property
CREATE FUNCTION contractor_has_relationship(_contractor_id uuid, _property_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM contractor_property_relationships
    WHERE contractor_id = _contractor_id
      AND property_id = _property_id
      AND (expires_at IS NULL OR expires_at > now())
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Relationship Triggers

```sql
-- Auto-create relationship when contractor submits inspection
CREATE TRIGGER create_contractor_relationship_on_assessment
AFTER INSERT ON assessments
FOR EACH ROW
WHEN (NEW.source = 'contractor_inspection')
EXECUTE FUNCTION create_contractor_property_relationship();

-- Relationship lasts 1 year by default
-- Function sets expires_at = now() + interval '1 year'
```

---

## Environment & Secrets

### Frontend Environment Variables

```env
# Auto-generated by Lovable Cloud (DO NOT EDIT)
VITE_SUPABASE_URL=https://reqklgwpwysawodawzil.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=reqklgwpwysawodawzil
```

### Edge Function Environment Variables

```env
# Available in Deno.env.get()
SUPABASE_URL           # Project URL
SUPABASE_ANON_KEY      # Public anon key
SUPABASE_SERVICE_ROLE_KEY  # Admin key (full access)
LOVABLE_API_KEY        # AI Gateway access
```

### Secrets Management

Secrets are stored via Lovable Cloud UI and accessed in edge functions:

```typescript
// In edge function
const apiKey = Deno.env.get('MY_EXTERNAL_API_KEY');
if (!apiKey) {
  throw new Error('MY_EXTERNAL_API_KEY not configured');
}
```

---

## Common Patterns & Best Practices

### CORS Handling

All edge functions include standard CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

### AI Response Parsing

AI responses often include markdown code fences:

```typescript
function parseAIResponse<T>(text: string): T {
  // Remove markdown code fences
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return JSON.parse(cleaned.trim());
}
```

### Error Handling

Standard error response format:

```typescript
// Edge function error handling
try {
  const result = await doWork();
  return new Response(JSON.stringify({ success: true, data: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
} catch (error) {
  console.error('Function error:', error);
  
  const status = error.message.includes('quota') ? 402 :
                 error.message.includes('rate') ? 429 : 500;
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: error.message 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

### Caching Strategies

| Data Type | Cache Location | TTL | Invalidation |
|-----------|----------------|-----|--------------|
| Water quality | `water_districts` | 365 days | Manual |
| Price lookups | `price_lookup_cache` | 30 days | Automatic |
| AI responses | None (stateless) | — | — |
| Unit prices | `unit_prices` | Manual refresh | Seed script |

### Logging Best Practices

```typescript
// Structured logging in edge functions
console.log(JSON.stringify({
  function: 'scan-data-plate',
  event: 'request_received',
  imageSize: imageBase64.length,
  timestamp: new Date().toISOString(),
}));

console.log(JSON.stringify({
  function: 'scan-data-plate',
  event: 'ai_response',
  confidence: result.confidence,
  fieldsExtracted: Object.keys(result.data || {}).length,
}));
```

---

## Appendix: Database Enums

```sql
-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'contractor', 'homeowner');

-- Assessment sources
CREATE TYPE assessment_source AS ENUM (
  'homeowner_onboarding',
  'homeowner_update',
  'contractor_inspection'
);

-- Service event types
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

*Last updated: January 2026*
