import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, jsonb, real, boolean, text } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const profilesTable = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  goal: varchar("goal").notNull(),
  experienceLevel: varchar("experience_level").notNull(),
  equipment: varchar("equipment").notNull(),
  timePerWorkout: integer("time_per_workout").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Profile = typeof profilesTable.$inferSelect;
export type InsertProfile = typeof profilesTable.$inferInsert;

export const weeklyPlansTable = pgTable("weekly_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  planData: jsonb("plan_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WeeklyPlanRow = typeof weeklyPlansTable.$inferSelect;

export const workoutSessionsTable = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  day: varchar("day").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  setsLogged: jsonb("sets_logged").notNull().default([]),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkoutSessionRow = typeof workoutSessionsTable.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessionsTable.$inferInsert;

export const exerciseProgressionTable = pgTable("exercise_progression", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  exerciseName: text("exercise_name").notNull(),
  category: varchar("category").notNull(),
  currentWeightKg: real("current_weight_kg").notNull().default(0),
  consecutiveSuccesses: integer("consecutive_successes").notNull().default(0),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ExerciseProgression = typeof exerciseProgressionTable.$inferSelect;
