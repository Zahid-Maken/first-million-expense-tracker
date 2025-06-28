import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { syncLocalDataToSupabase, syncSupabaseDataToLocal } from '@/lib/syncService';
import AuthForm from './auth-form';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { signIn, signUp, loading, error } = useSupabaseAuth();
  const { toast } = useToast();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleSubmit = async (email: string, password: string) => {
    try {
      let result;

      // Store email in localStorage for better identification
      localStorage.setItem("firstMillionUserEmail", email);

      if (mode === 'login') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }

      if (result.success) {
        // If successful login, sync data between local storage and Supabase
        if (mode === 'login') {
          // First sync local data to Supabase to prevent data loss
          const syncUpResult = await syncLocalDataToSupabase();
          
          if (!syncUpResult.success) {
            console.error('Error syncing data to Supabase:', syncUpResult.error);
          } else {
            console.log('Local data synced to Supabase successfully');
          }
          
          // Then sync from Supabase to local
          const syncDownResult = await syncSupabaseDataToLocal();
          
          if (!syncDownResult.success) {
            console.error('Error syncing data from Supabase:', syncDownResult.error);
          } else {
            console.log('Supabase data synced to local successfully');
          }

          // Set auth status as authenticated
          localStorage.setItem("firstMillionAuthStatus", "authenticated");
        }

        toast({
          title: mode === 'login' ? 'Signed in successfully' : 'Account created successfully',
          description: mode === 'signup' ? 'Please check your email to confirm your account.' : 'Your data has been synced.',
          variant: 'default',
        });

        // Close the modal
        onClose();
      } else {
        toast({
          title: 'Authentication error',
          description: result.error || 'An error occurred during authentication',
          variant: 'destructive',
        });
      }

      return result;
    } catch (err: any) {
      toast({
        title: 'Authentication error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-primary text-white border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create a New Account'}
          </DialogTitle>
          <DialogDescription className="text-center text-white/80">
            {mode === 'login' 
              ? 'Sign in to access your financial data across devices' 
              : 'Join us to track your finances and reach your first million'}
          </DialogDescription>
        </DialogHeader>
        <AuthForm
          mode={mode}
          onSubmit={handleSubmit}
          onToggleMode={toggleMode}
          loading={loading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
} 