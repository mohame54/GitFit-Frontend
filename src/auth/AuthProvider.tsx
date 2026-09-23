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
import * as authClient from '@/api/authClient';
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
  signOut: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readProfileId(user: User | null): string | null {
  const value = user?.user_metadata?.meals_profile_id;
  return typeof value === 'string' ? value : null;
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

  const applyAuthResponse = useCallback(
    async (response: Awaited<ReturnType<typeof authClient.login>>) => {
      const { error } = await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token,
      });
      if (error) throw error;

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authClient.login(email, password);
      await applyAuthResponse(response);
    },
    [applyAuthResponse],
  );

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const response = await authClient.signup(email, password, displayName);
      await applyAuthResponse(response);
    },
    [applyAuthResponse],
  );

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
      signOut,
      markOnboardingComplete,
    }),
    [user, session, loading, login, signup, signOut, markOnboardingComplete],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
