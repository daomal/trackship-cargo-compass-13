
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';

// Fix ikon default Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TrackingMap = () => {
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const mapCenter: [number, number] = [-2.548926, 118.0148634];

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
          return;
        }
        
        if (data) {
          setActiveShipments(data);
        }
      } catch (error) {
        console.error('Error in fetchActiveShipments:', error);
      }
    };

    fetchActiveShipments();

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

  return (
    <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {activeShipments.map(shipment => {
        if (!shipment.current_lat || !shipment.current_lng) return null;
        
        return (
          <Marker key={shipment.id} position={[shipment.current_lat, shipment.current_lng]}>
            <Popup>
              <b>{shipment.drivers?.name || 'Driver Unknown'}</b> ({shipment.drivers?.license_plate || 'Unknown Plate'})<br/>
              Tujuan: {shipment.tujuan}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default TrackingMap;
