
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Users, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
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

  useEffect(() => {
    // Get Mapbox token first
    const initMapbox = async () => {
      const token = await getMapboxToken();
      setMapboxToken(token);
      
      if (token && mapContainer.current) {
        initializeMap(token);
      }
    };
    
    initMapbox();
  }, []);

  useEffect(() => {
    if (mapboxToken) {
      fetchDriverLocations();
      const interval = setInterval(fetchDriverLocations, 30000);

      // Real-time subscription for shipments table
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

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [106.8456, -6.2088], // Jakarta coordinates
      zoom: 11,
      pitch: 30,
      antialias: true
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
  };

  const fetchDriverLocations = async () => {
    try {
      // Query shipments table for drivers with GPS coordinates
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

      // Transform data to DriverLocation format
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

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    locations.forEach((location) => {
      const driverName = location.driver_name || `Driver ${location.driver_id}`;
      
      // Create smaller, refined car marker
      const carMarker = document.createElement('div');
      carMarker.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full p-1 shadow-lg border border-white/50">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m-7 0a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m0 0V11a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5"/>
            </svg>
          </div>
          <div class="bg-black/80 text-white text-xs px-1.5 py-0.5 rounded mt-1 whitespace-nowrap backdrop-blur-sm border border-white/20 max-w-20 truncate">
            ${driverName}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker(carMarker)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${driverName}</h3>
            ${location.license_plate ? `<p class="text-xs text-gray-600">${location.license_plate}</p>` : ''}
            <p class="text-xs text-gray-600">
              Last update: ${new Date(location.updated_at).toLocaleTimeString('id-ID')}
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

  if (!mapboxToken) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
        <div className="text-center text-white">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Loading map configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'} flex flex-col rounded-xl overflow-hidden shadow-2xl`}>
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg shadow-lg">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Live Driver Tracking</h3>
            <p className="text-sm opacity-80">
              Last updated: {lastUpdate.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
            <Users className="h-4 w-4 mr-1" />
            {driverLocations.length} Drivers
          </Badge>
          
          <Button
            onClick={fetchDriverLocations}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div ref={mapContainer} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-xl">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span>Loading driver locations...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMap;
