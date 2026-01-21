

# Strategic Pivot: Lead Generator → Sales Closing Tool

## The Vision
Transform the app from "getting a stranger's phone number" to **validating the expert's advice**. When the plumber says "You need a replacement," the app becomes the "Bad Cop" (objective data) so the plumber can be the "Good Cop" (trusted advisor with solutions).

---

## Phase 1: Chain of Custody Branding

### 1.1 Add Contractor & Homeowner Context to Data Flow

**New Interface: `InspectionContext`**
```typescript
// src/types/technicianInspection.ts (add to TechnicianInspectionData)
contractorContext?: {
  companyName: string;      // "ABC Plumbing"
  technicianName?: string;  // "Mike"  
  companyPhone: string;     // For SMS links
};
homeownerContext?: {
  name?: string;            // "John" (captured at handoff)
};
```

**Impact**: Flows through `Index.tsx` → `CommandCenter` → `DashboardHeader`

### 1.2 Update Dashboard Header

**Current**: Just "CORTEX" with hardcoded "HO" avatar

**New Layout**:
```
┌─────────────────────────────────────────────────┐
│ [Logo] CORTEX                                   │
│ Report for John • Verified by ABC Plumbing      │
└─────────────────────────────────────────────────┘
```

**Files to modify**:
- `src/components/DashboardHeader.tsx` - Add props for `homeownerName`, `contractorName`
- `src/pages/Index.tsx` - Pass context through

---

## Phase 2: Expectation Shift (CTA Rename)

### 2.1 Rename Primary Button

| Location | Current | New |
|----------|---------|-----|
| `ActionDock.tsx` line 40 | "What are my options?" | "View Risk Analysis" |
| `BreachAlert.tsx` line 204 | "What are my options?" | "View Risk Analysis" |

### 2.2 Internal Navigation Rename

Update `handleServiceRequest` logic in `Index.tsx` to navigate to a renamed screen:
- `critical-assessment` → Continue using for red tier
- `findings-summary` → Continue using for yellow/green

The "Risk Analysis" terminology sets the expectation of **diagnosis**, not shopping.

---

## Phase 3: The Prescription Pad (Replace Contact Form)

### 3.1 Delete the Chatbot

Remove `WaterHeaterChatbot.tsx` and all references:
- `FindingsSummaryPage.tsx` (chat button + state)
- `CommandCenter.tsx` (any chat triggers)
- Edge function `chat-water-heater` can remain for now (no code change needed)

### 3.2 Create New "Prescription Pad" Component

**New File**: `src/components/PrescriptionPad.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ ⚠️ REMEDIATION PROTOCOL                         │
├─────────────────────────────────────────────────┤
│ FINDINGS & REQUIRED ACTIONS                     │
│                                                 │
│ 🔴 Anode Depleted                               │
│    → Unit Replacement (Safety Compromised)      │
│                                                 │
│ 🟠 High Pressure (110 PSI)                      │
│    → Install PRV + Expansion Tank (Code Req.)   │
│                                                 │
│ 🟡 Hard Water (18 GPG)                          │
│    → Water Softener (Prevent Future Failure)    │
├─────────────────────────────────────────────────┤
│ [PRIMARY BUTTON - context dependent]            │
└─────────────────────────────────────────────────┘
```

**Data Source**: Uses `getInfrastructureIssues()` + verdict to map issues to line items with explicit remediation labels.

### 3.3 Issue → Line Item Mapping

Enhance `InfrastructureIssue` to include `remediationLabel`:

| Issue ID | Finding Label | Remediation Label |
|----------|---------------|-------------------|
| `exp_tank_required` | Missing Expansion Tank | Install Expansion Tank |
| `prv_critical` | High Pressure (>80 PSI) | Install PRV |
| `prv_failed` | PRV Failed | Replace PRV |
| `softener_new` | Hard Water Detected | Install Water Softener |
| (verdict=REPLACE) | End of Service Life | Unit Replacement |

This creates a "prescription" that maps the diagnosis directly to billable work.

---

## Phase 4: Magic Buttons (Facilitate Outreach)

### 4.1 Two Button Modes

**Scenario A: Shoulder-to-Shoulder (Plumber Present)**
```
┌─────────────────────────────────────────────────┐
│ [Button] Review Solutions with Technician       │
│ "Turn to your technician to discuss next steps" │
└─────────────────────────────────────────────────┘
```
- **Behavior**: Closes the prescription pad, returns to dashboard, perhaps shows a "Discussion Complete" state
- **No lead capture needed** - the plumber is already there

**Scenario B: Remote Follow-Up (Viewing Alone)**
```
┌─────────────────────────────────────────────────┐
│ [Button] I'm Ready to Proceed                   │
│ "Opens a text to your plumber"                  │
└─────────────────────────────────────────────────┘
```
- **Behavior**: Opens SMS with pre-filled message:
  ```
  sms:555-0199?body=I've%20reviewed%20the%20Cortex%20report.%20I%20understand%20the%20risks%20and%20I'm%20ready%20to%20schedule%20the%20replacement.%20Please%20call%20me%20to%20finalize.
  ```

### 4.2 Mode Detection

Add to `InspectionContext`:
```typescript
handoffMode: 'tablet' | 'remote';
```

This is already captured in `HandoffStep.tsx` - just needs to flow through to the final screen.

---

## Phase 5: Kill "Have My Plumber Reach Out" Pattern

### 5.1 Remove Contact Form Usage

| File | Current CTA | New CTA |
|------|-------------|---------|
| `CriticalAssessmentPage.tsx` | "Have My Plumber Reach Out" | Prescription Pad button |
| `ReplacementOptionsPage.tsx` | "Have My Plumber Reach Out" | Prescription Pad button |
| `ServiceSelectionDrawer.tsx` | "Have My Plumber Reach Out" | "Review with Technician" or SMS button |
| `MaintenancePlan.tsx` | Contact form flow | Prescription Pad or SMS |

### 5.2 Keep PlumberContactForm for Edge Cases

Only use for truly cold leads (e.g., someone finds the report link weeks later without the plumber). Add a small "Need help?" link that opens the form as fallback.

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/types/technicianInspection.ts` | Add `contractorContext` and `homeownerContext` |
| `src/components/DashboardHeader.tsx` | Add "Chain of Custody" badge display |
| `src/components/ActionDock.tsx` | Rename button to "View Risk Analysis" |
| `src/components/BreachAlert.tsx` | Rename button to "View Risk Analysis" |
| `src/components/PrescriptionPad.tsx` | **NEW** - Prescription summary with magic buttons |
| `src/components/WaterHeaterChatbot.tsx` | **DELETE** |
| `src/components/FindingsSummaryPage.tsx` | Remove chatbot, add Prescription Pad integration |
| `src/components/CriticalAssessmentPage.tsx` | Replace CTA with Prescription Pad |
| `src/components/ServiceSelectionDrawer.tsx` | Rework as Prescription Pad display or remove |
| `src/lib/infrastructureIssues.ts` | Add `remediationLabel` field to issues |
| `src/pages/Index.tsx` | Pass contractor/homeowner context through |
| `src/components/steps/technician/HandoffStep.tsx` | Capture and pass `handoffMode` |

---

## Technical Notes

### SMS Link Format
```typescript
const smsLink = `sms:${contractorPhone}?body=${encodeURIComponent(
  `I've reviewed the Cortex report. I understand the risks and I'm ready to schedule the replacement. Please call me to finalize.`
)}`;

// Trigger:
window.location.href = smsLink;
```

### Fallback for iOS vs Android
iOS uses `sms:` with `&body=`, Android uses `sms:` with `?body=`. The `?body=` format works on both in most cases, but may need testing.

---

## User Experience Flow (After Changes)

```
Technician completes inspection
         ↓
Homeowner sees dashboard:
"Report for John • Verified by ABC Plumbing"
         ↓
Taps "View Risk Analysis"
         ↓
Sees Prescription Pad:
- 🔴 Replace Unit (Safety)
- 🟠 Install PRV (Code)
- 🟡 Add Softener (Protection)
         ↓
[If plumber present]     [If viewing remotely]
"Review with Tech"  →   "I'm Ready" → SMS opens
         ↓                    ↓
Discussion happens     Pre-filled text sent
```

This removes all friction while validating the plumber's expertise.

