
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type StatusCallback = (status: string) => void;

class LocationTracker {
  private watchId: string | null = null;
  private isTracking = false;
  private statusCallback: StatusCallback | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(shipmentId: string, onStatusChange?: StatusCallback): Promise<void> {
    if (this.isTracking) {
      console.log('Already tracking location');
      return;
    }

    this.statusCallback = onStatusChange || null;
    this.updateStatus('Meminta izin lokasi...');

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateStatus('Izin lokasi ditolak ❌');
      toast.error('Izin lokasi diperlukan untuk pelacakan GPS');
      return;
    }

    this.updateStatus('Mencari lokasi...');

    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        },
        (position, err) => {
          if (err) {
            console.error('Location error:', err);
            this.updateStatus('GPS Error ⚠️');
            return;
          }

          if (position) {
            this.updateShipmentLocation(shipmentId, position.coords.latitude, position.coords.longitude);
            this.updateStatus('GPS Terhubung ✅');
          }
        }
      );

      this.isTracking = true;
      toast.success('Pelacakan GPS dimulai');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.updateStatus('Gagal memulai GPS ❌');
      toast.error('Gagal memulai pelacakan GPS');
    }
  }

  async stopTracking(): Promise<void> {
    if (this.watchId) {
      try {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
        this.isTracking = false;
        this.updateStatus('GPS Dihentikan');
        toast.success('Pelacakan GPS dihentikan');
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      }
    }
  }

  private updateStatus(status: string): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  private async updateShipmentLocation(shipmentId: string, lat: number, lng: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          current_lat: lat,
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) {
        console.error('Error updating shipment location:', error);
      } else {
        console.log('Location updated:', { lat, lng });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationTracker = new LocationTracker();
