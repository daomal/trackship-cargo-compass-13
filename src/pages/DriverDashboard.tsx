
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
  const [activeWatchId, setActiveWatchId] = useState<string | null>(null);

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
        const id = await startTracking(activeShipmentId, setGpsStatus);
        if (id) setActiveWatchId(id);
      }
    };

    fetchMyShipments();

    return () => {
      if (activeWatchId) stopTracking();
    };
  }, [profile]);

  const handleCompleteShipment = async (shipment) => {
      if (activeWatchId) stopTracking();
      const { error } = await supabase.from('shipments').update({ status: 'terkirim', tanggal_tiba: new Date().toISOString() }).eq('id', shipment.id);
      if(error) toast.error('Gagal update status');
      else {
          toast.success('Pengiriman Selesai!');
          setMyShipments(prev => prev.filter(s => s.id !== shipment.id));
      }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-center font-bold shadow-sm">
          Status GPS: {gpsStatus}
      </div>
      <h1 className="text-2xl font-bold">Tugas Pengiriman Anda</h1>
      {!myShipments.length && <p>Tidak ada tugas pengiriman aktif.</p>}
      {myShipments.map(shipment => (
        <Card key={shipment.id}>
          <CardHeader>
            <CardTitle>{shipment.tujuan}</CardTitle>
            <p>No. SJ: {shipment.no_surat_jalan}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button className="py-6 bg-green-600 hover:bg-green-700" onClick={() => handleCompleteShipment(shipment)}>✅ Sampai Tujuan</Button>
            <Button className="py-6 bg-red-600 hover:bg-red-700" onClick={() => navigate(`/forum-kendala/${shipment.id}`)}>⚠️ Lapor Kendala</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DriverDashboard;
