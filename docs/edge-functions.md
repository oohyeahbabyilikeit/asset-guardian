# Edge Functions (Backend API)

Serverless functions deployed to Lovable Cloud. All functions use the Lovable AI Gateway for AI capabilities.

---

## Overview

| Function | Purpose | AI Model |
|----------|---------|----------|
| `scan-data-plate` | OCR water heater labels | Gemini 3 Flash |
| `analyze-unit-condition` | Visual condition assessment | Gemini 3 Flash |
| `analyze-filter-condition` | Filter cleanliness check | Gemini 3 Flash |
| `analyze-installation-context` | Detect infrastructure | Gemini 3 Flash |
| `read-error-codes` | Tankless display reading | Gemini 3 Flash |
| `scan-softener-plate` | OCR softener labels | Gemini 3 Flash |
| `lookup-price` | AI-powered pricing | Gemini 2.5 Flash |
| `seed-prices` | Populate price database | Gemini |
| `install-presets` | CRUD contractor presets | N/A (database only) |

---

## scan-data-plate

`supabase/functions/scan-data-plate/index.ts`

Extracts water heater specifications from data plate photos.

**Request**:
```typescript
POST /scan-data-plate
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response**:
```typescript
{
  "brand": "Rheem",
  "modelNumber": "XG50T06EC36U1",
  "serialNumber": "M031234567",
  "fuelType": "GAS",
  "capacityGallons": 50,
  "flowRateGPM": null,
  "warrantyYears": 6,
  "confidence": 92,
  "rawText": "RHEEM MANUFACTURING..."
}
```

**Implementation Notes**:
- Uses tool calling for structured extraction
- Falls back to text parsing if tool call fails
- Handles rate limiting (429) and credit depletion (402)

---

## analyze-unit-condition

`supabase/functions/analyze-unit-condition/index.ts`

Assesses visual condition from unit photos.

**Request**:
```typescript
POST /analyze-unit-condition
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response**:
```typescript
{
  "overallCondition": "FAIR",
  "rustLevel": "MODERATE",
  "leakIndicators": false,
  "sedimentVisible": true,
  "corrosionScore": 45,
  "estimatedConditionAge": 8,
  "recommendations": ["Schedule tank flush", "Inspect anode rod"],
  "confidence": 78
}
```

---

## analyze-filter-condition

`supabase/functions/analyze-filter-condition/index.ts`

Evaluates air/inlet filter condition.

**Request**:
```typescript
POST /analyze-filter-condition
{
  "imageBase64": "...",
  "filterType": "air" | "inlet"
}
```

**Response**:
```typescript
{
  "status": "DIRTY",
  "blockagePercent": 65,
  "description": "Visible dust and debris accumulation",
  "recommendation": "Replace filter within 30 days",
  "urgency": "soon",
  "confidence": 85
}
```

---

## analyze-installation-context

`supabase/functions/analyze-installation-context/index.ts`

Detects infrastructure from installation area photos.

**Response**:
```typescript
{
  "expansionTankPresent": true,
  "prvPresent": false,
  "circulationPumpPresent": false,
  "drainPanPresent": true,
  "adequateClearance": true,
  "ventingType": "POWER_VENT",
  "gasLineVisible": true,
  "issues": ["No PRV detected - recommend installation"],
  "confidence": 82
}
```

---

## read-error-codes

`supabase/functions/read-error-codes/index.ts`

Reads tankless water heater display screens.

**Request**:
```typescript
POST /read-error-codes
{
  "imageBase64": "...",
  "brand": "Rinnai"
}
```

**Response**:
```typescript
{
  "errorCodes": ["11", "12"],
  "flowRateGPM": 2.4,
  "temperature": 120,
  "displayReading": "E11 E12",
  "interpretation": "Ignition failure - check gas supply",
  "severity": "HIGH"
}
```

---

## lookup-price

`supabase/functions/lookup-price/index.ts`

AI-powered water heater pricing with caching.

**Request Types**:
```typescript
// By model number
{
  "type": "MODEL",
  "modelNumber": "XG50T06EC36U1",
  "manufacturer": "Rheem"
}

// By specifications
{
  "type": "SPECS",
  "fuelType": "GAS",
  "capacityGallons": 50,
  "ventType": "POWER_VENT",
  "warrantyYears": 6,
  "qualityTier": "STANDARD"
}
```

**Response**:
```typescript
{
  "retailPrice": 1299,
  "wholesalePrice": 899,
  "priceRangeLow": 1150,
  "priceRangeHigh": 1450,
  "manufacturer": "Rheem",
  "modelNumber": "XG50T06EC36U1",
  "confidence": 85,
  "source": "AI_ESTIMATE",
  "lastUpdated": "2026-01-11"
}
```

**Caching**:
- Results cached in `price_lookup_cache` table
- Cache expires after 7 days
- Falls back to AI if cache miss

---

## install-presets

`supabase/functions/install-presets/index.ts`

CRUD operations for contractor installation presets.

**GET** - Fetch presets:
```typescript
GET /install-presets?contractorId=uuid

// Response
[
  {
    "id": "uuid",
    "ventType": "POWER_VENT",
    "complexity": "STANDARD",
    "laborCost": 450,
    "materialsCost": 150,
    "permitCost": 75,
    "estimatedHours": 4,
    "description": "Standard power vent installation"
  }
]
```

**POST** - Save presets:
```typescript
POST /install-presets
{
  "contractorId": "uuid",
  "presets": [...]
}
```

**DELETE** - Remove preset:
```typescript
DELETE /install-presets?id=uuid
```

---

## Common Patterns

### CORS Headers
All functions include CORS handling:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle preflight
if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}
```

### AI Gateway Usage
```typescript
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [{ role: "user", content: [...] }],
  }),
});
```

### Error Handling
```typescript
try {
  // ... function logic
} catch (error) {
  console.error("Error:", error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Calling Edge Functions from Frontend

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('scan-data-plate', {
  body: { imageBase64: base64String }
});
```
