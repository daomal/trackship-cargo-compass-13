
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, Users, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RealTimeMap from './RealTimeMap';

interface ShipmentLocation {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  updated_at: string;
  tanggal_kirim: string;
  drivers?: {
    name: string;
    license_plate: string;
  } | null;
}

const TrackingMap = () => {
  const [shipments, setShipments] = useState<ShipmentLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayDrivers, setTodayDrivers] = useState(0);
  const [trackedDrivers, setTrackedDrivers] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    fetchTodayDrivers();
    const interval = setInterval(fetchTodayDrivers, 10000); // Refresh setiap 10 detik lebih sering
    subscribeToLocationUpdates();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchTodayDrivers = async () => {
    console.log('🔍 Fetching today drivers with GPS data...');
    setIsRefreshing(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Today date filter:', today);

      // First, let's get all shipments for today regardless of status to debug
      const { data: allTodayShipments, error: debugError } = await supabase
        .from('shipments')
        .select(`
          id, 
          no_surat_jalan, 
          perusahaan, 
          tujuan, 
          current_lat, 
          current_lng, 
          status,
          updated_at,
          tanggal_kirim,
          driver_id,
          drivers (name, license_plate)
        `)
        .eq('tanggal_kirim', today);

      if (debugError) {
        console.error('❌ Debug query error:', debugError);
      } else {
        console.log('🔍 All shipments today:', allTodayShipments?.length || 0);
        console.log('📍 Shipments with GPS:', allTodayShipments?.filter(s => s.current_lat && s.current_lng).length || 0);
        
        setDebugInfo(`Total hari ini: ${allTodayShipments?.length || 0}, GPS aktif: ${allTodayShipments?.filter(s => s.current_lat && s.current_lng).length || 0}`);
      }

      // Now get the filtered data for display (show all today's shipments, not just tertunda)
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, 
          no_surat_jalan, 
          perusahaan, 
          tujuan, 
          current_lat, 
          current_lng, 
          status,
          updated_at,
          tanggal_kirim,
          drivers (name, license_plate)
        `)
        .eq('tanggal_kirim', today)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching today drivers:', error);
        toast.error('Gagal memuat data driver hari ini');
        return;
      }

      console.log('✅ Fetched shipments data:', data?.length || 0);
      console.log('📊 Sample data:', data?.[0]);
      
      const shipmentData = data as ShipmentLocation[];
      setShipments(shipmentData);
      setTodayDrivers(shipmentData.length);
      
      const withGPS = shipmentData.filter(s => s.current_lat && s.current_lng);
      setTrackedDrivers(withGPS.length);
      
      console.log('📍 GPS Active drivers:', withGPS.length);
      withGPS.forEach(s => {
        console.log(`🚛 ${s.drivers?.name || 'Unknown'}: ${s.current_lat}, ${s.current_lng} (${s.updated_at})`);
      });
      
      toast.success(`Data diperbarui: ${shipmentData.length} driver, ${withGPS.length} GPS aktif`);
    } catch (error) {
      console.error('💥 Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchTodayDrivers();
  };

  const subscribeToLocationUpdates = () => {
    console.log('🔔 Setting up realtime subscription...');
    const channel = supabase
      .channel('shipment_locations_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments'
      }, (payload) => {
        console.log('⚡ Realtime update received:', payload.eventType);
        // Add type checking for payload
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          console.log('📍 Updated shipment ID:', payload.new.id);
        }
        fetchTodayDrivers();
        toast.success('📍 Data lokasi diperbarui secara real-time!');
      })
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Memuat data driver...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button and Debug Info */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pelacakan Driver Hari Ini</h2>
          {debugInfo && (
            <p className="text-sm text-gray-600 mt-1">Debug: {debugInfo}</p>
          )}
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Memuat...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Driver Hari Ini</p>
                <p className="text-3xl font-bold text-blue-800">{todayDrivers}</p>
              </div>
              <Truck className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">GPS Terhubung</p>
                <p className="text-3xl font-bold text-green-800">{trackedDrivers}</p>
              </div>
              <Navigation className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Tanpa GPS</p>
                <p className="text-3xl font-bold text-orange-800">{todayDrivers - trackedDrivers}</p>
              </div>
              <MapPin className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert if no GPS data */}
      {todayDrivers > 0 && trackedDrivers === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Tidak ada GPS aktif</p>
                <p className="text-sm">Driver sudah terdaftar tapi belum mengaktifkan GPS. Pastikan driver mengklik tombol "Aktifkan GPS" di dashboard mereka.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Map Component */}
      <RealTimeMap />

      {/* Today's Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Driver Hari Ini ({todayDrivers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {shipments.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada driver bertugas hari ini</p>
              </div>
            ) : (
              shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    shipment.current_lat && shipment.current_lng 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {shipment.drivers?.name || 'Supir Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.no_surat_jalan} • {shipment.tujuan}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.perusahaan}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Status: {shipment.status.toUpperCase()}
                      </div>
                      {shipment.current_lat && shipment.current_lng ? (
                        <div className="text-xs text-green-600 mt-1">
                          📍 Lat: {shipment.current_lat.toFixed(6)}, Lng: {shipment.current_lng.toFixed(6)}
                        </div>
                      ) : (
                        <div className="text-xs text-orange-600 mt-1">
                          📍 GPS belum aktif
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {shipment.current_lat && shipment.current_lng ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Navigation className="h-4 w-4 animate-pulse" />
                          <span className="text-xs font-medium">GPS ON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs">GPS OFF</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Update terakhir: {formatLastUpdate(shipment.updated_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingMap;
