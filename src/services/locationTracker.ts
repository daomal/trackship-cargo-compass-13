import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type StatusCallback = (status: string) => void;

// Declare Capacitor interface to fix TypeScript error
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
    };
  }
}

class LocationTracker {
  private watchId: string | number | null = null;
  private isTracking = false;
  private statusCallback: StatusCallback | null = null;
  private currentShipmentId: string | null = null;
  private isCapacitorAvailable = false;

  constructor() {
    // Check if we're in a Capacitor environment
    this.isCapacitorAvailable = typeof window !== 'undefined' && 
      window.Capacitor !== undefined && 
      window.Capacitor.isNativePlatform && 
      window.Capacitor.isNativePlatform();
    
    console.log('LocationTracker initialized, Capacitor available:', this.isCapacitorAvailable);
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      
      if (this.isCapacitorAvailable) {
        try {
          const permissions = await Geolocation.requestPermissions();
          console.log('Capacitor location permissions result:', permissions);
          return permissions.location === 'granted';
        } catch (error) {
          console.log('Capacitor permissions failed, falling back to browser API:', error);
          // Fall back to browser API if Capacitor fails
        }
      }
      
      // Use browser geolocation API (fallback or primary)
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return false;
      }
      
      // Check if permission is already granted
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Browser geolocation permission:', permission.state);
        return permission.state === 'granted' || permission.state === 'prompt';
      }
      
      // If permissions API is not available, assume we can request it
      return true;
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

      if (this.isCapacitorAvailable) {
        try {
          // Use Capacitor Geolocation
          this.watchId = await Geolocation.watchPosition(
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000,
            },
            (position, err) => {
              this.handleLocationUpdate(position, err);
            }
          );
        } catch (error) {
          console.log('Capacitor watchPosition failed, falling back to browser API:', error);
          this.startBrowserTracking();
        }
      } else {
        this.startBrowserTracking();
      }

      this.isTracking = true;
      console.log('GPS tracking started successfully with watchId:', this.watchId);
      toast.success('GPS tracking berhasil dimulai');
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.updateStatus('Gagal memulai GPS ❌');
      toast.error('Gagal memulai pelacakan GPS: ' + error);
    }
  }

  private startBrowserTracking(): void {
    // Use browser geolocation API
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('Browser GPS position received:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
        
        if (this.currentShipmentId) {
          this.updateShipmentLocation(
            this.currentShipmentId, 
            position.coords.latitude, 
            position.coords.longitude
          );
          
          this.updateStatus(`GPS Aktif ✅ (±${Math.round(position.coords.accuracy)}m)`);
        }
      },
      (error) => {
        console.error('Browser geolocation error:', error);
        this.updateStatus('GPS Error ⚠️');
        toast.error('Error GPS: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }

  private handleLocationUpdate(position: any, err: any): void {
    if (err) {
      console.error('Capacitor location error:', err);
      this.updateStatus('GPS Error ⚠️');
      toast.error('Error GPS: ' + err.message);
      return;
    }

    if (position && this.currentShipmentId) {
      console.log('Capacitor GPS position received:', {
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

  async stopTracking(): Promise<void> {
    console.log('Stopping GPS tracking...');
    if (this.watchId !== null) {
      try {
        if (this.isCapacitorAvailable) {
          await Geolocation.clearWatch({ id: this.watchId as string });
        } else {
          navigator.geolocation.clearWatch(this.watchId as number);
        }
        
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
      
      if (this.isCapacitorAvailable) {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
          });

          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          console.log('Current position obtained (Capacitor):', coords);
          return coords;
        } catch (error) {
          console.log('Capacitor getCurrentPosition failed, falling back to browser API:', error);
        }
      }
      
      // Use browser geolocation API (fallback or primary)
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log('Current position obtained (Browser):', coords);
            resolve(coords);
          },
          (error) => {
            console.error('Error getting current position:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000
          }
        );
      });
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
