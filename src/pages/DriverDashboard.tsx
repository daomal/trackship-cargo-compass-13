
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CheckCircle2, AlertTriangle, Navigation, Clock, Package, Star } from 'lucide-react';
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
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-400 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Memuat dashboard supir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-2xl">
              <Truck className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Driver Dashboard
          </h1>
          <p className="text-slate-300 text-lg">Kelola pengiriman Anda dengan mudah dan profesional</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">Total Pengiriman</p>
                  <p className="text-3xl font-bold text-white">{shipments.length}</p>
                </div>
                <Package className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">Status GPS</p>
                  <p className="text-lg font-semibold text-white">{gpsStatus}</p>
                </div>
                <Navigation className={`h-10 w-10 ${isGpsActive ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <p className="text-2xl font-bold text-white">4.9</p>
                  </div>
                </div>
                <Star className="h-10 w-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GPS Control Card */}
        <Card className="mb-8 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 p-2 rounded-lg">
                <Navigation className="h-6 w-6 text-white" />
              </div>
              GPS Tracking Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${gpsStatus.includes('✅') || gpsStatus.includes('Aktif') ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-slate-200 font-medium">Status:</span>
                <Badge variant={gpsStatus.includes('✅') || gpsStatus.includes('Aktif') ? 'default' : 'secondary'} className="bg-blue-500/20 text-blue-200">
                  {gpsStatus}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleToggleGPS}
                className={`h-16 px-12 text-lg font-bold flex items-center gap-4 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                  isGpsActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                }`}
              >
                {isGpsActive ? (
                  <>
                    <Navigation className="h-8 w-8 animate-pulse" />
                    🔴 MATIKAN GPS
                  </>
                ) : (
                  <>
                    <Navigation className="h-8 w-8" />
                    🟢 AKTIFKAN GPS
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-center text-sm text-slate-300 bg-black/20 p-3 rounded-lg">
              GPS akan melacak lokasi Anda secara real-time untuk semua pengiriman yang sedang berlangsung
            </p>
          </CardContent>
        </Card>

        {/* Shipments */}
        {shipments.length === 0 ? (
          <Card className="text-center py-16 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent>
              <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">
                Tidak Ada Pengiriman Tertunda
              </h2>
              <p className="text-slate-300 text-lg">
                Semua pengiriman Anda sudah selesai. Selamat beristirahat!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl text-white flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        {shipment.tujuan}
                      </CardTitle>
                      <div className="space-y-1 text-slate-300">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">No. Surat Jalan:</span>
                          <span className="font-bold text-blue-300">{shipment.noSuratJalan}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Perusahaan:</span>
                          <span className="font-bold text-indigo-300">{shipment.perusahaan}</span>
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 px-3 py-1">
                      {shipment.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-xs text-slate-400">Qty</p>
                        <p className="font-bold text-white">{shipment.qty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-xs text-slate-400">Tanggal Kirim</p>
                        <p className="font-bold text-white">{shipment.tanggalKirim}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleDelivered(shipment.id)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-16 text-lg font-bold flex items-center justify-center gap-3 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                    >
                      <CheckCircle2 className="h-8 w-8" />
                      ✅ SAMPAI TUJUAN
                    </Button>
                    
                    <Button
                      onClick={() => handleForumKendala(shipment.id)}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-16 text-lg font-bold flex items-center justify-center gap-3 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                    >
                      <AlertTriangle className="h-8 w-8" />
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
