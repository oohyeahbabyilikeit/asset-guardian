

# Fix: Revert Banner to Dark Theme Diagnostic Styling

## What Went Wrong

The recent change applied **bright light-mode colors** (`bg-amber-100`, `text-amber-600`) to a banner that sits on a **dark diagnostic terminal theme**. This created a jarring, washed-out appearance that breaks the design language.

## The Fix

Revert the `attention` case styling to use the project's established dark-theme amber palette:

### Current (Broken)
```typescript
iconColor: 'text-amber-600 dark:text-amber-400',
bgColor: 'bg-amber-100 dark:bg-amber-900/40',
borderColor: 'border-amber-300 dark:border-amber-600/50',
```

### Corrected (Dark Theme Diagnostic Style)
```typescript
iconColor: 'text-amber-400',
bgColor: 'bg-amber-950/40',
borderColor: 'border-amber-800/30',
```

This matches the existing diagnostic utility classes already defined in your CSS:
- `.status-badge-warning` uses `bg-amber-950/40 text-amber-400 border-amber-800/30`
- `.status-icon-warning` uses the same palette

## File to Edit

**`src/components/OptionsAssessmentDrawer.tsx`** (lines 94-96)

Replace the 3 color lines in the `attention` case with the dark-theme-consistent values above.

## Expected Result

The "Proactive Maintenance Recommended" banner will have a subtle, professional amber glow that matches the rest of the diagnostic UI rather than looking like a bright warning sticker.

