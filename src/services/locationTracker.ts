
import { supabase } from '@/integrations/supabase/client';

let watchId: number | null = null;

// Menggunakan API Geolocation standar milik browser
export const startTracking = (shipmentId: string, onStatusChange: (status: string) => void) => {
  if (!navigator.geolocation) {
    onStatusChange('GPS tidak didukung ❌');
    return Promise.resolve(null);
  }

  if (watchId !== null) {
    stopTracking();
  }
  
  onStatusChange('Meminta izin...');

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onStatusChange('Mencari lokasi...');
        const { latitude, longitude } = position.coords;

        supabase.from('shipments').update({ current_lat: latitude, current_lng: longitude }).eq('id', shipmentId);
        
        watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            onStatusChange('GPS Terhubung ✅');
            await supabase.from('shipments').update({ current_lat: pos.coords.latitude, current_lng: pos.coords.longitude }).eq('id', shipmentId);
          },
          (error) => onStatusChange('Koneksi GPS terputus ⚠️'),
          { enableHighAccuracy: true }
        );
        resolve(String(watchId));
      },
      (error) => {
        onStatusChange('Izin GPS ditolak ❌');
        resolve(null);
      }
    );
  });
};

export const stopTracking = () => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};
