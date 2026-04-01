import { Router, type IRouter, type Request, type Response } from "express";
import { db, weeklyPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getProgressionWeightsForUser } from "../lib/progression";

const router: IRouter = Router();

router.get("/plan", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const rows = await db.select().from(weeklyPlansTable).where(eq(weeklyPlansTable.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "No plan found" });
    return;
  }

  const plan = row.planData as any;
  const progressionWeights = await getProgressionWeightsForUser(userId);

  // Apply progression weights to each exercise
  if (plan?.days && Object.keys(progressionWeights).length > 0) {
    for (const day of plan.days) {
      for (const exercise of day.exercises ?? []) {
        if (progressionWeights[exercise.name] !== undefined) {
          exercise.suggested_weight_kg = progressionWeights[exercise.name];
        }
      }
    }
  }

  res.json(plan);
});

export default router;
