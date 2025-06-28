import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/localStorageService';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: true // Always authenticated in the localStorage version
  };
}
