import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting sign up with:', { email, name });
    
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });
      
      console.log('Sign up result:', { data, error });
      
      if (data?.session && data?.user) {
        console.log('Immediate session from signup:', data.session);
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error };
    } catch (err) {
      console.error('Sign up catch error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Sign in attempt:', { 
      email, 
      supabaseUrl: 'https://rkotgbydeyhmiivdakga.supabase.co',
      timestamp: new Date().toISOString()
    });
    
    try {
      // Test if we can reach Supabase at all
      console.log('Testing Supabase connection...');
      const healthCheck = await fetch('https://rkotgbydeyhmiivdakga.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrb3RnYnlkZXlobWlpdmRha2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTQzOTEsImV4cCI6MjA3MDc3MDM5MX0.H05Pdl8bmDYJRnA9jBEMGIfkX7fRPQA9VxAuF79xZ7w',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrb3RnYnlkZXlobWlpdmRha2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTQzOTEsImV4cCI6MjA3MDc3MDM5MX0.H05Pdl8bmDYJRnA9jBEMGIfkX7fRPQA9VxAuF79xZ7w'
        }
      });
      console.log('Health check response:', healthCheck.status, healthCheck.statusText);
      
      console.log('Attempting auth sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      
      console.log('Auth sign in response:', { 
        hasData: !!data, 
        hasSession: !!data?.session, 
        hasUser: !!data?.user, 
        error: error ? { message: error.message, status: error.status } : null 
      });
      
      if (data?.session && data?.user) {
        console.log('Setting session and user from sign in');
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error };
    } catch (err: any) {
      console.error('Sign in error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack?.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};