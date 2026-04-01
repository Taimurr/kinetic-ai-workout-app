import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KineticProvider, useKinetic } from "@/lib/context";
import { useEffect } from "react";
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

function LoginScreen({ onLogin }: { onLogin: () => void }) {
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
      <button
        onClick={onLogin}
        className="bg-[#CCFF00] text-[#121212] font-bold py-3 px-8 rounded-lg text-sm tracking-widest uppercase hover:bg-[#b8e600] transition-colors"
      >
        Sign In with Replit
      </button>
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
    return <LoginScreen onLogin={auth.login} />;
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
