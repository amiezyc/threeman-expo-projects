import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupaUser, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  role: 'admin' | 'employee';
  name: string;
  daily_rate: number | null;
  hourly_rate: number | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: SupaUser | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  inviteUser: (email: string, name: string, role: 'admin' | 'employee') => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchProfile(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const inviteUser = async (email: string, name: string, role: 'admin' | 'employee') => {
    const { error } = await supabase.functions.invoke('invite-user', {
      body: { email, name, role },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      signIn,
      signOut,
      inviteUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
