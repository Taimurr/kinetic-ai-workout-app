import { createContext, useContext, type ReactNode } from "react";
import { useStore, type UserProfile, type WorkoutSession } from "./store";
import type { WeeklyPlan } from "@workspace/api-client-react";

interface KineticContextValue {
  isLoaded: boolean;
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  plan: WeeklyPlan | null;
  setPlan: (p: WeeklyPlan) => void;
  sessions: WorkoutSession[];
  addSession: (s: WorkoutSession) => void;
}

const KineticContext = createContext<KineticContextValue | null>(null);

export function KineticProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <KineticContext.Provider value={store}>{children}</KineticContext.Provider>;
}

export function useKinetic() {
  const ctx = useContext(KineticContext);
  if (!ctx) throw new Error("useKinetic must be used within KineticProvider");
  return ctx;
}
