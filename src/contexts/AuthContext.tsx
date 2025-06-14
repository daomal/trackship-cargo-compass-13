
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/lib/types';
import { ensureUserInProfiles } from '@/utils/supabaseUtils';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (email: string, password: string, name: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile immediately after auth state change
          await fetchUserProfile(session.user.id);
          // Ensure the user exists in the profiles table
          ensureUserInProfiles();
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect logic after profile is loaded
  useEffect(() => {
    if (profile && user && !isLoading) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on the correct page
      if (profile.role === 'admin' && currentPath === '/admin') return;
      if (profile.driver_id && currentPath === '/dashboard-supir') return;
      
      // Redirect based on user role after successful login
      if (profile.role === 'admin') {
        console.log('User is admin, redirecting to admin panel');
        navigate('/admin');
      } else if (profile.driver_id) {
        console.log('User is driver, redirecting to driver dashboard');
        navigate('/dashboard-supir');
      }
    }
  }, [profile, user, isLoading, navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, created_at, driver_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsLoading(false);
        return;
      }

      console.log('User profile fetched:', data);
      setProfile(data as UserProfile);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in with:", email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", data, error);

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log("Attempting sign up for:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      console.log("Sign up response:", data, error);
      
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check if the profile has admin role - only return true if profile is loaded and role is admin
  const isAdmin = profile?.role === 'admin';

  console.log('Auth context state:', { user: !!user, profile, isAdmin, isLoading });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
