
## Goal
Fix the Sales Coach overlay so it scrolls reliably (desktop mousewheel/trackpad) and users can read the full briefing + chat history.

## What’s happening (root cause)
In `SalesCoachDrawer.tsx` the overlay is a `flex flex-col` container with `overflow-hidden`, and the middle section is `flex-1 overflow-y-auto`.  
In CSS flex layouts, scroll containers often **won’t actually become scrollable unless they’re allowed to shrink**. By default, flex children have `min-height: auto`, which can cause the “scrollable” area to expand to fit content (so it never overflows internally), while the parent clips the overflow. The end result is: **content is cut off and scrolling doesn’t work at all**.

## Changes to make (frontend only)
### 1) Make the scrollable middle section actually scroll
Update the Sales Coach “content” wrapper from:
- `className="flex-1 overflow-y-auto"`
to:
- `className="flex-1 min-h-0 overflow-y-auto"`

Optionally add `min-h-0` to any intermediate wrappers if needed, but typically adding it to the scroll container itself is sufficient.

### 2) (Recommended) Prevent “auto-scroll to bottom” from fighting user scroll
Right now this effect runs on every token streamed and every message update:
```ts
useEffect(() => {
  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
}, [briefing, messages]);
```
That can make it feel “stuck” when users try to scroll (especially during streaming). Improve it by:
- Tracking whether the user is currently at/near the bottom (via an `onScroll` handler + a small threshold).
- Only auto-scrolling when the user is already at the bottom (typical chat behavior).

This won’t be the primary fix for “no scrolling at all”, but it prevents the next UX complaint right after we restore scrolling.

### 3) Verify the overlay never scrolls the page behind it
Keep:
- outer container: `fixed inset-0 … overflow-hidden`
- inner container: the middle section handles scrolling

## Files involved
- `src/components/contractor/SalesCoachDrawer.tsx`
  - Add `min-h-0` to the middle scroll container
  - (Optional) Implement “only autoscroll if already at bottom” logic

## How we’ll test (quick checklist)
1. Go to `/contractor`
2. Click an opportunity → open Details/Property Report
3. Click **Sales Coach**
4. Generate a briefing (long enough to overflow)
5. Confirm:
   - Mouse wheel scroll works
   - Trackpad two-finger scroll works
   - You can reach both the very top and very bottom
6. Send 2–3 follow-up questions to create long chat history
7. Confirm you can scroll back up without being forced down (if we apply the conditional auto-scroll improvement)

## Acceptance criteria
- Sales Coach overlay scrolls on desktop consistently.
- No content is “trapped” below the fold.
- (If we do step 2) Users can scroll up while content streams without it snapping them back down.
