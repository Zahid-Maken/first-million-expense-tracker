import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import logoIcon from "@/assets/images/2.png";

export default function ConfirmEmail() {
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Check for the access_token and type parameters in the URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    
    const verifyEmail = async () => {
      try {
        if (!accessToken || type !== 'signup') {
          setVerificationStatus('error');
          setErrorMessage("Invalid or missing verification parameters");
          return;
        }
        
        // Set the access token in Supabase session
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '' // We don't have a refresh token at this point
        });
        
        if (error) {
          console.error("Error setting session:", error);
          setVerificationStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        // Email verification successful
        setVerificationStatus('success');
        
        // Start countdown for auto-redirect
        let timer = 5;
        const interval = setInterval(() => {
          timer -= 1;
          setCountdown(timer);
          
          if (timer <= 0) {
            clearInterval(interval);
            // Redirect to onboarding or dashboard
            setLocation("/onboarding");
          }
        }, 1000);
        
        return () => clearInterval(interval);
        
      } catch (error: any) {
        console.error("Error verifying email:", error);
        setVerificationStatus('error');
        setErrorMessage(error.message || "Failed to verify email");
      }
    };
    
    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <img 
              src={logoIcon} 
              alt="First Million Logo" 
              className="w-32 h-auto"
              style={{ objectFit: "contain", transform: "scale(1.5)", minWidth: 64, minHeight: 64 }}
            />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Email Verification</h1>
          
          {verificationStatus === 'verifying' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying your email address...</p>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="mt-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2 text-green-600">Email verified successfully!</p>
              <p className="text-muted-foreground mb-6">
                Your account is now ready. You'll be redirected to continue your onboarding in {countdown} seconds.
              </p>
              <Button 
                onClick={() => setLocation("/onboarding")} 
                className="bg-gradient-primary text-white"
              >
                Continue Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="mt-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2 text-red-600">Verification failed</p>
              <p className="text-muted-foreground mb-2">
                {errorMessage || "We couldn't verify your email. The link may have expired or is invalid."}
              </p>
              <p className="text-muted-foreground mb-6">
                Please try signing up again or contact support if the issue persists.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setLocation("/")}
                  variant="outline"
                >
                  Back to Home
                </Button>
                <Button 
                  onClick={() => setLocation("/onboarding")}
                  className="bg-gradient-primary text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 