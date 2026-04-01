import { Router, type IRouter, type Request, type Response } from "express";
import { db, workoutSessionsTable, weeklyPlansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { applyProgression, type SetLogged } from "../lib/progression";

const router: IRouter = Router();

router.get("/sessions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const rows = await db
    .select()
    .from(workoutSessionsTable)
    .where(eq(workoutSessionsTable.userId, userId))
    .orderBy(desc(workoutSessionsTable.date));

  res.json({
    sessions: rows.map((r) => ({
      id: r.id,
      day: r.day,
      date: r.date.toISOString(),
      duration_seconds: r.durationSeconds,
      sets_logged: r.setsLogged,
      completed: r.completed,
    })),
  });
});

router.post("/sessions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { day, date, duration_seconds, sets_logged, completed } = req.body;

  if (!day || !date || duration_seconds === undefined || !sets_logged || completed === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [inserted] = await db
    .insert(workoutSessionsTable)
    .values({
      userId,
      day,
      date: new Date(date),
      durationSeconds: duration_seconds,
      setsLogged: sets_logged,
      completed,
    })
    .returning();

  let progressionChanges: any[] = [];

  if (completed) {
    const planRows = await db
      .select()
      .from(weeklyPlansTable)
      .where(eq(weeklyPlansTable.userId, userId))
      .limit(1);

    const plan = planRows[0]?.planData as any;
    if (plan?.days) {
      const dayPlan = plan.days.find((d: any) => d.day.toLowerCase() === day.toLowerCase());
      if (dayPlan?.exercises?.length > 0) {
        progressionChanges = await applyProgression(userId, dayPlan.exercises, sets_logged as SetLogged[]);
      }
    }
  }

  res.json({
    session: {
      id: inserted.id,
      day: inserted.day,
      date: inserted.date.toISOString(),
      duration_seconds: inserted.durationSeconds,
      sets_logged: inserted.setsLogged,
      completed: inserted.completed,
    },
    progression_changes: progressionChanges,
  });
});

export default router;
