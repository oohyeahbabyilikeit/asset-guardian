
# Convert "Monitor" Drawer Dead End → Lead Capture via Personalized Maintenance Plan

## Problem
When a unit is perfectly healthy (PASS verdict), the `OptionsAssessmentDrawer` shows "Your Unit Is Stable" with a "Got It" button that just closes the drawer. This is a **dead end for lead capture** — we're losing potential customers who could opt into maintenance reminders.

## Solution
Transform the "monitor" tier experience into a lead capture opportunity by:
1. Showing the user their **personalized maintenance schedule** (next flush, anode check, etc.)
2. Offering an **SMS/email reminder opt-in** that captures their contact info as a lead
3. Adding a new `CaptureSource` type for this flow (`maintenance_reminder`)

---

## Implementation Plan

### Step 1: Add New CaptureSource Type
**File:** `src/lib/leadService.ts`

Add `'maintenance_reminder'` to the `CaptureSource` union type:
```typescript
export type CaptureSource = 
  | 'service_selection'
  | 'replacement_quote'
  | 'handoff_remote'
  | 'emergency_flow'
  | 'chat_escalation'
  | 'maintenance_reminder';  // NEW: From healthy unit reminder opt-in
```

### Step 2: Update OptionsAssessmentDrawer for Monitor Tier
**File:** `src/components/OptionsAssessmentDrawer.tsx`

When `tier === 'monitor'`, replace the simple "Got It" experience with:

1. **Personalized Maintenance Preview Section**
   - Calculate maintenance schedule using existing `calculateMaintenanceSchedule(inputs, metrics)`
   - Show upcoming tasks with timeframes (e.g., "Tank Flush – Due in 8 months")
   - Display the `yearsRemaining` estimate if available

2. **SMS/Email Reminder Opt-In Card**
   - Reuse the same UI pattern from `MaintenanceCalendar.tsx` (toggle + form)
   - Include SMS/email method selector and contact input
   - On submit: Call `submitLead()` with `captureSource: 'maintenance_reminder'`

3. **Updated CTA Button**
   - If not opted in: "Get Maintenance Reminders" (primary)
   - If opted in: "Got It" (outline) — closes drawer with success toast

### Step 3: Pass Required Props to Drawer
**File:** `src/components/CommandCenter.tsx` (or wherever drawer is opened)

Ensure `inputs` and `metrics` are passed to the drawer so it can calculate the maintenance schedule.

---

## UI Mockup (Monitor Tier)

```text
┌────────────────────────────────────────────────┐
│ Your Assessment                                 │
│ Here's what we found based on your condition   │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ 👁 Your Unit Is Stable                    │   │
│ │ No service is recommended at this time.  │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ Your Maintenance Schedule                       │
│ ┌──────────────────────────────────────────┐   │
│ │ 💧 Tank Flush         Due in 8 months    │   │
│ │ 🛡 Anode Inspection   Due in 14 months   │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔔 Get Maintenance Reminders              │   │
│ │ We'll text you when service is due       │   │
│ │                                           │   │
│ │ [Text] [Email]                           │   │
│ │ ┌────────────────────────────────┐       │   │
│ │ │ (555) 123-4567                 │       │   │
│ │ └────────────────────────────────┘       │   │
│ │         [ Enable Reminders ]             │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│          [ Got It ]  (outline button)          │
└────────────────────────────────────────────────┘
```

---

## Technical Details

### New Imports for OptionsAssessmentDrawer
```typescript
import { calculateMaintenanceSchedule, MaintenanceTask } from '@/lib/maintenanceCalculations';
import { submitLead, CaptureSource } from '@/lib/leadService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bell, BellRing, MessageSquare, Mail, Droplets, Shield, Flame } from 'lucide-react';
```

### State for Reminder Flow
```typescript
const [showReminderForm, setShowReminderForm] = useState(false);
const [reminderMethod, setReminderMethod] = useState<'sms' | 'email'>('sms');
const [contactInfo, setContactInfo] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [reminderEnabled, setReminderEnabled] = useState(false);
```

### Lead Submission Handler
```typescript
const handleReminderSubmit = async () => {
  if (!contactInfo.trim()) {
    toast.error(`Please enter your ${reminderMethod === 'sms' ? 'phone number' : 'email'}`);
    return;
  }
  
  setIsSubmitting(true);
  const result = await submitLead({
    customerName: 'Homeowner',
    customerPhone: reminderMethod === 'sms' ? contactInfo : '',
    customerEmail: reminderMethod === 'email' ? contactInfo : undefined,
    captureSource: 'maintenance_reminder',
    captureContext: {
      healthScore,
      yearsRemaining,
      nextMaintenanceType: schedule?.primaryTask?.type,
      monthsUntilDue: schedule?.primaryTask?.monthsUntilDue,
    },
    optInAlerts: true,
    preferredContactMethod: reminderMethod,
  });
  
  setIsSubmitting(false);
  if (result.success) {
    setReminderEnabled(true);
    toast.success(`Reminders enabled! We'll ${reminderMethod === 'sms' ? 'text' : 'email'} you before maintenance is due.`);
  } else {
    toast.error('Something went wrong. Please try again.');
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/leadService.ts` | Add `'maintenance_reminder'` to `CaptureSource` |
| `src/components/OptionsAssessmentDrawer.tsx` | Add maintenance schedule display + reminder opt-in form for monitor tier |

## Benefits

1. **Lead Capture**: Every healthy unit now has a path to capture contact info
2. **Value Exchange**: Users get personalized maintenance reminders in exchange for contact
3. **Reuses Existing Code**: Uses existing `calculateMaintenanceSchedule`, `submitLead`, and UI patterns
4. **Non-Intrusive**: Opt-in is optional — "Got It" still closes the drawer
