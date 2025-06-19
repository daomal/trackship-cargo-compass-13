
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
  private backgroundUpdateInterval: NodeJS.Timeout | null = null;
  private lastKnownPosition: { lat: number; lng: number } | null = null;

  constructor() {
    // Check if we're in a Capacitor environment
    this.isCapacitorAvailable = typeof window !== 'undefined' && 
      window.Capacitor !== undefined && 
      window.Capacitor.isNativePlatform && 
      window.Capacitor.isNativePlatform();
    
    console.log('LocationTracker initialized, Capacitor available:', this.isCapacitorAvailable);
    
    // Setup background tracking handlers
    this.setupBackgroundTracking();
  }

  private setupBackgroundTracking(): void {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.isTracking) {
          console.log('🌙 App went to background, starting background GPS tracking...');
          this.startBackgroundTracking();
        } else if (document.visibilityState === 'visible' && this.isTracking) {
          console.log('☀️ App came to foreground, resuming normal GPS tracking...');
          this.stopBackgroundTracking();
        }
      });

      // Handle page unload/beforeunload
      window.addEventListener('beforeunload', () => {
        if (this.isTracking) {
          console.log('📱 App closing, enabling background GPS...');
          this.startBackgroundTracking();
          
          // Store tracking state in localStorage for persistence
          localStorage.setItem('gps_tracking_active', 'true');
          localStorage.setItem('gps_driver_id', this.currentDriverId || '');
          if (this.lastKnownPosition) {
            localStorage.setItem('last_gps_position', JSON.stringify(this.lastKnownPosition));
          }
        }
      });

      // Restore tracking state when page loads
      window.addEventListener('load', () => {
        const wasTracking = localStorage.getItem('gps_tracking_active') === 'true';
        const savedDriverId = localStorage.getItem('gps_driver_id');
        
        if (wasTracking && savedDriverId) {
          console.log('🔄 Restoring GPS tracking for driver:', savedDriverId);
          setTimeout(() => {
            this.startTrackingForDriver(savedDriverId, this.statusCallback);
          }, 1000);
        }
      });
    }

    // Register service worker for background processing
    this.registerServiceWorker();
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered for background GPS');
        
        // Send GPS data to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'GPS_TRACKING_INIT',
            driverId: this.currentDriverId
          });
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  private startBackgroundTracking(): void {
    if (this.backgroundUpdateInterval) return;
    
    console.log('🔧 Starting background GPS updates...');
    
    // More frequent updates when in background to ensure continuity
    this.backgroundUpdateInterval = setInterval(async () => {
      if (this.currentDriverId) {
        const position = await this.getCurrentPosition();
        if (position) {
          this.lastKnownPosition = position;
          await this.updateDriverLocation(this.currentDriverId, position.lat, position.lng);
          console.log('📡 Background GPS update sent:', position);
          
          // Update localStorage with latest position
          localStorage.setItem('last_gps_position', JSON.stringify(position));
        }
      }
    }, 3000); // Every 3 seconds for background tracking
  }

  private stopBackgroundTracking(): void {
    if (this.backgroundUpdateInterval) {
      clearInterval(this.backgroundUpdateInterval);
      this.backgroundUpdateInterval = null;
      console.log('⏹️ Background GPS tracking stopped');
    }
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
        }
      }
      
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return false;
      }
      
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Browser geolocation permission:', permission.state);
        return permission.state === 'granted' || permission.state === 'prompt';
      }
      
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
          this.watchId = await Geolocation.watchPosition(
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 2000, // Reduce cache time for more accurate tracking
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
      
      // Store active state
      localStorage.setItem('gps_tracking_active', 'true');
      localStorage.setItem('gps_driver_id', driverId);
      
      // Set up continuous updates
      this.updateInterval = setInterval(() => {
        if (this.isTracking && document.visibilityState === 'visible') {
          this.getCurrentPosition().then(coords => {
            if (coords && this.currentDriverId) {
              this.lastKnownPosition = coords;
              this.updateDriverLocation(this.currentDriverId, coords.lat, coords.lng);
            }
          });
        }
      }, 2000); // Every 2 seconds when app is active
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.updateStatus('Gagal memulai GPS ❌');
      toast.error('Gagal memulai pelacakan GPS: ' + error);
    }
  }

  private startBrowserTracking(): void {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('Browser GPS position received:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
        
        if (this.currentDriverId) {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.lastKnownPosition = coords;
          
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
        timeout: 8000,
        maximumAge: 1000, // Very fresh data for continuous tracking
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
      
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      this.lastKnownPosition = coords;
      
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
    
    this.stopBackgroundTracking();
    
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
        this.lastKnownPosition = null;
        
        // Clear stored state
        localStorage.removeItem('gps_tracking_active');
        localStorage.removeItem('gps_driver_id');
        localStorage.removeItem('last_gps_position');
        
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
      
      const { error } = await supabase
        .from('shipments')
        .update({
          current_lat: lat,
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .eq('status', 'tertunda');

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
            timeout: 8000
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
            timeout: 8000
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

  getLastKnownPosition(): { lat: number; lng: number } | null {
    return this.lastKnownPosition;
  }
}

export const locationTracker = new LocationTracker();
