import { db, exerciseProgressionTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export interface SetLogged {
  exercise: string;
  reps: number;
  weight_kg: number;
}

export interface ExercisePrescription {
  name: string;
  category: "primary" | "accessory" | "isolation";
  sets: number;
  reps: number;
  suggested_weight_kg: number;
}

export interface ProgressionChange {
  exercise: string;
  old_weight_kg: number;
  new_weight_kg: number;
  reason: string;
}

const COMPOUND_INCREMENT = 2.5;
const ISOLATION_INCREMENT = 1.25;
const DELOAD_FACTOR = 0.9;

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function getIncrement(category: string): number {
  return category === "isolation" ? ISOLATION_INCREMENT : COMPOUND_INCREMENT;
}

function didCompleteAllReps(
  exerciseName: string,
  prescribed_sets: number,
  prescribed_reps: number,
  prescribed_weight: number,
  logged_sets: SetLogged[],
): boolean {
  const exerciseSets = logged_sets.filter(
    (s) => s.exercise.toLowerCase() === exerciseName.toLowerCase(),
  );
  if (exerciseSets.length < prescribed_sets) return false;
  return exerciseSets.every(
    (s) => s.reps >= prescribed_reps && s.weight_kg >= prescribed_weight,
  );
}

export async function applyProgression(
  userId: string,
  exercises: ExercisePrescription[],
  logsForSession: SetLogged[],
): Promise<ProgressionChange[]> {
  const changes: ProgressionChange[] = [];

  for (const exercise of exercises) {
    const existing = await db
      .select()
      .from(exerciseProgressionTable)
      .where(
        and(
          eq(exerciseProgressionTable.userId, userId),
          eq(exerciseProgressionTable.exerciseName, exercise.name),
        ),
      )
      .limit(1);

    const current = existing[0];
    const currentWeight = current?.currentWeightKg ?? exercise.suggested_weight_kg;
    const successes = current?.consecutiveSuccesses ?? 0;
    const failures = current?.consecutiveFailures ?? 0;
    const increment = getIncrement(exercise.category);

    const succeeded = didCompleteAllReps(
      exercise.name,
      exercise.sets,
      exercise.reps,
      currentWeight,
      logsForSession,
    );

    let newWeight = currentWeight;
    let newSuccesses = succeeded ? successes + 1 : 0;
    let newFailures = succeeded ? 0 : failures + 1;
    let reason = "";

    if (succeeded) {
      // Rule 1: 2 consecutive successes → increase weight
      if (newSuccesses >= 2) {
        const progressedWeight = roundToNearest(currentWeight + increment, increment);
        newWeight = progressedWeight;
        newSuccesses = 0;
        reason = `Completed all sets for 2 sessions. Weight increased by ${increment}kg.`;
        changes.push({
          exercise: exercise.name,
          old_weight_kg: currentWeight,
          new_weight_kg: newWeight,
          reason,
        });
      }
    } else {
      // Rule 2: 2 consecutive failures → deload 10%
      if (newFailures >= 2) {
        const deloadedWeight = roundToNearest(currentWeight * DELOAD_FACTOR, increment);
        newWeight = Math.max(deloadedWeight, increment);
        newFailures = 0;
        reason = `Failed to complete all reps for 2 sessions. Weight reduced by 10%.`;
        changes.push({
          exercise: exercise.name,
          old_weight_kg: currentWeight,
          new_weight_kg: newWeight,
          reason,
        });
      }
    }

    if (current) {
      await db
        .update(exerciseProgressionTable)
        .set({
          currentWeightKg: newWeight,
          consecutiveSuccesses: newSuccesses,
          consecutiveFailures: newFailures,
        })
        .where(eq(exerciseProgressionTable.id, current.id));
    } else {
      await db.insert(exerciseProgressionTable).values({
        userId,
        exerciseName: exercise.name,
        category: exercise.category,
        currentWeightKg: newWeight,
        consecutiveSuccesses: newSuccesses,
        consecutiveFailures: newFailures,
      });
    }
  }

  return changes;
}

export async function getProgressionWeightsForUser(
  userId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select()
    .from(exerciseProgressionTable)
    .where(eq(exerciseProgressionTable.userId, userId));

  return Object.fromEntries(rows.map((r) => [r.exerciseName, r.currentWeightKg]));
}
