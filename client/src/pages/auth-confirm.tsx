import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, XCircle, ArrowLeftRight } from "lucide-react";

export default function AuthConfirmPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Parse the URL to get type and token from the hash fragment or query params
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const queryParams = new URLSearchParams(url.search);
        
        // Check for token in either hash or query params
        const token = hashParams.get("access_token") || 
                      queryParams.get("token") || 
                      hashParams.get("token");
                      
        const type = hashParams.get("type") || 
                     queryParams.get("type") || 
                     "recovery"; // Default to recovery if not specified
        
        console.log("URL:", url.toString());
        console.log("Token:", token);
        console.log("Type:", type);
        
        if (!token) {
          // No token found, manually check if the user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // User is already authenticated
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMessage("Invalid verification link. Please check your email and try again.");
          }
          return;
        }
        
        // Process the token based on type
        let result;
        
        // Handle the token - this could be verification, recovery, etc.
        if (type === "recovery" || type === "signup") {
          // For signup or password recovery, we need to verify the token
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type === "signup" ? "signup" : "recovery",
          });
        } else if (type === "magiclink") {
          // For magic link, we use the signInWithOtp method
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "magiclink",
          });
        } else {
          // For other types or if unsure, try to exchange the token for a session
          result = await supabase.auth.getSession();
        }
        
        // Check if we have a session now
        if (result.error) {
          console.error("Verification error:", result.error);
          setStatus("error");
          setErrorMessage(result.error.message || "Verification failed. Please try again.");
        } else {
          // Success - we have a session
          setStatus("success");
        }
      } catch (error: any) {
        console.error("Error during verification:", error);
        setStatus("error");
        setErrorMessage(error.message || "An unexpected error occurred");
      }
    };

    handleEmailConfirmation();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-glow bg-white/20 backdrop-blur-sm text-white overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-3xl flex items-center justify-center">
              {status === "loading" ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : status === "success" ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              {status === "loading"
                ? "Verifying Your Email..."
                : status === "success"
                ? "Email Verified Successfully!"
                : "Verification Failed"}
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              {status === "loading"
                ? "Please wait while we confirm your email address."
                : status === "success"
                ? "Your email has been verified. You can now close this tab and continue with your onboarding process."
                : errorMessage}
            </p>
          </div>

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center items-center space-x-2 text-sm text-white/70">
                <ArrowLeftRight className="w-4 h-4" />
                <div>You can now close this tab and return to the First Million app</div>
                <Sparkles className="w-4 h-4" />
              </div>
              
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={() => window.close()}
                  className="bg-white/30 hover:bg-white/40 text-white"
                >
                  Close This Tab
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-center">
              <Button 
                onClick={() => setLocation("/onboarding")}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                Return to Onboarding
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 