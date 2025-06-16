
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Users, RefreshCw, Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { getMapboxToken } from '@/utils/mapboxSettings';

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  driver_name?: string;
  license_plate?: string;
}

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapError, setMapError] = useState<string>('');

  useEffect(() => {
    const initMapbox = async () => {
      try {
        const token = await getMapboxToken();
        if (!token) {
          setMapError('Token Mapbox tidak tersedia. Silakan hubungi admin untuk mengkonfigurasi token.');
          setIsLoading(false);
          return;
        }
        setMapboxToken(token);
        
        if (mapContainer.current) {
          initializeMap(token);
        }
      } catch (error) {
        console.error('Error getting Mapbox token:', error);
        setMapError('Gagal memuat konfigurasi peta.');
        setIsLoading(false);
      }
    };
    
    initMapbox();
  }, []);

  useEffect(() => {
    if (mapboxToken) {
      fetchDriverLocations();
      const interval = setInterval(fetchDriverLocations, 30000);

      const channel = supabase
        .channel('shipments_realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shipments'
        }, () => {
          fetchDriverLocations();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [mapboxToken]);

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [106.8456, -6.2088], // Jakarta coordinates
        zoom: 11,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Gagal menginisialisasi peta.');
    }
  };

  const fetchDriverLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          driver_id,
          current_lat,
          current_lng,
          updated_at,
          drivers (
            name,
            license_plate
          )
        `)
        .not('driver_id', 'is', null)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching driver locations:', error);
        return;
      }

      const locations: DriverLocation[] = data?.map((item: any) => ({
        driver_id: item.driver_id,
        latitude: item.current_lat,
        longitude: item.current_lng,
        updated_at: item.updated_at,
        driver_name: item.drivers?.name,
        license_plate: item.drivers?.license_plate
      })) || [];

      setDriverLocations(locations);
      setLastUpdate(new Date());
      updateMarkers(locations);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarkers = (locations: DriverLocation[]) => {
    if (!map.current) return;

    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    locations.forEach((location) => {
      const driverName = location.driver_name || `Driver ${location.driver_id}`;
      
      const carMarker = document.createElement('div');
      carMarker.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="bg-blue-600 rounded-full p-1.5 shadow-lg border-2 border-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m-7 0a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m0 0V11a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5"/>
            </svg>
          </div>
          <div class="bg-white text-gray-800 text-xs px-2 py-1 rounded shadow mt-1 max-w-16 truncate border">
            ${driverName}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker(carMarker)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-sm">${driverName}</h3>
            ${location.license_plate ? `<p class="text-xs text-gray-600">${location.license_plate}</p>` : ''}
            <p class="text-xs text-gray-600">
              Update: ${new Date(location.updated_at).toLocaleTimeString('id-ID')}
            </p>
          </div>
        `);

      marker.setPopup(popup);
      markers.current[location.driver_id] = marker;
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (mapError) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-red-800 mb-2">Error Peta</h3>
          <p className="text-red-600 text-sm">{mapError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken || isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konfigurasi peta...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'} flex flex-col rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Live Driver Tracking</h3>
            <p className="text-sm text-gray-500">
              Update: {lastUpdate.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Users className="h-3 w-3 mr-1" />
            {driverLocations.length}
          </Badge>
          
          <Button
            onClick={fetchDriverLocations}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="outline"
            className="border-gray-200 hover:bg-gray-50"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div ref={mapContainer} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm border">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Memuat lokasi driver...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMap;
