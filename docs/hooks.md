# Hooks Reference

Custom React hooks for data fetching, device APIs, and business logic.

---

## AI/Camera Scanning Hooks

### useDataPlateScan
`src/hooks/useDataPlateScan.ts`

Captures and analyzes water heater data plate photos using AI OCR.

```typescript
const { 
  scanPlate,      // (imageBase64: string) => Promise<ScanResult>
  isScanning,     // boolean
  result,         // ExtractedData | null
  error           // string | null
} = useDataPlateScan();
```

**Returns**:
```typescript
interface ExtractedData {
  brand: string;
  modelNumber: string;
  serialNumber: string;
  fuelType: 'GAS' | 'ELECTRIC' | 'PROPANE';
  capacityGallons: number;
  flowRateGPM?: number;      // tankless only
  warrantyYears: number;
  confidence: number;        // 0-100
  rawText: string;
}
```

---

### useConditionScan
`src/hooks/useConditionScan.ts`

Analyzes photos of water heater for visual condition assessment.

```typescript
const { 
  scanCondition,
  isScanning,
  result,
  error
} = useConditionScan();
```

**Returns**: Condition rating, rust detection, leak indicators, etc.

---

### useFilterScan
`src/hooks/useFilterScan.ts`

Analyzes filter photos (air filters for hybrids, inlet filters for tankless).

```typescript
const { scanFilter, isScanning, result } = useFilterScan();
```

**Returns**: `CLEAN` | `DIRTY` | `CLOGGED` status with blockage percentage.

---

### useErrorCodeScan
`src/hooks/useErrorCodeScan.ts`

Reads error codes from tankless water heater displays.

```typescript
const { scanErrorCode, isScanning, result } = useErrorCodeScan();
```

---

### useSoftenerPlateScan
`src/hooks/useSoftenerPlateScan.ts`

OCR for water softener data plates.

---

### useInstallationContextScan
`src/hooks/useInstallationContextScan.ts`

Analyzes installation area photos to detect:
- Expansion tank presence
- PRV (pressure reducing valve)
- Circulation pump
- Drain pan
- Proper clearances

---

## Location & Network Hooks

### useGPS
`src/hooks/useGPS.ts`

Browser geolocation API wrapper.

```typescript
const { 
  position,       // { lat: number, lng: number } | null
  error,          // string | null
  isLoading,      // boolean
  getPosition     // () => Promise<Position>
} = useGPS();
```

---

### useNetworkStatus
`src/hooks/useNetworkStatus.ts`

Monitors online/offline status.

```typescript
const { isOnline } = useNetworkStatus();
```

---

### useOfflineSync
`src/hooks/useOfflineSync.ts`

Manages offline data persistence and sync queue.

```typescript
const {
  pendingCount,           // number of items waiting to sync
  isSyncing,              // boolean
  syncNow,                // () => Promise<void>
  saveInspection,         // (data: InspectionData) => Promise<void>
  savePhoto               // (blob: Blob, type: string) => Promise<string>
} = useOfflineSync();
```

---

## Pricing Hooks

### usePricing
`src/hooks/usePricing.ts`

Basic unit price lookup.

```typescript
const { 
  getPrice,       // (inputs: ForensicInputs) => Promise<PriceResult>
  isLoading,
  error
} = usePricing();
```

---

### useTieredPricing
`src/hooks/useTieredPricing.ts`

Comprehensive pricing across Essential/Recommended/Premium tiers.

```typescript
const {
  tiers,          // TierPricing[]
  isLoading,
  error,
  calculateTiers  // (inputs, metrics) => Promise<void>
} = useTieredPricing();

interface TierPricing {
  tier: 'ESSENTIAL' | 'RECOMMENDED' | 'PREMIUM';
  unitCost: PriceRange;
  laborCost: PriceRange;
  infraCost: PriceRange;
  totalCost: PriceRange;
  includedIssues: InfrastructureIssue[];
}
```

---

## Utility Hooks

### useMobile
`src/hooks/use-mobile.tsx`

Responsive breakpoint detection.

```typescript
const isMobile = useMobile(); // true if viewport < 768px
```

---

### useTypewriter
`src/hooks/useTypewriter.ts`

Typewriter text animation effect.

```typescript
const displayText = useTypewriter(fullText, speed);
```

---

### useToast
`src/hooks/use-toast.ts`

Toast notification trigger (shadcn pattern).

```typescript
const { toast } = useToast();
toast({ title: "Success", description: "Saved!" });
```

---

## Hook Patterns

### Loading States
All async hooks follow this pattern:
```typescript
const { data, isLoading, error } = useHook();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Component data={data} />;
```

### Camera Integration
Camera hooks expect base64 image strings:
```typescript
// Get image from camera input
const handleCapture = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  const base64 = await fileToBase64(file);
  await scanPlate(base64);
};
```
