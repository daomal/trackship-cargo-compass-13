
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ShipmentTable from "@/components/ShipmentTable";
import DataFilters from "@/components/DataFilters";
import FileUploader from "@/components/FileUploader";
import ExportOptions from "@/components/ExportOptions";
import ShipmentForm from "@/components/ShipmentForm";
import { getShipments, subscribeToShipments } from "@/lib/shipmentService";
import { Shipment, FilterOptions } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import CompanyAnalytics from "@/components/CompanyAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface KendalaReport {
  id: string;
  created_at: string;
  author_name: string;
  message: string;
  photo_url?: string | null;
  shipments?: {
    no_surat_jalan: string;
    perusahaan: string;
    tujuan: string;
  } | null;
}

const AdminData = () => {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [kendalaReports, setKendalaReports] = useState<KendalaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: [null, null],
    status: "all",
    driver: "all",
    company: "all",
    searchQuery: "",
    kendalaFilter: "all"
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Akses ditolak",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Akses ditolak",
        description: "Anda tidak memiliki akses admin",
        variant: "destructive",
      });
      navigate('/');
    } else {
      fetchShipments();
      fetchKendalaReports();
    }
  }, [isAdmin, user, navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToShipments((updatedShipments) => {
      setShipments(updatedShipments);
      applyFilters(updatedShipments, filterOptions);
    });

    return () => unsubscribe();
  }, [isAdmin, filterOptions]);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const data = await getShipments();
      setShipments(data);
      applyFilters(data, filterOptions);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengiriman",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKendalaReports = async () => {
    try {
      const { data, error } = await supabase
        .from('kendala_reports')
        .select(`
          id,
          created_at,
          author_name,
          message,
          photo_url,
          shipments (
            no_surat_jalan,
            perusahaan,
            tujuan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching kendala reports:', error);
        return;
      }

      setKendalaReports(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const applyFilters = (data: Shipment[], filters: FilterOptions) => {
    console.log('🔧 Applying filters:', filters);
    console.log('📊 Total shipments before filter:', data.length);
    
    let filtered = [...data];
    
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const searchTerm = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(shipment => 
        shipment.noSuratJalan.toLowerCase().includes(searchTerm) ||
        shipment.perusahaan.toLowerCase().includes(searchTerm) ||
        shipment.tujuan.toLowerCase().includes(searchTerm) ||
        (shipment.drivers?.name && shipment.drivers.name.toLowerCase().includes(searchTerm)) ||
        (shipment.kendala && shipment.kendala.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0];
      const endDate = filters.dateRange[1];
      
      filtered = filtered.filter(shipment => {
        const shipmentDate = new Date(shipment.tanggalKirim);
        return shipmentDate >= startDate && shipmentDate <= endDate;
      });
    }
    
    if (filters.status !== "all") {
      filtered = filtered.filter(shipment => shipment.status === filters.status);
    }
    
    if (filters.driver !== "all") {
      filtered = filtered.filter(shipment => shipment.drivers?.name === filters.driver);
    }
    
    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter(shipment => shipment.perusahaan === filters.company);
    }

    // Apply kendala filter with specific kendala matching
    if (filters.kendalaFilter === "with-kendala") {
      console.log('🔍 Filtering for shipments WITH any kendala');
      const beforeKendalaFilter = filtered.length;
      filtered = filtered.filter(shipment => {
        const hasKendala = shipment.kendala && shipment.kendala.trim() !== "";
        if (hasKendala) {
          console.log('✅ Shipment has kendala:', shipment.noSuratJalan, 'Kendala:', shipment.kendala);
        }
        return hasKendala;
      });
      console.log(`📊 With-kendala filter: ${beforeKendalaFilter} -> ${filtered.length} shipments`);
    } else if (filters.kendalaFilter === "without-kendala") {
      console.log('🔍 Filtering for shipments WITHOUT kendala');
      const beforeKendalaFilter = filtered.length;
      filtered = filtered.filter(shipment => {
        const hasNoKendala = !shipment.kendala || shipment.kendala.trim() === "";
        return hasNoKendala;
      });
      console.log(`📊 No-kendala filter: ${beforeKendalaFilter} -> ${filtered.length} shipments`);
    } else if (filters.kendalaFilter !== "all") {
      // Filter by specific kendala value
      console.log('🔍 Filtering for specific kendala:', filters.kendalaFilter);
      const beforeKendalaFilter = filtered.length;
      filtered = filtered.filter(shipment => {
        const matchesKendala = shipment.kendala === filters.kendalaFilter;
        if (matchesKendala) {
          console.log('✅ Shipment matches kendala:', shipment.noSuratJalan, 'Kendala:', shipment.kendala);
        }
        return matchesKendala;
      });
      console.log(`📊 Specific-kendala filter: ${beforeKendalaFilter} -> ${filtered.length} shipments`);
    }
    
    console.log('📊 Final filtered shipments:', filtered.length);
    setFilteredShipments(filtered);
  };

  const handleFilter = (filters: FilterOptions) => {
    console.log('🎯 Handle filter called with:', filters);
    setFilterOptions(filters);
    applyFilters(shipments, filters);
  };

  const drivers = Array.from(new Set(shipments.map(s => s.drivers?.name).filter(Boolean)));
  const companies = Array.from(new Set(shipments.map(s => s.perusahaan))).filter(Boolean);
  
  // Get unique kendala options from shipments
  const kendalaOptions = Array.from(new Set(
    shipments
      .map(s => s.kendala)
      .filter(kendala => kendala && kendala.trim() !== "")
  )).sort();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 glass-button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Peta
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-navy-500">Manajemen Data</h1>
                    <p className="text-muted-foreground">
                      Kelola dan pantau data pengiriman
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => signOut()} className="glass-button">Logout</Button>
            </div>
            
            <Tabs defaultValue="manage">
              <TabsList className="mb-4">
                <TabsTrigger value="manage">Kelola Data</TabsTrigger>
                <TabsTrigger value="add">Tambah Data</TabsTrigger>
                <TabsTrigger value="analytics">Analisis</TabsTrigger>
                <TabsTrigger value="kendala">Laporan Kendala</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manage">
                <div className="grid gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex flex-row justify-between items-center">
                        <CardTitle>Filter dan Ekspor Data</CardTitle>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={fetchShipments}
                          disabled={isLoading}
                          className="glass-button"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
                        <DataFilters 
                          onFilter={handleFilter} 
                          drivers={drivers}
                          companies={companies}
                          kendalaOptions={kendalaOptions}
                        />
                        <div className="flex gap-4">
                          <FileUploader onUploadSuccess={fetchShipments} />
                          <ExportOptions data={filteredShipments} />
                          <Button 
                            variant="default" 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="glass-button-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <ShipmentTable 
                    shipments={filteredShipments} 
                    onShipmentUpdated={fetchShipments}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="add">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Tambah Data Pengiriman</CardTitle>
                    <CardDescription>
                      Tambahkan data pengiriman baru ke sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShipmentForm 
                      onShipmentCreated={fetchShipments}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <CompanyAnalytics shipments={shipments} />
              </TabsContent>

              <TabsContent value="kendala">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Laporan Kendala</CardTitle>
                    <CardDescription>
                      Semua laporan dan percakapan kendala dari supir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {kendalaReports.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600">Belum ada laporan kendala</p>
                        </div>
                      ) : (
                        kendalaReports.map((report) => (
                          <Card key={report.id} className="bg-gray-50/80 glass-effect">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-semibold text-gray-800">{report.author_name}</span>
                                  {report.shipments && (
                                    <div className="text-sm text-gray-600">
                                      {report.shipments.no_surat_jalan} - {report.shipments.tujuan}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">{formatTime(report.created_at)}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{report.message}</p>
                              {report.photo_url && (
                                <img
                                  src={report.photo_url}
                                  alt="Foto kendala"
                                  className="max-w-full h-32 object-cover rounded-lg border"
                                />
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle>Tambah Data Pengiriman</DialogTitle>
          </DialogHeader>
          <ShipmentForm
            onShipmentCreated={() => {
              fetchShipments();
              setIsAddDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminData;
