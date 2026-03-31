import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Goal = "strength" | "muscle_gain" | "weight_loss" | "general_fitness";
export type Experience = "beginner" | "some_experience" | "intermediate";
export type Equipment = "full_gym" | "dumbbells_only" | "barbells_and_dumbbells" | "bodyweight_only";

export interface OnboardingProfile {
  goal: Goal;
  experience: Experience;
  equipment: Equipment;
  timePerWorkout: 30 | 45 | 60 | 75;
  daysPerWeek: 2 | 3 | 4 | 5;
}

export interface Exercise {
  name: string;
  category: "primary" | "accessory" | "isolation";
  muscle_group: string;
  sets: number;
  reps: number;
  suggested_weight_kg: number;
  rest_seconds: number;
  description: string;
}

export interface DayPlan {
  day: string;
  type: "training" | "rest";
  title: string;
  estimated_duration: number;
  intensity: "low" | "moderate" | "high";
  exercises: Exercise[];
}

export interface WeeklyPlan {
  days: DayPlan[];
  generatedAt: string;
  weekStartDate: string;
  isTemplate?: boolean;
}

export interface LoggedSet {
  exerciseName: string;
  setNumber: number;
  actualReps: number;
  actualWeight: number;
  skipped: boolean;
  loggedAt: string;
}

export interface WorkoutSession {
  date: string;
  dayPlan: DayPlan;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  loggedSets: LoggedSet[];
}

export interface CompletedDay {
  date: string;
  dayName: string;
  workoutTitle: string;
  durationSeconds: number;
}

export interface ProgressData {
  completedDays: CompletedDay[];
  streakCount: number;
  longestStreak: number;
  totalWorkouts: number;
  totalMinutes: number;
}

interface AppState {
  onboardingCompleted: boolean;
  profile: OnboardingProfile | null;
  weeklyPlan: WeeklyPlan | null;
  currentSession: WorkoutSession | null;
  progress: ProgressData;
  isGeneratingPlan: boolean;
}

interface AppContextType extends AppState {
  setProfile: (profile: OnboardingProfile) => void;
  completeOnboarding: (profile: OnboardingProfile) => Promise<void>;
  generatePlan: (profile: OnboardingProfile) => Promise<void>;
  startWorkout: (dayPlan: DayPlan, date: string) => void;
  logSet: (set: LoggedSet) => void;
  completeWorkout: () => void;
  skipDay: () => void;
  resetApp: () => Promise<void>;
}

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: "kinetic_onboarding_completed",
  PROFILE: "kinetic_profile",
  WEEKLY_PLAN: "kinetic_weekly_plan",
  PROGRESS: "kinetic_progress",
  CURRENT_SESSION: "kinetic_current_session",
};

const DEFAULT_PROGRESS: ProgressData = {
  completedDays: [],
  streakCount: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  totalMinutes: 0,
};

const AppContext = createContext<AppContextType | null>(null);

const TEMPLATE_PLANS: Record<string, DayPlan[]> = {
  strength_full_gym: [
    {
      day: "Monday",
      type: "training",
      title: "Upper Body Push",
      estimated_duration: 60,
      intensity: "high",
      exercises: [
        { name: "Bench Press", category: "primary", muscle_group: "chest", sets: 4, reps: 5, suggested_weight_kg: 80, rest_seconds: 120, description: "Lie flat, grip bar shoulder-width, lower to chest, press up explosively." },
        { name: "Overhead Press", category: "primary", muscle_group: "shoulders", sets: 3, reps: 6, suggested_weight_kg: 50, rest_seconds: 120, description: "Stand tall, press bar from shoulders to lockout overhead." },
        { name: "Incline Dumbbell Press", category: "accessory", muscle_group: "chest", sets: 3, reps: 10, suggested_weight_kg: 24, rest_seconds: 90, description: "On incline bench, press dumbbells from chest level to full extension." },
        { name: "Lateral Raise", category: "isolation", muscle_group: "shoulders", sets: 3, reps: 12, suggested_weight_kg: 10, rest_seconds: 60, description: "Raise dumbbells to shoulder height with slight elbow bend." },
      ],
    },
    { day: "Tuesday", type: "rest", title: "Rest Day", estimated_duration: 0, intensity: "low", exercises: [] },
    {
      day: "Wednesday",
      type: "training",
      title: "Lower Body",
      estimated_duration: 60,
      intensity: "high",
      exercises: [
        { name: "Squat", category: "primary", muscle_group: "legs", sets: 4, reps: 5, suggested_weight_kg: 100, rest_seconds: 180, description: "Stand with bar on traps, squat below parallel, drive up through heels." },
        { name: "Romanian Deadlift", category: "accessory", muscle_group: "legs", sets: 3, reps: 8, suggested_weight_kg: 80, rest_seconds: 90, description: "Hinge at hips, lower bar along legs, feel hamstring stretch, return upright." },
        { name: "Leg Press", category: "accessory", muscle_group: "legs", sets: 3, reps: 10, suggested_weight_kg: 120, rest_seconds: 90, description: "Place feet shoulder-width on platform, lower until knees at 90°, press through heels." },
        { name: "Calf Raise", category: "isolation", muscle_group: "legs", sets: 3, reps: 15, suggested_weight_kg: 60, rest_seconds: 60, description: "Stand on edge of step, raise onto toes fully, lower slowly." },
      ],
    },
    { day: "Thursday", type: "rest", title: "Rest Day", estimated_duration: 0, intensity: "low", exercises: [] },
    {
      day: "Friday",
      type: "training",
      title: "Upper Body Pull",
      estimated_duration: 60,
      intensity: "moderate",
      exercises: [
        { name: "Deadlift", category: "primary", muscle_group: "back", sets: 3, reps: 5, suggested_weight_kg: 120, rest_seconds: 180, description: "Grip bar shoulder-width, drive through floor, lock hips and knees at top." },
        { name: "Barbell Row", category: "primary", muscle_group: "back", sets: 3, reps: 8, suggested_weight_kg: 70, rest_seconds: 90, description: "Hinge forward, pull bar to lower chest, squeeze shoulder blades." },
        { name: "Pull-up", category: "accessory", muscle_group: "back", sets: 3, reps: 8, suggested_weight_kg: 0, rest_seconds: 90, description: "Hang from bar, pull chest to bar, lower with control." },
        { name: "Bicep Curl", category: "isolation", muscle_group: "arms", sets: 3, reps: 12, suggested_weight_kg: 14, rest_seconds: 60, description: "Curl dumbbells to shoulders with elbows pinned to sides." },
      ],
    },
    { day: "Saturday", type: "rest", title: "Rest Day", estimated_duration: 0, intensity: "low", exercises: [] },
    { day: "Sunday", type: "rest", title: "Rest Day", estimated_duration: 0, intensity: "low", exercises: [] },
  ],
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function buildTemplatePlan(profile: OnboardingProfile): WeeklyPlan {
  const key = `${profile.goal}_${profile.equipment}`;
  const templateDays = TEMPLATE_PLANS[key] || TEMPLATE_PLANS["strength_full_gym"];

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const trainingDays: number[] = [];

  if (profile.daysPerWeek <= 3) {
    trainingDays.push(0, 2, 4);
  } else if (profile.daysPerWeek === 4) {
    trainingDays.push(0, 1, 3, 4);
  } else {
    trainingDays.push(0, 1, 2, 4, 5);
  }

  const days: DayPlan[] = dayNames.map((dayName, idx) => {
    if (trainingDays.slice(0, profile.daysPerWeek).includes(idx)) {
      const templateDay = templateDays.find((d) => d.type === "training");
      if (templateDay) {
        return { ...templateDay, day: dayName, estimated_duration: profile.timePerWorkout };
      }
    }
    return { day: dayName, type: "rest", title: "Rest Day", estimated_duration: 0, intensity: "low", exercises: [] };
  });

  return {
    days,
    generatedAt: new Date().toISOString(),
    weekStartDate: getWeekStart(),
    isTemplate: true,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    onboardingCompleted: false,
    profile: null,
    weeklyPlan: null,
    currentSession: null,
    progress: DEFAULT_PROGRESS,
    isGeneratingPlan: false,
  });

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const [onboarded, profileStr, planStr, progressStr, sessionStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PLAN),
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION),
      ]);

      setState((prev) => ({
        ...prev,
        onboardingCompleted: onboarded === "true",
        profile: profileStr ? JSON.parse(profileStr) : null,
        weeklyPlan: planStr ? JSON.parse(planStr) : null,
        progress: progressStr ? JSON.parse(progressStr) : DEFAULT_PROGRESS,
        currentSession: sessionStr ? JSON.parse(sessionStr) : null,
      }));
    } catch (e) {
      console.warn("Failed to load stored data", e);
    }
  }

  const setProfile = useCallback((profile: OnboardingProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const generatePlan = useCallback(async (profile: OnboardingProfile) => {
    setState((prev) => ({ ...prev, isGeneratingPlan: true }));
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const response = await fetch(`https://${domain}/api/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.goal,
          experience_level: profile.experience,
          equipment: profile.equipment,
          time_per_workout: profile.timePerWorkout,
          days_per_week: profile.daysPerWeek,
        }),
      });

      if (!response.ok) throw new Error("Plan generation failed");

      const data = await response.json();
      const plan: WeeklyPlan = {
        days: data.days,
        generatedAt: new Date().toISOString(),
        weekStartDate: getWeekStart(),
        isTemplate: false,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(plan));
      setState((prev) => ({ ...prev, weeklyPlan: plan, isGeneratingPlan: false }));
    } catch (e) {
      console.warn("AI plan generation failed, using template", e);
      const plan = buildTemplatePlan(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(plan));
      setState((prev) => ({ ...prev, weeklyPlan: plan, isGeneratingPlan: false }));
    }
  }, []);

  const completeOnboarding = useCallback(async (profile: OnboardingProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
    setState((prev) => ({ ...prev, profile, onboardingCompleted: true }));
    await generatePlan(profile);
  }, [generatePlan]);

  const startWorkout = useCallback((dayPlan: DayPlan, date: string) => {
    const session: WorkoutSession = {
      date,
      dayPlan,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      loggedSets: [],
    };
    AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    setState((prev) => ({ ...prev, currentSession: session }));
  }, []);

  const logSet = useCallback((set: LoggedSet) => {
    setState((prev) => {
      if (!prev.currentSession) return prev;
      const updated: WorkoutSession = {
        ...prev.currentSession,
        loggedSets: [...prev.currentSession.loggedSets.filter(
          (s) => !(s.exerciseName === set.exerciseName && s.setNumber === set.setNumber)
        ), set],
      };
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updated));
      return { ...prev, currentSession: updated };
    });
  }, []);

  const completeWorkout = useCallback(() => {
    setState((prev) => {
      if (!prev.currentSession) return prev;
      const now = new Date();
      const startedAt = new Date(prev.currentSession.startedAt);
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      const completed: WorkoutSession = {
        ...prev.currentSession,
        status: "completed",
        completedAt: now.toISOString(),
        durationSeconds,
      };

      const completedDay: CompletedDay = {
        date: prev.currentSession.date,
        dayName: prev.currentSession.dayPlan.day,
        workoutTitle: prev.currentSession.dayPlan.title,
        durationSeconds,
      };

      const newCompletedDays = [...prev.progress.completedDays, completedDay];
      const totalMinutes = Math.round(newCompletedDays.reduce((a, d) => a + d.durationSeconds, 0) / 60);

      const newProgress: ProgressData = {
        ...prev.progress,
        completedDays: newCompletedDays,
        totalWorkouts: prev.progress.totalWorkouts + 1,
        totalMinutes,
        streakCount: prev.progress.streakCount + 1,
        longestStreak: Math.max(prev.progress.longestStreak, prev.progress.streakCount + 1),
      };

      AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);

      return { ...prev, currentSession: null, progress: newProgress };
    });
  }, []);

  const skipDay = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    setState((prev) => ({ ...prev, currentSession: null }));
  }, []);

  const resetApp = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setState({
      onboardingCompleted: false,
      profile: null,
      weeklyPlan: null,
      currentSession: null,
      progress: DEFAULT_PROGRESS,
      isGeneratingPlan: false,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setProfile,
        completeOnboarding,
        generatePlan,
        startWorkout,
        logSet,
        completeWorkout,
        skipDay,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
