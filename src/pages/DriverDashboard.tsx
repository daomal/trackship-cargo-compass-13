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
    if (isLoading) return;
    
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
        await locationTracker.stopTracking();
        setIsGpsActive(false);
        setGpsStatus('GPS Dihentikan');
      } else {
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
    <div className="min-h-screen p-4 animate-fade-in">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 animate-slide-in">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="glass-card p-4 rounded-full">
                <Truck className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Dashboard Supir</h1>
            <p className="text-slate-600">Kelola pengiriman Anda dengan mudah</p>
          </div>

          {/* GPS Control Card */}
          <Card className="mb-8 hover-lift">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
                <Navigation className="h-6 w-6 text-blue-600" />
                Kontrol GPS Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center">
                <Badge 
                  variant={gpsStatus.includes('✅') || gpsStatus.includes('Aktif') ? 'default' : 'secondary'}
                  className="text-lg px-4 py-2"
                >
                  {gpsStatus}
                </Badge>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleToggleGPS}
                  size="lg"
                  className={`h-16 px-8 text-lg font-semibold flex items-center gap-3 transition-all duration-300 ${
                    isGpsActive 
                      ? 'bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm' 
                      : 'bg-green-500/90 hover:bg-green-600/90 backdrop-blur-sm'
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
              
              <p className="text-center text-sm text-slate-600">
                GPS akan melacak lokasi Anda untuk semua pengiriman yang sedang berlangsung
              </p>
            </CardContent>
          </Card>
        </div>

        {shipments.length === 0 ? (
          <Card className="text-center py-16 hover-lift">
            <CardContent>
              <div className="glass-card p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                Tidak Ada Pengiriman Tertunda
              </h2>
              <p className="text-slate-600 text-lg">
                Semua pengiriman Anda sudah selesai. Selamat beristirahat!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {shipments.map((shipment, index) => (
              <Card 
                key={shipment.id} 
                className="border-l-4 border-l-blue-500 hover-lift animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                        <div className="glass-card p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        {shipment.tujuan}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>No. Surat Jalan: <span className="font-semibold text-slate-800">{shipment.noSuratJalan}</span></p>
                        <p>Perusahaan: <span className="font-semibold text-slate-800">{shipment.perusahaan}</span></p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50/70 text-yellow-700 border-yellow-300/50 backdrop-blur-sm">
                      {shipment.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="glass-card p-3 rounded-lg">
                      <span className="text-slate-600">Qty:</span>
                      <span className="font-semibold text-slate-800 ml-2">{shipment.qty}</span>
                    </div>
                    <div className="glass-card p-3 rounded-lg">
                      <span className="text-slate-600">Tanggal Kirim:</span>
                      <span className="font-semibold text-slate-800 ml-2">{shipment.tanggalKirim}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleDelivered(shipment.id)}
                      className="h-14 text-lg font-semibold flex items-center justify-center gap-3 bg-green-500/90 hover:bg-green-600/90 backdrop-blur-sm transition-all duration-300"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      ✅ SAMPAI TUJUAN
                    </Button>
                    
                    <Button
                      onClick={() => handleForumKendala(shipment.id)}
                      variant="destructive"
                      className="h-14 text-lg font-semibold flex items-center justify-center gap-3 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm transition-all duration-300"
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
