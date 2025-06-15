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
  const [mapInitialized, setMapInitialized] = useState(false);

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
      const defaultToken = 'pk.eyJ1Ijoia2Vsb2xhc2VuamEiLCJhIjoiY21id3gzbnA0MTc1cTJycHVuZHJyMWo2ciJ9.84jSVtrqyFb8MJwKFeGm1g';
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
          setMapInitialized(false);
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
        setMapInitialized(false);
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
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Track user interaction to prevent auto zoom-out
      map.current.on('mousedown', () => {
        setUserInteracting(true);
        console.log('🖱️ User started interacting with map');
      });
      map.current.on('touchstart', () => {
        setUserInteracting(true);
        console.log('👆 User started touching map');
      });
      map.current.on('dragstart', () => {
        setUserInteracting(true);
        console.log('🖱️ User started dragging map');
      });
      map.current.on('zoomstart', () => {
        setUserInteracting(true);
        console.log('🔍 User started zooming map');
      });
      
      // Long delay before allowing auto-fit again
      map.current.on('mouseup', () => {
        setTimeout(() => {
          setUserInteracting(false);
          console.log('🖱️ User interaction timeout - allowing auto-fit');
        }, 10000); // 10 seconds delay
      });
      map.current.on('touchend', () => {
        setTimeout(() => {
          setUserInteracting(false);
          console.log('👆 Touch interaction timeout - allowing auto-fit');
        }, 10000);
      });
      map.current.on('dragend', () => {
        setTimeout(() => {
          setUserInteracting(false);
          console.log('🖱️ Drag interaction timeout - allowing auto-fit');
        }, 10000);
      });
      map.current.on('zoomend', () => {
        setTimeout(() => {
          setUserInteracting(false);
          console.log('🔍 Zoom interaction timeout - allowing auto-fit');
        }, 10000);
      });
      
      map.current.on('load', () => {
        console.log('🗺️ Map loaded successfully');
        setMapInitialized(true);
        console.log('✅ Map initialization state set to true');
        // Wait a moment for state to update, then fetch locations
        setTimeout(() => {
          fetchDriverLocations();
        }, 100);
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
      console.log('📊 Raw data sample:', data?.slice(0, 2));
      
      // Group by driver_id to get unique drivers with their combined data
      const driverMap = new Map<string, DriverLocation>();
      
      data?.forEach((shipment: any) => {
        if (!shipment.driver_id || !shipment.drivers) {
          console.log('⚠️ Skipping shipment - missing driver data:', shipment);
          return;
        }
        
        console.log('🔍 Processing shipment:', {
          driver_id: shipment.driver_id,
          driver_name: shipment.drivers?.name,
          lat: shipment.current_lat,
          lng: shipment.current_lng
        });
        
        const driverId = shipment.driver_id;
        const existing = driverMap.get(driverId);
        
        if (!existing || new Date(shipment.updated_at) > new Date(existing.updated_at)) {
          const delivered = shipment.status === 'terkirim' ? [shipment.tujuan] : [];
          const destinations = [shipment.tujuan];
          
          if (existing) {
            destinations.push(...existing.destinations.filter(d => d !== shipment.tujuan));
            delivered.push(...existing.delivered_destinations);
          }
          
          const driverLocation: DriverLocation = {
            driver_id: driverId,
            driver_name: shipment.drivers.name,
            license_plate: shipment.drivers.license_plate,
            current_lat: shipment.current_lat,
            current_lng: shipment.current_lng,
            updated_at: shipment.updated_at,
            shipment_count: (existing?.shipment_count || 0) + 1,
            destinations: destinations,
            delivered_destinations: delivered
          };
          
          console.log('✅ Created driver location object:', driverLocation);
          driverMap.set(driverId, driverLocation);
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
      console.log('📊 Driver objects:', uniqueDrivers);
      
      setDrivers(uniqueDrivers);
      
      console.log('🗺️ Checking map readiness - map.current:', !!map.current, 'mapInitialized:', mapInitialized);
      
      if (map.current && mapInitialized) {
        console.log('🗺️ Map is ready, updating markers...');
        updateMapMarkersAndTrails(uniqueDrivers);
      } else {
        console.log('⚠️ Map not ready yet - map.current:', !!map.current, 'mapInitialized:', mapInitialized);
        // Try again after a short delay if map exists but not initialized
        if (map.current && !mapInitialized) {
          setTimeout(() => {
            console.log('🔄 Retrying marker update after delay...');
            if (map.current) {
              console.log('✅ Map found on retry, setting initialized and updating markers');
              setMapInitialized(true);
              updateMapMarkersAndTrails(uniqueDrivers);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('💥 Error:', error);
    }
  };

  const create3DTruckIcon = (color: string, driverName: string) => {
    console.log('🚛 Creating 3D truck icon for:', driverName, 'with color:', color);
    
    // Create SVG for 3D isometric truck similar to the uploaded image
    const svgContent = `
      <svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
          <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color}"/>
            <stop offset="50%" style="stop-color:${color}"/>
            <stop offset="100%" style="stop-color:#000"/>
          </linearGradient>
          <linearGradient id="cabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff"/>
            <stop offset="30%" style="stop-color:${color}"/>
            <stop offset="100%" style="stop-color:#000"/>
          </linearGradient>
        </defs>
        
        <!-- Shadow base -->
        <ellipse cx="40" cy="52" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
        
        <!-- Truck body (cargo area) - 3D isometric view -->
        <path d="M25 20 L55 20 L60 25 L60 40 L55 45 L25 45 L20 40 L20 25 Z" 
              fill="url(#truckGradient)" stroke="#000" stroke-width="1"/>
        
        <!-- Truck body top face -->
        <path d="M25 20 L55 20 L60 15 L30 15 Z" 
              fill="${color}" stroke="#000" stroke-width="1" opacity="0.9"/>
        
        <!-- Truck body right face -->
        <path d="M55 20 L60 15 L60 30 L55 35 L55 20 Z" 
              fill="${color}" stroke="#000" stroke-width="1" opacity="0.7"/>
        
        <!-- Truck cabin - 3D isometric -->
        <path d="M10 25 L25 25 L25 40 L10 40 L5 35 L5 30 Z" 
              fill="url(#cabGradient)" stroke="#000" stroke-width="1"/>
        
        <!-- Cabin top -->
        <path d="M10 25 L25 25 L30 20 L15 20 Z" 
              fill="#ffffff" stroke="#000" stroke-width="1" opacity="0.9"/>
        
        <!-- Cabin right side -->
        <path d="M25 25 L30 20 L30 35 L25 40 Z" 
              fill="${color}" stroke="#000" stroke-width="1" opacity="0.8"/>
        
        <!-- Windshield -->
        <rect x="12" y="27" width="10" height="6" fill="rgba(135, 206, 235, 0.8)" 
              stroke="#000" stroke-width="0.5"/>
        
        <!-- Wheels - 3D effect -->
        <ellipse cx="15" cy="42" rx="5" ry="3" fill="#333" stroke="#000" stroke-width="1"/>
        <ellipse cx="15" cy="40" rx="4" ry="2.5" fill="#666"/>
        <ellipse cx="15" cy="39" rx="2" ry="1.5" fill="#999"/>
        
        <ellipse cx="45" cy="42" rx="5" ry="3" fill="#333" stroke="#000" stroke-width="1"/>
        <ellipse cx="45" cy="40" rx="4" ry="2.5" fill="#666"/>
        <ellipse cx="45" cy="39" rx="2" ry="1.5" fill="#999"/>
        
        <!-- Headlights -->
        <circle cx="5" cy="30" r="2" fill="#FFFF99" stroke="#FFD700" stroke-width="1"/>
        <circle cx="5" cy="35" r="2" fill="#FFFF99" stroke="#FFD700" stroke-width="1"/>
        
        <!-- Grille details -->
        <rect x="6" y="28" width="3" height="1" fill="#666"/>
        <rect x="6" y="30" width="3" height="1" fill="#666"/>
        <rect x="6" y="32" width="3" height="1" fill="#666"/>
        <rect x="6" y="34" width="3" height="1" fill="#666"/>
        <rect x="6" y="36" width="3" height="1" fill="#666"/>
        
        <!-- Direction indicator -->
        <polygon points="65,18 70,22 65,26" fill="#FFD700" stroke="#FF8C00" stroke-width="1"/>
        
        <!-- Driver name label with better positioning -->
        <rect x="12" y="5" width="${Math.max(driverName.length * 6, 40)}" height="12" 
              fill="rgba(255,255,255,0.95)" stroke="${color}" stroke-width="1" rx="2"/>
        <text x="${12 + Math.max(driverName.length * 3, 20)}" y="13" 
              text-anchor="middle" font-family="Arial, sans-serif" font-size="9" 
              font-weight="bold" fill="#333">${driverName}</text>
      </svg>
    `;

    // Create DOM element from SVG
    const div = document.createElement('div');
    div.innerHTML = svgContent;
    div.style.cursor = 'pointer';
    div.style.transform = 'translate(-50%, -100%)'; // Center horizontally, bottom-align to GPS point
    div.style.transformOrigin = 'center bottom';
    div.style.position = 'absolute';
    div.style.pointerEvents = 'auto';
    div.style.zIndex = '1000';
    
    console.log('✅ 3D truck SVG icon created successfully');
    return div;
  };

  const updateMapMarkersAndTrails = (driverData: DriverLocation[]) => {
    if (!map.current) {
      console.log('❌ No map instance available for markers update');
      return;
    }

    console.log('🗺️ Updating map markers and trails for', driverData.length, 'drivers');
    console.log('📊 Driver data for markers:', driverData);

    // Clear existing markers that are no longer needed
    const currentDriverIds = new Set(driverData.map(d => d.driver_id));
    drivers_markers.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        console.log('🗑️ Removing outdated marker for driver:', driverId);
        marker.remove();
        drivers_markers.delete(driverId);
      }
    });

    // Update driver trails and markers
    driverData.forEach((driver, index) => {
      const driverColor = driverColors[index % driverColors.length];
      const driverId = driver.driver_id;
      const newPosition: [number, number] = [driver.current_lng, driver.current_lat];
      
      console.log('📍 Processing driver:', driver.driver_name, 'at position:', newPosition);
      console.log('🎨 Driver color:', driverColor);
      
      // Validate coordinates
      if (!driver.current_lat || !driver.current_lng || isNaN(driver.current_lat) || isNaN(driver.current_lng)) {
        console.error('❌ Invalid coordinates for driver:', driver.driver_name, 'lat:', driver.current_lat, 'lng:', driver.current_lng);
        return;
      }
      
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
        console.log('🔄 Updating existing marker position for:', driver.driver_name);
        // Update position without animation to prevent floating
        existingMarker.setLngLat(newPosition);
      } else {
        console.log('✨ Creating new marker for:', driver.driver_name);
        
        try {
          // Create new marker with 3D truck icon
          const truckElement = create3DTruckIcon(driverColor, driver.driver_name);
          console.log('🚛 Truck element created, adding to map...');
          
          truckElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('📍 Driver marker clicked:', driver.driver_name);
            setSelectedDriver(driver.driver_id);
            map.current?.flyTo({
              center: newPosition,
              zoom: 16,
              duration: 1000
            });
          });

          console.log('🔧 Event listeners added to marker element');

          // Create enhanced popup
          const timeAgo = Math.floor((new Date().getTime() - new Date(driver.updated_at).getTime()) / 60000);
          const popup = new mapboxgl.Popup({ 
            offset: [0, -60], // Offset to account for truck height
            closeButton: true,
            closeOnClick: false,
            anchor: 'bottom'
          }).setHTML(
            `<div style="padding: 16px; font-family: 'Segoe UI', sans-serif; min-width: 280px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
              <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                  🚛 ${driver.driver_name}
                </h3>
                <div style="width: 30px; height: 3px; background: ${driverColor}; margin: 8px auto; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px; backdrop-filter: blur(10px);">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 16px; margin-right: 8px;">📋</span>
                  <span style="font-size: 14px; font-weight: 500;">${driver.license_plate}</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 16px; margin-right: 8px;">📦</span>
                  <span style="font-size: 14px;">${driver.shipment_count} pengiriman aktif</span>
                </div>
                <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                  <span style="font-size: 16px; margin-right: 8px; margin-top: 2px;">📍</span>
                  <span style="font-size: 13px; line-height: 1.4;">${driver.destinations.join(', ')}</span>
                </div>
                ${driver.delivered_destinations.length > 0 ? 
                  `<div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                    <span style="font-size: 16px; margin-right: 8px; margin-top: 2px;">✅</span>
                    <span style="font-size: 13px; color: #90EE90; line-height: 1.4;">${driver.delivered_destinations.join(', ')}</span>
                  </div>` : ''
                }
              </div>
              <div style="text-align: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                <div style="color: ${timeAgo < 1 ? '#90EE90' : timeAgo < 5 ? '#FFD700' : '#FF6B6B'}; font-size: 14px; font-weight: bold; margin-bottom: 4px;">
                  ${timeAgo < 1 ? '🟢 LIVE TRACKING' : `⏰ ${timeAgo} menit yang lalu`}
                </div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.8);">
                  ${driver.current_lat.toFixed(6)}, ${driver.current_lng.toFixed(6)}
                </div>
              </div>
            </div>`
          );

          console.log('💬 Popup created for marker');

          console.log('🗺️ Creating marker at exact GPS position:', newPosition);
          const marker = new mapboxgl.Marker({
            element: truckElement,
            anchor: 'bottom' // Anchor at bottom to align with GPS point
          })
            .setLngLat(newPosition)
            .setPopup(popup)
            .addTo(map.current);

          console.log('✅ Marker created and added to map for:', driver.driver_name);
          drivers_markers.set(driverId, marker);
          setDriverMarkers(new Map(drivers_markers));
          
          console.log('📊 Current markers count:', drivers_markers.size);
        } catch (markerError) {
          console.error('❌ Error creating marker for', driver.driver_name, ':', markerError);
        }
      }
      
      // Add destination markers for delivered locations
      driver.delivered_destinations.forEach((destination, destIndex) => {
        const destKey = `${driverId}-${destination}`;
        if (!destination_markers.has(destKey)) {
          const destEl = document.createElement('div');
          destEl.innerHTML = '🎯';
          destEl.style.fontSize = '28px';
          destEl.style.cursor = 'pointer';
          destEl.style.transform = 'translate(-50%, -100%)';
          destEl.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))';
          destEl.style.transition = 'all 0.3s ease';
          
          destEl.addEventListener('mouseenter', () => {
            destEl.style.transform = 'translate(-50%, -100%) scale(1.2)';
          });
          
          destEl.addEventListener('mouseleave', () => {
            destEl.style.transform = 'translate(-50%, -100%) scale(1)';
          });
          
          const destPopup = new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<div style="padding: 12px; font-family: sans-serif; background: linear-gradient(135deg, #10B981, #059669); color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <h4 style="margin: 0 0 8px 0; font-size: 16px; text-align: center;">
                ✅ Pengiriman Berhasil
              </h4>
              <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
                  📍 ${destination}
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">
                  oleh: ${driver.driver_name}
                </p>
              </div>
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

    console.log('✅ Map markers update completed. Active markers:', drivers_markers.size);
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
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
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

          <div ref={mapContainer} className="h-[600px] w-full rounded-lg border-2 border-gray-200 shadow-lg" />
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
                      map.current?.flyTo({
                        center: [driver.current_lng, driver.current_lat],
                        zoom: 16,
                        duration: 1000
                      });
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
