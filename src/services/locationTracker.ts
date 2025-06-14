
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type StatusCallback = (status: string) => void;

class LocationTracker {
  private watchId: string | null = null;
  private isTracking = false;
  private statusCallback: StatusCallback | null = null;
  private currentShipmentId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      const permissions = await Geolocation.requestPermissions();
      console.log('Location permissions result:', permissions);
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(shipmentId: string, onStatusChange?: StatusCallback): Promise<void> {
    console.log('Starting GPS tracking for shipment:', shipmentId);
    
    if (this.isTracking && this.currentShipmentId === shipmentId) {
      console.log('Already tracking this shipment');
      return;
    }

    // Stop any existing tracking
    if (this.isTracking) {
      await this.stopTracking();
    }

    this.currentShipmentId = shipmentId;
    this.statusCallback = onStatusChange || null;
    this.updateStatus('Meminta izin lokasi...');

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.updateStatus('Izin lokasi ditolak ❌');
        toast.error('Izin lokasi diperlukan untuk pelacakan GPS');
        return;
      }

      this.updateStatus('Memulai GPS...');
      console.log('Starting location watch...');

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
        (position, err) => {
          if (err) {
            console.error('Location error:', err);
            this.updateStatus('GPS Error ⚠️');
            toast.error('Error GPS: ' + err.message);
            return;
          }

          if (position && this.currentShipmentId) {
            console.log('New GPS position received:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp)
            });
            
            this.updateShipmentLocation(
              this.currentShipmentId, 
              position.coords.latitude, 
              position.coords.longitude
            );
            
            this.updateStatus(`GPS Aktif ✅ (±${Math.round(position.coords.accuracy)}m)`);
          }
        }
      );

      this.isTracking = true;
      console.log('GPS tracking started successfully with watchId:', this.watchId);
      toast.success('GPS tracking berhasil dimulai');
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.updateStatus('Gagal memulai GPS ❌');
      toast.error('Gagal memulai pelacakan GPS: ' + error);
    }
  }

  async stopTracking(): Promise<void> {
    console.log('Stopping GPS tracking...');
    if (this.watchId) {
      try {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
        this.isTracking = false;
        this.currentShipmentId = null;
        this.updateStatus('GPS Dihentikan');
        console.log('GPS tracking stopped successfully');
        toast.success('Pelacakan GPS dihentikan');
      } catch (error) {
        console.error('Error stopping location tracking:', error);
        toast.error('Error saat menghentikan GPS');
      }
    }
  }

  private updateStatus(status: string): void {
    console.log('GPS Status update:', status);
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  private async updateShipmentLocation(shipmentId: string, lat: number, lng: number): Promise<void> {
    try {
      console.log('Updating shipment location in database:', { shipmentId, lat, lng });
      
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
        toast.error('Gagal update lokasi: ' + error.message);
      } else {
        console.log('✅ Location successfully updated in database');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Error saat menyimpan lokasi');
    }
  }

  async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      console.log('Getting current position...');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log('Current position obtained:', coords);
      return coords;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getCurrentShipmentId(): string | null {
    return this.currentShipmentId;
  }
}

export const locationTracker = new LocationTracker();
