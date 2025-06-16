
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CheckCircle2, AlertTriangle, Navigation, Clock, Package, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shipment, SupabaseShipment } from '@/lib/types';
import { locationTracker } from '@/services/locationTracker';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<string>('GPS Belum Aktif');
  const [isGpsActive, setIsGpsActive] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    if (!profile?.driver_id) {
      console.log('User is not a driver, redirecting to home');
      navigate('/');
      return;
    }

    fetchDriverShipments();
  }, [profile, isLoading, navigate]);

  const fetchDriverShipments = async () => {
    if (!profile?.driver_id) return;

    setIsLoadingShipments(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('driver_id', profile.driver_id)
        .eq('status', 'tertunda')
        .order('tanggal_kirim', { ascending: true });

      if (error) {
        console.error('Error fetching shipments:', error);
        toast.error('Gagal memuat data pengiriman');
        return;
      }

      const mappedShipments = (data as SupabaseShipment[]).map(mapSupabaseShipment);
      setShipments(mappedShipments);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const mapSupabaseShipment = (dbShipment: SupabaseShipment): Shipment => {
    return {
      id: dbShipment.id,
      noSuratJalan: dbShipment.no_surat_jalan,
      perusahaan: dbShipment.perusahaan,
      tujuan: dbShipment.tujuan,
      driverId: dbShipment.driver_id,
      tanggalKirim: dbShipment.tanggal_kirim,
      tanggalTiba: dbShipment.tanggal_tiba,
      waktuTiba: dbShipment.waktu_tiba,
      status: dbShipment.status,
      kendala: dbShipment.kendala,
      qty: dbShipment.qty,
      trackingUrl: dbShipment.tracking_url,
      currentLat: dbShipment.current_lat,
      currentLng: dbShipment.current_lng
    };
  };

  const handleDelivered = async (shipmentId: string) => {
    try {
      const now = new Date();
      const { error } = await supabase
        .from('shipments')
        .update({
          status: 'terkirim',
          tanggal_tiba: now.toISOString().split('T')[0],
          waktu_tiba: now.toTimeString().split(' ')[0],
          updated_at: now.toISOString(),
          updated_by: user?.id
        })
        .eq('id', shipmentId);

      if (error) {
        console.error('Error updating shipment:', error);
        toast.error('Gagal mengupdate status pengiriman');
        return;
      }

      toast.success('Pengiriman berhasil diselesaikan!');
      fetchDriverShipments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleToggleGPS = async () => {
    if (!profile?.driver_id) return;

    try {
      if (isGpsActive) {
        await locationTracker.stopTracking();
        setIsGpsActive(false);
        setGpsStatus('GPS Dihentikan');
        toast.success('GPS berhasil dimatikan');
      } else {
        setGpsStatus('Mengaktifkan GPS...');
        
        await locationTracker.startTrackingForDriver(profile.driver_id, (status) => {
          setGpsStatus(status);
        });
        
        setIsGpsActive(true);
        toast.success('GPS berhasil diaktifkan');
      }
    } catch (error) {
      console.error('Error toggling GPS:', error);
      setGpsStatus('Error GPS');
      toast.error('Gagal mengubah status GPS');
    }
  };

  const handleForumKendala = (shipmentId: string) => {
    navigate(`/forum-kendala/${shipmentId}`);
  };

  if (isLoading || isLoadingShipments) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl p-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Truck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Supir
            </h1>
            <p className="text-gray-600">Kelola pengiriman Anda dengan mudah</p>
          </div>
        </div>

        {/* GPS Control */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Navigation className={`h-5 w-5 ${isGpsActive ? 'text-green-600' : 'text-gray-400'}`} />
              Kontrol GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="font-medium text-gray-700">Status:</span>
                <Badge variant={isGpsActive ? 'default' : 'secondary'} className={isGpsActive ? 'bg-green-100 text-green-800' : ''}>
                  {gpsStatus}
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={handleToggleGPS}
              className={`w-full h-12 text-lg font-semibold ${
                isGpsActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Navigation className="h-5 w-5 mr-2" />
              {isGpsActive ? 'Matikan GPS' : 'Aktifkan GPS'}
            </Button>
            
            <p className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              GPS akan melacak lokasi Anda untuk semua pengiriman yang sedang berlangsung
            </p>
          </CardContent>
        </Card>

        {/* Shipment Stats */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Pengiriman Tertunda</p>
                <p className="text-3xl font-bold text-blue-600">{shipments.length}</p>
              </div>
              <Package className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        {shipments.length === 0 ? (
          <Card className="text-center py-12 border-0 shadow-md">
            <CardContent>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Tidak Ada Pengiriman Tertunda
              </h2>
              <p className="text-gray-600">
                Semua pengiriman sudah selesai. Selamat beristirahat!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        {shipment.tujuan}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">No. Surat:</span> {shipment.noSuratJalan}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Perusahaan:</span> {shipment.perusahaan}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {shipment.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Qty</p>
                        <p className="font-semibold">{shipment.qty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Tanggal Kirim</p>
                        <p className="font-semibold">{shipment.tanggalKirim}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleDelivered(shipment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white h-12 font-semibold"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Selesai Kirim
                    </Button>
                    
                    <Button
                      onClick={() => handleForumKendala(shipment.id)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-12 font-semibold"
                    >
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Lapor Kendala
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
