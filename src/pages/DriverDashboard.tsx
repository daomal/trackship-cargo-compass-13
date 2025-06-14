import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CheckCircle2, AlertTriangle, Navigation, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shipment, SupabaseShipment } from '@/lib/types';
import { locationTracker } from '@/services/locationTracker';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<string>('Meminta izin...');
  const [trackingShipments, setTrackingShipments] = useState<Set<string>>(new Set());
  const [gpsPermissionGranted, setGpsPermissionGranted] = useState(false);

  useEffect(() => {
    // Redirect if not a driver
    if (profile && !profile.driver_id) {
      navigate('/');
      return;
    }

    if (profile?.driver_id) {
      initializeGPSAndFetchShipments();
    }
  }, [profile, navigate]);

  const initializeGPSAndFetchShipments = async () => {
    // First request GPS permissions
    try {
      setGpsStatus('Meminta izin...');
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'granted') {
        setGpsPermissionGranted(true);
        setGpsStatus('Mencari lokasi...');
        
        // Fetch shipments after GPS permission is granted
        await fetchDriverShipments();
        
        // Start automatic tracking if there are shipments
        setTimeout(() => {
          startAutoTracking();
        }, 1000);
      } else {
        setGpsStatus('Izin GPS ditolak ❌');
        toast.error('Izin lokasi diperlukan untuk pelacakan GPS');
        // Still fetch shipments even without GPS
        await fetchDriverShipments();
      }
    } catch (error) {
      console.error('GPS Permission Error:', error);
      setGpsStatus('Izin GPS ditolak ❌');
      // Still fetch shipments even with GPS error
      await fetchDriverShipments();
    }
  };

  const fetchDriverShipments = async () => {
    if (!profile?.driver_id) return;

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const startAutoTracking = async () => {
    if (shipments.length > 0 && gpsPermissionGranted) {
      // Start tracking for the first active shipment
      const activeShipment = shipments[0];
      if (activeShipment) {
        try {
          await locationTracker.startTracking(activeShipment.id, setGpsStatus);
          setTrackingShipments(prev => new Set(prev).add(activeShipment.id));
          setGpsStatus('GPS Terhubung ✅');
        } catch (error) {
          console.error('Error starting auto tracking:', error);
          setGpsStatus('Error GPS ⚠️');
        }
      }
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
    if (!gpsPermissionGranted) {
      toast.error('Izin GPS diperlukan untuk memulai pelacakan');
      return;
    }

    try {
      await locationTracker.startTracking(shipmentId, setGpsStatus);
      setTrackingShipments(prev => new Set(prev).add(shipmentId));
      setGpsStatus('GPS Terhubung ✅');
    } catch (error) {
      console.error('Error starting tracking:', error);
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
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const handleForumKendala = (shipmentId: string) => {
    navigate(`/forum-kendala/${shipmentId}`);
  };

  const handleLaporKendala = async (shipmentId: string) => {
    navigate(`/forum-kendala/${shipmentId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
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
                <Badge variant={gpsStatus.includes('✅') || gpsStatus.includes('Terhubung') ? 'default' : 'secondary'}>
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
                        disabled={!gpsPermissionGranted}
                      >
                        <Navigation className="h-4 w-4" />
                        Aktifkan GPS
                      </Button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleDelivered(shipment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      ✅ SAMPAI TUJUAN
                    </Button>
                    
                    <Button
                      onClick={() => handleForumKendala(shipment.id)}
                      variant="outline"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 h-14 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      <MessageSquare className="h-6 w-6" />
                      💬 FORUM KENDALA
                    </Button>
                    
                    <Button
                      onClick={() => handleLaporKendala(shipment.id)}
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
