import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@shared/schema';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

// Get the current origin for redirect URLs
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Create a single supabase client for interacting with your database
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Set up redirect URLs for auth flows
    redirectTo: `${origin}/auth/confirm`,
  },
});

// Function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Function to check if the user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Function to sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Function to sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
};

// Function to sign out
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Function to sync local data with Supabase
export const syncUserData = async (userData: any) => {
  if (!await isAuthenticated()) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      ...userData
    })
    .select();
    
  if (error) {
    console.error('Error syncing user data:', error);
    return null;
  }
  
  return data?.[0] || null;
}; 