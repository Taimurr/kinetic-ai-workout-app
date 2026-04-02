# Kinetic Coach — Technical Documentation & Setup Guide

**Version 2.0 — April 2026**

Kinetic Coach is an AI-powered, web-based workout coach application designed to help beginner-to-intermediate gym-goers stay consistent by eliminating decision fatigue. The user opens the app and is told exactly what to do — no planning, no guesswork.

This project was developed for **ENTI 674: AI-Assisted Software Development** within the **Master of Management program at the Haskayne School of Business, University of Calgary**.

---

## 1. Architecture Overview

Kinetic Coach is a **pnpm monorepo** containing four workspace artifacts and six shared libraries. The primary application is a React web frontend backed by an Express API server, both communicating with a PostgreSQL database.

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────┐
│                  CLIENT (Browser)                 │
│                                                   │
│   React 19 + Vite 7 + Tailwind CSS 4             │
│   Wouter (routing) · Framer Motion (animations)  │
│   Radix UI + shadcn (components)                  │
│                                                   │
│   Pages: Login → Onboarding → Plan → Workout      │
│          → Session → Progress                     │
└───────────────────────┬──────────────────────────┘
                        │ HTTP (fetch, credentials: include)
                        │ Cookie-based session auth
                        ▼
┌──────────────────────────────────────────────────┐
│               API SERVER (Express 5)              │
│                                                   │
│   Routes: /auth, /profile, /plan, /sessions,      │
│           /generate-plan, /healthz                │
│                                                   │
│   Middleware: authMiddleware (session lookup)      │
│                                                   │
│   Core Logic:                                     │
│   ├── AI Plan Generation (Claude API + fallback)  │
│   └── Progression Engine (deterministic rules)    │
└──────────┬──────────────────────┬────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐   ┌──────────────────────┐
│   PostgreSQL    │   │  Anthropic Claude API │
│                 │   │  (claude-sonnet-4-6)  │
│  Tables:        │   │                      │
│  · users        │   │  Used ONLY for:      │
│  · sessions     │   │  · Plan generation   │
│  · profiles     │   │  · Exercise content  │
│  · weekly_plans │   │                      │
│  · workout_     │   │  NOT used for:       │
│    sessions     │   │  · Progression logic │
│  · exercise_    │   │  · Weight changes    │
│    progression  │   └──────────────────────┘
└─────────────────┘
```

### 1.2 Monorepo Workspace Structure

The project uses `pnpm-workspace.yaml` to define four artifact packages and six library packages:

**Artifacts (deployable applications):**

| Package | Path | Description |
|---|---|---|
| `@workspace/api-server` | `artifacts/api-server` | Express 5 API server (Node.js, ESM) |
| `@workspace/kinetic-web` | `artifacts/kinetic-web` | React frontend (Vite 7, Tailwind CSS 4) |
| `@workspace/mobile` | `artifacts/mobile` | Expo React Native companion app (experimental) |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox` | UI mockup/prototyping sandbox |

**Libraries (shared code):**

| Package | Path | Description |
|---|---|---|
| `@workspace/db` | `lib/db` | Drizzle ORM schemas, migrations, and database connection pooling |
| `@workspace/api-client-react` | `lib/api-client-react` | Auto-generated React Query API client (via Orval from OpenAPI spec) |
| `@workspace/api-zod` | `lib/api-zod` | Auto-generated Zod validation schemas (via Orval from OpenAPI spec) |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI specification and Orval code generation config |
| `@workspace/replit-auth-web` | `lib/replit-auth-web` | Frontend auth hook (`useAuth`) and `loginWithCredentials` helper |
| `@workspace/integrations-anthropic-ai` | `lib/integrations-anthropic-ai` | Anthropic Claude SDK client wrapper |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 19.1.0 | Component UI |
| Build Tool | Vite | 7.3.0 | Dev server + production bundler |
| CSS | Tailwind CSS | 4.1.14 | Utility-first styling (Kinetic Onyx dark theme) |
| Routing | Wouter | 3.3.5 | Lightweight client-side routing |
| Animations | Framer Motion | 12.23.24 | Page transitions and micro-interactions |
| UI Components | Radix UI + shadcn/ui | Various | Accessible, unstyled primitives |
| State Management | React Context + custom `useStore` hook | — | Global app state (auth, plan, sessions) |
| Server Data | TanStack React Query | 5.90.21 | Server state caching and mutations |
| Backend Framework | Express | 5.x | HTTP API routing |
| ORM | Drizzle ORM | 0.45.1 | Type-safe PostgreSQL queries |
| Database | PostgreSQL | — | Persistent data storage |
| AI | Anthropic Claude API | `claude-sonnet-4-6` | Workout plan generation |
| Auth | Custom cookie-based sessions | — | Demo-mode sign-in (SHA-256 user IDs) |
| Package Manager | pnpm | — | Monorepo workspace management |
| Language | TypeScript | 5.9.2 | End-to-end type safety |
| Logging | Pino + pino-http | 9.x / 10.x | Structured JSON logging |

---

## 3. Database Schema

The database is managed via Drizzle ORM with schemas defined in `lib/db/src/schema/`. All tables use `gen_random_uuid()` for primary key generation.

### 3.1 Auth Tables (`lib/db/src/schema/auth.ts`)

**`users`** — User accounts

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `varchar` | PK, default `gen_random_uuid()` | In practice: SHA-256 hex of the user's email |
| `email` | `varchar` | UNIQUE | Lowercase, trimmed |
| `first_name` | `varchar` | nullable | Derived from email prefix on demo login |
| `last_name` | `varchar` | nullable | Always null in demo mode |
| `profile_image_url` | `varchar` | nullable | Always null in demo mode |
| `created_at` | `timestamptz` | NOT NULL, default NOW | |
| `updated_at` | `timestamptz` | NOT NULL, auto-update | |

**`sessions`** — Server-side session store

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `sid` | `varchar` | PK | 64-char hex (32 random bytes) |
| `sess` | `jsonb` | NOT NULL | Contains `{ user: AuthUser }` |
| `expire` | `timestamp` | NOT NULL, indexed | Session TTL: 7 days from creation |

### 3.2 Kinetic Tables (`lib/db/src/schema/kinetic.ts`)

**`profiles`** — User onboarding data

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `varchar` | PK | |
| `user_id` | `varchar` | FK → users, UNIQUE, CASCADE | One profile per user |
| `goal` | `varchar` | NOT NULL | `strength`, `muscle_gain`, `weight_loss`, `general_fitness` |
| `experience_level` | `varchar` | NOT NULL | `beginner`, `some_experience`, `intermediate` |
| `equipment` | `varchar` | NOT NULL | `full_gym`, `dumbbells_only`, `barbells_and_dumbbells`, `bodyweight_only` |
| `time_per_workout` | `integer` | NOT NULL | 30, 45, 60, or 75 (minutes) |
| `days_per_week` | `integer` | NOT NULL | 2, 3, 4, or 5 |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL, auto-update | |

**`weekly_plans`** — AI-generated workout plans

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `varchar` | PK | |
| `user_id` | `varchar` | FK → users, UNIQUE, CASCADE | One active plan per user (upserted) |
| `plan_data` | `jsonb` | NOT NULL | Full plan structure (see Section 4.1) |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL, auto-update | |

**`workout_sessions`** — Completed workout logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `varchar` | PK | |
| `user_id` | `varchar` | FK → users, CASCADE | |
| `day` | `varchar` | NOT NULL | Day name (e.g., "Monday") |
| `date` | `timestamptz` | NOT NULL | Session date |
| `duration_seconds` | `integer` | NOT NULL, default 0 | Total workout duration |
| `sets_logged` | `jsonb` | NOT NULL, default [] | Array of `{ exercise, reps, weight_kg }` |
| `completed` | `boolean` | NOT NULL, default false | |
| `created_at` | `timestamptz` | NOT NULL | |

**`exercise_progression`** — Per-exercise weight tracking

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `varchar` | PK | |
| `user_id` | `varchar` | FK → users, CASCADE | |
| `exercise_name` | `text` | NOT NULL | Exercise name (matches plan exercise names) |
| `category` | `varchar` | NOT NULL | `primary`, `accessory`, or `isolation` |
| `current_weight_kg` | `real` | NOT NULL, default 0 | Current prescribed weight |
| `consecutive_successes` | `integer` | NOT NULL, default 0 | Resets on failure or after progression |
| `consecutive_failures` | `integer` | NOT NULL, default 0 | Resets on success or after deload |
| `updated_at` | `timestamptz` | NOT NULL, auto-update | |

---

## 4. Core Systems

### 4.1 AI Plan Generation

The plan generation system uses a **hybrid approach**: Claude AI generates personalized plans, with automatic fallback to pre-validated templates.

**Location:** `artifacts/api-server/src/routes/profile.ts` (triggered on profile save) and `artifacts/api-server/src/routes/generate-plan.ts` (standalone endpoint).

**AI Call:**

- Model: `claude-sonnet-4-6`
- Max tokens: 8,192
- System prompt instructs Claude to return strict JSON matching the plan schema
- User message includes: goal, experience level, equipment, time per workout, days per week

**Plan JSON Schema:**

```json
{
  "days": [
    {
      "day": "Monday",
      "type": "training",
      "title": "Upper Body Push",
      "estimated_duration": 45,
      "intensity": "moderate",
      "exercises": [
        {
          "name": "Bench Press",
          "category": "primary",
          "muscle_group": "chest",
          "sets": 3,
          "reps": 8,
          "suggested_weight_kg": 60,
          "rest_seconds": 90,
          "description": "Lie on bench, grip bar shoulder-width, lower to chest, press up."
        }
      ]
    },
    {
      "day": "Tuesday",
      "type": "rest",
      "title": "Rest Day",
      "estimated_duration": 0,
      "intensity": "low",
      "exercises": []
    }
  ]
}
```

**AI Constraints Enforced via Prompt:**

1. Plan must cover exactly N training days (matching user's `days_per_week`)
2. Remaining days are rest days
3. No more than 2 consecutive training days before a rest day (except 2-day plans)
4. Exercise selection respects equipment availability
5. Volume (sets × reps) follows experience-level ranges: beginner (2–3 sets, 8–12 reps), some experience (3 sets, 6–12 reps), intermediate (3–4 sets, 5–12 reps)
6. Conservative starting weights for beginners
7. 4–7 exercises per workout depending on time available

**Template Fallback (`buildTemplatePlan`):**

If the Claude API call fails, times out, or returns unparseable JSON, the system falls back to `buildTemplatePlan()` which constructs a valid plan from hardcoded exercise libraries organized by goal (strength, muscle gain, weight loss, general fitness). Template plans follow the same JSON schema and respect the user's days-per-week and time constraints.

### 4.2 Deterministic Progression Engine

The progression engine is implemented as pure TypeScript business logic — **not AI**. This is a critical architectural decision: progression behavior must be deterministic, transparent, and reproducible.

**Location:** `artifacts/api-server/src/lib/progression.ts`

**When it runs:** After every completed workout session (`POST /api/sessions` with `completed: true`), the engine evaluates each exercise in the day's plan against the logged sets.

**Progression Rules:**

| Rule | Trigger | Action |
|---|---|---|
| **Weight Increase** | All prescribed reps completed for all sets at current weight for 2 consecutive sessions | Increase weight by 2.5 kg (compound lifts) or 1.25 kg (isolation) |
| **Weight Decrease (Deload)** | Failed to complete all reps for 2 consecutive sessions | Reduce weight by 10% (rounded to nearest increment, minimum = 1 increment) |
| **Success Reset** | After a weight increase | `consecutiveSuccesses` resets to 0 |
| **Failure Reset** | After a deload | `consecutiveFailures` resets to 0 |

**Success Evaluation Logic:**

An exercise is considered "successful" if the number of logged sets matching the exercise name is ≥ the prescribed set count, AND every one of those logged sets has `reps >= prescribed_reps` and `weight_kg >= prescribed_weight`.

**Weight Application:**

When `GET /api/plan` is called, the server fetches the stored plan from `weekly_plans` and overlays progression weights from `exercise_progression` onto each exercise's `suggested_weight_kg` before returning the response. This means the frontend always sees the most current weights without needing to know about progression logic.

### 4.3 Authentication System

The current authentication system uses **demo-mode credentials** — any email and password combination is accepted. This was implemented to replace the original Replit OIDC integration, which was removed to eliminate external auth dependencies.

**How it works:**

1. User submits email + password via `POST /api/login`
2. Server computes `userId = SHA-256(email.toLowerCase().trim()).slice(0, 32)`
3. Server upserts a row in the `users` table
4. Server creates a session row in the `sessions` table with a 64-char random hex SID
5. Server sets an `httpOnly` cookie named `sid` with 7-day TTL
6. On subsequent requests, `authMiddleware` reads the `sid` cookie, looks up the session, and populates `req.user`

**Files involved:**

| File | Responsibility |
|---|---|
| `artifacts/api-server/src/lib/auth.ts` | Session CRUD operations (`createSession`, `getSession`, `deleteSession`, `clearSession`, `getSessionId`) |
| `artifacts/api-server/src/routes/auth.ts` | `POST /login`, `GET /auth/user`, `GET/POST /logout` |
| `artifacts/api-server/src/middlewares/authMiddleware.ts` | Reads session from cookie, sets `req.user`, provides `req.isAuthenticated()` |
| `lib/replit-auth-web/src/use-auth.ts` | Frontend `useAuth()` hook and `loginWithCredentials()` helper |

---

## 5. Frontend Architecture

### 5.1 Application Flow

```
LoginScreen
    │ loginWithCredentials(email, password)
    │ → POST /api/login → cookie set → page reload
    ▼
AuthGuard
    │ useAuth() checks /api/auth/user
    │ If no profile → redirect to /onboarding
    ▼
Onboarding (5 steps)
    │ Goal → Experience → Equipment → Time → Days
    │ → POST /api/profile (saves profile + generates AI plan)
    ▼
Plan (weekly dashboard)
    │ Shows all 7 days, today highlighted
    │ Completed sessions marked, weekly stats
    │ Tap a day → Workout detail
    ▼
Workout (daily detail)
    │ Exercise list with sets, reps, weight, descriptions
    │ "Start Workout" → Session
    ▼
Session (active logging)
    │ Sequential set logging with rep/weight adjusters
    │ Rest timer between sets, skip functionality
    │ "Finish Workout" → saves to server → progression runs
    ▼
Progress
    │ Streak counter, total workouts, minutes, sets
    │ Reverse-chronological workout history
```

### 5.2 State Management

The app uses a custom `useStore` hook (`artifacts/kinetic-web/src/lib/store.ts`) exposed via React Context (`KineticProvider`):

| State | Source | Description |
|---|---|---|
| `auth` | `useAuth()` hook | User object, loading state, login/logout functions |
| `profile` | `GET /api/profile` | User's onboarding preferences |
| `plan` | `GET /api/plan` | Active weekly plan (with progression weights) |
| `sessions` | `GET /api/sessions` | All completed workout session logs |

All API calls use `credentials: 'include'` to send the session cookie. On initial load (after auth resolves), the store fetches profile, plan, and sessions in parallel via `Promise.all`.

### 5.3 Design System — "Kinetic Onyx"

The UI follows a dark, premium fitness aesthetic with neon lime accents:

| Token | Value | Usage |
|---|---|---|
| `#CCFF00` | Neon Lime (Primary) | CTAs, active states, brand, progress bars |
| `#121212` | Near Black | Page backgrounds |
| `#1A1A1A` | Dark Surface | Cards, inputs |
| `#FFFFFF` | White | Primary text |
| `rgba(255,255,255,0.4)` | Muted White | Secondary text, descriptions |
| `rgba(255,255,255,0.1)` | Subtle | Borders, dividers |

**Typography:** Outfit (headlines, bold, uppercase), Space Mono (labels, stats, monospaced data), system sans-serif (body).

**UI Patterns:** Rounded-2xl cards, full-width lime CTA buttons, progress bar at onboarding top, "TODAY" pill badges, animated page transitions (Framer Motion slide/fade).

---

## 6. API Reference

### 6.1 Authentication

**`POST /api/login`**

Accepts any email/password (demo mode). Creates or upserts a user and returns a session.

Request:
```json
{ "email": "user@example.com", "password": "anything" }
```

Response (200):
```json
{
  "user": {
    "id": "a1b2c3d4...",
    "email": "user@example.com",
    "firstName": "user",
    "lastName": null,
    "profileImageUrl": null
  }
}
```

Sets cookie: `sid=<64-char-hex>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`

**`GET /api/auth/user`**

Returns the current authenticated user from the session cookie, or `{ "user": null }`.

**`GET /api/logout`** and **`POST /api/logout`**

Clears the session from the database and removes the cookie. GET redirects to `/`, POST returns `{ "success": true }`.

### 6.2 Profile & Plan Generation

**`GET /api/profile`** (Auth required)

Returns `{ "profile": { goal, experience_level, equipment, time_per_workout, days_per_week } }` or `{ "profile": null }` if onboarding not completed.

**`POST /api/profile`** (Auth required)

Saves onboarding data and triggers AI plan generation. Returns the generated weekly plan JSON directly.

Request:
```json
{
  "goal": "muscle_gain",
  "experience_level": "some_experience",
  "equipment": "full_gym",
  "time_per_workout": 45,
  "days_per_week": 4
}
```

Response: Full plan JSON (see Section 4.1 for schema).

### 6.3 Weekly Plan

**`GET /api/plan`** (Auth required)

Returns the active weekly plan with progression-adjusted weights. The server fetches the stored plan from `weekly_plans`, looks up all entries in `exercise_progression` for this user, and overlays current weights onto matching exercises before returning.

### 6.4 Workout Sessions

**`GET /api/sessions`** (Auth required)

Returns `{ "sessions": [...] }` — all workout logs in reverse chronological order.

**`POST /api/sessions`** (Auth required)

Saves a completed workout session and runs the progression engine.

Request:
```json
{
  "day": "Monday",
  "date": "2026-04-01T10:00:00.000Z",
  "duration_seconds": 2700,
  "sets_logged": [
    { "exercise": "Bench Press", "reps": 8, "weight_kg": 60 },
    { "exercise": "Bench Press", "reps": 8, "weight_kg": 60 },
    { "exercise": "Bench Press", "reps": 8, "weight_kg": 60 }
  ],
  "completed": true
}
```

Response:
```json
{
  "session": { "id": "...", "day": "Monday", "date": "...", "duration_seconds": 2700, "sets_logged": [...], "completed": true },
  "progression_changes": [
    { "exercise": "Bench Press", "old_weight_kg": 60, "new_weight_kg": 62.5, "reason": "Completed all sets for 2 sessions. Weight increased by 2.5kg." }
  ]
}
```

---

## 7. Setup & Installation

### 7.1 Prerequisites

- **Node.js** v24 or higher
- **pnpm** package manager (`npm install -g pnpm`)
- **PostgreSQL** instance (local, Docker, or cloud — e.g., Neon, Supabase, Railway)
- **Anthropic API key** (optional — the app falls back to template plans without it)

### 7.2 Installation

```bash
# 1. Clone the repository
git clone https://github.com/Taimurr/kinetic-ai-workout-app.git
cd kinetic-ai-workout-app

# 2. Install all workspace dependencies
pnpm install

# 3. Set up environment variables (see 7.3)

# 4. Push database schema
cd lib/db
pnpm run push
cd ../..

# 5. Start the development server
pnpm dev
```

### 7.3 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Yes | Server port (e.g., `3000`) |
| `BASE_PATH` | Yes | Base URL path (e.g., `/`) |
| `SESSION_SECRET` | Yes | Cookie parser secret (any random string) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | No | Anthropic API key for Claude plan generation |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | No | Anthropic API base URL (defaults to standard) |

### 7.4 Database Migrations

Kinetic uses Drizzle Kit's `push` command for schema management:

```bash
cd lib/db

# Apply schema to database (safe — only adds/alters, never drops)
pnpm run push

# Force push (caution — may drop columns)
pnpm run push-force
```

---

## 8. Development Workflow

### 8.1 Build & Typecheck

```bash
# Full typecheck across all packages
pnpm run typecheck

# Full production build
pnpm run build
```

### 8.2 Code Generation (API Client)

The API client and Zod schemas are auto-generated from the OpenAPI spec using Orval:

```bash
cd lib/api-spec
pnpm exec orval
```

This generates:
- `lib/api-client-react/src/generated/` — React Query hooks and TypeScript types
- `lib/api-zod/src/generated/` — Zod validation schemas

### 8.3 Key Development Files

| What you're working on | Files to edit |
|---|---|
| Database schema | `lib/db/src/schema/auth.ts`, `lib/db/src/schema/kinetic.ts` |
| API routes | `artifacts/api-server/src/routes/*.ts` |
| Progression logic | `artifacts/api-server/src/lib/progression.ts` |
| AI prompt engineering | `artifacts/api-server/src/routes/generate-plan.ts` (system prompt), `artifacts/api-server/src/routes/profile.ts` |
| Frontend pages | `artifacts/kinetic-web/src/pages/*.tsx` |
| Global state | `artifacts/kinetic-web/src/lib/store.ts` |
| Auth system | `artifacts/api-server/src/routes/auth.ts`, `lib/replit-auth-web/src/use-auth.ts` |

---

## 9. AI-Assisted Development Process

This application was built primarily using AI-assisted development tools as part of the ENTI 674 course curriculum:

1. **Ideation & PRD:** The Product Requirements Document was developed collaboratively with Anthropic Claude, covering 42 user stories, data models, and system architecture.
2. **Prompt Engineering for Replit Agent:** A comprehensive 3,000-word structured prompt was crafted to guide Replit Agent through the full-stack build, encoding the design system, database schema, API structure, and UI specifications.
3. **Primary Development:** Replit Agent built the initial application across multiple iterations, with manual intervention for debugging and refinement.
4. **Auth Migration:** The original Replit OIDC authentication was replaced with a custom demo-mode auth system (6 files changed) to remove external dependencies.
5. **Progression Engine:** The deterministic progression logic was developed as a standalone module, explicitly separated from AI to ensure reproducible, transparent behavior.
6. **Design System:** The "Kinetic Onyx" visual language (dark backgrounds, neon lime accents, Outfit typography) was defined upfront using Google Stitch and enforced consistently across all screens.

---

## 10. Security Considerations

- **Demo Mode:** The current authentication accepts any credentials. This is intentional for demonstration and educational purposes. A production deployment would require proper authentication (OAuth, email verification, password hashing).
- **Session Security:** Sessions use 256-bit random IDs, are stored server-side in PostgreSQL, and transmitted via `HttpOnly` cookies.
- **API Key Protection:** The Anthropic API key is stored as an environment variable and never exposed to the frontend. All AI calls are made server-side.
- **Input Validation:** API routes validate required fields before database operations. Zod schemas provide type-safe validation for API contracts.
- **CORS:** Configured to allow credentials with origin matching enabled.

---

## 11. Known Limitations

- Authentication is demo-mode only (no password hashing, no email verification)
- No offline support or local storage fallback for workout logging
- Single active plan per user (no plan history beyond the current week)
- Progression engine evaluates per-session only (no multi-week volume progression in current build)
- Mobile app (Expo) is experimental and not feature-complete
- No exercise substitution AI in the current build
- Template fallback plans use the same exercise set regardless of equipment selection
