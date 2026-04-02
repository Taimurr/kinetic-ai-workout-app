# Kinetic Coach

**An AI-powered, zero-decision fitness web application built to eliminate gym decision fatigue.**

*Developed as the final project for ENTI 674: AI-Assisted Software Development in the Master of Management program at the Haskayne School of Business, University of Calgary.*

---

## Overview

Beginner-to-intermediate gym-goers face a common set of challenges: they do not know how to structure an effective weekly plan, they struggle to maintain consistency, and the sheer variety of fitness content available online makes decision-making harder rather than easier.

Kinetic Coach acts as a smart personal trainer. It delivers a highly opinionated, zero-decision daily flow — the user opens the app and is told exactly what to do. By combining a dark, premium "Kinetic Onyx" UI with an AI backend that generates weekly plans and a deterministic progression engine that adapts to performance, Kinetic removes the planning burden so users can focus entirely on execution.

---

## Key Features

- **Demo-Mode Authentication:** Simple email/password sign-in (any credentials accepted) with server-side session persistence via cookie-based sessions stored in PostgreSQL. No external auth provider required.
- **Frictionless 5-Step Onboarding:** Captures the user's fitness goal, experience level, available equipment, time per workout, and days per week using tappable cards — zero free-text input required.
- **AI-Generated Weekly Plans:** Personalized 7-day workout schedules generated dynamically via the Anthropic Claude API (`claude-sonnet-4-6`), with automatic fallback to pre-validated template plans if the AI call fails or times out.
- **Zero-Decision Daily View:** A clean dashboard that surfaces the current day's prescribed exercises, target sets, target reps, and suggested weights immediately upon login.
- **Live Workout Logging:** Per-set logging with adjustable reps and weight, a built-in rest timer between sets, skip functionality, and real-time progress tracking within the session.
- **Deterministic Progression Engine:** A strict, rule-based backend system (separate from the AI) that adjusts future workout weights based on logged performance — increasing weight after 2 consecutive successful sessions or deloading after 2 consecutive failures.
- **Progress Tracking:** Workout history, day streaks, total minutes trained, and sets logged — all accessible from a dedicated progress screen.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 7, Tailwind CSS 4, Wouter (routing), Framer Motion (animations), Radix UI primitives, Recharts |
| **Backend** | Node.js + Express 5 (ESM), TypeScript |
| **Database** | PostgreSQL via Drizzle ORM |
| **AI Integration** | Anthropic Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| **Auth** | Cookie-based sessions with SHA-256 user ID derivation (demo mode) |
| **Package Manager** | pnpm (workspace monorepo) |
| **Mobile** | Expo / React Native (experimental companion app) |
| **Dev Platform** | Replit |

---

## Project Structure

```
kinetic-ai-workout-app/
├── artifacts/
│   ├── api-server/              # Express API server
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── auth.ts          # Session management (create/get/delete)
│   │       │   ├── progression.ts   # Deterministic weight progression engine
│   │       │   └── logger.ts        # Pino logger config
│   │       ├── middlewares/
│   │       │   └── authMiddleware.ts # Session lookup middleware
│   │       ├── routes/
│   │       │   ├── auth.ts          # POST /login, GET/POST /logout, GET /auth/user
│   │       │   ├── profile.ts       # GET/POST /profile (onboarding data + plan generation)
│   │       │   ├── plan.ts          # GET /plan (with progression weights applied)
│   │       │   ├── sessions.ts      # GET/POST /sessions (workout logging + progression)
│   │       │   ├── generate-plan.ts # POST /generate-plan (Claude AI + template fallback)
│   │       │   └── health.ts        # GET /healthz
│   │       ├── app.ts              # Express app setup (CORS, cookies, middleware)
│   │       └── index.ts            # Server entry point
│   ├── kinetic-web/              # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── onboarding.tsx   # 5-step onboarding flow
│   │       │   ├── plan.tsx         # Weekly plan dashboard
│   │       │   ├── workout.tsx      # Daily workout detail view
│   │       │   ├── session.tsx      # Active workout logging session
│   │       │   └── progress.tsx     # Stats, streaks, workout history
│   │       ├── lib/
│   │       │   ├── store.ts         # Global state (useStore hook)
│   │       │   └── context.tsx      # React context provider
│   │       ├── components/ui/       # Radix UI + shadcn components
│   │       └── App.tsx             # Root component, auth guard, login screen
│   ├── mobile/                   # Expo React Native app (experimental)
│   └── mockup-sandbox/           # UI mockup development sandbox
├── lib/
│   ├── db/                       # Drizzle ORM schemas + database connection
│   │   └── src/schema/
│   │       ├── auth.ts              # users, sessions tables
│   │       └── kinetic.ts           # profiles, weekly_plans, workout_sessions, exercise_progression
│   ├── api-client-react/         # Generated API client (Orval)
│   ├── api-zod/                  # Generated Zod validation schemas (Orval)
│   ├── api-spec/                 # OpenAPI spec + Orval config
│   ├── replit-auth-web/          # Auth hook (useAuth, loginWithCredentials)
│   └── integrations-anthropic-ai/ # Anthropic AI client wrapper
├── scripts/                      # Build scripts
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # pnpm monorepo workspace definition
└── tsconfig.base.json            # Shared TypeScript config
```

---

## Database Schema

The PostgreSQL database is managed through Drizzle ORM with the following tables:

| Table | Purpose |
|---|---|
| `users` | User accounts (id derived from SHA-256 of email, email, name, timestamps) |
| `sessions` | Server-side session store (session ID, JSON session data, expiry) |
| `profiles` | Onboarding data (goal, experience level, equipment, time per workout, days per week) |
| `weekly_plans` | AI-generated workout plans stored as JSONB (one active plan per user) |
| `workout_sessions` | Completed workout logs (day, date, duration, sets logged as JSONB, completion status) |
| `exercise_progression` | Per-exercise weight tracking for the progression engine (current weight, consecutive successes/failures) |

---

## API Endpoints

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | No | Accepts `{email, password}` — creates/upserts user, returns session cookie |
| `GET` | `/auth/user` | No | Returns current authenticated user or `null` |
| `GET/POST` | `/logout` | No | Clears session cookie |
| `GET` | `/profile` | Yes | Returns user's onboarding profile |
| `POST` | `/profile` | Yes | Saves onboarding data + generates AI workout plan |
| `GET` | `/plan` | Yes | Returns active weekly plan with progression weights applied |
| `POST` | `/generate-plan` | No | Standalone AI plan generation endpoint |
| `GET` | `/sessions` | Yes | Returns all workout session logs (reverse chronological) |
| `POST` | `/sessions` | Yes | Saves a completed workout + runs progression engine |
| `GET` | `/healthz` | No | Health check |

---

## Quick Start

### Prerequisites

- Node.js v24+
- pnpm (`npm install -g pnpm`)
- PostgreSQL instance (local or cloud)
- Anthropic API key (for AI plan generation; optional — template fallback works without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/Taimurr/kinetic-ai-workout-app.git
cd kinetic-ai-workout-app

# Install all workspace dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/kinetic
PORT=3000
BASE_PATH=/
SESSION_SECRET=any-random-string

# Optional — AI plan generation (falls back to templates without this)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Database Setup

```bash
# Push the Drizzle schema to your PostgreSQL database
cd lib/db
pnpm run push
```

### Run Development Server

```bash
# From the project root
pnpm dev
```

The API server starts on the configured `PORT` and the Vite dev server proxies API requests.

---

## Design System — "Kinetic Onyx"

| Token | Value |
|---|---|
| Primary (Neon Lime) | `#CCFF00` |
| Secondary | `#A2A003` |
| Tertiary | `#C4AB04` |
| Background | `#121212` |
| Surface | `#1A1A1A` |
| Text Primary | `#FFFFFF` |
| Text Muted | `#9CA3AF` |
| Headline Font | Outfit (bold, uppercase) |
| Mono/Labels | Space Mono |

---

## License

MIT

---

## Acknowledgments

This project was developed for ENTI 674: AI-Assisted Software Development in the Master of Management program at the Haskayne School of Business, University of Calgary. Development was primarily AI-assisted using Replit Agent, Anthropic Claude, and related tools.
