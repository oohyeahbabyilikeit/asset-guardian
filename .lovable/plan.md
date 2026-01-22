
# Contractor Dashboard / Mini-CRM / Lead Engine

## Vision

Build a contractor workspace that serves three core functions:

1. **Lead Engine** - Surfaces high-value opportunities from inspections and detected maintenance needs
2. **Mini-CRM** - Tracks customer relationships and lead pipeline
3. **Toolbox** - Quick access to inspection workflow, pricing, and reports

The dashboard transforms raw data into actionable business intelligence, helping contractors prioritize their day and close more revenue.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONTRACTOR DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  📊 OPPORTUNITY FEED (Lead Engine)                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │   │
│  │  │ 🔴 CRITICAL │ │ 🟠 HIGH     │ │ 🟡 MEDIUM   │ │ 🟢 LOW      │ │   │
│  │  │ 2 leads     │ │ 5 leads     │ │ 12 leads    │ │ 8 leads     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 🔴 CRITICAL: 123 Main St - Active Leak                      │ │   │
│  │  │    Unit: 12yr Rheem Gas Tank | Health: 24/100               │ │   │
│  │  │    Job Complexity: ELEVATED (attic location)                 │ │   │
│  │  │    [📞 Call Now] [📝 View Details] [❌ Dismiss]             │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 🟠 HIGH: 456 Oak Ave - Warranty Expiring                    │ │   │
│  │  │    Unit: 5yr A.O. Smith | Health: 62/100 | 6mo warranty     │ │   │
│  │  │    Opportunity: Proactive replacement before coverage ends   │ │   │
│  │  │    [📞 Call] [📝 View] [⏰ Remind Later]                     │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  📋 LEAD PIPELINE (Mini-CRM)                                      │   │
│  │  ┌────────┐ ┌────────────┐ ┌──────────┐ ┌────────┐                │   │
│  │  │ NEW    │ │ CONTACTED  │ │ QUOTED   │ │ CLOSED │                │   │
│  │  │  8     │ │     4      │ │    2     │ │   12   │                │   │
│  │  └────────┘ └────────────┘ └──────────┘ └────────┘                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  🛠️ QUICK ACTIONS                                                 │   │
│  │  [Start Inspection] [View Properties] [Pricing Setup] [Reports]  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

| Table | Purpose in Dashboard |
|-------|---------------------|
| `opportunity_notifications` | Primary lead feed - detected opportunities |
| `leads` | Captured homeowner contacts from app interactions |
| `contractor_property_relationships` | Properties this contractor has serviced |
| `properties` + `water_heaters` | Property/unit details for context |
| `assessments` | Latest health scores and verdicts |
| `quotes` | Quote history for win/loss tracking |

---

## Implementation Plan

### Phase 1: Dashboard Layout and Mock Data

**Files to Create:**
- `src/pages/Contractor.tsx` - Main dashboard page (expand existing)
- `src/components/contractor/OpportunityFeed.tsx` - Lead engine component
- `src/components/contractor/LeadCard.tsx` - Individual opportunity card
- `src/components/contractor/PipelineOverview.tsx` - CRM pipeline visualization
- `src/components/contractor/QuickActions.tsx` - Action buttons

**Mock Data Approach:**
Since the database is currently empty, we'll generate realistic mock data based on the existing `mockAsset.ts` scenarios to demonstrate the full experience:

```typescript
// src/data/mockContractorData.ts
interface MockOpportunity {
  id: string;
  propertyAddress: string;
  customerName?: string;
  opportunityType: 'replacement_urgent' | 'replacement_recommended' | 'warranty_expiring' | 'anode_due' | 'flush_due' | 'annual_checkup';
  priority: 'critical' | 'high' | 'medium' | 'low';
  unitSummary: string; // "12yr Rheem Gas Tank in Attic"
  healthScore: number;
  failProbability: number;
  jobComplexity: 'STANDARD' | 'ELEVATED' | 'COMPLEX';
  context: string; // "Active leak detected" | "Warranty ends in 6 months"
  createdAt: Date;
}
```

### Phase 2: Opportunity Feed Component

The heart of the dashboard - a filterable, prioritized feed of service opportunities:

**Features:**
- **Priority Tabs**: Filter by CRITICAL / HIGH / MEDIUM / LOW
- **Smart Sorting**: Highest priority + oldest first
- **Lead Cards**: Show property, unit summary, health score, job complexity, action buttons
- **Quick Actions**: Call, View Details, Dismiss with reason
- **Status Tracking**: Pending → Viewed → Contacted → Converted/Dismissed

**LeadCard Component:**

```typescript
interface LeadCardProps {
  opportunity: MockOpportunity;
  onCall: () => void;
  onViewDetails: () => void;
  onDismiss: (reason: string) => void;
  onRemindLater: () => void;
}
```

Visual design:
- Color-coded left border based on priority (red/orange/yellow/green)
- Property address as headline
- Unit summary with age, brand, location
- Health score badge with color coding
- Job complexity indicator (helps prioritize)
- Context line explaining the opportunity
- Action buttons row

### Phase 3: Pipeline Overview Component

A visual CRM pipeline showing lead progression:

**Stages:**
1. **New** - Fresh leads, not yet contacted
2. **Contacted** - Spoke with homeowner
3. **Quoted** - Sent a quote
4. **Closed** - Won (converted) or Lost (declined)

**Metrics:**
- Count per stage
- Conversion rates
- Average time in stage
- Revenue potential (based on opportunity type)

### Phase 4: Quick Actions Bar

Fast access to key workflows:

| Action | Destination |
|--------|-------------|
| Start Inspection | Opens technician flow modal or navigates to inspection |
| View Properties | List of serviced properties |
| Pricing Setup | Configure install presets and service prices |
| Reports | Export activity summary |

### Phase 5: Real Data Integration (Future)

Once the mock UI is validated, wire up to Supabase:

```typescript
// Fetch opportunities for logged-in contractor
const { data: opportunities } = await supabase
  .from('opportunity_notifications')
  .select(`
    *,
    water_heater:water_heaters(
      *,
      property:properties(*)
    )
  `)
  .eq('contractor_id', userId)
  .eq('status', 'pending')
  .order('priority', { ascending: false })
  .order('created_at', { ascending: true });
```

---

## Component Breakdown

### 1. `src/pages/Contractor.tsx` (Expand)

```typescript
export default function Contractor() {
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-background">
      <header>...</header>
      
      <main className="p-4 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Critical" count={2} color="red" />
          <StatCard label="High" count={5} color="orange" />
          <StatCard label="Medium" count={12} color="yellow" />
          <StatCard label="Low" count={8} color="green" />
        </div>
        
        {/* Opportunity Feed */}
        <OpportunityFeed 
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
        />
        
        {/* Pipeline Overview */}
        <PipelineOverview />
        
        {/* Quick Actions */}
        <QuickActions />
      </main>
    </div>
  );
}
```

### 2. `src/components/contractor/OpportunityFeed.tsx`

```typescript
export function OpportunityFeed({ selectedPriority, onPriorityChange }) {
  const opportunities = useMockOpportunities(); // or useRealOpportunities()
  
  const filtered = selectedPriority 
    ? opportunities.filter(o => o.priority === selectedPriority)
    : opportunities;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Service Opportunities</h2>
        <PriorityFilter value={selectedPriority} onChange={onPriorityChange} />
      </div>
      
      {filtered.map(opportunity => (
        <LeadCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
```

### 3. `src/components/contractor/LeadCard.tsx`

```typescript
export function LeadCard({ opportunity }: { opportunity: MockOpportunity }) {
  const priorityColors = {
    critical: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    medium: 'border-l-yellow-500 bg-yellow-500/5',
    low: 'border-l-green-500 bg-green-500/5',
  };
  
  return (
    <div className={cn(
      "rounded-lg border-l-4 p-4",
      priorityColors[opportunity.priority]
    )}>
      {/* Header: Priority badge + Address */}
      <div className="flex items-start justify-between">
        <div>
          <Badge variant={...}>{opportunity.priority.toUpperCase()}</Badge>
          <h3 className="font-semibold mt-1">{opportunity.propertyAddress}</h3>
        </div>
        <HealthScoreBadge score={opportunity.healthScore} />
      </div>
      
      {/* Unit Summary */}
      <p className="text-sm text-muted-foreground mt-2">
        {opportunity.unitSummary}
      </p>
      
      {/* Context / Opportunity Reason */}
      <p className="text-sm mt-2">{opportunity.context}</p>
      
      {/* Job Complexity Indicator */}
      <div className="flex items-center gap-2 mt-3">
        <JobComplexityBadge complexity={opportunity.jobComplexity} />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="default">
          <Phone className="w-4 h-4 mr-1" /> Call
        </Button>
        <Button size="sm" variant="outline">View Details</Button>
        <Button size="sm" variant="ghost">Dismiss</Button>
      </div>
    </div>
  );
}
```

### 4. `src/components/contractor/PipelineOverview.tsx`

```typescript
export function PipelineOverview() {
  const pipeline = useMockPipeline();
  
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold mb-4">Lead Pipeline</h3>
      
      <div className="grid grid-cols-4 gap-2">
        {pipeline.stages.map(stage => (
          <div key={stage.name} className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stage.count}</div>
            <div className="text-xs text-muted-foreground">{stage.name}</div>
          </div>
        ))}
      </div>
      
      {/* Conversion funnel visualization */}
      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pipeline.conversionRate}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {pipeline.conversionRate}% conversion rate
      </p>
    </div>
  );
}
```

### 5. `src/data/mockContractorData.ts`

Generate realistic mock data based on existing scenarios:

```typescript
export const mockOpportunities: MockOpportunity[] = [
  {
    id: '1',
    propertyAddress: '1847 Sunset Dr, Phoenix AZ',
    customerName: 'Johnson Family',
    opportunityType: 'replacement_urgent',
    priority: 'critical',
    unitSummary: '12yr Rheem Gas Tank in Attic',
    healthScore: 24,
    failProbability: 78,
    jobComplexity: 'ELEVATED',
    context: 'Active leak detected during routine inspection',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    propertyAddress: '456 Oak Ave, Scottsdale AZ',
    customerName: 'Martinez Residence',
    opportunityType: 'warranty_expiring',
    priority: 'high',
    unitSummary: '5yr A.O. Smith Power Vent in Garage',
    healthScore: 62,
    failProbability: 18,
    jobComplexity: 'STANDARD',
    context: 'Factory warranty expires in 6 months - proactive replacement opportunity',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  // ... more scenarios
];
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Contractor.tsx` | **Modify** | Expand with full dashboard layout |
| `src/components/contractor/OpportunityFeed.tsx` | **Create** | Lead engine feed component |
| `src/components/contractor/LeadCard.tsx` | **Create** | Individual opportunity card |
| `src/components/contractor/PipelineOverview.tsx` | **Create** | CRM pipeline visualization |
| `src/components/contractor/QuickActions.tsx` | **Create** | Action buttons bar |
| `src/components/contractor/StatCard.tsx` | **Create** | Priority stat cards |
| `src/components/contractor/JobComplexityBadge.tsx` | **Create** | Complexity indicator |
| `src/data/mockContractorData.ts` | **Create** | Mock opportunities and pipeline data |

---

## Visual Design Principles

1. **Priority-First**: Color-coded left borders and badges make urgency immediately visible
2. **Scannable**: Key info (address, unit, health score) visible without expanding
3. **Action-Oriented**: Every card has clear next steps (Call, View, Dismiss)
4. **Mobile-Ready**: Cards stack vertically, touch-friendly action buttons
5. **Dark Mode Compatible**: Uses existing design system tokens

---

## Expected Outcome

After implementation, contractors will see:

1. **At a glance**: How many opportunities by priority level
2. **Feed of leads**: Sorted by urgency with all context needed to act
3. **Pipeline health**: Visual representation of lead progression
4. **One-tap actions**: Start new inspection, view pricing, access reports

This creates a "command center" that turns passive data collection into proactive revenue generation.
