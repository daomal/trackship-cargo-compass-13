
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';

// Fix default Leaflet icons with error handling
const initializeLeafletIcons = () => {
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  } catch (error) {
    console.error('Error initializing Leaflet icons:', error);
  }
};

const TrackingMap = () => {
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const mapCenter: [number, number] = [-2.548926, 118.0148634];

  // Initialize Leaflet icons on component mount
  useEffect(() => {
    initializeLeafletIcons();
  }, []);

  useEffect(() => {
    const fetchActiveShipments = async () => {
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*, drivers(name, license_plate)')
          .eq('status', 'tertunda')
          .not('current_lat', 'is', null);
        
        if (error) {
          console.error('Error fetching shipments:', error);
          setMapError('Failed to load shipment data');
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setActiveShipments(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchActiveShipments:', error);
        setMapError('Failed to load shipment data');
        setIsLoading(false);
      }
    };

    fetchActiveShipments();

    // Set up realtime subscription
    const channel = supabase.channel('realtime-shipments')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
      }, (payload) => {
        setActiveShipments(prev =>
          prev.map(s => s.id === payload.new.id ? {...s, ...payload.new} : s)
        );
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Force map re-render on error
  const handleMapError = () => {
    console.log('Map error detected, forcing re-render');
    setMapKey(prev => prev + 1);
    setMapError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat peta...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{mapError}</p>
          <button 
            onClick={handleMapError} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Muat Ulang Peta
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="h-full w-full">
        <div key={`map-wrapper-${mapKey}`}>
          <MapContainer 
            center={mapCenter} 
            zoom={5} 
            style={{ height: '100%', width: '100%' }}
            key={`tracking-map-${mapKey}`}
            whenReady={() => console.log('Map ready successfully')}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {activeShipments.map(shipment => {
              if (!shipment.current_lat || !shipment.current_lng) return null;
              
              try {
                return (
                  <Marker 
                    key={shipment.id} 
                    position={[shipment.current_lat, shipment.current_lng]}
                  >
                    <Popup>
                      <div>
                        <b>{shipment.drivers?.name || 'Driver Unknown'}</b> ({shipment.drivers?.license_plate || 'Unknown Plate'})<br/>
                        Tujuan: {shipment.tujuan}
                      </div>
                    </Popup>
                  </Marker>
                );
              } catch (error) {
                console.error('Error rendering marker for shipment:', shipment.id, error);
                return null;
              }
            })}
          </MapContainer>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering TrackingMap:', error);
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Gagal memuat peta</p>
          <button 
            onClick={handleMapError} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Muat Ulang Peta
          </button>
        </div>
      </div>
    );
  }
};

export default TrackingMap;
