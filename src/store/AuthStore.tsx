import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  initial: string;
  avatarColor: string;
  provider: 'apple' | 'google' | 'anonymous';
  createdAt: Date;
  onboardingComplete: boolean;
}

interface AuthStoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Firebase Apple auth integration
      // For now, create a mock user
      setUser({
        uid: 'user-apple-1',
        displayName: '김찬영',
        email: 'user@apple.com',
        initial: '찬',
        avatarColor: '#859C78',
        provider: 'apple',
        createdAt: new Date(),
        onboardingComplete: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Firebase Google auth integration
      setUser({
        uid: 'user-google-1',
        displayName: '김찬영',
        email: 'user@gmail.com',
        initial: '찬',
        avatarColor: '#C48B35',
        provider: 'google',
        createdAt: new Date(),
        onboardingComplete: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInAnonymously = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser({
        uid: 'user-anon-1',
        displayName: '게스트',
        initial: '게',
        avatarColor: '#A09585',
        provider: 'anonymous',
        createdAt: new Date(),
        onboardingComplete: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const completeOnboarding = useCallback(() => {
    setUser(prev => prev ? { ...prev, onboardingComplete: true } : null);
  }, []);

  return (
    <AuthStoreContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signInWithApple,
      signInWithGoogle,
      signInAnonymously,
      signOut,
      updateProfile,
      completeOnboarding,
    }}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore() {
  const context = useContext(AuthStoreContext);
  if (!context) throw new Error('useAuthStore must be used within AuthStoreProvider');
  return context;
}
