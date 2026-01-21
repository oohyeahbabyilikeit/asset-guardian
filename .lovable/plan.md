

# Add Corrtex AI Chat to Service Selection

## Overview
Add a "Chat with Corrtex AI" button below the plumber contact button that opens a fullscreen AI-powered chat. The chat will be pre-loaded with all inspection data and display suggested questions based on the customer's specific recommended services.

---

## Architecture

```text
┌────────────────────────────────────────────────────────────┐
│               ServiceSelectionDrawer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Services List - Violations, Urgent, Maintenance]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Footer:                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [📞 Have My Plumber Reach Out] ← Primary CTA        │  │
│  │  [💬 Chat with Corrtex AI] ← Secondary, opens chat   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼ Opens fullscreen overlay
┌────────────────────────────────────────────────────────────┐
│                   CorrtexChatOverlay                       │
│  Header: "Corrtex AI" + Close button                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Initial Message:                                     │  │
│  │  "Hi! I've reviewed your water heater assessment.     │  │
│  │   Based on what we found, you have [X] items to       │  │
│  │   discuss. Ask me anything about your options!"       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Suggested Questions (based on their services):           │
│  ┌────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Why expansion  │ │ Is replacement  │ │ What's a PRV? │ │
│  │ tank needed?   │ │ urgent?         │ │               │ │
│  └────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                            │
│  [Input field] [Send]                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### 1. Create New Component: CorrtexChatOverlay

**File**: `src/components/CorrtexChatOverlay.tsx`

A fullscreen chat overlay that:
- Receives context: inputs, metrics, recommendation, selected tasks, and priority findings
- Streams responses from the existing `chat-water-heater` edge function
- Generates dynamic suggested questions based on what services are being shown

**Props**:
```typescript
interface CorrtexChatOverlayProps {
  open: boolean;
  onClose: () => void;
  // Context for AI
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  recommendation: { action: string; badge: string; title: string; };
  // Services being shown to generate questions
  violations: MaintenanceTask[];
  recommendations: MaintenanceTask[];
  maintenanceTasks: MaintenanceTask[];
  addOns: MaintenanceTask[];
  healthScore: number;
}
```

**Key Features**:
- Fullscreen overlay (similar to MaintenanceChatInterface fullscreen mode)
- SSE streaming for real-time AI responses
- Dynamic suggested questions based on their specific situation
- Handles rate limit (429) and payment required (402) errors gracefully

### 2. Update ServiceSelectionDrawer

**File**: `src/components/ServiceSelectionDrawer.tsx`

Add new props and button:
- Add props for AI context (inputs, metrics, recommendation, healthScore)
- Add state: `showCorrtexChat` 
- Add "Chat with Corrtex AI" button below the plumber CTA

**Footer Changes**:
```tsx
<DrawerFooter className="border-t border-border">
  <p className="text-xs text-center text-muted-foreground mb-2">
    No obligation—just a quick conversation
  </p>
  <Button onClick={handleSubmit} disabled={selectedTypes.size === 0} className="w-full gap-2 h-12">
    <Phone className="w-4 h-4" />
    Have My Plumber Reach Out
  </Button>
  
  {/* NEW: Corrtex AI Chat Button */}
  <Button 
    variant="outline" 
    onClick={() => setShowCorrtexChat(true)} 
    className="w-full gap-2"
  >
    <Sparkles className="w-4 h-4" />
    Chat with Corrtex AI
  </Button>
  <p className="text-[10px] text-center text-muted-foreground">
    Get instant answers about your options
  </p>
</DrawerFooter>
```

### 3. Update CommandCenter to Pass Context

**File**: `src/components/CommandCenter.tsx`

Pass additional context to ServiceSelectionDrawer:
```tsx
<ServiceSelectionDrawer
  // ... existing props
  inputs={currentInputs}           // NEW
  metrics={metrics}                // NEW  
  recommendation={recommendation}  // NEW
  healthScore={dynamicHealthScore.score}  // NEW
/>
```

### 4. Dynamic Suggested Questions Logic

Questions are generated based on what's in their service list:

| Service Type | Suggested Questions |
|--------------|---------------------|
| Expansion Tank (violation) | "Why is an expansion tank required?" |
| PRV Installation | "What does a PRV do?" |
| Replacement Consultation | "Is replacement urgent or can I wait?" |
| Anode Replacement | "How does an anode protect my tank?" |
| Tank Flush | "What happens if I skip the flush?" |
| Water Softener (add-on) | "How would a softener help?" |
| High Pressure detected | "Is my water pressure dangerous?" |

**Example question generator**:
```typescript
function generateSuggestedQuestions(
  violations: MaintenanceTask[],
  recommendations: MaintenanceTask[],
  maintenanceTasks: MaintenanceTask[],
  addOns: MaintenanceTask[]
): string[] {
  const questions: string[] = [];
  
  // Check for specific services and add relevant questions
  if (violations.some(v => v.type.includes('expansion'))) {
    questions.push("Why is the expansion tank required?");
  }
  if (recommendations.some(r => r.type === 'replacement_consult')) {
    questions.push("Is replacement urgent?");
  }
  if (maintenanceTasks.some(m => m.type === 'flush')) {
    questions.push("What if I skip the flush?");
  }
  // ... more mappings
  
  return questions.slice(0, 4); // Max 4 suggestions
}
```

---

## Edge Function: Already Exists!

The `chat-water-heater` edge function is already perfect for this:
- Accepts `messages` and `context` (inputs, metrics, recommendation, findings)
- Uses Lovable AI (Gemini 3 Flash) for streaming responses
- Has proper CORS and error handling

**Minor Enhancement**: Update the system prompt to mention they're looking at service options (not just a general assessment).

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/CorrtexChatOverlay.tsx` | **CREATE** - New fullscreen chat component |
| `src/components/ServiceSelectionDrawer.tsx` | **MODIFY** - Add button + new props |
| `src/components/CommandCenter.tsx` | **MODIFY** - Pass context to drawer |
| `supabase/functions/chat-water-heater/index.ts` | **MODIFY** - Update prompt for service context |

---

## User Experience Flow

1. Customer sees their service options in ServiceSelectionDrawer
2. Before committing to plumber contact, they tap "Chat with Corrtex AI"
3. Fullscreen chat opens with personalized greeting
4. Suggested questions appear based on their specific violations/recommendations
5. They can ask anything - AI has full context of their assessment
6. Once educated, they close chat and either:
   - Request plumber callback (confident)
   - Continue browsing (needs more time)

This gives customers a self-serve education path before committing to a lead.

