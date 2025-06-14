
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShipmentLocation {
  id: string;
  no_surat_jalan: string;
  tujuan: string;
  current_lat: number;
  current_lng: number;
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

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (mapboxToken) {
      fetchShipmentLocations();
      const interval = setInterval(fetchShipmentLocations, 10000); // Update setiap 10 detik
      subscribeToLocationUpdates();
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [mapboxToken]);

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      toast.success('Mapbox token berhasil diatur');
    } else {
      toast.error('Masukkan Mapbox token yang valid');
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [106.8456, -6.2088], // Jakarta coordinates
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });
  };

  const fetchShipmentLocations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, 
          no_surat_jalan, 
          tujuan, 
          current_lat, 
          current_lng,
          tanggal_kirim,
          drivers (name, license_plate)
        `)
        .eq('status', 'tertunda')
        .eq('tanggal_kirim', today)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      if (error) {
        console.error('Error fetching shipment locations:', error);
        return;
      }

      const shipmentData = (data || []) as ShipmentLocation[];
      setShipments(shipmentData);
      updateMapMarkers(shipmentData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateMapMarkers = (shipmentData: ShipmentLocation[]) => {
    if (!map.current) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    const newMarkers: mapboxgl.Marker[] = [];

    shipmentData.forEach((shipment) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMUM5Ljc5IDExIDggOS4yMSA4IDlDOCA2Ljc5IDkuNzkgNSAxMiA1QzE0LjIxIDUgMTYgNi43OSAxNiA5QzE2IDkuMjEgMTQuMjEgMTEgMTIgMTFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+)';
      el.style.backgroundSize = 'cover';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = selectedShipment === shipment.id ? '3px solid #FF6B6B' : '2px solid white';

      // Add click event
      el.addEventListener('click', () => {
        setSelectedShipment(shipment.id);
        // Zoom to selected shipment
        map.current?.flyTo({
          center: [shipment.current_lng, shipment.current_lat],
          zoom: 15,
          duration: 1000
        });
      });

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 10px; font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;">
            ${shipment.drivers?.name || 'Driver Tidak Diketahui'}
          </h3>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
            ${shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
          </p>
          <p style="margin: 0; color: #374151; font-size: 12px;">
            Tujuan: ${shipment.tujuan}
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
    }
  };

  const subscribeToLocationUpdates = () => {
    const channel = supabase
      .channel('shipment_locations_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments'
      }, () => {
        console.log('Real-time location update received');
        fetchShipmentLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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
              <strong>Untuk menggunakan peta real-time:</strong>
            </p>
            <ol className="text-xs text-blue-600 space-y-1 mb-4">
              <li>1. Buat akun di <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a></li>
              <li>2. Dapatkan Public Token dari dashboard Mapbox</li>
              <li>3. Masukkan token di bawah ini</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Masukkan Mapbox Public Token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTokenSubmit}>
              Aktifkan Peta
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
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Peta Pelacakan Real-time - Driver Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} className="h-96 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Driver List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" />
            Driver Aktif Hari Ini ({shipments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {shipments.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada driver dengan GPS aktif hari ini</p>
              </div>
            ) : (
              shipments.map((shipment) => (
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
                        {shipment.drivers?.name || 'Driver Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tujuan: {shipment.tujuan}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Navigation className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-medium">GPS ON</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMap;
