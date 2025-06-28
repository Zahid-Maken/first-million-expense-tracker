import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/lib/themeService";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import BankDetails from "@/pages/bank-details";
import LoansPage from "@/pages/loans";
import InvestmentDetailsPage from "@/pages/investment-details-page";
import Settings from "@/pages/settings";
import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import AuthConfirmPage from "@/pages/auth-confirm";
import { initStorage } from "@/lib/localStorageService";
import { supabase } from "@/lib/supabase";
import { syncSupabaseDataToLocal, syncLocalDataToSupabase } from "@/lib/syncService";
import { startPeriodicSync } from "@/lib/dataSync";

// Onboarding component with redirect logic
function Onboarding() {
  const [, setLocation] = useLocation();

  const handleOnboardingComplete = (data: any) => {
    console.log("Onboarding completed, redirecting to dashboard");
    
    // Save to localStorage that user has completed onboarding
    localStorage.setItem("firstMillionOnboardingCompleted", "true");
    console.log("Onboarding completion flag set in onboarding component");
    
    // Force reload of the page to ensure all data is freshly loaded
    window.location.href = "/dashboard";
  };

  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
}

function Router() {
  const [, setLocation] = useLocation();
  const [hasVisitedBefore, setHasVisitedBefore] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check router path and redirect if needed
  useEffect(() => {
    const path = window.location.pathname;
    const onboardingCompleted = localStorage.getItem("firstMillionOnboardingCompleted") === "true";
    
    // If we're at root path and onboarding is already completed, redirect to dashboard
    if (path === "/" && onboardingCompleted) {
      console.log("Onboarding already completed, redirecting to dashboard");
      window.location.href = "/dashboard";
    }
    
    // If we're at dashboard but onboarding isn't completed, redirect to onboarding
    if (path === "/dashboard" && !onboardingCompleted) {
      console.log("Onboarding not completed, redirecting to onboarding");
      window.location.href = "/onboarding";
    }
  }, []);
  
  useEffect(() => {
    // Initialize the localStorage service
    initStorage();
    
    // Initialize theme with our enhanced system
    initializeTheme();
    
    // Check if user has visited before and completed onboarding
    const visited = localStorage.getItem("firstMillionVisited");
    const onboardingCompleted = localStorage.getItem("firstMillionOnboardingCompleted");
    
    setHasVisitedBefore(visited === "true");
    setHasCompletedOnboarding(onboardingCompleted === "true");
    
    // Mark that the user has visited
    localStorage.setItem("firstMillionVisited", "true");

    // Start periodic sync - will only run if user is authenticated
    const stopPeriodicSync = startPeriodicSync(10); // Every 10 minutes

    // Add timeout to prevent getting stuck in loading state
    const authTimeout = setTimeout(() => {
      if (isAuthenticating) {
        console.log("Authentication check timed out, proceeding as skipped");
        setIsAuthenticating(false);
        localStorage.setItem("firstMillionAuthStatus", "skipped");
      }
      
      // Also set loading to false after timeout
      setIsLoading(false);
    }, 3000); // Reduce timeout to 3 seconds

    // Check authentication status from Supabase
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If the user is authenticated, sync their data
        if (session) {
          console.log("User is authenticated, syncing data...");
          
          // Check if we need to sync from local to Supabase first
          // (This would be the case if user created data before authenticating)
          const needsInitialSync = !localStorage.getItem("firstMillionDataSynced");
          if (needsInitialSync) {
            console.log("Performing initial sync to Supabase");
            await syncLocalDataToSupabase();
          }
          
          // Then sync from Supabase to local storage
          const syncResult = await syncSupabaseDataToLocal();
          console.log("Sync result:", syncResult);
          
          // Set auth status in localStorage
          localStorage.setItem("firstMillionAuthStatus", "authenticated");
          localStorage.setItem("firstMillionUserEmail", session.user.email || '');
        } else {
          // If no session, user is not authenticated
          localStorage.setItem("firstMillionAuthStatus", "skipped");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // In case of error, set auth status as skipped
        localStorage.setItem("firstMillionAuthStatus", "skipped");
      } finally {
        setIsAuthenticating(false);
        setIsLoading(false); // End loading state
        clearTimeout(authTimeout); // Clear the timeout since we're done
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN') {
        try {
          // Check if we need to sync from local to Supabase first
          const needsInitialSync = !localStorage.getItem("firstMillionDataSynced");
          if (needsInitialSync) {
            console.log("Performing initial sync to Supabase after sign in");
            await syncLocalDataToSupabase();
          }
          
          // Then sync from Supabase to local
          await syncSupabaseDataToLocal();
          
          localStorage.setItem("firstMillionAuthStatus", "authenticated");
          if (session?.user?.email) {
            localStorage.setItem("firstMillionUserEmail", session.user.email);
          }
          
          // Refresh the page to ensure data is displayed correctly
          window.location.reload();
        } catch (error) {
          console.error("Error syncing data:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.setItem("firstMillionAuthStatus", "skipped");
        localStorage.removeItem("firstMillionDataSynced");
      }
    });
    
    // Cleanup subscription, periodic sync, and timeout
    return () => {
      subscription.unsubscribe();
      stopPeriodicSync();
      clearTimeout(authTimeout);
    };
  }, []);

  // Only render routes once we've checked localStorage and authentication
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <Switch>
      {/* If path is specifically /onboarding, always show the onboarding flow */}
      <Route path="/onboarding" component={Onboarding} />
      
      {/* If path is / and hasn't completed onboarding, show onboarding */}
      {!hasCompletedOnboarding && (
        <Route path="/" component={Onboarding} />
      )}
      
      {/* If path is / and has completed onboarding, show dashboard */}
      {hasCompletedOnboarding && (
        <Route path="/" component={Dashboard} />
      )}
      
      {/* These routes are always available */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/auth/confirm" component={AuthConfirmPage} />
      <Route path="/bank-details" component={BankDetails} />
      <Route path="/loans" component={LoansPage} />
      <Route path="/investment/:id" component={InvestmentDetailsPage} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
