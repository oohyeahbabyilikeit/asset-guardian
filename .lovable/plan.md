
## What’s actually broken (why the “min-h-0 / overflow-y-auto” fixes didn’t help)
Your Property Report is a **Radix Sheet** (`<Sheet>`). When a Sheet is open, Radix uses a scroll-lock mechanism (via `react-remove-scroll`) that **blocks wheel/trackpad scrolling everywhere except inside the Sheet content**.

Right now, `SalesCoachDrawer` is rendered **outside** the Sheet (“for z-index”), which means it’s treated as “outside the allowed area,” so wheel scrolling gets prevented at the document level. That exactly produces: **“no scrolling at all”** even if the Sales Coach container is technically scrollable.

So we’re going to “redo it” in a way that avoids fighting Radix’s scroll lock entirely.

## Agreed behavior (from your answers)
- When Sales Coach opens: **close the Property Report behind it**
- When Sales Coach closes: **auto-return to the same Property Report**

This guarantees the Sales Coach overlay is the only modal/overlay on screen, so nothing else can scroll-lock it.

---

## Implementation plan (full redo, reliable)
### 1) Move Sales Coach ownership up to `OpportunityFeed`
**Goal:** Sales Coach should not be a child of `PropertyReportDrawer` at all.

Changes:
- Add state in `src/components/contractor/OpportunityFeed.tsx`:
  - `selectedOpportunityId` (or keep current `selectedOpportunity`, but using ID is safer)
  - `salesCoachOpportunityId`
  - `returnToReportOpportunityId` (so we can re-open the same report after closing Sales Coach)

Flow:
- Clicking “Details” sets `selectedOpportunityId`
- Clicking “Sales Coach” will:
  1) store current `selectedOpportunityId` into `returnToReportOpportunityId`
  2) close the report (`selectedOpportunityId = null`)
  3) open Sales Coach (`salesCoachOpportunityId = that id`)

Closing Sales Coach will:
1) close Sales Coach (`salesCoachOpportunityId = null`)
2) reopen report (`selectedOpportunityId = returnToReportOpportunityId`)

Why this works:
- With the Sheet closed, **no Radix scroll lock is active**, so Sales Coach scroll is native and reliable.

### 2) Update `PropertyReportDrawer` to be “dumb” (no Sales Coach state inside)
In `src/components/contractor/PropertyReportDrawer.tsx`:
- Remove `showSalesCoach` state entirely
- Remove the `<SalesCoachDrawer .../>` render entirely
- Replace the “Sales Coach” button action with a callback prop:
  - New prop: `onOpenSalesCoach?: (opportunityId: string) => void` (or pass the whole opportunity)

This makes Property Report purely a report UI; Sales Coach becomes a separate top-level overlay.

### 3) Render `SalesCoachDrawer` from `OpportunityFeed` (top level)
In `src/components/contractor/OpportunityFeed.tsx`:
- Render `<SalesCoachDrawer open={...} opportunity={...} onClose={...} />` alongside the existing `<PropertyReportDrawer />`.

Important:
- When Sales Coach is open, the report is closed (per your preference), so the scroll lock is gone.

### 4) Simplify Sales Coach scroll behavior (stop “helping,” just let it scroll)
In `src/components/contractor/SalesCoachDrawer.tsx`:
- Keep the flex layout (`fixed inset-0 flex flex-col overflow-hidden` + middle `flex-1 min-h-0 overflow-y-auto`)
- Remove any remaining “scroll-fighting” behavior that’s unnecessary once the Sheet isn’t open.
  - We can keep the “only autoscroll if near bottom” logic, but we’ll ensure it never runs during initial briefing unless explicitly desired.
  - If needed, we can disable auto-scroll entirely during `briefing` streaming and only auto-scroll for the chat stream.

### 5) Fix the console warnings (so we’re not missing real errors)
These aren’t the main bug, but they pollute debugging:

**A) ReactMarkdown ref warning**
- `react-markdown` can pass props (sometimes including `ref`) into custom renderers.
- We’ll update the `components={{ p, ul, li, strong }}` handlers to spread props onto actual DOM nodes:
  - `p: ({node, ...props}) => <p {...props} className="..." />`
This removes “Function components cannot be given refs” warnings.

**B) Radix “Missing Description / aria-describedby” warning**
- Add a `SheetDescription` (can be `sr-only`) in `PropertyReportDrawer` to satisfy Radix accessibility requirements.

---

## Testing checklist (what I’ll verify after implementation)
1) Go to `/contractor`
2) Click a Lead → “Details” opens Property Report
3) Click “Sales Coach”
   - Property Report closes
   - Sales Coach opens
4) Generate a long briefing
5) Verify scroll with:
   - mouse wheel
   - trackpad two-finger scroll
   - scrollbar drag
6) Send 2–3 follow-up questions; verify scrolling still works during streaming
7) Click Close/Back:
   - Sales Coach closes
   - Property Report reopens on the same opportunity

Acceptance criteria:
- Sales Coach scroll works 100% on desktop (wheel/trackpad) while briefing/chat are long.
- No “snap back” behavior while reading older content.
- Closing Sales Coach reliably returns to the same report.

---

## Files that will be changed
- `src/components/contractor/OpportunityFeed.tsx` (new state + orchestration, render SalesCoachDrawer here)
- `src/components/contractor/PropertyReportDrawer.tsx` (remove internal Sales Coach overlay; add callback prop)
- `src/components/contractor/SalesCoachDrawer.tsx` (final scroll + markdown + key handling polish)
- (Optional) `src/components/ui/sheet.tsx` only if we need accessibility tweaks globally (likely not necessary)

---

## If anything still blocks scrolling after this
At that point, the only remaining causes would be truly global wheel prevention (rare) or a transparent overlay capturing pointer events above Sales Coach. If needed, we’ll add a temporary on-screen debug strip (scrollTop/scrollHeight/clientHeight + “wheel events received”) to prove whether the browser is even delivering wheel events to the container, then remove it once confirmed.
