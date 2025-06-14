
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { startTracking, stopTracking } from '@/services/locationTracker';

const DriverDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [myShipments, setMyShipments] = useState<any[]>([]);
  const [gpsStatus, setGpsStatus] = useState('Menunggu...');
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !profile.driver_id) return;

    const fetchMyShipments = async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('driver_id', profile.driver_id)
        .eq('status', 'tertunda');

      if (error) {
        toast.error("Gagal memuat pengiriman.");
      } else if (data && data.length > 0) {
        setMyShipments(data);
        const activeShipmentId = data[0].id;
        startTracking(activeShipmentId, setGpsStatus).then(setTrackingId);
      }
    };

    fetchMyShipments();

    return () => {
      if (trackingId) {
        stopTracking();
      }
    };
  }, [profile]);

  const handleStatusUpdate = async (shipment: any, newStatus: string, kendala: string | null = null) => {
    const updateObject: any = { status: newStatus, kendala: kendala };
    if (newStatus === 'terkirim') {
      updateObject.tanggal_tiba = new Date().toISOString();
      updateObject.waktu_tiba = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (trackingId) stopTracking();
    }
    const { error } = await supabase.from('shipments').update(updateObject).eq('id', shipment.id);
    if (error) toast.error('Gagal update status');
    else {
      toast.success('Status berhasil diperbarui!');
      setMyShipments(prev => prev.filter(s => s.id !== shipment.id));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="p-2 bg-gray-100 rounded-md text-center font-semibold">
        Status GPS: {gpsStatus}
      </div>
      <h1 className="text-2xl font-bold">Tugas Pengiriman Anda</h1>
      {myShipments.map(shipment => (
        <Card key={shipment.id}>
          <CardHeader>
            <CardTitle>{shipment.tujuan}</CardTitle>
            <p>No. SJ: {shipment.no_surat_jalan}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-green-600" onClick={() => handleStatusUpdate(shipment, 'terkirim')}>
              ✅ Sampai Tujuan
            </Button>
            <Button className="w-full bg-red-600" onClick={() => navigate(`/forum-kendala/${shipment.id}`)}>
              ⚠️ Lapor Kendala
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DriverDashboard;
