import { Router, type IRouter, type Request, type Response } from "express";
import { db, profilesTable, weeklyPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { buildTemplatePlan } from "./generate-plan";

const router: IRouter = Router();

router.get("/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const rows = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) {
    res.json({ profile: null });
    return;
  }
  res.json({
    profile: {
      goal: row.goal,
      experience_level: row.experienceLevel,
      equipment: row.equipment,
      time_per_workout: row.timePerWorkout,
      days_per_week: row.daysPerWeek,
    },
  });
});

router.post("/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { goal, experience_level, equipment, time_per_workout, days_per_week } = req.body;

  if (!goal || !experience_level || !equipment || !time_per_workout || !days_per_week) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  await db
    .insert(profilesTable)
    .values({ userId, goal, experienceLevel: experience_level, equipment, timePerWorkout: time_per_workout, daysPerWeek: days_per_week })
    .onConflictDoUpdate({
      target: profilesTable.userId,
      set: { goal, experienceLevel: experience_level, equipment, timePerWorkout: time_per_workout, daysPerWeek: days_per_week },
    });

  const anthropic = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy",
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  let plan;
  try {
    const userMessage = `Generate a weekly workout plan for this user:\n- Goal: ${goal}\n- Experience: ${experience_level}\n- Equipment: ${equipment}\n- Time per workout: ${time_per_workout} minutes\n- Days per week: ${days_per_week}\n\nReturn ONLY valid JSON, no markdown.`;
    const SYSTEM_PROMPT = `You are a certified fitness coach AI. Generate a weekly workout plan as a JSON object.\nReturn ONLY valid JSON with this structure: {"days":[{"day":"Monday","type":"training","title":"Upper Body Push","estimated_duration":45,"intensity":"moderate","exercises":[{"name":"Bench Press","category":"primary","muscle_group":"chest","sets":3,"reps":8,"suggested_weight_kg":60,"rest_seconds":90,"description":"Lie on bench, grip bar shoulder-width, lower to chest, press up."}]},{"day":"Tuesday","type":"rest","title":"Rest Day","estimated_duration":0,"intensity":"low","exercises":[]}]}`;
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    let text = content.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    plan = JSON.parse(text);
  } catch {
    plan = buildTemplatePlan({ goal, experience_level, equipment, time_per_workout, days_per_week });
  }

  await db
    .insert(weeklyPlansTable)
    .values({ userId, planData: plan })
    .onConflictDoUpdate({
      target: weeklyPlansTable.userId,
      set: { planData: plan },
    });

  res.json(plan);
});

export default router;
