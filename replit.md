# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains Kinetic — an AI-powered workout coach web app with Replit Auth and full PostgreSQL persistence.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (fully used — profiles, plans, sessions, progression, auth sessions)
- **Auth**: Replit Auth (OIDC / PKCE) via `@workspace/replit-auth-web`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Web**: React + Vite (Kinetic Onyx theme)
- **Mobile**: Expo (React Native, secondary artifact)
- **AI**: Anthropic Claude via Replit AI Integrations

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   │   ├── src/lib/auth.ts          # OIDC session helpers
│   │   ├── src/lib/progression.ts   # Weight progression engine
│   │   ├── src/middlewares/authMiddleware.ts
│   │   └── src/routes/
│   │       ├── auth.ts      # /login /callback /logout /auth/user
│   │       ├── profile.ts   # GET/POST /profile
│   │       ├── plan.ts      # GET /plan (with progression weights)
│   │       ├── sessions.ts  # GET/POST /sessions
│   │       └── generate-plan.ts
│   ├── kinetic-web/        # Kinetic React+Vite web app
│   └── mobile/             # Kinetic Expo mobile app (secondary)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   │   └── src/schema/
│   │       ├── auth.ts      # sessionsTable, usersTable
│   │       └── kinetic.ts   # profiles, weekly_plans, workout_sessions, exercise_progression
│   ├── replit-auth-web/    # useAuth() React hook (browser)
│   └── integrations-anthropic-ai/ # Anthropic AI SDK wrapper
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Kinetic Web App — Features

### Web (artifacts/kinetic-web)
- **Auth**: Replit OIDC login gate — shows branded login screen if not authenticated
- **Onboarding**: 5-step flow (goal, experience, equipment, time, days) — persisted to PostgreSQL
- **AI Plan Generation**: `POST /api/profile` saves profile + generates plan via Claude claude-sonnet-4-6
- **Weekly Plan View**: Dark premium dashboard; plan fetched from `/api/plan` with live progression weights
- **Daily Workout View**: Exercise cards with category, target, and current progression weight
- **Session Logging**: Real-time set logging; `POST /api/sessions` saves and triggers progression engine
- **Progress Tracking**: Session history from PostgreSQL via `GET /api/sessions`
- **Progression Engine**: 2 consecutive successes → +2.5kg compound / +1.25kg isolation; 2 failures → −10% deload

### API (artifacts/api-server)
- `GET  /api/auth/user` — Current auth user
- `GET  /api/login` — Start OIDC flow
- `GET  /api/callback` — OIDC callback, upserts user, creates session
- `GET  /api/logout` — Clear session + OIDC logout
- `GET  /api/profile` — Get user profile
- `POST /api/profile` — Save profile + generate AI plan
- `GET  /api/plan` — Current plan with progression weights applied
- `GET  /api/sessions` — All workout sessions
- `POST /api/sessions` — Log session + trigger progression rules
- `POST /api/generate-plan` — Standalone AI plan generation (unauthenticated)
- `GET  /api/healthz` — Health check

## Design System — Kinetic Onyx
- Background: `#121212`
- Primary (neon lime): `#CCFF00`
- Surface cards: `#1A1A1A`
- Typography: Outfit (headings) + Space_Mono (labels)
- Dark-only mode

## Progression Engine Rules
- Track consecutive success/failure per exercise + category in `exercise_progression` table
- Success = all sets completed at or above prescribed reps and weight
- 2 consecutive successes → weight + 2.5kg (compound/primary/accessory) or + 1.25kg (isolation)
- 2 consecutive failures → weight × 0.9, rounded to nearest 1.25kg increment
- Progression weights override `suggested_weight_kg` when serving `/api/plan`

## Key Technical Notes
- Auth uses OIDC/PKCE via Replit — no password storage
- Sessions stored in PostgreSQL `sessions` table (not express-session)
- `cookie-parser` + CORS `credentials: true` configured in `app.ts`
- All frontend data fetching uses `credentials: 'include'` for cookie auth
- `useStore` in `store.ts` fetches all data from API on mount (replaces localStorage)
- Context type updated: `setProfile` returns `Promise<WeeklyPlan>`, `addSession` returns `Promise<void>`
