
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get existing session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", currentSession);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
            ensureUserInProfiles();
          } else {
            setIsLoading(false);
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
          ensureUserInProfiles();
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Separate redirect logic that only runs after initialization is complete
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const currentPath = window.location.pathname;
    console.log('Checking redirect logic:', { 
      isInitialized, 
      isLoading, 
      user: !!user, 
      profile, 
      currentPath 
    });

    // Only redirect if we have complete auth state
    if (user && profile) {
      // Don't redirect if already on the correct page
      if (profile.role === 'admin' && currentPath === '/admin') return;
      if (profile.driver_id && currentPath === '/dashboard-supir') return;
      
      // Redirect based on user role
      if (profile.role === 'admin') {
        console.log('User is admin, redirecting to admin panel');
        navigate('/admin');
      } else if (profile.driver_id) {
        console.log('User is driver, redirecting to driver dashboard');
        navigate('/dashboard-supir');
      }
    }
  }, [user, profile, isLoading, isInitialized, navigate]);

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
      setIsInitialized(false);
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Only return true if profile is loaded and role is admin
  const isAdmin = profile?.role === 'admin';

  console.log('Auth context state:', { 
    user: !!user, 
    profile, 
    isAdmin, 
    isLoading, 
    isInitialized 
  });

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
