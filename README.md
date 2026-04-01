# Kinetic Coach 

**An AI-powered, zero-decision fitness application built to eliminate gym decision fatigue.**

*Developed as the final project for ENTI 674: AI-Assisted Software Development in the Master of Management program at the Haskayne School of Business, University of Calgary.*

---

## 📖 Overview

Gym-goers at the beginner-to-intermediate level face a common set of challenges: they do not know how to structure an effective weekly plan, they struggle to maintain consistency, and the sheer variety of fitness content available online makes decision-making harder rather than easier. 

Kinetic Coach acts as a smart personal trainer. It is a highly opinionated, zero-decision daily flow application. The user opens the app and is told exactly what to do. By combining a minimal UI with an AI backend that generates weekly plans and a deterministic progression engine that adapts to performance, Kinetic removes the planning burden so users can focus entirely on execution.

## ✨ Key Features

* **Secure Authentication & Persistence:** Full OIDC/PKCE authentication via Replit, with all user profiles, active plans, and historical session logs securely persisted in a PostgreSQL database.
* **Frictionless Onboarding:** A streamlined 5-step flow capturing the user's goal, experience level, available equipment, time constraints, and training frequency.
* **AI-Generated Weekly Plans:** Contextually appropriate weekly workout schedules generated dynamically using Anthropic's Claude AI, with intelligent fallbacks to pre-validated templates to ensure sub-5-second load times.
* **Zero-Decision Daily View:** A clean dashboard that surfaces the current day's prescribed exercises, target sets, target reps, and suggested starting weights immediately upon login.
* **Deterministic Progression Engine:** A strict, rule-based backend system (distinct from the AI generation) that mathematically adjusts future workout weights based on logged performance (e.g., increasing weight after consecutive successful sessions, or implementing deloads after failures).

## 🛠️ Technology Stack

This project was built using modern, AI-assisted development tools, primarily developed within Replit.

* **Frontend:** Next.js / React, styled with Tailwind CSS
* **Backend:** Node.js API routes within the Next.js framework
* **Database:** PostgreSQL (with `users`, `profiles`, `weekly_plans`, `workout_sessions`, and `exercise_progression` schemas)
* **Authentication:** Replit Auth (OIDC)
* **AI Integration:** Anthropic Claude API (via Replit AI Integrations)
