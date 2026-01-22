
# Sales Coach Feature - AI-Powered Call Briefing

## Overview

Replace the "Full Report" button in PropertyReportDrawer with a **Sales Coach** feature. When clicked, it opens a drawer/overlay where an AI language model provides the plumbing owner with:

1. **Call Opening Script** - How to greet and establish rapport
2. **Key Talking Points** - What to emphasize based on the specific findings
3. **Objection Handling** - Pre-loaded responses to common customer concerns
4. **Closing Strategies** - How to move toward scheduling/commitment

---

## Architecture

### New Edge Function: `sales-coach`

A dedicated edge function that generates sales coaching content based on the property's complete diagnostic data. Unlike the homeowner-facing `chat-water-heater` function, this one:
- Uses a **sales coaching persona** (confident, tactical, business-focused)
- Provides **structured briefing sections** (not just chat)
- Includes **objection counters** specific to the findings
- Formats output for quick scanning before a call

### New Component: `SalesCoachDrawer`

A fullscreen overlay (similar to CorrtexChatOverlay) that:
- Shows a loading state while generating the briefing
- Displays the AI-generated coaching in structured sections
- Allows follow-up questions in a chat format
- Has a "Regenerate" option if the rep wants a fresh take

---

## Data Flow

```text
PropertyReportDrawer
       │
       │ onClick "Sales Coach"
       ▼
┌──────────────────┐
│ SalesCoachDrawer │
│  (opens overlay) │
└────────┬─────────┘
         │ POST to /functions/v1/sales-coach
         │ with: { opportunity, mode: 'briefing' }
         ▼
┌──────────────────────────────────────────┐
│ Edge Function: sales-coach               │
│ ─────────────────────────────────────────│
│ Input: Full opportunity data             │
│   - asset (brand, age, warranty, etc.)   │
│   - forensicInputs (PSI, hardness, etc.) │
│   - opterraResult (health, verdict)      │
│   - inspectionNotes                      │
│   - priority + context                   │
│                                          │
│ System Prompt: Sales Coach Persona       │
│ ─────────────────────────────────────────│
│ Output: Structured briefing              │
│   1. Opening Hook                        │
│   2. Key Talking Points (3-5)            │
│   3. Upsell Opportunities                │
│   4. Objection Handlers (3-4)            │
│   5. Closing Strategy                    │
└──────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Edge Function: `supabase/functions/sales-coach/index.ts`

**System Prompt Strategy:**
```text
You are a Sales Coach for a plumbing company owner. Your job is to prepare them 
for an outreach call to a homeowner whose water heater was recently inspected.

Based on the diagnostic data below, provide a structured briefing:

## CALL OPENING (2-3 sentences)
A natural, non-pushy way to start the call referencing the recent inspection.

## KEY TALKING POINTS (3-5 bullet points)
The most compelling findings to mention. Lead with the customer's BENEFIT, 
not technical jargon. Reference specific data points.

## UPSELL OPPORTUNITIES (2-3 bullet points)
Additional services that make sense given the situation.

## OBJECTION HANDLERS
Common objections and how to respond:
- "I don't have the budget right now" → ...
- "I want to get another quote" → ...
- "It's been working fine" → ...

## CLOSING STRATEGY
How to ask for the appointment without being pushy.

RULES:
- Be direct and tactical, not salesy
- Reference specific numbers from the inspection when helpful
- Use qualitative terms (concerning condition, elevated wear) rather than exact percentages
- Keep each section scannable in under 30 seconds
```

**Request Body:**
```typescript
interface SalesCoachRequest {
  opportunity: MockOpportunity;
  mode: 'briefing' | 'chat';
  messages?: Message[];  // For follow-up Q&A
}
```

### 2. Component: `src/components/contractor/SalesCoachDrawer.tsx`

**Structure:**
```text
┌─────────────────────────────────────────┐
│ ← Back    Sales Coach    [Regenerate]  │
├─────────────────────────────────────────┤
│                                         │
│  Johnson Family • 1847 Sunset Dr        │
│  ● CRITICAL Priority                    │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  🎯 CALL OPENING                        │
│  "Hi Mrs. Johnson, this is [Name] from  │
│  [Company]. I'm following up on the     │
│  water heater inspection our tech       │
│  completed yesterday..."                │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  💬 KEY TALKING POINTS                  │
│  • The active leak means water damage   │
│    risk is high - especially in attic   │
│  • No anode service in 12 years has     │
│    accelerated tank deterioration       │
│  • Warranty expired 6 years ago         │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  📦 UPSELL OPPORTUNITIES                │
│  • Expansion tank (required - closed    │
│    loop system detected)                │
│  • PRV replacement (95 PSI measured)    │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  🛡️ OBJECTION HANDLERS                  │
│                                         │
│  ▼ "I don't have the budget right now"  │
│    [Expandable response]                │
│                                         │
│  ▼ "It's been working fine"             │
│    [Expandable response]                │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  🎬 CLOSING STRATEGY                    │
│  "Given what we found, I'd recommend    │
│  we get someone out this week to..."    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Ask a follow-up question...]    Send  │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Sections are collapsible accordions
- Objection handlers expand on tap
- Chat input at bottom for follow-ups ("What if they ask about financing?")
- Copy button on each section for pasting into notes

### 3. Update `PropertyReportDrawer.tsx`

**Changes:**
- Replace "Full Report" button with "Sales Coach" button
- Add `Sparkles` icon from lucide-react (AI indicator)
- Add state to control SalesCoachDrawer visibility
- Pass opportunity data to SalesCoachDrawer

```typescript
// Button change
<Button 
  className="flex-1 gap-2"
  onClick={() => setShowSalesCoach(true)}
>
  <Sparkles className="w-4 h-4" />
  Sales Coach
</Button>
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/sales-coach/index.ts` | Create | New edge function with sales coaching prompt |
| `src/components/contractor/SalesCoachDrawer.tsx` | Create | AI briefing overlay with structured sections |
| `src/components/contractor/PropertyReportDrawer.tsx` | Modify | Replace "Full Report" → "Sales Coach" button |
| `supabase/config.toml` | Modify | Add sales-coach function config |

---

## Technical Considerations

**Streaming Response:**
The edge function will use SSE streaming (same as chat-water-heater) so the briefing appears progressively rather than making the user wait for the full response.

**Caching Consideration:**
We could cache the generated briefing per opportunity ID to avoid regenerating if the user re-opens. For now, we'll generate fresh each time but include a "Regenerate" button.

**Error Handling:**
- 429 rate limit → Show "Please wait a moment and try again"
- 402 payment required → Show "AI service temporarily unavailable"
- Network error → Show retry button
