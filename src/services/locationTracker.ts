
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
      const permissions = await Geolocation.requestPermissions();
      console.log('Location permissions:', permissions);
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(shipmentId: string, onStatusChange?: StatusCallback): Promise<void> {
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

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateStatus('Izin lokasi ditolak ❌');
      toast.error('Izin lokasi diperlukan untuk pelacakan GPS');
      return;
    }

    this.updateStatus('Mencari lokasi...');
    console.log('Starting location tracking for shipment:', shipmentId);

    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000, // 30 seconds
        },
        (position, err) => {
          if (err) {
            console.error('Location error:', err);
            this.updateStatus('GPS Error ⚠️');
            toast.error('Error GPS: ' + err.message);
            return;
          }

          if (position && this.currentShipmentId) {
            console.log('New GPS position:', {
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
      toast.success('Pelacakan GPS dimulai untuk pengiriman ini');
      console.log('GPS tracking started successfully');
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
        toast.success('Pelacakan GPS dihentikan');
        console.log('GPS tracking stopped successfully');
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
        toast.error('Gagal update lokasi ke database: ' + error.message);
      } else {
        console.log('✅ Location successfully updated in database');
        // Tambahkan feedback visual bahwa data tersimpan
        toast.success('📍 Lokasi tersimpan ke database', { duration: 2000 });
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
