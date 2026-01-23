
# Sequences Page Database Integration Fix

## Issues Found

After reviewing the code and database, I identified several critical gaps preventing the Sequences page from being cohesive and fully database-connected:

### 1. Missing Customer Information
The `ActiveSequencesList` and `SequenceRow` components display placeholder text like "Lead a000000" instead of actual customer names and addresses. The data exists in `demo_opportunities` but the sequences only store `opportunity_id` - there's no join being performed.

### 2. No Sequence Events Being Created
When `useStartSequence` creates a nurturing sequence, it only inserts into `nurturing_sequences` but **never creates the corresponding `sequence_events` rows**. This means:
- "Send Now" and "Skip" buttons fail (no event IDs exist)
- `StepTimeline` shows empty execution history
- No data for analytics calculations

### 3. Inconsistent Trigger Type Matching
- Sequences use: `urgent_replace`, `maintenance_reminder`
- Templates use: `replacement_urgent`, `maintenance`
- This causes template lookups to fail in some cases

### 4. Missing TypeScript Fields
The `NurturingSequence` interface is missing the `outcome`, `outcomeReason`, and `outcomeAt` fields that exist in the database, causing `(s as any).outcome` workarounds.

### 5. Analytics Using Mock Values
Open rate (68%) and click rate (24%) are hardcoded instead of calculated from actual `sequence_events` data.

---

## Solution

### 1. Create a New Hook to Fetch Enriched Sequences

Create `useEnrichedSequences` that joins `nurturing_sequences` with `demo_opportunities` to get customer names and addresses in a single query:

```typescript
// Returns sequences with customerName and propertyAddress attached
useEnrichedSequences() -> EnrichedSequence[]
```

### 2. Fix `useStartSequence` to Create Events

When starting a sequence, also create `sequence_events` rows for each step from the template:

```typescript
// For each template step:
INSERT INTO sequence_events {
  sequence_id,
  step_number,
  action_type,
  scheduled_at: (start_date + step.day days),
  status: 'pending',
  message_content: step.message
}
```

### 3. Update TypeScript Types

Add missing fields to `NurturingSequence`:
- `outcome: 'converted' | 'lost' | 'stopped' | null`
- `outcomeReason: string | null`
- `outcomeAt: Date | null`

### 4. Fix Template Matching

Create a unified mapping function that handles both naming conventions:
- `urgent_replace` ↔ `replacement_urgent`
- `maintenance_reminder` ↔ `maintenance`

### 5. Calculate Real Analytics

Replace hardcoded rates with actual calculations from `sequence_events`:
- Open rate = events with `opened_at` / total sent events
- Click rate = events with `clicked_at` / total sent events

---

## File Changes

### Modified Files

| File | Changes |
|------|---------|
| `src/hooks/useNurturingSequences.ts` | Add `outcome` fields to interface, create `useEnrichedSequences` hook, fix `useStartSequence` to create events |
| `src/components/contractor/ActiveSequencesList.tsx` | Use enriched sequences with real customer data |
| `src/components/contractor/SequenceRow.tsx` | Accept and display customerName, propertyAddress props |
| `src/components/contractor/SequenceControlDrawer.tsx` | Use enriched data, fix template matching |
| `src/components/contractor/SequenceAnalytics.tsx` | Calculate real open/click rates from events |
| `src/pages/Sequences.tsx` | Use enriched sequences hook |

---

## Technical Details

### Enriched Sequence Type

```typescript
interface EnrichedSequence extends NurturingSequence {
  customerName: string;
  propertyAddress: string;
  opportunityType: string;
}
```

### Database Query for Enrichment

Since we can't use JOINs directly in Supabase JS client between tables without foreign keys, we'll:
1. Fetch all nurturing sequences
2. Fetch all demo_opportunities
3. Map them client-side (efficient for small datasets)

### Event Creation on Sequence Start

```typescript
// In useStartSequence mutation:
const templateSteps = template.steps;
const startDate = new Date();

const events = templateSteps.map(step => ({
  sequence_id: newSequenceId,
  step_number: step.step,
  action_type: step.action,
  scheduled_at: addDays(startDate, step.day).toISOString(),
  status: 'pending',
  message_content: step.message,
}));

await supabase.from('sequence_events').insert(events);
```

### Template Type Mapping

```typescript
function normalizeSequenceType(type: string): string {
  const mappings: Record<string, string> = {
    'urgent_replace': 'replacement_urgent',
    'replacement_urgent': 'replacement_urgent',
    'maintenance_reminder': 'maintenance',
    'maintenance': 'maintenance',
    'code_violation': 'code_violation',
  };
  return mappings[type] || type;
}
```

---

## Outcome

After these changes:
- Sequence rows show real customer names and property addresses
- "Send Now" and "Skip" buttons work with actual event records
- Template matching is consistent across the app
- Analytics show calculated metrics based on real data
- TypeScript types are complete without `any` casts
- The entire Sequences page is fully database-connected
