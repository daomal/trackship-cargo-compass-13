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

interface ShipmentLocation {
  id: string;
  no_surat_jalan: string;
  tujuan: string;
  current_lat: number;
  current_lng: number;
  updated_at: string;
  drivers?: {
    name: string;
    license_plate: string;
  } | null;
}

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [shipments, setShipments] = useState<ShipmentLocation[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
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
      fetchShipmentLocations();
      const interval = setInterval(fetchShipmentLocations, 10000);
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
        fetchShipmentLocations(); // Fetch locations once map is ready
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

  const fetchShipmentLocations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🗺️ Fetching GPS locations for map...');
      
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, 
          no_surat_jalan, 
          tujuan, 
          current_lat, 
          current_lng,
          updated_at,
          tanggal_kirim,
          drivers (name, license_plate)
        `)
        .eq('tanggal_kirim', today)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      if (error) {
        console.error('❌ Error fetching shipment locations:', error);
        return;
      }

      console.log('📍 GPS locations found:', data?.length || 0);
      const shipmentData = (data || []) as ShipmentLocation[];
      setShipments(shipmentData);
      
      if (map.current) {
        updateMapMarkers(shipmentData);
      }
    } catch (error) {
      console.error('💥 Error:', error);
    }
  };

  const updateMapMarkers = (shipmentData: ShipmentLocation[]) => {
    if (!map.current) return;

    console.log('🗺️ Updating map markers for', shipmentData.length, 'locations');

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    const newMarkers: mapboxgl.Marker[] = [];

    shipmentData.forEach((shipment) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = selectedShipment === shipment.id ? '3px solid #FF6B6B' : '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      
      // Use a truck emoji or color for the marker
      el.style.backgroundColor = '#3B82F6';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '16px';
      el.innerHTML = '🚛';

      // Add click event
      el.addEventListener('click', () => {
        console.log('📍 Marker clicked:', shipment.drivers?.name);
        setSelectedShipment(shipment.id);
        // Zoom to selected shipment
        map.current?.flyTo({
          center: [shipment.current_lng, shipment.current_lat],
          zoom: 15,
          duration: 1000
        });
      });

      // Create popup with more detailed info
      const lastUpdate = new Date(shipment.updated_at);
      const timeAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000);
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 12px; font-family: sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
            🚛 ${shipment.drivers?.name || 'Driver Tidak Diketahui'}
          </h3>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            📋 ${shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
          </p>
          <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">
            📍 Tujuan: ${shipment.tujuan}
          </p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
            🕐 Update: ${timeAgo < 1 ? 'Baru saja' : `${timeAgo} menit lalu`}
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
            Lat: ${shipment.current_lat.toFixed(6)}<br>
            Lng: ${shipment.current_lng.toFixed(6)}
          </p>
        </div>`
      );

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([shipment.current_lng, shipment.current_lat])
        .setPopup(popup)
        .addTo(map.current);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (shipmentData.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      shipmentData.forEach(shipment => {
        bounds.extend([shipment.current_lng, shipment.current_lat]);
      });
      
      map.current?.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
      
      console.log('🗺️ Map bounds updated to show all', shipmentData.length, 'markers');
    }
  };

  const subscribeToLocationUpdates = () => {
    console.log('🔔 Map subscribing to realtime GPS updates...');
    const channel = supabase
      .channel('shipment_locations_map')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments'
      }, (payload) => {
        console.log('⚡ Map GPS update received:', payload.new?.id);
        fetchShipmentLocations();
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
              Peta Pelacakan Real-time - Driver Hari Ini
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
          {shipments.length === 0 && (
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

      {/* Driver List */}
      {shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-600" />
              Driver Aktif di Peta ({shipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedShipment === shipment.id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedShipment(shipment.id);
                    map.current?.flyTo({
                      center: [shipment.current_lng, shipment.current_lat],
                      zoom: 15,
                      duration: 1000
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">
                        🚛 {shipment.drivers?.name || 'Driver Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-600">
                        📋 {shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-500">
                        📍 Tujuan: {shipment.tujuan}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Navigation className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-medium">GPS ON</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeMap;
