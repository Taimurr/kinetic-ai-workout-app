import { createContext, useContext, type ReactNode } from "react";
import { useStore, type UserProfile, type WorkoutSession } from "./store";
import type { WeeklyPlan } from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/replit-auth-web";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

interface KineticContextValue {
  auth: AuthState;
  isLoaded: boolean;
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => Promise<WeeklyPlan>;
  plan: WeeklyPlan | null;
  setPlan: (p: WeeklyPlan) => void;
  sessions: WorkoutSession[];
  addSession: (s: WorkoutSession) => Promise<void>;
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
