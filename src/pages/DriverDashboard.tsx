
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
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
  const [gpsStatus, setGpsStatus] = useState<string>('Belum dimulai');
  const [isGpsActive, setIsGpsActive] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (isLoading) return;
    
    // Redirect if not a driver
    if (!profile?.driver_id) {
      console.log('User is not a driver, redirecting to home');
      navigate('/');
      return;
    }

    console.log('Driver dashboard initializing for driver:', profile.driver_id);
    fetchDriverShipments();
  }, [profile, isLoading, navigate]);

  const fetchDriverShipments = async () => {
    if (!profile?.driver_id) return;

    setIsLoadingShipments(true);
    try {
      console.log('Fetching shipments for driver:', profile.driver_id);
      
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

      console.log('Fetched shipments:', data?.length || 0);
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

      toast.success('Status berhasil diupdate: Terkirim');
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
        // Stop GPS
        await locationTracker.stopTracking();
        setIsGpsActive(false);
        setGpsStatus('GPS Dihentikan');
      } else {
        // Start GPS for this driver
        console.log('Starting GPS tracking for driver:', profile.driver_id);
        setGpsStatus('Memulai GPS...');
        
        await locationTracker.startTrackingForDriver(profile.driver_id, (status) => {
          console.log('GPS status update:', status);
          setGpsStatus(status);
        });
        
        setIsGpsActive(true);
        console.log('GPS tracking started successfully');
      }
    } catch (error) {
      console.error('Error toggling GPS:', error);
      setGpsStatus('Error GPS ❌');
      toast.error('Gagal mengubah status GPS');
    }
  };

  const handleForumKendala = (shipmentId: string) => {
    navigate(`/forum-kendala/${shipmentId}`);
  };

  if (isLoading || isLoadingShipments) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Memuat dashboard supir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              Dashboard Supir
            </h1>
            <p className="text-gray-600">Kelola pengiriman Anda dengan mudah</p>
          </div>

          {/* GPS Control Card */}
          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Status GPS:</span>
                </div>
                <Badge variant={gpsStatus.includes('✅') || gpsStatus.includes('Aktif') ? 'default' : 'secondary'}>
                  {gpsStatus}
                </Badge>
              </div>
              
              {/* Single GPS Toggle Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleToggleGPS}
                  className={`h-16 px-8 text-lg font-semibold flex items-center gap-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 ${
                    isGpsActive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isGpsActive ? (
                    <>
                      <Navigation className="h-6 w-6 animate-pulse" />
                      🔴 MATIKAN GPS
                    </>
                  ) : (
                    <>
                      <Navigation className="h-6 w-6" />
                      🟢 AKTIFKAN GPS
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mt-3">
                GPS akan melacak lokasi Anda untuk semua pengiriman yang sedang berlangsung
              </p>
            </CardContent>
          </Card>
        </div>

        {shipments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Tidak Ada Pengiriman Tertunda
              </h2>
              <p className="text-gray-600">
                Semua pengiriman Anda sudah selesai. Selamat beristirahat!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gray-800 mb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        {shipment.tujuan}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        No. Surat Jalan: <span className="font-semibold">{shipment.noSuratJalan}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Perusahaan: <span className="font-semibold">{shipment.perusahaan}</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      {shipment.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Qty: <span className="font-semibold">{shipment.qty}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Tanggal Kirim: <span className="font-semibold">{shipment.tanggalKirim}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleDelivered(shipment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      ✅ SAMPAI TUJUAN
                    </Button>
                    
                    <Button
                      onClick={() => handleForumKendala(shipment.id)}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      <AlertTriangle className="h-6 w-6" />
                      ⚠️ LAPOR KENDALA
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
