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
  delivered_destinations: string[];
}

interface DriverTrail {
  driver_id: string;
  coordinates: [number, number][];
  color: string;
}

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [drivers_markers, setDriverMarkers] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [destination_markers, setDestinationMarkers] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [driver_trails, setDriverTrails] = useState<Map<string, DriverTrail>>(new Map());
  const [showTokenManager, setShowTokenManager] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);

  // Color palette for different drivers
  const driverColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#EE5A24', '#0FB9B1', '#3742FA', '#2F3542', '#FF3838'
  ];

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
      
      // Track user interaction to prevent auto zoom-out
      map.current.on('mousedown', () => setUserInteracting(true));
      map.current.on('touchstart', () => setUserInteracting(true));
      map.current.on('dragstart', () => setUserInteracting(true));
      map.current.on('zoomstart', () => setUserInteracting(true));
      
      map.current.on('mouseup', () => {
        setTimeout(() => setUserInteracting(false), 2000); // Wait 2 seconds before allowing auto-fit
      });
      map.current.on('touchend', () => {
        setTimeout(() => setUserInteracting(false), 2000);
      });
      map.current.on('dragend', () => {
        setTimeout(() => setUserInteracting(false), 2000);
      });
      map.current.on('zoomend', () => {
        setTimeout(() => setUserInteracting(false), 2000);
      });
      
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
          status,
          drivers (name, license_plate)
        `)
        .eq('tanggal_kirim', today)
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
          const delivered = shipment.status === 'terkirim' ? [shipment.tujuan] : [];
          const destinations = [shipment.tujuan];
          
          if (existing) {
            destinations.push(...existing.destinations.filter(d => d !== shipment.tujuan));
            delivered.push(...existing.delivered_destinations);
          }
          
          driverMap.set(driverId, {
            driver_id: driverId,
            driver_name: shipment.drivers.name,
            license_plate: shipment.drivers.license_plate,
            current_lat: shipment.current_lat,
            current_lng: shipment.current_lng,
            updated_at: shipment.updated_at,
            shipment_count: (existing?.shipment_count || 0) + 1,
            destinations: destinations,
            delivered_destinations: delivered
          });
        } else if (existing) {
          existing.shipment_count += 1;
          if (!existing.destinations.includes(shipment.tujuan)) {
            existing.destinations.push(shipment.tujuan);
          }
          if (shipment.status === 'terkirim' && !existing.delivered_destinations.includes(shipment.tujuan)) {
            existing.delivered_destinations.push(shipment.tujuan);
          }
        }
      });

      const uniqueDrivers = Array.from(driverMap.values());
      console.log('📍 Unique drivers with GPS:', uniqueDrivers.length);
      
      setDrivers(uniqueDrivers);
      
      if (map.current) {
        updateMapMarkersAndTrails(uniqueDrivers);
      }
    } catch (error) {
      console.error('💥 Error:', error);
    }
  };

  const createTruckIcon = (color: string, driverName: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw truck body
      ctx.fillStyle = color;
      ctx.fillRect(8, 15, 24, 12);
      
      // Draw truck cabin
      ctx.fillRect(8, 8, 12, 15);
      
      // Draw wheels
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(14, 30, 3, 0, 2 * Math.PI);
      ctx.arc(26, 30, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add driver initial
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(driverName.charAt(0).toUpperCase(), 14, 17);
    }
    
    return canvas;
  };

  const updateMapMarkersAndTrails = (driverData: DriverLocation[]) => {
    if (!map.current) return;

    console.log('🗺️ Updating map markers and trails for', driverData.length, 'drivers');

    // Update driver trails and markers
    driverData.forEach((driver, index) => {
      const driverColor = driverColors[index % driverColors.length];
      const driverId = driver.driver_id;
      const newPosition: [number, number] = [driver.current_lng, driver.current_lat];
      
      // Update or create trail
      const existingTrail = driver_trails.get(driverId);
      if (existingTrail) {
        // Add new position if it's different from the last one
        const lastPos = existingTrail.coordinates[existingTrail.coordinates.length - 1];
        if (!lastPos || lastPos[0] !== newPosition[0] || lastPos[1] !== newPosition[1]) {
          existingTrail.coordinates.push(newPosition);
          
          // Keep only last 50 points to prevent memory issues
          if (existingTrail.coordinates.length > 50) {
            existingTrail.coordinates = existingTrail.coordinates.slice(-50);
          }
          
          updateTrailOnMap(existingTrail);
        }
      } else {
        // Create new trail
        const newTrail: DriverTrail = {
          driver_id: driverId,
          coordinates: [newPosition],
          color: driverColor
        };
        driver_trails.set(driverId, newTrail);
        setDriverTrails(new Map(driver_trails));
        updateTrailOnMap(newTrail);
      }
      
      // Update or create driver marker
      const existingMarker = drivers_markers.get(driverId);
      if (existingMarker) {
        // Smooth animate to new position
        const currentLngLat = existingMarker.getLngLat();
        const targetLngLat = new mapboxgl.LngLat(newPosition[0], newPosition[1]);
        
        if (currentLngLat.lng !== targetLngLat.lng || currentLngLat.lat !== targetLngLat.lat) {
          animateMarker(existingMarker, currentLngLat, targetLngLat, 2000); // 2 second animation
        }
      } else {
        // Create new marker
        const truckIcon = createTruckIcon(driverColor, driver.driver_name);
        const el = document.createElement('div');
        el.appendChild(truckIcon);
        el.style.cursor = 'pointer';
        el.style.transform = 'translate(-50%, -50%)';
        
        el.addEventListener('click', () => {
          console.log('📍 Driver marker clicked:', driver.driver_name);
          setSelectedDriver(driver.driver_id);
          if (!userInteracting) {
            map.current?.flyTo({
              center: newPosition,
              zoom: 15,
              duration: 1000
            });
          }
        });

        // Create popup
        const timeAgo = Math.floor((new Date().getTime() - new Date(driver.updated_at).getTime()) / 60000);
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
            ${driver.delivered_destinations.length > 0 ? 
              `<p style="margin: 0 0 8px 0; color: #10B981; font-size: 14px;">
                ✅ Selesai: ${driver.delivered_destinations.join(', ')}
              </p>` : ''
            }
            <p style="margin: 0 0 8px 0; color: ${timeAgo < 1 ? '#10B981' : timeAgo < 5 ? '#F59E0B' : '#EF4444'}; font-size: 12px; font-weight: bold;">
              🕐 ${timeAgo < 1 ? '🟢 LIVE' : `⏰ ${timeAgo} menit lalu`}
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              Lat: ${driver.current_lat.toFixed(6)}<br>
              Lng: ${driver.current_lng.toFixed(6)}
            </p>
          </div>`
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat(newPosition)
          .setPopup(popup)
          .addTo(map.current);

        drivers_markers.set(driverId, marker);
        setDriverMarkers(new Map(drivers_markers));
      }
      
      // Add destination markers for delivered locations
      driver.delivered_destinations.forEach((destination, destIndex) => {
        const destKey = `${driverId}-${destination}`;
        if (!destination_markers.has(destKey)) {
          const destEl = document.createElement('div');
          destEl.innerHTML = '📍';
          destEl.style.fontSize = '24px';
          destEl.style.cursor = 'pointer';
          destEl.style.transform = 'translate(-50%, -100%)';
          
          const destPopup = new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<div style="padding: 8px; font-family: sans-serif;">
              <h4 style="margin: 0 0 4px 0; color: #10B981; font-size: 14px;">
                ✅ Pengiriman Selesai
              </h4>
              <p style="margin: 0 0 2px 0; font-size: 12px; color: #374151;">
                📍 ${destination}
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                oleh: ${driver.driver_name}
              </p>
            </div>`
          );
          
          // For demo, place delivered markers near the current position
          // In real implementation, you'd have actual destination coordinates
          const destMarker = new mapboxgl.Marker(destEl)
            .setLngLat([newPosition[0] + (destIndex * 0.001), newPosition[1] + (destIndex * 0.001)])
            .setPopup(destPopup)
            .addTo(map.current);
            
          destination_markers.set(destKey, destMarker);
          setDestinationMarkers(new Map(destination_markers));
        }
      });
    });

    // Fit map to show all markers (only if user is not interacting)
    if (driverData.length > 0 && !userInteracting) {
      const bounds = new mapboxgl.LngLatBounds();
      driverData.forEach(driver => {
        bounds.extend([driver.current_lng, driver.current_lat]);
      });
      
      map.current?.fitBounds(bounds, {
        padding: 50,
        maxZoom: 13,
        duration: 1000
      });
      
      console.log('🗺️ Map bounds updated to show all', driverData.length, 'driver markers');
    }
  };

  const updateTrailOnMap = (trail: DriverTrail) => {
    if (!map.current) return;
    
    const sourceId = `trail-${trail.driver_id}`;
    const layerId = `trail-layer-${trail.driver_id}`;
    
    const source = map.current.getSource(sourceId);
    if (source) {
      // Update existing trail
      (source as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: trail.coordinates
        }
      });
    } else {
      // Create new trail
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: trail.coordinates
          }
        }
      });
      
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': trail.color,
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
    }
  };

  const animateMarker = (marker: mapboxgl.Marker, start: mapboxgl.LngLat, end: mapboxgl.LngLat, duration: number) => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLng = start.lng + (end.lng - start.lng) * easeProgress;
      const currentLat = start.lat + (end.lat - start.lat) * easeProgress;
      
      marker.setLngLat([currentLng, currentLat]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
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
        fetchDriverLocations();
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
              {drivers.map((driver, index) => {
                const timeAgo = Math.floor((new Date().getTime() - new Date(driver.updated_at).getTime()) / 60000);
                const driverColor = driverColors[index % driverColors.length];
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
                      if (!userInteracting) {
                        map.current?.flyTo({
                          center: [driver.current_lng, driver.current_lat],
                          zoom: 15,
                          duration: 1000
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: driverColor }}
                          ></div>
                          🚛 {driver.driver_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          📋 {driver.license_plate}
                        </div>
                        <div className="text-sm text-gray-500">
                          📦 {driver.shipment_count} pengiriman • {driver.destinations.join(', ')}
                        </div>
                        {driver.delivered_destinations.length > 0 && (
                          <div className="text-sm text-green-600">
                            ✅ Selesai: {driver.delivered_destinations.join(', ')}
                          </div>
                        )}
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
