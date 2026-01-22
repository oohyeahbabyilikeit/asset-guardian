
# Simplify Risk Analysis Drawer - Progressive Disclosure Approach

## Current Problem

The OptionsAssessmentDrawer displays too much content at once, creating immediate visual overwhelm:

| Current Element | Lines | Issue |
|-----------------|-------|-------|
| Header + Description | 369-374 | Two lines of header text |
| Large Verdict Banner | 377-388 | Good, but competes with other content |
| Photo Evidence | 390-405 | Adds visual weight |
| "Why" Rationale (3 cards) | 407-436 | Largest content block |
| Collapsed Findings | 439-484 | Still visible as trigger |
| Fallback Summary | 486-499 | Conditional but adds height |
| "What's Next" Preview | 663-704 | 4 category previews |
| Two CTAs | 708-730 | Chat + main CTA |

**Total: 7-8 distinct content sections visible immediately**

## Solution: "Single Takeaway" Design

Transform the drawer into a focused, single-message experience with optional depth.

### New Hierarchy (3 tiers)

```text
┌─────────────────────────────────────────┐
│                                         │
│  ⚠️  REPLACEMENT RECOMMENDED            │  
│                                         │
│  Based on your inspection, continuing   │
│  to repair this unit will likely cost   │
│  more than it's worth.                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [     See My Options →     ]           │  ← PRIMARY CTA
│                                         │
│  ▸ View Details                         │  ← Expands everything else
│                                         │
└─────────────────────────────────────────┘
```

### Key Changes

**1. Merge Verdict + Rationale into One Block**

Instead of a banner THEN rationale cards, combine them:

```typescript
<div className="rounded-2xl p-6 bg-destructive/10 border-2 border-destructive/40">
  <div className="flex items-center gap-3 mb-4">
    <AlertTriangle className="w-8 h-8 text-destructive" />
    <h3 className="text-xl font-bold">Replacement Recommended</h3>
  </div>
  <p className="text-foreground/80 leading-relaxed">
    {rationale?.summary || "Based on your inspection, continuing to repair 
    this unit will likely cost more than it's worth. A new water heater 
    gives you reliability, efficiency, and peace of mind."}
  </p>
</div>
```

**2. Move Photo + Details to Collapsible**

Hide secondary content behind "View Details":

```typescript
<Collapsible>
  <CollapsibleTrigger>
    ▸ View Details ({findings.length} items)
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Photo evidence */}
    {/* Rationale breakdown cards */}
    {/* Priority findings */}
  </CollapsibleContent>
</Collapsible>
```

**3. Remove "What's Next" Preview Entirely**

The next page will show this - no need to preview. Delete lines 663-704.

**4. Consolidate CTAs**

Move "Chat with Corrtex" into the collapsible details section or make it an inline text link instead of a full-width button.

**5. One-liner Summary for Rationale**

Instead of 3 separate rationale cards, show just ONE key sentence from the AI, with expansion available.

### Visual Comparison

| Before | After |
|--------|-------|
| Header (2 lines) | Single title |
| Banner (4 lines) | Combined verdict block |
| Photo (full width) | Hidden in "Details" |
| 3 Rationale cards | 1-sentence summary |
| Collapsible findings | Merged into "Details" |
| "What's Next" preview | Removed |
| 2 CTAs stacked | 1 CTA + text link |
| **~350px content** | **~180px content** |

## Implementation Details

### 1. Unified Verdict Block (replaces lines 377-436)

Create a single, calm verdict card that combines the headline + one-sentence rationale:

```typescript
{/* Unified Verdict - calm, focused */}
<div className={`rounded-2xl p-6 ${recommendation.bgColor} border ${recommendation.borderColor}`}>
  <div className="flex items-center gap-3 mb-3">
    <Icon className={`w-7 h-7 ${recommendation.iconColor}`} />
    <h3 className="text-lg font-bold text-foreground">{recommendation.headline}</h3>
  </div>
  <p className="text-sm text-muted-foreground leading-relaxed">
    {verdictAction === 'REPLACE' 
      ? (rationale?.summary || "Continuing to repair this unit will likely cost more than it's worth. A new water heater gives you reliability and peace of mind.")
      : recommendation.subheadline
    }
  </p>
</div>
```

### 2. "View Details" Collapsible (replaces lines 390-499)

Move ALL secondary content (photo, rationale cards, findings) into one expansion:

```typescript
<Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
  <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
    <span>{detailsExpanded ? 'Hide' : 'View'} Details</span>
    <ChevronDown className={`w-4 h-4 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} />
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-4 pt-3">
    {/* Photo evidence */}
    {inputs.photoUrls?.condition && (
      <div className="rounded-xl overflow-hidden border border-border">
        <img src={inputs.photoUrls.condition} className="w-full h-36 object-cover" />
        <p className="text-xs text-muted-foreground p-2 bg-muted/30">
          Photo from your inspection
        </p>
      </div>
    )}
    
    {/* Rationale breakdown - only if user expands */}
    {rationale?.sections && (
      <div className="space-y-2">
        {rationale.sections.map((section, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-xs font-medium text-foreground mb-1">{section.heading}</p>
            <p className="text-xs text-muted-foreground">{section.content}</p>
          </div>
        ))}
      </div>
    )}
    
    {/* Priority findings */}
    {hasPriorityFindings && (
      <div className="space-y-2">
        {priorityFindings.map((finding) => /* existing finding cards */)}
      </div>
    )}
    
    {/* Chat link - inline */}
    <button 
      onClick={() => setShowCorrtexChat(true)}
      className="flex items-center gap-2 text-sm text-primary hover:underline"
    >
      <Sparkles className="w-4 h-4" />
      Have questions? Chat with Corrtex AI
    </button>
  </CollapsibleContent>
</Collapsible>
```

### 3. Delete "What's Next" Section

Remove lines 663-704 entirely. The next page will reveal this content.

### 4. Simplified CTA Area

Single primary button, no secondary Chat button:

```typescript
<Button 
  onClick={handleCTA}
  size="lg"
  className="w-full font-semibold"
>
  {ctaText}
  <ChevronRight className="w-5 h-5 ml-1" />
</Button>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/OptionsAssessmentDrawer.tsx` | Major restructure to progressive disclosure |

## Expected Outcome

When the drawer opens, homeowners see:
1. One clear verdict card with a single sentence explanation
2. One primary CTA button
3. An unobtrusive "View Details" link for those who want more

This reduces cognitive load from 7+ sections to just 2 visible elements, making the decision path obvious while still preserving access to detailed evidence for those who want it.
