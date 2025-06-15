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
  private currentDriverId: string | null = null;
  private isCapacitorAvailable = false;
  private updateInterval: NodeJS.Timeout | null = null;

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

  async startTrackingForDriver(driverId: string, onStatusChange?: StatusCallback): Promise<void> {
    console.log('Starting GPS tracking for driver:', driverId);
    
    if (this.isTracking && this.currentDriverId === driverId) {
      console.log('Already tracking this driver');
      return;
    }

    // Stop any existing tracking
    if (this.isTracking) {
      await this.stopTracking();
    }

    this.currentDriverId = driverId;
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
      console.log('Starting location watch for driver...');

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
      console.log('GPS tracking started successfully for driver:', driverId);
      toast.success('GPS tracking berhasil dimulai');
      
      // Set up interval to update location more frequently
      this.updateInterval = setInterval(() => {
        if (this.isTracking) {
          this.getCurrentPosition().then(coords => {
            if (coords && this.currentDriverId) {
              this.updateDriverLocation(this.currentDriverId, coords.lat, coords.lng);
            }
          });
        }
      }, 5000); // Update every 5 seconds
      
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
        
        if (this.currentDriverId) {
          this.updateDriverLocation(
            this.currentDriverId, 
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
        maximumAge: 3000, // Reduce cache time for more frequent updates
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

    if (position && this.currentDriverId) {
      console.log('Capacitor GPS position received:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      });
      
      this.updateDriverLocation(
        this.currentDriverId, 
        position.coords.latitude, 
        position.coords.longitude
      );
      
      this.updateStatus(`GPS Aktif ✅ (±${Math.round(position.coords.accuracy)}m)`);
    }
  }

  async stopTracking(): Promise<void> {
    console.log('Stopping GPS tracking...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.watchId !== null) {
      try {
        if (this.isCapacitorAvailable) {
          await Geolocation.clearWatch({ id: this.watchId as string });
        } else {
          navigator.geolocation.clearWatch(this.watchId as number);
        }
        
        this.watchId = null;
        this.isTracking = false;
        this.currentDriverId = null;
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

  private async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    try {
      console.log('Updating driver location in database:', { driverId, lat, lng });
      
      // Update all shipments for this driver with current location
      const { error } = await supabase
        .from('shipments')
        .update({
          current_lat: lat,
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .eq('status', 'tertunda'); // Only update pending shipments

      if (error) {
        console.error('Error updating driver location:', error);
        toast.error('Gagal update lokasi: ' + error.message);
      } else {
        console.log('✅ Driver location successfully updated in database');
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

  getCurrentDriverId(): string | null {
    return this.currentDriverId;
  }
}

export const locationTracker = new LocationTracker();
