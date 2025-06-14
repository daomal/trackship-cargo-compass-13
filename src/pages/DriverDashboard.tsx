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
  const [trackingShipments, setTrackingShipments] = useState<Set<string>>(new Set());

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

      // Auto-start tracking for the first shipment with a delay
      if (mappedShipments.length > 0) {
        const firstShipment = mappedShipments[0];
        console.log('Auto-starting GPS for first shipment:', firstShipment.id);
        // Add a longer delay to ensure everything is ready
        setTimeout(() => {
          handleStartTracking(firstShipment.id);
        }, 2000);
      }
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
      
      // Stop tracking for this shipment
      if (trackingShipments.has(shipmentId)) {
        await locationTracker.stopTracking();
        setTrackingShipments(prev => {
          const newSet = new Set(prev);
          newSet.delete(shipmentId);
          return newSet;
        });
      }

      fetchDriverShipments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleStartTracking = async (shipmentId: string) => {
    try {
      console.log('Starting GPS tracking for shipment:', shipmentId);
      setGpsStatus('Memulai GPS...');
      
      await locationTracker.startTracking(shipmentId, (status) => {
        console.log('GPS status update:', status);
        setGpsStatus(status);
      });
      
      setTrackingShipments(prev => new Set(prev).add(shipmentId));
      console.log('GPS tracking started successfully');
    } catch (error) {
      console.error('Error starting tracking:', error);
      setGpsStatus('Error GPS ❌');
      toast.error('Gagal memulai pelacakan GPS');
    }
  };

  const handleStopTracking = async (shipmentId: string) => {
    try {
      await locationTracker.stopTracking();
      setGpsStatus('GPS Dihentikan');
      setTrackingShipments(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipmentId);
        return newSet;
      });
      toast.success('GPS tracking dihentikan');
    } catch (error) {
      console.error('Error stopping tracking:', error);
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

          {/* GPS Status */}
          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Status GPS:</span>
                </div>
                <Badge variant={gpsStatus.includes('✅') || gpsStatus.includes('Aktif') ? 'default' : 'secondary'}>
                  {gpsStatus}
                </Badge>
              </div>
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

                  {/* GPS Tracking Button */}
                  <div className="flex justify-center mb-4">
                    {trackingShipments.has(shipment.id) ? (
                      <Button
                        onClick={() => handleStopTracking(shipment.id)}
                        variant="outline"
                        className="flex items-center gap-2 bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                      >
                        <Navigation className="h-4 w-4 animate-pulse" />
                        GPS Aktif - Klik untuk Matikan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStartTracking(shipment.id)}
                        variant="outline"
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Navigation className="h-4 w-4" />
                        Aktifkan GPS
                      </Button>
                    )}
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
