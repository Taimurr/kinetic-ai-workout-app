import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are a certified fitness coach AI. Generate a weekly workout plan as a JSON object.

Rules:
1. Return ONLY valid JSON, no markdown, no explanation, no code fences.
2. Plan must cover exactly {days_per_week} training days and fill remaining days as rest.
3. Distribute rest days so no more than 2 consecutive training days before a rest day (except 2-day plans).
4. Do NOT front-load all training days.
5. Exercise selection must only use equipment the user has.
6. Volume per exercise:
   - beginner: 2-3 sets, 8-12 reps
   - some_experience: 3 sets, 6-12 reps
   - intermediate: 3-4 sets, 5-12 reps
7. Start weights conservatively for beginners.
8. Each workout should have 4-7 exercises depending on time available.
9. Include a mix of compound and isolation exercises appropriate to the goal.
10. Workout titles should be descriptive (e.g., "Upper Body Push", "Lower Body", "Pull Day", "Full Body").

Return this EXACT JSON structure with no extra text:
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
}`;

export function buildTemplatePlan(body: any) {
  const { goal, experience_level, equipment, time_per_workout, days_per_week } = body;

  const trainingSplit: Record<number, string[]> = {
    2: ["Monday", "Thursday"],
    3: ["Monday", "Wednesday", "Friday"],
    4: ["Monday", "Tuesday", "Thursday", "Friday"],
    5: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
  };

  const trainingDays = new Set(trainingSplit[days_per_week] || trainingSplit[3]);
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const setsMap: Record<string, number> = {
    beginner: 2,
    some_experience: 3,
    intermediate: 4,
  };
  const sets = setsMap[experience_level] || 3;

  const exercisesByGoal: Record<string, any[]> = {
    strength: [
      { name: "Bench Press", category: "primary", muscle_group: "chest", sets, reps: 5, suggested_weight_kg: 70, rest_seconds: 120, description: "Lie flat, grip bar, lower to chest, press up explosively." },
      { name: "Overhead Press", category: "primary", muscle_group: "shoulders", sets, reps: 5, suggested_weight_kg: 45, rest_seconds: 120, description: "Press bar from shoulders to full lockout overhead." },
      { name: "Squat", category: "primary", muscle_group: "legs", sets, reps: 5, suggested_weight_kg: 90, rest_seconds: 180, description: "Bar on traps, squat below parallel, drive through heels." },
      { name: "Deadlift", category: "primary", muscle_group: "back", sets: 3, reps: 5, suggested_weight_kg: 110, rest_seconds: 180, description: "Grip bar, drive through floor, lock hips and knees at top." },
      { name: "Barbell Row", category: "accessory", muscle_group: "back", sets, reps: 6, suggested_weight_kg: 60, rest_seconds: 90, description: "Hinge forward, pull bar to lower chest, squeeze shoulder blades." },
      { name: "Pull-up", category: "accessory", muscle_group: "back", sets: 3, reps: 8, suggested_weight_kg: 0, rest_seconds: 90, description: "Hang from bar, pull chest to bar, lower with control." },
      { name: "Tricep Pushdown", category: "isolation", muscle_group: "arms", sets: 3, reps: 12, suggested_weight_kg: 25, rest_seconds: 60, description: "Keep elbows pinned, extend arms fully, control the return." },
    ],
    muscle_gain: [
      { name: "Incline Dumbbell Press", category: "primary", muscle_group: "chest", sets: 4, reps: 10, suggested_weight_kg: 22, rest_seconds: 90, description: "Press dumbbells on incline bench from chest to full extension." },
      { name: "Barbell Row", category: "primary", muscle_group: "back", sets: 4, reps: 10, suggested_weight_kg: 60, rest_seconds: 90, description: "Hinge forward, pull bar to lower chest, squeeze shoulder blades." },
      { name: "Squat", category: "primary", muscle_group: "legs", sets: 4, reps: 10, suggested_weight_kg: 70, rest_seconds: 90, description: "Bar on traps, squat below parallel, drive through heels." },
      { name: "Lateral Raise", category: "isolation", muscle_group: "shoulders", sets: 4, reps: 15, suggested_weight_kg: 10, rest_seconds: 60, description: "Raise dumbbells to shoulder height with slight elbow bend." },
      { name: "Bicep Curl", category: "isolation", muscle_group: "arms", sets: 3, reps: 12, suggested_weight_kg: 14, rest_seconds: 60, description: "Curl dumbbells to shoulders with elbows pinned to sides." },
      { name: "Leg Press", category: "accessory", muscle_group: "legs", sets: 3, reps: 12, suggested_weight_kg: 120, rest_seconds: 90, description: "Place feet shoulder-width, lower until knees at 90°, press through heels." },
    ],
    weight_loss: [
      { name: "Squat", category: "primary", muscle_group: "legs", sets: 3, reps: 15, suggested_weight_kg: 50, rest_seconds: 60, description: "Bar on traps, squat below parallel, drive through heels." },
      { name: "Push-up", category: "primary", muscle_group: "chest", sets: 3, reps: 15, suggested_weight_kg: 0, rest_seconds: 60, description: "Lower chest to floor, push back up, keep core tight." },
      { name: "Romanian Deadlift", category: "accessory", muscle_group: "legs", sets: 3, reps: 12, suggested_weight_kg: 50, rest_seconds: 60, description: "Hinge at hips, lower bar along legs, feel hamstring stretch." },
      { name: "Dumbbell Row", category: "accessory", muscle_group: "back", sets: 3, reps: 12, suggested_weight_kg: 18, rest_seconds: 60, description: "Brace on bench, pull dumbbell to hip, squeeze back." },
      { name: "Mountain Climber", category: "isolation", muscle_group: "core", sets: 3, reps: 20, suggested_weight_kg: 0, rest_seconds: 45, description: "In plank, drive knees to chest alternately at speed." },
      { name: "Lunge", category: "accessory", muscle_group: "legs", sets: 3, reps: 12, suggested_weight_kg: 14, rest_seconds: 60, description: "Step forward, lower back knee toward ground, return to start." },
    ],
    general_fitness: [
      { name: "Squat", category: "primary", muscle_group: "legs", sets: 3, reps: 12, suggested_weight_kg: 60, rest_seconds: 90, description: "Bar on traps, squat below parallel, drive through heels." },
      { name: "Bench Press", category: "primary", muscle_group: "chest", sets: 3, reps: 10, suggested_weight_kg: 60, rest_seconds: 90, description: "Lie flat, grip bar, lower to chest, press up." },
      { name: "Barbell Row", category: "accessory", muscle_group: "back", sets: 3, reps: 10, suggested_weight_kg: 50, rest_seconds: 90, description: "Hinge forward, pull bar to lower chest." },
      { name: "Overhead Press", category: "accessory", muscle_group: "shoulders", sets: 3, reps: 10, suggested_weight_kg: 40, rest_seconds: 90, description: "Press bar from shoulders to lockout overhead." },
      { name: "Plank", category: "isolation", muscle_group: "core", sets: 3, reps: 30, suggested_weight_kg: 0, rest_seconds: 60, description: "Hold body rigid like a board, brace core throughout." },
    ],
  };

  const workoutTitles = ["Upper Body Push", "Lower Body", "Upper Body Pull", "Full Body A", "Full Body B"];

  let trainingDayCount = 0;
  const days = allDays.map((dayName) => {
    if (trainingDays.has(dayName)) {
      const exercises = exercisesByGoal[goal] || exercisesByGoal["general_fitness"];
      const titleIdx = trainingDayCount % workoutTitles.length;
      trainingDayCount++;
      return {
        day: dayName,
        type: "training" as const,
        title: workoutTitles[titleIdx],
        estimated_duration: time_per_workout,
        intensity: goal === "strength" ? "high" : "moderate",
        exercises: exercises.slice(0, Math.min(exercises.length, time_per_workout <= 30 ? 4 : time_per_workout <= 45 ? 5 : 6)),
      };
    }
    return {
      day: dayName,
      type: "rest" as const,
      title: "Rest Day",
      estimated_duration: 0,
      intensity: "low" as const,
      exercises: [],
    };
  });

  return { days };
}

router.post("/generate-plan", async (req, res) => {
  const { goal, experience_level, equipment, time_per_workout, days_per_week } = req.body;

  if (!goal || !experience_level || !equipment || !time_per_workout || !days_per_week) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const userMessage = `Generate a weekly workout plan for this user:
- Goal: ${goal}
- Experience: ${experience_level}
- Equipment: ${equipment}
- Time per workout: ${time_per_workout} minutes
- Days per week: ${days_per_week}

Remember: Return ONLY valid JSON, no markdown, no code fences, no explanation.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT.replace("{days_per_week}", days_per_week.toString()),
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    let text = content.text.trim();
    // Strip any accidental markdown
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    const plan = JSON.parse(text);
    res.json(plan);
  } catch (err) {
    req.log.error({ err }, "AI plan generation failed, using template");
    const plan = buildTemplatePlan({ goal, experience_level, equipment, time_per_workout, days_per_week });
    res.json(plan);
  }
});

export default router;
