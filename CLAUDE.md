# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hamilton Machine Timeline Entity — an OEE (Overall Equipment Effectiveness) plant performance tracker for Hamilton injection molding machines. Integrates with the IOsense IoT platform for real-time machine data, event tracking, and production monitoring.

## Repository Structure

There are **two separate frontend apps** in this repo:

- **`Frontend/plant-performance-tracker/`** — The main developed application. Vite + React 18 + TypeScript + shadcn/ui. This is where active development happens.
- **`frontend/`** — A bare Next.js 16 template (React 19, Tailwind CSS 4). Mostly scaffolding, not the active app.

## Build & Dev Commands

### Main App (`Frontend/plant-performance-tracker/`)
```bash
cd Frontend/plant-performance-tracker
bun install          # uses bun (bun.lockb present)
bun run dev          # start dev server (Vite)
bun run build        # production build
bun run build:dev    # development build
bun run lint         # eslint
```

### Next.js Template (`frontend/`)
```bash
cd frontend
npm install
npm run dev          # next dev
npm run build        # next build
npm run lint         # eslint
```

## Architecture (Main App)

### Authentication Flow
- SSO-based: user arrives with `?token=xxx` URL param → `AuthService.validateSSOToken()` exchanges it for a Bearer JWT via IOsense connector API (`https://connector.iosense.io`)
- Fallback: reads `token`, `userId`, `organisation` from cookies or localStorage
- `AuthContext` (`src/contexts/AuthContext.tsx`) wraps the app and exposes `useAuth()` hook
- No login form — auth is cookie/SSO-based only

### IOsense API Service (`src/services/iosense.service.ts`)
All API calls go through a shared `request()` helper that injects Bearer token + organisation header. Key functions:
- `findUserDevices()` — paginated device list
- `getDeviceMetadata(devID)` — sensor metadata, params with visibility flag (`t=1`)
- `getWidgetData()` — aggregated time-series data
- `getAllEventCategories()` / `getEventLogs()` — event management
- `getCustomTableRows(devID, page, limit)` — custom table data (server-side pagination)

### Machine Timeline Data Flow
1. `getCustomTableRows("Hamilton_Master")` → returns rows where D3 = machine name, D4 = device ID
2. User selects machine → D4 device ID → `getDeviceMetadata(D4)` → filter sensors where `params[sensor].t = "1"` → dynamic column headers
3. `getCustomTableRows(D4, page, limit)` → populate data table with server-side pagination
4. Chart columns (start time, end time, machine status, reason) are discovered dynamically from metadata sensor names

### UI Structure
- **Index page** has two tabs: "Source Page" and "Logbooks"
- **Source Page** → `MachineTimeline` component: Highcharts xrange timeline chart + filterable data table with server-side pagination
- **Logbooks** → `OEEDashboard` with gauge cards, breakdown charts, pareto charts, donut charts (currently uses mock data)
- UI primitives: shadcn/ui (Radix-based), animations via Framer Motion, charts via Highcharts + Recharts

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig)

## MCP Tools (REQUIRED)

### IOsense SDK MCP
- **Always use real IOsense data** — never mock data for API-connected features
- Use the `iosense-sdk` MCP tools: `get_workflow` → `get_flows` → `get_code` to discover and implement new API integrations
- Track all API FunctionID calls in `iosense.md` at the repo root
- IOsense connector base URL: `https://connector.iosense.io`
- Data types: devices (influx), assets, insights (bruce), enms, events

### Figma MCP
- If Figma link provided → use Figma MCP to build dynamic apps connected to IOsense SDK APIs

### Playwright
- Run Playwright tests before marking features as complete
- Take screenshots, fix console errors, confirm real IOsense data

## Key Conventions

- All IOsense API calls require a valid Bearer token from `authService.getAccessToken()`
- Device sensors use IDs like D0, D1, D2... with metadata params controlling visibility (`t=1` means visible)
- OEE constants (plants, machines, moulds, downtime/rejection reasons) live in `src/constants/oeeConstants.ts`
- Track API FunctionID calls in `iosense.md` whenever new endpoints are integrated
- Use .env for secrets — never hardcode credentials
