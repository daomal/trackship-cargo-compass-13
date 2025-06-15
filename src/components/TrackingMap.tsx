
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, Users, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RealTimeMap from './RealTimeMap';

interface DriverData {
  driver_id: string;
  driver_name: string;
  license_plate: string;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  updated_at: string;
  shipment_count: number;
  destinations: string[];
}

const TrackingMap = () => {
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayDrivers, setTodayDrivers] = useState(0);
  const [trackedDrivers, setTrackedDrivers] = useState(0);

  useEffect(() => {
    fetchTodayDrivers();
    const interval = setInterval(fetchTodayDrivers, 5000); // Refresh every 5 seconds for live data
    subscribeToLocationUpdates();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchTodayDrivers = async () => {
    console.log('🔍 Fetching today driver locations...');
    setIsRefreshing(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Today date filter:', today);

      // Get all drivers for today with their shipment info
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          driver_id,
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
        .not('driver_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching today drivers:', error);
        toast.error('Gagal memuat data driver hari ini');
        return;
      }

      console.log('✅ Fetched shipments data:', data?.length || 0);
      
      // Group by driver to get unique drivers with their combined data
      const driverMap = new Map<string, DriverData>();
      
      data?.forEach((shipment: any) => {
        if (!shipment.driver_id || !shipment.drivers) return;
        
        const driverId = shipment.driver_id;
        const existing = driverMap.get(driverId);
        
        if (!existing) {
          driverMap.set(driverId, {
            driver_id: driverId,
            driver_name: shipment.drivers.name,
            license_plate: shipment.drivers.license_plate,
            current_lat: shipment.current_lat,
            current_lng: shipment.current_lng,
            status: shipment.status,
            updated_at: shipment.updated_at,
            shipment_count: 1,
            destinations: [shipment.tujuan]
          });
        } else {
          // Update with most recent location data
          if (new Date(shipment.updated_at) > new Date(existing.updated_at)) {
            existing.current_lat = shipment.current_lat;
            existing.current_lng = shipment.current_lng;
            existing.updated_at = shipment.updated_at;
          }
          
          existing.shipment_count += 1;
          if (!existing.destinations.includes(shipment.tujuan)) {
            existing.destinations.push(shipment.tujuan);
          }
        }
      });

      const uniqueDrivers = Array.from(driverMap.values());
      setDrivers(uniqueDrivers);
      setTodayDrivers(uniqueDrivers.length);
      
      const withGPS = uniqueDrivers.filter(d => d.current_lat && d.current_lng);
      setTrackedDrivers(withGPS.length);
      
      console.log('📍 Total drivers today:', uniqueDrivers.length);
      console.log('📍 GPS Active drivers:', withGPS.length);
      
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
    toast.success('Data berhasil diperbarui');
  };

  const subscribeToLocationUpdates = () => {
    console.log('🔔 Setting up realtime subscription for driver tracking...');
    const channel = supabase
      .channel('driver_tracking_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments'
      }, (payload) => {
        console.log('⚡ Realtime driver update received:', payload.eventType);
        fetchTodayDrivers();
      })
      .subscribe((status) => {
        console.log('🔔 Driver tracking subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from driver tracking updates');
      supabase.removeChannel(channel);
    };
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Live';
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
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Tracking Driver Hari Ini</h2>
          <p className="text-sm text-gray-600 mt-1">Update otomatis setiap 5 detik</p>
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
                <p className="text-green-600 text-sm font-medium">GPS Live</p>
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
                <p className="text-orange-600 text-sm font-medium">GPS Off</p>
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
                <p className="text-sm">Driver sudah terdaftar tapi belum mengaktifkan GPS. Pastikan driver mengklik tombol "AKTIFKAN GPS" di dashboard mereka.</p>
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
            {drivers.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada driver bertugas hari ini</p>
              </div>
            ) : (
              drivers.map((driver) => {
                const timeAgo = Math.floor((new Date().getTime() - new Date(driver.updated_at).getTime()) / 60000);
                return (
                  <div
                    key={driver.driver_id}
                    className={`p-4 rounded-lg border transition-colors ${
                      driver.current_lat && driver.current_lng 
                        ? timeAgo < 1 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          🚛 {driver.driver_name}
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {driver.shipment_count} pengiriman
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          📋 {driver.license_plate}
                        </div>
                        <div className="text-sm text-gray-500">
                          📍 Tujuan: {driver.destinations.join(', ')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Status: {driver.status.toUpperCase()}
                        </div>
                        {driver.current_lat && driver.current_lng ? (
                          <div className="text-xs text-green-600 mt-1">
                            📍 Lat: {driver.current_lat.toFixed(6)}, Lng: {driver.current_lng.toFixed(6)}
                          </div>
                        ) : (
                          <div className="text-xs text-orange-600 mt-1">
                            📍 GPS belum aktif
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {driver.current_lat && driver.current_lng ? (
                          <div className={`flex items-center gap-1 ${timeAgo < 1 ? 'text-green-600' : timeAgo < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            <Navigation className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-medium">
                              {timeAgo < 1 ? 'LIVE' : `${timeAgo}m ago`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs">GPS OFF</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingMap;
