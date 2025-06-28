import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Mail, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onToggleMode: () => void;
  onSkip?: () => void;
  loading: boolean;
  error: string | null;
}

export default function AuthForm({ mode, onSubmit, onToggleMode, onSkip, loading, error }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (mode === 'signup' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await onSubmit(email, password);
    
    // If signup was successful, show verification message
    if (result.success && mode === 'signup') {
      setVerificationSent(true);
    }
  };

  // Show verification message if signup was successful
  if (verificationSent && mode === 'signup') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Verification email sent to {email}</AlertDescription>
        </Alert>
        
        <div className="p-4 bg-white/10 rounded-lg text-white text-center">
          <h3 className="font-semibold mb-2">Please check your email</h3>
          <p className="text-sm mb-4">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
          <p className="text-xs text-white/80">
            After verification, you can continue with the onboarding process or login directly from the dashboard.
          </p>
        </div>
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="link"
            onClick={onToggleMode}
            className="text-white/80 hover:text-white underline text-sm"
          >
            Back to login
          </Button>
          
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="border-white/30 text-white hover:bg-white/10 text-sm h-9"
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-semibold text-sm sm:text-base">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`bg-white/20 border-white/30 text-white placeholder:text-white/60 mt-1 sm:mt-2 h-10 sm:h-11 text-sm sm:text-base pl-9 ${
                emailError ? 'border-red-400' : ''
              }`}
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          </div>
          {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white font-semibold text-sm sm:text-base">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? "Create a password (min 6 characters)" : "Enter your password"}
              className={`bg-white/20 border-white/30 text-white placeholder:text-white/60 mt-1 sm:mt-2 h-10 sm:h-11 text-sm sm:text-base pl-9 ${
                passwordError ? 'border-red-400' : ''
              }`}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          </div>
          {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 sm:h-12 mt-4 bg-white/90 text-amber-600 hover:bg-white font-semibold"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
              {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
            </>
          ) : (
            mode === 'login' ? 'Sign In' : 'Create Account'
          )}
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pt-2">
        <Button
          type="button"
          variant="link"
          onClick={onToggleMode}
          className="text-white/80 hover:text-white underline text-sm"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </Button>

        {onSkip && (
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="border-white/30 text-white hover:bg-white/10 text-sm h-9"
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
} 