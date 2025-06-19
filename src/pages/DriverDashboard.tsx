
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, AlertTriangle, MapPin, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Shipment {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
  qty: number;
  tanggal_kirim: string;
  status: string;
}

const sendCommandToSW = (command: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(command);
  } else {
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage(command);
    }).catch(() => {
      console.error("Service Worker tidak tersedia");
      toast.error("Gagal memulai pelacakan.");
    });
  }
};

const DriverDashboard = () => {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [myShipments, setMyShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !profile) return;
    
    let isMounted = true;

    const initialize = async () => {
      if (!profile.driver_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('driver_id', profile.driver_id)
          .eq('status', 'tertunda')
          .order('tanggal_kirim', { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching shipments:', error);
          toast.error("Gagal memuat pengiriman.");
        } else if (data && data.length > 0) {
          setMyShipments(data);
          // Start tracking for the first shipment
          sendCommandToSW({ command: 'startTracking', shipmentId: data[0].id });
          setIsTrackingActive(true);
          toast.success("Pelacakan GPS dimulai");
        } else {
          sendCommandToSW({ command: 'stopTracking' });
          setIsTrackingActive(false);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error("Terjadi kesalahan saat memuat data");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      sendCommandToSW({ command: 'stopTracking' });
    };
  }, [profile, isAuthLoading]);

  const handleCompleteShipment = async (shipment: Shipment) => {
    try {
      sendCommandToSW({ command: 'stopTracking' });
      setIsTrackingActive(false);

      const now = new Date();
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: 'terkirim', 
          tanggal_tiba: now.toISOString().split('T')[0],
          waktu_tiba: now.toTimeString().split(' ')[0],
          updated_at: now.toISOString()
        })
        .eq('id', shipment.id);

      if (error) {
        console.error('Error completing shipment:', error);
        toast.error("Gagal menyelesaikan pengiriman");
        return;
      }

      toast.success('Pengiriman Selesai!');
      setMyShipments(prev => prev.filter(s => s.id !== shipment.id));

      // Start tracking next shipment if any
      const remainingShipments = myShipments.filter(s => s.id !== shipment.id);
      if (remainingShipments.length > 0) {
        sendCommandToSW({ command: 'startTracking', shipmentId: remainingShipments[0].id });
        setIsTrackingActive(true);
      }
    } catch (error) {
      console.error('Error completing shipment:', error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleReportIssue = (shipmentId: string) => {
    navigate(`/forum-kendala/${shipmentId}`);
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Memuat dashboard supir...</p>
        </div>
      </div>
    );
  }

  if (!profile?.driver_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="container mx-auto max-w-md text-center pt-20">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Akses Ditolak
              </h2>
              <p className="text-gray-600 mb-4">
                Anda tidak memiliki akses sebagai supir.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" />
            Dashboard Supir
          </h1>
          <p className="text-gray-600">Kelola pengiriman Anda</p>
        </div>

        {/* GPS Status */}
        <div className="mb-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-4">
              <div className="text-center">
                <Badge 
                  variant={isTrackingActive ? "default" : "secondary"}
                  className={`text-lg px-4 py-2 ${isTrackingActive ? 'bg-green-600' : 'bg-gray-500'}`}
                >
                  {isTrackingActive ? '🟢 GPS Aktif - Pelacakan Latar Belakang' : '🔴 GPS Tidak Aktif'}
                </Badge>
                <p className="text-sm text-gray-600 mt-3">
                  {isTrackingActive 
                    ? 'Lokasi Anda sedang dilacak secara otomatis' 
                    : 'Tidak ada pengiriman aktif untuk dilacak'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Tugas Pengiriman Aktif</h2>
          
          {myShipments.length === 0 ? (
            <Card className="text-center py-12 bg-white shadow-lg">
              <CardContent>
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Tidak Ada Tugas Aktif
                </h3>
                <p className="text-gray-600">
                  Semua pengiriman Anda sudah selesai. Selamat beristirahat!
                </p>
              </CardContent>
            </Card>
          ) : (
            myShipments.map((shipment) => (
              <Card key={shipment.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {shipment.tujuan}
                  </CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      No. Surat Jalan: <span className="font-semibold">{shipment.no_surat_jalan}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Perusahaan: <span className="font-semibold">{shipment.perusahaan}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: <span className="font-semibold">{shipment.qty}</span> | 
                      Tanggal: <span className="font-semibold">{shipment.tanggal_kirim}</span>
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => handleCompleteShipment(shipment)}
                      className="h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle2 className="h-6 w-6 mr-2" />
                      ✅ Sampai Tujuan
                    </Button>
                    
                    <Button
                      onClick={() => handleReportIssue(shipment.id)}
                      variant="destructive"
                      className="h-14 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      ⚠️ Lapor Kendala
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="px-6 py-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
