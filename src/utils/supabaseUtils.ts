
import { supabase } from "@/integrations/supabase/client";

/**
 * Validates the Supabase connection and types
 * @returns A promise that resolves to true if the connection is valid
 */
export const validateSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try fetching from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    console.log('Supabase connection validated successfully');
    return true;
  } catch (error) {
    console.error('Error validating Supabase connection:', error);
    return false;
  }
};

/**
 * Add the current user to the profiles table if they don't exist
 * @returns A promise that resolves to true if the user was added or already exists
 */
export const ensureUserInProfiles = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user is logged in');
      return false;
    }

    // Check if the user exists in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user profile:', error);
      return false;
    }

    // If the user doesn't exist, create them
    if (!data) {
      console.log('Creating new user profile');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          role: 'user'
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return false;
      }
      
      return true;
    }

    console.log('User profile already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring user in profiles:', error);
    return false;
  }
};
