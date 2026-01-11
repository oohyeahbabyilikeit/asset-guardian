# Opterra Water Heater Management Platform

A comprehensive water heater inspection, assessment, and maintenance platform built for both homeowners and plumbing contractors.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components         │  Hooks                  │
│  - Index        │  - CommandCenter    │  - useDataPlateScan     │
│  - TestHarness  │  - TechnicianFlow   │  - useConditionScan     │
│                 │  - OnboardingFlow   │  - useOfflineSync       │
│                 │  - HealthGauge      │  - useTieredPricing     │
├─────────────────────────────────────────────────────────────────┤
│                      State & Data Layer                         │
│  - React Query (server state)                                   │
│  - Local state (React useState)                                 │
│  - IndexedDB (offline storage via idb)                          │
├─────────────────────────────────────────────────────────────────┤
│                    Backend (Lovable Cloud)                      │
│  - Edge Functions (AI analysis, pricing, OCR)                   │
│  - PostgreSQL (assessments, properties, water heaters)          │
│  - Row Level Security (role-based access)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

| Feature | Description | Key Files |
|---------|-------------|-----------|
| **Data Plate Scanning** | AI-powered OCR to extract water heater specs | `useDataPlateScan.ts`, `scan-data-plate/` |
| **Opterra Algorithm** | Risk assessment scoring for water heaters | `opterraAlgorithm.ts` |
| **Tiered Pricing** | Multi-tier replacement quotes | `useTieredPricing.ts`, `infrastructureIssues.ts` |
| **Offline Sync** | Works without internet, syncs later | `offlineDb.ts`, `useOfflineSync.ts` |
| **Technician Flow** | Multi-step inspection wizard | `TechnicianFlow.tsx`, `steps/technician/` |

## Project Structure

```
src/
├── components/           # React components
│   ├── steps/           # Multi-step flow components
│   │   └── technician/  # Technician inspection steps
│   └── ui/              # Shadcn UI primitives
├── hooks/               # Custom React hooks
├── lib/                 # Business logic & utilities
│   └── services/        # External service integrations
├── pages/               # Route-level components
├── types/               # TypeScript type definitions
└── integrations/        # Backend client (Supabase)

supabase/
└── functions/           # Edge functions (serverless)
    ├── scan-data-plate/ # OCR water heater labels
    ├── lookup-price/    # AI-powered pricing
    └── analyze-*/       # Various AI analysis endpoints

docs/                    # You are here!
```

## Documentation Index

- [Components Guide](./components.md) - UI component library
- [Hooks Reference](./hooks.md) - Custom hooks API
- [Business Logic](./lib.md) - Algorithms & calculations
- [Backend Functions](./edge-functions.md) - Serverless API
- [Database Schema](./database.md) - Tables & relationships
- [Type Definitions](./types.md) - TypeScript interfaces
- [Technician Flow](./technician-flow.md) - Inspection process

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | React Query + useState |
| Routing | React Router v6 |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL with RLS |
| AI | Lovable AI Gateway (Gemini) |
| Offline | IndexedDB via `idb` |

## Environment Variables

```env
VITE_SUPABASE_URL=<auto-configured>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
VITE_SUPABASE_PROJECT_ID=<auto-configured>
```

Edge functions have access to:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` - For AI gateway access
