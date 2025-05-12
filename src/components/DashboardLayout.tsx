
import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogIn, User, UserCog, BarChart2, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import SummaryCards from "./SummaryCards";
import ShipmentTable from "./ShipmentTable";
import DataCharts from "./DataCharts";
import DriverStatistics from "./DriverStatistics";
import ConstraintAnalysis from "./ConstraintAnalysis";
import DataFilters from "./DataFilters";
import NoteForm from "./NoteForm";
import { Shipment, ShipmentStatus, FilterOptions } from "@/lib/types";
import { getShipments } from "@/lib/shipmentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = () => {
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: [null, null],
    status: "all",
    driver: "all",
    company: "all",
    searchQuery: ""
  });

  // Fetch shipments on component mount
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const data = await getShipments();
      setShipments(data);
      setFilteredShipments(data);
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

  // Function to handle filtering
  const handleFilter = (filters: FilterOptions) => {
    setFilterOptions(filters);
    
    let filtered = [...shipments];
    
    // Filter by date range
    if (filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0];
      const endDate = filters.dateRange[1];
      
      filtered = filtered.filter(shipment => {
        const shipmentDate = new Date(shipment.tanggalKirim);
        return shipmentDate >= startDate && shipmentDate <= endDate;
      });
    }
    
    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(shipment => shipment.status === filters.status);
    }
    
    // Filter by driver
    if (filters.driver !== "all") {
      filtered = filtered.filter(shipment => shipment.supir === filters.driver);
    }

    // Filter by company
    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter(shipment => shipment.perusahaan === filters.company);
    }
    
    // Filter by search query
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(shipment => 
        shipment.noSuratJalan.toLowerCase().includes(query) ||
        shipment.perusahaan.toLowerCase().includes(query) ||
        shipment.tujuan.toLowerCase().includes(query) ||
        shipment.supir.toLowerCase().includes(query)
      );
    }
    
    setFilteredShipments(filtered);
  };

  // Handle real-time search changes
  useEffect(() => {
    handleFilter({
      ...filterOptions,
      searchQuery: searchQuery
    });
  }, [searchQuery]);

  // Extract all drivers for filter
  const drivers = Array.from(new Set(shipments.map(s => s.supir))).filter(Boolean);
  
  // Extract all companies for filter
  const companies = Array.from(new Set(shipments.map(s => s.perusahaan))).filter(Boolean);

  // Count summary data
  const summary = {
    total: filteredShipments.length,
    delivered: filteredShipments.filter(s => s.status === "terkirim").length,
    pending: filteredShipments.filter(s => s.status === "tertunda").length,
    failed: filteredShipments.filter(s => s.status === "gagal").length
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-purple">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col space-y-6">
            <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row'} justify-between items-center`}>
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-black">Dashboard Pengiriman</h1>
                <p className="text-gray-700">
                  Pantau dan kelola data pengiriman dalam satu tempat
                </p>
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col w-full space-y-2' : 'items-center'} gap-4`}>
                <Button variant="outline" asChild className="bg-white/90 text-purple-700 hover:bg-purple-50 hover:shadow-md transition-all duration-300 border-purple-200">
                  <Link to="/public-data">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Lihat Data Publik
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="bg-white/90 text-purple-700 hover:bg-purple-50 hover:shadow-md transition-all duration-300 border-purple-200">
                  <a href="https://trayekbaru.netlify.app/" target="_blank" rel="noopener noreferrer">
                    <Truck className="mr-2 h-4 w-4" />
                    Trayek Driver
                  </a>
                </Button>
                
                {user ? (
                  <div className={`flex ${isMobile ? 'flex-col w-full' : 'items-center'} gap-4`}>
                    {isAdmin && (
                      <Button variant="default" className="bg-gradient-ocean text-white hover:opacity-90" asChild>
                        <Link to="/admin">
                          <UserCog className="mr-2 h-4 w-4" />
                          Panel Admin
                        </Link>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => signOut()}
                      className="bg-white/90 text-purple-700 hover:bg-purple-50 hover:shadow-md border-purple-200"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button variant="default" className="bg-gradient-ocean text-white" asChild>
                    <Link to="/auth">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-4">
                <SummaryCards summary={summary} />
              </div>
              
              <div className="lg:col-span-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <DataFilters 
                      onFilter={handleFilter} 
                      drivers={drivers}
                      companies={companies}
                    />
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-4">
                <ShipmentTable shipments={filteredShipments} onShipmentUpdated={fetchShipments} />
              </div>
              
              <div className="lg:col-span-4">
                <NoteForm />
              </div>
              
              <div className="lg:col-span-4">
                <DriverStatistics shipments={filteredShipments} />
              </div>
              
              <div className="lg:col-span-2">
                <DataCharts shipments={filteredShipments} />
              </div>
              
              <div className="lg:col-span-2">
                <ConstraintAnalysis shipments={filteredShipments} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
