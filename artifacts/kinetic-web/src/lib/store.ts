import { useState, useEffect, useCallback } from 'react';
import type { GeneratePlanBody, WeeklyPlan } from '@workspace/api-client-react';
import { useAuth } from '@workspace/replit-auth-web';

export interface UserProfile extends GeneratePlanBody {}

export interface WorkoutSession {
  id?: string;
  day: string;
  date: string;
  duration_seconds: number;
  sets_logged: { exercise: string; reps: number; weight_kg: number }[];
  completed: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useStore() {
  const auth = useAuth();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [plan, setPlanState] = useState<WeeklyPlan | null>(null);
  const [sessions, setSessionsState] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) {
      setIsLoaded(true);
      return;
    }

    Promise.all([
      apiFetch<{ profile: UserProfile | null }>('/api/profile').then((d) => d.profile),
      apiFetch<WeeklyPlan>('/api/plan').catch(() => null),
      apiFetch<{ sessions: WorkoutSession[] }>('/api/sessions')
        .then((d) => d.sessions)
        .catch(() => []),
    ])
      .then(([p, pl, s]) => {
        setProfileState(p);
        setPlanState(pl);
        setSessionsState(s);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, [auth.isLoading, auth.isAuthenticated]);

  const setProfile = useCallback(async (p: UserProfile): Promise<WeeklyPlan> => {
    const result = await apiFetch<WeeklyPlan>('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: p.goal,
        experience_level: p.experience_level,
        equipment: p.equipment,
        time_per_workout: p.time_per_workout,
        days_per_week: p.days_per_week,
      }),
    });
    setProfileState(p);
    setPlanState(result);
    return result;
  }, []);

  const setPlan = useCallback((p: WeeklyPlan) => {
    setPlanState(p);
  }, []);

  const addSession = useCallback(async (s: WorkoutSession): Promise<void> => {
    const result = await apiFetch<{ session: WorkoutSession; progression_changes: any[] }>('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: s.day,
        date: s.date,
        duration_seconds: s.duration_seconds,
        sets_logged: s.sets_logged,
        completed: s.completed,
      }),
    });
    setSessionsState((prev) => [...prev, result.session]);
    if (result.progression_changes.length > 0 && plan) {
      const updatedPlan = await apiFetch<WeeklyPlan>('/api/plan').catch(() => null);
      if (updatedPlan) setPlanState(updatedPlan);
    }
  }, [plan]);

  return {
    auth,
    isLoaded,
    profile,
    setProfile,
    plan,
    setPlan,
    sessions,
    addSession,
  };
}
