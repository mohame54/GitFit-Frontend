import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/auth/supabase';
import { clearChatHistory } from '@/store/chatStore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profileId: string | null;
  onboardingComplete: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readProfileId(user: User | null): string | null {
  return user?.id ?? null;
}

function readOnboarding(user: User | null): boolean {
  return user?.user_metadata?.onboarding_complete === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession) {
        clearChatHistory();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            onboarding_complete: false,
          },
        },
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error(
          'Check your email to confirm your account, then sign in.',
        );
      }
      setSession(data.session);
      setUser(data.session.user);
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    clearChatHistory();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });
    if (error) throw error;
    setUser(data.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profileId: readProfileId(user),
      onboardingComplete: readOnboarding(user),
      loading,
      login,
      signup,
      signInWithGoogle,
      signOut,
      markOnboardingComplete,
    }),
    [
      user,
      session,
      loading,
      login,
      signup,
      signInWithGoogle,
      signOut,
      markOnboardingComplete,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
