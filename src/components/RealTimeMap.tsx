
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Navigation, Zap, Eye, EyeOff } from 'lucide-react';

// Mock data untuk driver
const mockDrivers = [
  { id: 1, name: "Ahmad Rizki", lat: -6.2088, lng: 106.8456, status: "active", lastUpdate: "2 menit lalu" },
  { id: 2, name: "Budi Santoso", lat: -6.1751, lng: 106.8650, status: "active", lastUpdate: "1 menit lalu" },
  { id: 3, name: "Cahyo Utomo", lat: -6.2297, lng: 106.8203, status: "inactive", lastUpdate: "15 menit lalu" },
  { id: 4, name: "Dwi Prasetyo", lat: -6.1944, lng: 106.8229, status: "active", lastUpdate: "3 menit lalu" },
  { id: 5, name: "Eko Wijaya", lat: -6.2615, lng: 106.7812, status: "active", lastUpdate: "1 menit lalu" },
];

const driverColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

const RealTimeMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeDrivers, setActiveDrivers] = useState(mockDrivers.filter(d => d.status === 'active').length);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');
  const [showDriverList, setShowDriverList] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoidGVzdC1tYXBib3giLCJhIjoiY2x2Yzl5aDBjMWJzdzJrcGVxMHF5anc5YSJ9.abc123';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [106.8456, -6.2088],
      zoom: 11,
      pitch: 45,
      bearing: 0,
      antialias: true
    });

    // Enhanced map controls
    const nav = new mapboxgl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true
    });
    map.current.addControl(nav, 'top-right');

    const scale = new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    });
    map.current.addControl(scale, 'bottom-left');

    map.current.on('load', () => {
      // Add enhanced 3D buildings
      map.current?.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });

      // Add markers for each driver with smaller, more refined design
      mockDrivers.forEach((driver, index) => {
        const color = driverColors[index % driverColors.length];
        const isActive = driver.status === 'active';
        
        // Create enhanced marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'driver-marker';
        markerElement.innerHTML = `
          <div class="marker-container" style="
            position: relative;
            cursor: pointer;
            transform: translateZ(0);
          ">
            <!-- Car Icon (Smaller) -->
            <div class="car-icon" style="
              width: 24px;
              height: 24px;
              background: linear-gradient(145deg, ${color}, ${color}dd);
              border: 2px solid white;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              z-index: 10;
              ${!isActive ? 'opacity: 0.6; filter: grayscale(50%);' : ''}
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            
            <!-- Status indicator -->
            <div class="status-dot" style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 8px;
              height: 8px;
              background: ${isActive ? '#22C55E' : '#EF4444'};
              border: 2px solid white;
              border-radius: 50%;
              z-index: 11;
              ${isActive ? 'animation: pulse 2s infinite;' : ''}
            "></div>
            
            <!-- Driver name label (Smaller) -->
            <div class="driver-label" style="
              position: absolute;
              top: -35px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 600;
              color: #1F2937;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              z-index: 9;
              opacity: 0;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              pointer-events: none;
            ">
              ${driver.name}
            </div>
          </div>
        `;

        // Enhanced hover effects
        markerElement.addEventListener('mouseenter', () => {
          const label = markerElement.querySelector('.driver-label') as HTMLElement;
          const carIcon = markerElement.querySelector('.car-icon') as HTMLElement;
          if (label) label.style.opacity = '1';
          if (carIcon) {
            carIcon.style.transform = 'scale(1.1)';
            carIcon.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.15)';
          }
        });

        markerElement.addEventListener('mouseleave', () => {
          const label = markerElement.querySelector('.driver-label') as HTMLElement;
          const carIcon = markerElement.querySelector('.car-icon') as HTMLElement;
          if (label) label.style.opacity = '0';
          if (carIcon) {
            carIcon.style.transform = 'scale(1)';
            carIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';
          }
        });

        markerElement.addEventListener('click', () => {
          setSelectedDriver(selectedDriver === driver.id ? null : driver.id);
          map.current?.flyTo({
            center: [driver.lng, driver.lat],
            zoom: 15,
            duration: 1000
          });
        });

        new mapboxgl.Marker(markerElement)
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
      });
    });

    return () => map.current?.remove();
  }, [mapStyle]);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .driver-marker:hover .car-icon {
        transform: scale(1.1) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Sidebar */}
      <div className={`${showDriverList ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl`}>
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Live Tracking</h2>
              <p className="text-sm text-slate-500">Real-time driver locations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">{activeDrivers} Active</span>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Users className="w-3 h-3 mr-1" />
              {mockDrivers.length} Total
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {mockDrivers.map((driver, index) => (
            <Card 
              key={driver.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${
                selectedDriver === driver.id 
                  ? 'border-l-blue-500 bg-blue-50/50 shadow-md' 
                  : driver.status === 'active' 
                    ? 'border-l-green-400 hover:border-l-green-500' 
                    : 'border-l-gray-300 opacity-75'
              }`}
              onClick={() => {
                setSelectedDriver(selectedDriver === driver.id ? null : driver.id);
                map.current?.flyTo({
                  center: [driver.lng, driver.lat],
                  zoom: 15,
                  duration: 1000
                });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                    style={{ background: `linear-gradient(145deg, ${driverColors[index % driverColors.length]}, ${driverColors[index % driverColors.length]}dd)` }}
                  >
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{driver.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={driver.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          driver.status === 'active' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {driver.status === 'active' ? 'Online' : 'Offline'}
                      </Badge>
                      <span className="text-xs text-slate-500">{driver.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Map Container */}
      <div className="flex-1 relative">
        {/* Floating Controls */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDriverList(!showDriverList)}
            className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/95 transition-all duration-200"
          >
            {showDriverList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-2">
            <div className="flex flex-col gap-1">
              <Button
                variant={mapStyle.includes('light') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapStyle('mapbox://styles/mapbox/light-v11')}
                className="text-xs justify-start"
              >
                Light
              </Button>
              <Button
                variant={mapStyle.includes('dark') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
                className="text-xs justify-start"
              >
                Dark
              </Button>
              <Button
                variant={mapStyle.includes('satellite') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-v9')}
                className="text-xs justify-start"
              >
                Satellite
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="absolute top-4 right-4 z-10">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{activeDrivers}</p>
                    <p className="text-xs text-slate-500">Active Now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{mockDrivers.length}</p>
                    <p className="text-xs text-slate-500">Total Drivers</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div ref={mapContainer} className="w-full h-full rounded-lg shadow-inner" />
      </div>
    </div>
  );
};

export default RealTimeMap;
