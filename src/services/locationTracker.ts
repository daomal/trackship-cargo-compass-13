
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

export const startTracking = async (shipmentId: string, onStatusChange: (status: string) => void): Promise<string | null> => {
  try {
    onStatusChange('Meminta izin...');
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'denied') {
      onStatusChange('Izin GPS ditolak ❌');
      alert('Mohon aktifkan izin lokasi untuk aplikasi ini di pengaturan browser/perangkat Anda.');
      return null;
    }

    onStatusChange('Mencari lokasi...');
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }, 
      async (position, err) => {
        if (err || !position) {
          onStatusChange('Gagal mendapatkan lokasi ❌');
          return;
        }
        onStatusChange('GPS Terhubung ✅');
        await supabase
          .from('shipments')
          .update({ 
            current_lat: position.coords.latitude, 
            current_lng: position.coords.longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipmentId);
      }
    );
    return watchId;
  } catch (error) {
    onStatusChange('GPS tidak tersedia ❌');
    console.error("Error starting GPS:", error);
    return null;
  }
};

export const stopTracking = (watchId: string) => {
  if (watchId) {
    Geolocation.clearWatch({ id: watchId });
  }
};
