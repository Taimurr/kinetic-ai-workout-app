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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, profile, plan } = useKinetic();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    const onOnboarding = location.startsWith("/onboarding");
    if (!profile && !onOnboarding) {
      navigate("/onboarding");
    }
  }, [isLoaded, profile, location]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
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
