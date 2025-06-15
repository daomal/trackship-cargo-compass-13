
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MapboxSettings {
  id: string;
  key: string;
  mapbox_token: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current Mapbox token from Supabase
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Use type assertion to work around TypeScript limitations
    const { data, error } = await (supabase as any)
      .from('settings')
      .select('mapbox_token')
      .eq('key', 'mapbox_token')
      .single();

    if (error) {
      console.log('No Mapbox token found in database');
      return '';
    }

    return data?.mapbox_token || '';
  } catch (error) {
    console.error('Error fetching Mapbox token:', error);
    return '';
  }
};

/**
 * Save the Mapbox token to Supabase
 */
export const saveMapboxToken = async (token: string): Promise<boolean> => {
  try {
    // Use type assertion to work around TypeScript limitations
    const { error } = await (supabase as any)
      .from('settings')
      .upsert({
        key: 'mapbox_token',
        mapbox_token: token,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving Mapbox token:', error);
      toast.error('Gagal menyimpan token Mapbox');
      return false;
    }

    console.log('Mapbox token saved successfully');
    toast.success('Token Mapbox berhasil disimpan');
    return true;
  } catch (error) {
    console.error('Error saving Mapbox token:', error);
    toast.error('Gagal menyimpan token Mapbox');
    return false;
  }
};

/**
 * Delete the Mapbox token from Supabase
 */
export const deleteMapboxToken = async (): Promise<boolean> => {
  try {
    // Use type assertion to work around TypeScript limitations
    const { error } = await (supabase as any)
      .from('settings')
      .delete()
      .eq('key', 'mapbox_token');

    if (error) {
      console.error('Error deleting Mapbox token:', error);
      toast.error('Gagal menghapus token Mapbox');
      return false;
    }

    console.log('Mapbox token deleted successfully');
    toast.success('Token Mapbox berhasil dihapus');
    return true;
  } catch (error) {
    console.error('Error deleting Mapbox token:', error);
    toast.error('Gagal menghapus token Mapbox');
    return false;
  }
};
