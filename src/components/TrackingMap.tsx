
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, Users, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface ShipmentLocation {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  drivers?: {
    name: string;
    license_plate: string;
  } | null;
}

const TrackingMap = () => {
  const [shipments, setShipments] = useState<ShipmentLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShipments, setActiveShipments] = useState(0);
  const [trackedShipments, setTrackedShipments] = useState(0);

  useEffect(() => {
    fetchActiveShipments();
    subscribeToLocationUpdates();
  }, []);

  const fetchActiveShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, no_surat_jalan, perusahaan, tujuan, current_lat, current_lng, status, drivers (name, license_plate)')
        .eq('status', 'tertunda')
        .order('tanggal_kirim', { ascending: false });

      if (error) {
        console.error('Error fetching active shipments:', error);
        toast.error('Gagal memuat data pengiriman aktif');
        return;
      }

      const shipmentData = data as ShipmentLocation[];
      setShipments(shipmentData);
      setActiveShipments(shipmentData.length);
      setTrackedShipments(shipmentData.filter(s => s.current_lat && s.current_lng).length);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToLocationUpdates = () => {
    const channel = supabase
      .channel('shipment_locations')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments'
      }, () => {
        fetchActiveShipments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      {/* Map Placeholder and Active Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Placeholder */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Peta Pelacakan Real-time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Peta akan ditampilkan di sini</p>
                <p className="text-sm text-gray-500">
                  Menampilkan {trackedShipments} supir dengan GPS aktif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Shipments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Pengiriman Aktif
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {shipment.drivers?.name || 'Supir Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.drivers?.license_plate || 'No. Polisi Tidak Diketahui'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.tujuan} - {shipment.perusahaan}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {shipment.current_lat && shipment.current_lng ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Navigation className="h-4 w-4" />
                          <span className="text-xs">GPS ON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs">GPS OFF</span>
                        </div>
                      )}
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
