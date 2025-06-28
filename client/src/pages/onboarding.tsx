import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, setLocation] = useLocation();

  const handleOnboardingComplete = (data: any) => {
    // Save to localStorage that user has completed onboarding
    localStorage.setItem("firstMillionOnboardingCompleted", "true");
    
    // Redirect to dashboard
    setLocation("/dashboard");
  };

  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
} 