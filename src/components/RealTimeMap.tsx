import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle, Settings, Trash2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getMapboxToken, saveMapboxToken, deleteMapboxToken } from '@/utils/mapboxSettings';

interface DriverLocation {
  driver_id: string;
  driver_name: string;
  license_plate: string;
  current_lat: number;
  current_lng: number;
  updated_at: string;
  shipment_count: number;
  destinations: string[];
}

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [showTokenManager, setShowTokenManager] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isSavingToken, setIsSavingToken] = useState(false);

  // Load token from Supabase on component mount
  useEffect(() => {
    loadTokenFromDatabase();
  }, []);

  const loadTokenFromDatabase = async () => {
    setIsLoadingToken(true);
    console.log('🔑 Loading Mapbox token from Supabase...');
    
    const token = await getMapboxToken();
    
    if (token) {
      setMapboxToken(token);
      setTokenInput(token);
      console.log('✅ Loaded Mapbox token from Supabase');
    } else {
      // Set default token if no saved token
      const defaultToken = 'pk.eyJ1Ijoia2Vsb2xhc2VuamEiLCJhIjoiY21id3gzbnA0MTc1cTJrcHVuZHJyMWo2ciJ9.84jSVtrqyFb8MJwKFeGm1g';
      setMapboxToken(defaultToken);
      setTokenInput(defaultToken);
      // Save default token to database
      await saveMapboxToken(defaultToken);
      console.log('📱 Set and saved default Mapbox token');
    }
    
    setIsLoadingToken(false);
  };

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current && !isLoadingToken) {
      initializeMap();
    }
  }, [mapboxToken, isLoadingToken]);

  useEffect(() => {
    if (mapboxToken && !isLoadingToken) {
      fetchDriverLocations();
      const interval = setInterval(fetchDriverLocations, 3000); // Update every 3 seconds for live tracking
      subscribeToLocationUpdates();
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [mapboxToken, isLoadingToken]);

  const handleTokenSubmit = async () => {
    if (tokenInput.trim()) {
      setIsSavingToken(true);
      const newToken = tokenInput.trim();
      
      const success = await saveMapboxToken(newToken);
      if (success) {
        setMapboxToken(newToken);
        
        // Reinitialize map with new token
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        
        setShowTokenManager(false);
      }
      setIsSavingToken(false);
    } else {
      toast.error('Masukkan Mapbox token yang valid');
    }
  };

  const handleClearToken = async () => {
    setIsSavingToken(true);
    const success = await deleteMapboxToken();
    
    if (success) {
      setMapboxToken('');
      setTokenInput('');
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      
      setShowTokenManager(false);
    }
    setIsSavingToken(false);
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [106.8456, -6.2088], // Jakarta coordinates
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        console.log('🗺️ Map loaded successfully');
        fetchDriverLocations(); // Fetch locations once map is ready
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        toast.error('Error loading map. Please check your Mapbox token.');
      });
    } catch (error) {
      console.error('❌ Map initialization error:', error);
      toast.error('Failed to initialize map. Please check your Mapbox token.');
    }
  };

  const fetchDriverLocations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🗺️ Fetching driver GPS locations for live map...');
      
      // Get unique drivers with their latest location and shipment info
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          driver_id,
          current_lat, 
          current_lng,
          updated_at,
          tujuan,
          drivers (name, license_plate)
        `)
        .eq('tanggal_kirim', today)
        .eq('status', 'tertunda')
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null)
        .not('driver_id', 'is', null);

      if (error) {
        console.error('❌ Error fetching driver locations:', error);
        return;
      }

      console.log('📍 Raw driver data:', data?.length || 0);
      
      // Group by driver_id to get unique drivers
      const driverMap = new Map<string, DriverLocation>();
      
      data?.forEach((shipment: any) => {
        if (!shipment.driver_id || !shipment.drivers) return;
        
        const driverId = shipment.driver_id;
        const existing = driverMap.get(driverId);
        
        if (!existing || new Date(shipment.updated_at) > new Date(existing.updated_at)) {
          // Use the most recent location for this driver
          driverMap.set(driverId, {
            driver_id: driverId,
            driver_name: shipment.drivers.name,
            license_plate: shipment.drivers.license_plate,
            current_lat: shipment.current_lat,
            current_lng: shipment.current_lng,
            updated_at: shipment.updated_at,
            shipment_count: 1,
            destinations: [shipment.tujuan]
          });
        } else if (existing) {
          // Update shipment count and destinations for existing driver
          existing.shipment_count += 1;
          if (!existing.destinations.includes(shipment.tujuan)) {
            existing.destinations.push(shipment.tujuan);
          }
        }
      });

      const uniqueDrivers = Array.from(driverMap.values());
      console.log('📍 Unique drivers with GPS:', uniqueDrivers.length);
      
      setDrivers(uniqueDrivers);
      
      if (map.current) {
        updateMapMarkers(uniqueDrivers);
      }
    } catch (error) {
      console.error('💥 Error:', error);
    }
  };

  const updateMapMarkers = (driverData: DriverLocation[]) => {
    if (!map.current) return;

    console.log('🗺️ Updating map markers for', driverData.length, 'drivers');

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    const newMarkers: mapboxgl.Marker[] = [];

    driverData.forEach((driver) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '35px';
      el.style.height = '35px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = selectedDriver === driver.driver_id ? '3px solid #FF6B6B' : '2px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      
      // Use a truck emoji or color for the marker
      el.style.backgroundColor = '#10B981';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '18px';
      el.innerHTML = '🚛';

      // Add click event
      el.addEventListener('click', () => {
        console.log('📍 Driver marker clicked:', driver.driver_name);
        setSelectedDriver(driver.driver_id);
        // Zoom to selected driver
        map.current?.flyTo({
          center: [driver.current_lng, driver.current_lat],
          zoom: 15,
          duration: 1000
        });
      });

      // Create popup with detailed driver info
      const lastUpdate = new Date(driver.updated_at);
      const timeAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000);
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 12px; font-family: sans-serif; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
            🚛 ${driver.driver_name}
          </h3>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            📋 ${driver.license_plate}
          </p>
          <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">
            📦 ${driver.shipment_count} pengiriman aktif
          </p>
          <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
            📍 Tujuan: ${driver.destinations.join(', ')}
          </p>
          <p style="margin: 0 0 8px 0; color: ${timeAgo < 1 ? '#10B981' : timeAgo < 5 ? '#F59E0B' : '#EF4444'}; font-size: 12px; font-weight: bold;">
            🕐 ${timeAgo < 1 ? '🟢 LIVE' : `⏰ ${timeAgo} menit lalu`}
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
            Lat: ${driver.current_lat.toFixed(6)}<br>
            Lng: ${driver.current_lng.toFixed(6)}
          </p>
        </div>`
      );

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.current_lng, driver.current_lat])
        .setPopup(popup)
        .addTo(map.current);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (driverData.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      driverData.forEach(driver => {
        bounds.extend([driver.current_lng, driver.current_lat]);
      });
      
      map.current?.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
      
      console.log('🗺️ Map bounds updated to show all', driverData.length, 'driver markers');
    }
  };

  const subscribeToLocationUpdates = () => {
    console.log('🔔 Map subscribing to realtime GPS updates...');
    const channel = supabase
      .channel('driver_locations_live_map')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments'
      }, (payload) => {
        console.log('⚡ Live GPS update received:', payload.new?.driver_id);
        fetchDriverLocations(); // Refresh driver locations immediately
      })
      .subscribe();

    return () => {
      console.log('🔌 Map unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  };

  if (isLoadingToken) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mr-3"></div>
            <p>Memuat pengaturan Mapbox...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Peta Pelacakan Real-time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 mb-3">
              <strong>Token Mapbox tidak ditemukan</strong>
            </p>
            <p className="text-xs text-blue-600 mb-4">
              Untuk menggunakan peta real-time, masukkan token Mapbox di bawah ini.
              Token akan disimpan di database dan dapat diakses dari komputer manapun.
            </p>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-xs text-green-700">
                ✅ <strong>Mapbox Gratis:</strong> 50,000 map loads per bulan tanpa biaya
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Masukkan Mapbox Public Token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1"
              disabled={isSavingToken}
            />
            <Button 
              onClick={handleTokenSubmit}
              disabled={isSavingToken}
              className="flex items-center gap-2"
            >
              {isSavingToken ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Token
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Peta Live Tracking - Driver Hari Ini
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokenManager(!showTokenManager)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Kelola Token
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Token Manager */}
          {showTokenManager && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-3">Pengaturan Mapbox Token</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Token Aktif Saat Ini:</label>
                  <div className="bg-white p-2 rounded text-xs font-mono border break-all">
                    {mapboxToken ? `${mapboxToken.substring(0, 20)}...${mapboxToken.substring(mapboxToken.length - 10)}` : 'Tidak ada token'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Masukkan token baru..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1"
                    disabled={isSavingToken}
                  />
                  <Button 
                    onClick={handleTokenSubmit} 
                    size="sm"
                    disabled={isSavingToken}
                    className="flex items-center gap-1"
                  >
                    {isSavingToken ? (
                      <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></div>
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Update
                  </Button>
                  <Button 
                    onClick={handleClearToken} 
                    variant="destructive" 
                    size="sm"
                    disabled={isSavingToken}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Token disimpan di database dan dapat diakses dari komputer manapun
                </p>
              </div>
            </div>
          )}

          <div ref={mapContainer} className="h-96 w-full rounded-lg" />
          {drivers.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  Tidak ada driver dengan GPS aktif hari ini. Pastikan driver mengaktifkan GPS di dashboard mereka.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Drivers List */}
      {drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-600" />
              Driver Aktif Live ({drivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drivers.map((driver) => {
                const timeAgo = Math.floor((new Date().getTime() - new Date(driver.updated_at).getTime()) / 60000);
                return (
                  <div
                    key={driver.driver_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDriver === driver.driver_id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedDriver(driver.driver_id);
                      map.current?.flyTo({
                        center: [driver.current_lng, driver.current_lat],
                        zoom: 15,
                        duration: 1000
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">
                          🚛 {driver.driver_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          📋 {driver.license_plate}
                        </div>
                        <div className="text-sm text-gray-500">
                          📦 {driver.shipment_count} pengiriman • {driver.destinations.join(', ')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-center gap-1 ${timeAgo < 1 ? 'text-green-600' : timeAgo < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          <Navigation className="h-4 w-4 animate-pulse" />
                          <span className="text-xs font-medium">
                            {timeAgo < 1 ? 'LIVE' : `${timeAgo}m`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeMap;
