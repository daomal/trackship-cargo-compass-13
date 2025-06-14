
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, Users, Navigation, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShipmentLocation {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  updated_at: string;
  drivers?: {
    name: string;
    license_plate: string;
  } | null;
}

const TrackingMap = () => {
  const [shipments, setShipments] = useState<ShipmentLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeShipments, setActiveShipments] = useState(0);
  const [trackedShipments, setTrackedShipments] = useState(0);

  useEffect(() => {
    fetchActiveShipments();
    const interval = setInterval(fetchActiveShipments, 30000); // Refresh setiap 30 detik
    subscribeToLocationUpdates();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchActiveShipments = async () => {
    console.log('Fetching active shipments with GPS data...');
    try {
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
          drivers (name, license_plate)
        `)
        .eq('status', 'tertunda')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching active shipments:', error);
        toast.error('Gagal memuat data pengiriman aktif');
        return;
      }

      console.log('Fetched shipments data:', data);
      const shipmentData = data as ShipmentLocation[];
      setShipments(shipmentData);
      setActiveShipments(shipmentData.length);
      setTrackedShipments(shipmentData.filter(s => s.current_lat && s.current_lng).length);
      
      toast.success(`Data diperbarui: ${shipmentData.length} pengiriman aktif`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveShipments();
  };

  const subscribeToLocationUpdates = () => {
    console.log('Setting up realtime subscription...');
    const channel = supabase
      .channel('shipment_locations_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments'
      }, (payload) => {
        console.log('Realtime update received:', payload);
        fetchActiveShipments();
        toast.success('Data lokasi diperbarui secara real-time!');
      })
      .subscribe();

    return () => {
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
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pelacakan Real-time</h2>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Memperbarui...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Aktif</p>
                <p className="text-3xl font-bold text-blue-800">{activeShipments}</p>
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
                <p className="text-3xl font-bold text-green-800">{trackedShipments}</p>
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
                <p className="text-3xl font-bold text-orange-800">{activeShipments - trackedShipments}</p>
              </div>
              <MapPin className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Placeholder dengan Data Koordinat */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Peta Pelacakan Real-time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-dashed border-gray-300 p-4 overflow-y-auto">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 mb-4">Koordinat GPS Aktif:</h4>
                {shipments.filter(s => s.current_lat && s.current_lng).length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada GPS aktif saat ini</p>
                  </div>
                ) : (
                  shipments
                    .filter(s => s.current_lat && s.current_lng)
                    .map((shipment) => (
                      <div key={shipment.id} className="bg-white p-3 rounded-lg shadow-sm border">
                        <div className="font-medium text-sm text-gray-800">
                          {shipment.drivers?.name || 'Driver Tidak Diketahui'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {shipment.drivers?.license_plate} → {shipment.tujuan}
                        </div>
                        <div className="text-xs text-green-600 font-mono">
                          📍 Lat: {shipment.current_lat?.toFixed(6)}, Lng: {shipment.current_lng?.toFixed(6)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Update: {formatLastUpdate(shipment.updated_at)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Shipments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Pengiriman Aktif ({activeShipments})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {shipments.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada pengiriman aktif</p>
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
                        {shipment.current_lat && shipment.current_lng && (
                          <div className="text-xs text-green-600 mt-1">
                            📍 {shipment.current_lat.toFixed(4)}, {shipment.current_lng.toFixed(4)}
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
    </div>
  );
};

export default TrackingMap;
