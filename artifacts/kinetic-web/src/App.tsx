import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KineticProvider, useKinetic } from "@/lib/context";
import { useEffect, useState } from "react";
import { loginWithCredentials } from "@workspace/replit-auth-web";
import Onboarding from "@/pages/onboarding";
import Plan from "@/pages/plan";
import Workout from "@/pages/workout";
import Session from "@/pages/session";
import Progress from "@/pages/progress";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function Spinner() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithCredentials(email, password);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white font-['Outfit']">
          <span className="text-[#CCFF00]">KINETIC</span>
        </h1>
        <p className="text-[#888] mt-2 text-sm tracking-widest uppercase">
          AI Workout Coach
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#1A1A1A] text-white placeholder-[#555] border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#1A1A1A] text-white placeholder-[#555] border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] transition-colors"
        />
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#CCFF00] text-[#121212] font-bold py-3 px-8 rounded-lg text-sm tracking-widest uppercase hover:bg-[#b8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-[#555] text-xs">
        Demo mode — any email/password works
      </p>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth, isLoaded, profile } = useKinetic();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (auth.isLoading || !isLoaded) return;
    if (!auth.isAuthenticated) return;
    const onOnboarding = location.startsWith("/onboarding");
    if (!profile && !onOnboarding) {
      navigate("/onboarding");
    }
  }, [auth.isLoading, auth.isAuthenticated, isLoaded, profile, location]);

  if (auth.isLoading || (auth.isAuthenticated && !isLoaded)) {
    return <Spinner />;
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Plan} />
        <Route path="/workout/:day" component={Workout} />
        <Route path="/session/:day" component={Session} />
        <Route path="/progress" component={Progress} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <KineticProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </KineticProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
