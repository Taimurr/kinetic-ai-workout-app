# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains Kinetic — an AI-powered workout coach mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (not yet used in mobile — uses AsyncStorage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with expo-router
- **AI**: Anthropic Claude via Replit AI Integrations

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (plan generation, AI)
│   └── mobile/             # Kinetic Expo mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-anthropic-ai/ # Anthropic AI SDK wrapper
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Kinetic App — Features

### Mobile (artifacts/mobile)
- **Onboarding**: 5-step flow (goal, experience, equipment, time, days)
- **AI Plan Generation**: Calls Express API which calls Claude claude-sonnet-4-6 to generate personalized weekly plans
- **Weekly Plan View**: Dark premium dashboard showing 7-day plan with today highlighted
- **Daily Workout View**: Exercise cards with category, target, and load
- **Session Logging**: Real-time set logging with reps/weight inputs
- **Progress Tracking**: Streak count, total workouts, session history
- **Persistence**: AsyncStorage for all local state

### API (artifacts/api-server)
- `POST /api/generate-plan` — Calls Claude API to generate personalized weekly workout plan, falls back to template if AI fails
- `GET /api/healthz` — Health check

### Design System — Kinetic Onyx
- Background: `#121212`
- Primary (neon lime): `#CCFF00`  
- Surface cards: `#1A1A1A`
- Typography: Inter (400/500/600/700)
- Premium dark fitness aesthetic

## Key Technical Notes

- Mobile app uses AsyncStorage (no backend database in first build)
- AI plan generation via `POST /api/generate-plan` with Claude claude-sonnet-4-6
- Fallback template plans if AI call fails
- Expo Router for file-based navigation
- lucide-react-native for icons
