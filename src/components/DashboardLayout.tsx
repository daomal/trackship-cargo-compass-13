
import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogIn, User, UserCog, BarChart2, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import ShipmentTable from "./ShipmentTable";
import DataFilters from "./DataFilters";
import NoteForm from "./NoteForm";
import { Shipment, ShipmentStatus, FilterOptions, DashboardView } from "@/lib/types";
import { getShipments } from "@/lib/shipmentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardNav from "./DashboardNav";
import DashboardHome from "./DashboardHome";

const DashboardLayout = () => {
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  
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

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardHome shipments={filteredShipments} />;
      case "shipments":
        return (
          <div className="space-y-4 w-full">
            <DataFilters 
              onFilter={handleFilter} 
              drivers={drivers}
              companies={companies}
            />
            <ShipmentTable 
              shipments={filteredShipments} 
              onShipmentUpdated={fetchShipments} 
            />
          </div>
        );
      case "notes":
        return <NoteForm />;
      default:
        return <DashboardHome shipments={filteredShipments} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-r from-violet-100 to-indigo-100">
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-full">
          <div className="flex flex-col space-y-6 animate-fade-in">
            <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row'} justify-between items-center`}>
              <div className="flex flex-col space-y-2 animate-slide-in">
                <h1 className="text-2xl md:text-3xl font-bold text-purple-900">Dashboard Pengiriman</h1>
                <p className="text-gray-700">
                  Pantau dan kelola data pengiriman dalam satu tempat
                </p>
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col w-full space-y-2' : 'items-center'} gap-4 animate-slide-in`} style={{animationDelay: "0.2s"}}>
                <Button variant="outline" asChild className="bg-white/90 text-purple-700 hover:bg-purple-50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-purple-200 rounded-xl">
                  <Link to="/public-data">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Lihat Data Publik
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="bg-white/90 text-purple-700 hover:bg-purple-50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-purple-200 rounded-xl">
                  <a href="https://trayekbaru.netlify.app/" target="_blank" rel="noopener noreferrer">
                    <Truck className="mr-2 h-4 w-4" />
                    Trayek Driver
                  </a>
                </Button>
                
                {user ? (
                  <div className={`flex ${isMobile ? 'flex-col w-full' : 'items-center'} gap-4`}>
                    {isAdmin && (
                      <Button variant="default" className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl" asChild>
                        <Link to="/admin">
                          <UserCog className="mr-2 h-4 w-4" />
                          Panel Admin
                        </Link>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => signOut()}
                      className="bg-white/90 text-purple-700 hover:bg-purple-50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-purple-200 rounded-xl"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button variant="default" className="bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl" asChild>
                    <Link to="/auth">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Dashboard Navigation */}
            <DashboardNav activeView={activeView} onViewChange={setActiveView} />
            
            {/* Active View Content - Full width */}
            <div className="w-full">
              {renderView()}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
