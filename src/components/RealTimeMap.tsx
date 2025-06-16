
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Users, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { MAPBOX_TOKEN } from '@/utils/mapboxSettings';

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  drivers?: {
    name: string;
  };
}

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
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

    fetchDriverLocations();
    const interval = setInterval(fetchDriverLocations, 30000);

    // Real-time subscription
    const channel = supabase
      .channel('driver_locations_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_locations'
      }, () => {
        fetchDriverLocations();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const fetchDriverLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select(`
          *,
          drivers (
            name
          )
        `)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching driver locations:', error);
        return;
      }

      setDriverLocations(data || []);
      setLastUpdate(new Date());
      updateMarkers(data || []);
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
      const driverName = location.drivers?.name || `Driver ${location.driver_id}`;
      
      // Create smaller, more refined car marker
      const carMarker = document.createElement('div');
      carMarker.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full p-1.5 shadow-lg border-2 border-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m-7 0a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1-3 0m0 0V11a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5"/>
            </svg>
          </div>
          <div class="bg-black/80 text-white text-xs px-2 py-1 rounded-md mt-1 whitespace-nowrap backdrop-blur-sm border border-white/20">
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

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'} flex flex-col`}>
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
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
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
            <Users className="h-4 w-4 mr-1" />
            {driverLocations.length} Drivers
          </Badge>
          
          <Button
            onClick={fetchDriverLocations}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div ref={mapContainer} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
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
