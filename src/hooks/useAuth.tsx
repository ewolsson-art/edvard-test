import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { role?: string; first_name?: string; last_name?: string }) => Promise<{ error: Error | null; data: { user: User | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (emailOrPhone: string, role: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if the current URL has auth callback params (hash OR query string).
// Lovable's OAuth broker on custom domains can return tokens via either path,
// so we must wait for Supabase to process them before declaring "no session".
function hasAuthCallbackParams(): boolean {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (hash.includes('access_token') || hash.includes('type=magiclink') || hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('error=')) {
    return true;
  }
  // PKCE / code-exchange flow used by some OAuth callbacks
  if (/[?&](code|token_hash|provider_token)=/.test(search)) {
    return true;
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialSessionResolved = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // If we get a SIGNED_IN event (e.g. from magic link), always stop loading
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setLoading(false);
          initialSessionResolved = true;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only set state from getSession if onAuthStateChange hasn't already resolved
      // This prevents the race condition where getSession returns null before hash params are processed
      if (!initialSessionResolved) {
        setSession(session);
        setUser(session?.user ?? null);
        // If there are auth callback params in the URL but no session yet,
        // keep loading=true to wait for onAuthStateChange to fire
        if (!session && hasAuthCallbackParams()) {
          // Wait for onAuthStateChange to process the hash params
          // Set a timeout as fallback in case it never fires
          setTimeout(() => {
            if (!initialSessionResolved) {
              setLoading(false);
            }
          }, 3000);
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { role?: string; first_name?: string; last_name?: string }) => {
    const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/slutfor-profil")}`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error, data: data ? { user: data.user } : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithOtp = async (emailOrPhone: string, role: string) => {
    const isPhone = emailOrPhone.startsWith('+');
    if (isPhone) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: emailOrPhone,
        options: { data: { role } }
      });
      return { error };
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailOrPhone,
        options: {
          emailRedirectTo: `${window.location.origin}/slutfor-profil`,
          data: { role },
          shouldCreateUser: true,
        }
      });
      return { error };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Set state immediately for instant UI feedback
      setUser(null);
      setSession(null);
      // Then tell Supabase (don't block on it)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Sign out error:', e);
      // Even if the API call fails, clear local state
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
