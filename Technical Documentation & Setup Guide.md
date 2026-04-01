# Kinetic Coach: System Documentation & Setup Guide

[cite_start]**Kinetic Coach** is an AI-powered, web-based workout coach application designed to help beginner-to-intermediate gym-goers stay consistent by eliminating decision fatigue[cite: 6]. [cite_start]This application operates as a "smart personal trainer," providing a zero-decision daily flow where the user is told exactly what to do each day[cite: 7, 11].

This project was developed for **ENTI 674: AI-Assisted Software Development** within the **Master of Management program at the Haskayne School of Business, University of Calgary**.

---

## 🛠️ Technical Stack

[cite_start]This project leverages a modern, AI-integrated stack for high performance and rapid development[cite: 227]:

* [cite_start]**Frontend**: React and Next.js for a responsive, mobile-optimized web experience[cite: 229].
* [cite_start]**Backend**: Node.js with an Express API layer for business logic and AI orchestration[cite: 230].
* **Database**: PostgreSQL for persistent storage of user profiles, workout plans, and session logs.
* **AI Integration**: Anthropic Claude API (via Replit AI Integrations) for generative plan creation.
* **Authentication**: Replit Auth (OIDC/PKCE) for secure user sessions and data persistence.

---

## ✨ Core Features

### 1. AI-Hybrid Plan Generation
[cite_start]The system uses a hybrid approach to generate workout plans within a 5-second target latency[cite: 194, 195]:
* [cite_start]**Template Baseline**: Maintains a library of pre-validated workout templates[cite: 196].
* **AI Customization**: Claude AI customizes these templates based on the user's goal, experience level, and available equipment.

### 2. Deterministic Progression Engine
[cite_start]A strict, rule-based backend engine (separate from the AI) handles weight adjustments to ensure safe and steady progress[cite: 131, 232]:
* **Progression**: If a user completes all prescribed reps for 2 consecutive sessions, the engine increases weight by 2.5 kg (compound lifts) or 1.25 kg (isolation lifts).
* **Regression**: If a user fails to hit minimum targets for 2 consecutive sessions, the engine maintains or reduces weight by one increment.
* [cite_start]**Volume**: Weekly volume (sets) increases after 3 weeks of consistent completion[cite: 138].

### 3. Frictionless Onboarding & Daily View
* [cite_start]**5-Step Survey**: Collects fitness goals, experience, equipment, and schedule availability without free-text input [cite: 74-85].
* [cite_start]**Zero-Decision Dashboard**: Surfaces the current day's workout immediately upon login, removing all planning burden[cite: 106, 108].
* [cite_start]**Frictionless Logging**: Designed to require a maximum of 2 taps per set to log completed exercises[cite: 33, 118].

---

## 🗄️ Database Schema

The PostgreSQL database manages several key entities to support long-term user progress:
* [cite_start]**Profiles**: Stores onboarding data like fitness goals and equipment access[cite: 246].
* [cite_start]**WeeklyPlans**: Versioned JSON contracts for the 7-day training schedule[cite: 242, 247].
* [cite_start]**WorkoutSessions**: Tracks the status and timing of daily sessions[cite: 248].
* [cite_start]**LoggedSets**: Captures actual reps and weights used for progression analysis[cite: 251].
* [cite_start]**ProgressionEvents**: Logs every weight or volume adjustment triggered by the engine[cite: 252].

---

## 🚀 Setup & Installation

### Prerequisites
* Node.js (v24 or higher).
* PNPM package manager.
* A running PostgreSQL instance.

### Installation
1.  **Clone the Repository**:
    ```bash git clone [https://github.com/Taimurr/kinetic-ai-workout-app.git](https://github.com/Taimurr/kinetic-ai-workout-app.git)
       cd kinetic-ai-workout-app
    ```
2.  **Install Dependencies**:
    ```bash pnpm install
    ```
3.  **Configure Environment**:
    Create a `.env` file with your `DATABASE_URL` and Replit authentication secrets.
4.  **Sync Database**:
    ```bash pnpm run db:push
    ```
5.  **Run Development Server**:
    ```bash pnpm dev
    ```

---

## 📈 Success Metrics (MVP)
* [cite_start]**Activation**: ≥ 80% onboarding completion rate[cite: 255].
* [cite_start]**Retention**: ≥ 40% of users returning to log a workout within 7 days[cite: 263].
* [cite_start]**Performance**: AI plan generation latency ≤ 5 seconds[cite: 270].
