import { useState, useEffect } from 'react';
import type { GeneratePlanBody, WeeklyPlan, DayPlan, Exercise } from '@workspace/api-client-react';

export interface UserProfile extends GeneratePlanBody {}

export interface WorkoutSession {
  day: string;
  date: string;
  duration_seconds: number;
  sets_logged: { exercise: string; reps: number; weight_kg: number }[];
  completed: boolean;
}

const PROFILE_KEY = 'kinetic_profile';
const PLAN_KEY = 'kinetic_plan';
const SESSIONS_KEY = 'kinetic_sessions';

export function useStore() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [plan, setPlanState] = useState<WeeklyPlan | null>(null);
  const [sessions, setSessionsState] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(PROFILE_KEY);
    const pl = localStorage.getItem(PLAN_KEY);
    const s = localStorage.getItem(SESSIONS_KEY);

    if (p) setProfileState(JSON.parse(p));
    if (pl) setPlanState(JSON.parse(pl));
    if (s) setSessionsState(JSON.parse(s));
    
    setIsLoaded(true);
  }, []);

  const setProfile = (p: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfileState(p);
  };

  const setPlan = (p: WeeklyPlan) => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(p));
    setPlanState(p);
  };

  const addSession = (s: WorkoutSession) => {
    const newSessions = [...sessions, s];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    setSessionsState(newSessions);
  };

  return {
    isLoaded,
    profile,
    setProfile,
    plan,
    setPlan,
    sessions,
    addSession
  };
}
