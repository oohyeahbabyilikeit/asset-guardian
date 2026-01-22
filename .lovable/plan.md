

# Remove Dollar Tracking - Implement Service-Based Closes

## Summary

Replace the revenue-focused pipeline metrics with service completion tracking. "Closes" will be counted by actual technician actions recorded through the technician app, categorized into three main buckets:

1. **Maintenance** - flush, anode_replacement, descale, filter_clean, inspection
2. **Code Violation Fixes** - exp_tank_install, exp_tank_replace, prv_install, prv_replace, softener_install
3. **Replacements** - replacement (full unit replacement)

---

## Data Model Changes

### Update `mockContractorData.ts`

Replace revenue-based pipeline with service-close metrics:

**Before:**
```typescript
interface PipelineStage {
  name: string;
  count: number;
  revenue: number;  // ❌ Remove
}

interface MockPipeline {
  stages: PipelineStage[];
  conversionRate: number;
  totalRevenue: number;  // ❌ Remove
}
```

**After:**
```typescript
export type CloseCategory = 'maintenance' | 'code_fixes' | 'replacements';

interface ServiceCloseMetrics {
  maintenance: {
    total: number;
    breakdown: { flush: number; anode: number; descale: number; inspection: number };
  };
  codeFixes: {
    total: number;
    breakdown: { expTank: number; prv: number; softener: number };
  };
  replacements: {
    total: number;
  };
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'flat';
}

interface MockPipeline {
  stages: { name: string; count: number }[];  // No revenue
  conversionRate: number;
  closes: ServiceCloseMetrics;  // New: tracks actual service completions
}
```

### New Mock Data

```typescript
export const mockPipeline: MockPipeline = {
  stages: [
    { name: 'New', count: 8 },
    { name: 'Contacted', count: 4 },
    { name: 'Scheduled', count: 2 },  // Renamed from "Quoted"
    { name: 'Completed', count: 12 }, // Renamed from "Closed"
  ],
  conversionRate: 46,
  closes: {
    maintenance: {
      total: 8,
      breakdown: { flush: 4, anode: 2, descale: 1, inspection: 1 }
    },
    codeFixes: {
      total: 3,
      breakdown: { expTank: 1, prv: 1, softener: 1 }
    },
    replacements: {
      total: 1,
    },
    thisMonth: 12,
    lastMonth: 9,
    trend: 'up',
  }
};
```

---

## Component Changes

### 1. `PipelineOverview.tsx` - Remove All Dollar References

**Changes:**
- Remove `DollarSign` icon import
- Remove `formatCurrency` function
- Remove `totalRevenue` usage
- Remove per-stage revenue display
- Add service close summary instead

**New Design:**

```text
┌────────────────────────────────────────────────────┐
│  Pipeline                        12 completed ↑    │
├────────────────────────────────────────────────────┤
│   8  →  4  →  2  →  12                             │
│  New  Contact  Sched  Done                         │
├────────────────────────────────────────────────────┤
│  ██████████████████░░░░░░░░░  46% conversion       │
└────────────────────────────────────────────────────┘
```

Compact version:
```text
Pipeline              12 done ↑
8 → 4 → 2 → 12
[========    ] 46%
```

### 2. New Component: `ClosesBreakdown.tsx`

A new card showing service completion breakdown by category:

```text
┌────────────────────────────────────────────────────┐
│  This Month's Closes                    12 total   │
├────────────────────────────────────────────────────┤
│  🔧 Maintenance        8                           │
│     4 Flush · 2 Anode · 1 Descale · 1 Inspection   │
│                                                     │
│  ⚠️ Code Fixes         3                           │
│     1 Exp Tank · 1 PRV · 1 Softener                │
│                                                     │
│  🔄 Replacements       1                           │
├────────────────────────────────────────────────────┤
│  ↑ 33% vs last month (9)                           │
└────────────────────────────────────────────────────┘
```

### 3. `TodaysSummary.tsx` - Add Closes Summary

Add a small footer showing today's/this week's completed services:

```text
┌─────────────────────────────────────────┐
│  Today's Actions            27 total    │
│  ⚠️ 5 urgent actions needed             │
│                                          │
│  [2 Crit] [3 High] [5 Med] [3 Low]      │
│                                          │
│  ───────────────────────────────────    │
│  ✓ 3 completed today                    │
└─────────────────────────────────────────┘
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/data/mockContractorData.ts` | **Modify** | Remove `revenue`/`totalRevenue`, add `ServiceCloseMetrics` type and mock close data |
| `src/components/contractor/PipelineOverview.tsx` | **Modify** | Remove all dollar formatting, replace with completion count + trend arrow |
| `src/components/contractor/ClosesBreakdown.tsx` | **Create** | New component showing categorized service completions |
| `src/pages/Contractor.tsx` | **Modify** | Add `ClosesBreakdown` to the sidebar overview panel |

---

## Technical Details

### Type Definitions (mockContractorData.ts)

```typescript
export type CloseCategory = 'maintenance' | 'code_fixes' | 'replacements';

export interface MaintenanceBreakdown {
  flush: number;
  anode: number;
  descale: number;
  inspection: number;
}

export interface CodeFixBreakdown {
  expTank: number;
  prv: number;
  softener: number;
}

export interface ServiceCloseMetrics {
  maintenance: {
    total: number;
    breakdown: MaintenanceBreakdown;
  };
  codeFixes: {
    total: number;
    breakdown: CodeFixBreakdown;
  };
  replacements: {
    total: number;
  };
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'flat';
}

export interface PipelineStage {
  name: string;
  count: number;
  // revenue removed
}

export interface MockPipeline {
  stages: PipelineStage[];
  conversionRate: number;
  closes: ServiceCloseMetrics;
  // totalRevenue removed
}
```

### PipelineOverview Changes

```typescript
// Before
<div className="flex items-center gap-1.5 text-xs text-gray-400">
  <DollarSign className="w-3 h-3" />
  <span className="text-gray-600">{formatCurrency(totalRevenue)}</span>
  <span>potential</span>
</div>

// After
<div className="flex items-center gap-1.5 text-xs">
  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
  <span className="text-gray-600 font-medium">{closes.thisMonth}</span>
  <span className="text-gray-400">completed</span>
  {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
  {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
</div>
```

### ClosesBreakdown Component

```typescript
interface ClosesBreakdownProps {
  closes: ServiceCloseMetrics;
  compact?: boolean;
}

export function ClosesBreakdown({ closes, compact = false }: ClosesBreakdownProps) {
  const percentChange = closes.lastMonth > 0 
    ? Math.round(((closes.thisMonth - closes.lastMonth) / closes.lastMonth) * 100)
    : 0;
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Completed Services</h3>
        <span className="text-sm text-gray-600 font-medium">{closes.thisMonth}</span>
      </div>
      
      {/* Category rows */}
      <div className="space-y-2">
        <CategoryRow 
          icon={<Wrench />} 
          label="Maintenance" 
          count={closes.maintenance.total}
          detail={`${closes.maintenance.breakdown.flush} flush · ${closes.maintenance.breakdown.anode} anode`}
        />
        <CategoryRow 
          icon={<AlertTriangle />} 
          label="Code Fixes" 
          count={closes.codeFixes.total}
          detail={`${closes.codeFixes.breakdown.expTank} exp tank · ${closes.codeFixes.breakdown.prv} PRV`}
        />
        <CategoryRow 
          icon={<RefreshCw />} 
          label="Replacements" 
          count={closes.replacements.total}
        />
      </div>
      
      {/* Trend footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {closes.trend === 'up' && <TrendingUp className="inline w-3 h-3 text-emerald-500 mr-1" />}
        {percentChange > 0 ? '+' : ''}{percentChange}% vs last month
      </div>
    </div>
  );
}
```

---

## Visual Outcome

**Before (Revenue-focused):**
```
Pipeline                    $88.3K potential
8 → 4 → 2 → 12
$24.5K  $12.8K  $8.4K  $42.6K
```

**After (Service-focused):**
```
Pipeline                    12 completed ↑
8 → 4 → 2 → 12
New  Contact  Sched  Done
────────────────────────────
Completed Services          12
🔧 Maintenance      8   (4 flush, 2 anode...)
⚠️ Code Fixes       3   (1 exp tank, 1 PRV...)
🔄 Replacements     1
+33% vs last month
```

This shifts the focus from hypothetical revenue to actual work completed through the technician app, making the metrics directly trackable via `service_events` table entries.

