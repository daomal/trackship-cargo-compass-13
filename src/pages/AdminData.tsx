
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
import { Plus, RefreshCw, ArrowLeft, Database, BarChart3, MessageSquare, Upload } from "lucide-react";
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

    // Apply kendala filter
    if (filters.kendalaFilter === "with-kendala") {
      filtered = filtered.filter(shipment => shipment.kendala && shipment.kendala.trim() !== "");
    } else if (filters.kendalaFilter === "without-kendala") {
      filtered = filtered.filter(shipment => !shipment.kendala || shipment.kendala.trim() === "");
    }
    
    setFilteredShipments(filtered);
  };

  const handleFilter = (filters: FilterOptions) => {
    setFilterOptions(filters);
    applyFilters(shipments, filters);
  };

  const drivers = Array.from(new Set(shipments.map(s => s.drivers?.name).filter(Boolean)));
  const companies = Array.from(new Set(shipments.map(s => s.perusahaan))).filter(Boolean);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Modern Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="container mx-auto py-4 px-6">
            <div className="flex flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin')}
                  className="bg-white/60 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Peta
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Manajemen Data
                    </h1>
                    <p className="text-slate-500 font-medium">
                      Kelola dan pantau data pengiriman
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => signOut()}
                className="bg-white/60 backdrop-blur-sm border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-300 shadow-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto py-8 px-6">
          <div className="flex flex-col space-y-8">
            {/* Modern Tabs */}
            <Tabs defaultValue="manage">
              <TabsList className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg p-1 rounded-xl">
                <TabsTrigger 
                  value="manage" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-medium transition-all duration-300"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Kelola Data
                </TabsTrigger>
                <TabsTrigger 
                  value="add"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-lg font-medium transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-lg font-medium transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analisis
                </TabsTrigger>
                <TabsTrigger 
                  value="kendala"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg font-medium transition-all duration-300"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Laporan Kendala
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manage" className="space-y-6 mt-6">
                {/* Filter and Export Card */}
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <div className="flex flex-row justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Filter dan Ekspor Data
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={fetchShipments}
                        disabled={isLoading}
                        className="bg-white/60 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div className="flex-1">
                        <DataFilters 
                          onFilter={handleFilter} 
                          drivers={drivers}
                          companies={companies}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <FileUploader onUploadSuccess={fetchShipments} />
                        <ExportOptions data={filteredShipments} />
                        <Button 
                          onClick={() => setIsAddDialogOpen(true)}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table */}
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden">
                  <CardContent className="p-0">
                    <ShipmentTable 
                      shipments={filteredShipments} 
                      onShipmentUpdated={fetchShipments}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="add" className="mt-6">
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <Plus className="h-5 w-5" />
                      Tambah Data Pengiriman
                    </CardTitle>
                    <CardDescription className="text-emerald-600">
                      Tambahkan data pengiriman baru ke sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ShipmentForm 
                      onShipmentCreated={fetchShipments}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <div className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl rounded-xl overflow-hidden">
                  <CompanyAnalytics shipments={shipments} />
                </div>
              </TabsContent>

              <TabsContent value="kendala" className="mt-6">
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <MessageSquare className="h-5 w-5" />
                      Laporan Kendala
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Semua laporan dan percakapan kendala dari supir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {kendalaReports.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">Belum ada laporan kendala</p>
                          <p className="text-gray-400 text-sm mt-2">Laporan akan muncul di sini ketika ada kendala dari driver</p>
                        </div>
                      ) : (
                        kendalaReports.map((report) => (
                          <Card key={report.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="font-semibold text-gray-800 text-lg">{report.author_name}</span>
                                  {report.shipments && (
                                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                                      <div className="font-medium">{report.shipments.no_surat_jalan}</div>
                                      <div>{report.shipments.tujuan}</div>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {formatTime(report.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3 leading-relaxed">{report.message}</p>
                              {report.photo_url && (
                                <img
                                  src={report.photo_url}
                                  alt="Foto kendala"
                                  className="max-w-full h-40 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-300"
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
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Tambah Data Pengiriman
            </DialogTitle>
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
