

# Add Contractor Tools Route

## Overview

Create a new `/contractor` route with its own dedicated page that you can navigate to, separate from the homeowner-focused Index page. This gives you a clean canvas to build out contractor-specific tools and features.

## Implementation

### 1. Create New Contractor Page

Create `src/pages/Contractor.tsx` - a new page component for contractor tools:

```typescript
// Initial scaffold with navigation back to home
export default function Contractor() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <h1 className="text-lg font-bold">Contractor Tools</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>
      
      <main className="p-4">
        {/* Your contractor tools will go here */}
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Contractor tools coming soon...</p>
        </div>
      </main>
    </div>
  );
}
```

### 2. Add Route to App.tsx

Register the new route in the router:

```typescript
import Contractor from "./pages/Contractor";

// In Routes:
<Route path="/contractor" element={<Contractor />} />
```

### 3. Add Navigation Link from Home

Add a link/button on the ModeSelectScreen to navigate to `/contractor`:

```typescript
<Link to="/contractor" className="...">
  Contractor Portal →
</Link>
```

## File Changes

| File | Action |
|------|--------|
| `src/pages/Contractor.tsx` | **Create** - New contractor page scaffold |
| `src/App.tsx` | **Edit** - Add `/contractor` route |
| `src/components/ModeSelectScreen.tsx` | **Edit** - Add navigation link to contractor page |

## Result

After implementation:

- Navigate to `/` → See the existing mode select screen with a new "Contractor Portal" link
- Navigate to `/contractor` → See the new contractor tools page
- The contractor page has a back button to return to `/`

You can then build out whatever contractor-specific features you need on this dedicated page without affecting the homeowner flow.

