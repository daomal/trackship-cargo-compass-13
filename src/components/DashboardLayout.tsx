import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, User, UserCog, BarChart2, Truck, Menu, X } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: [null, null],
    status: "all",
    driver: "all",
    company: "all",
    searchQuery: ""
  });

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

  const handleFilter = (filters: FilterOptions) => {
    setFilterOptions(filters);
    
    let filtered = [...shipments];
    
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
    
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(shipment => 
        shipment.noSuratJalan.toLowerCase().includes(query) ||
        shipment.perusahaan.toLowerCase().includes(query) ||
        shipment.tujuan.toLowerCase().includes(query) ||
        (shipment.drivers?.name && shipment.drivers.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredShipments(filtered);
  };

  useEffect(() => {
    handleFilter({
      ...filterOptions,
      searchQuery: searchQuery
    });
  }, [searchQuery]);

  const drivers = Array.from(new Set(shipments.map(s => s.drivers?.name).filter(Boolean))) as string[];
  const companies = Array.from(new Set(shipments.map(s => s.perusahaan))).filter(Boolean);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardHome shipments={filteredShipments} />;
      case "shipments":
        return (
          <div className="space-y-6 w-full">
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

  const renderTopButtons = () => (
    <div className={`flex ${isMobile ? 'flex-col w-full space-y-3' : 'items-center'} gap-3`}>
      <Button 
        variant="outline" 
        asChild 
        className="border-gray-200 hover:bg-gray-50 shadow-sm"
      >
        <Link to="/public-data" className="flex items-center justify-center gap-2">
          <BarChart2 className="h-4 w-4" />
          <span>Data Publik</span>
        </Link>
      </Button>
      
      <Button 
        variant="outline" 
        asChild 
        className="border-gray-200 hover:bg-gray-50 shadow-sm"
      >
        <a 
          href="https://trayekbaru.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2"
        >
          <Truck className="h-4 w-4" />
          <span>Trayek Driver</span>
        </a>
      </Button>
      
      {user ? (
        <div className={`flex ${isMobile ? 'flex-col w-full space-y-3' : 'items-center'} gap-3`}>
          {isAdmin && (
            <Button 
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700 shadow-sm" 
              asChild
            >
              <Link to="/admin" className="flex items-center justify-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>Panel Admin</span>
              </Link>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
          >
            <span>Logout</span>
          </Button>
        </div>
      ) : (
        <Button 
          variant="default" 
          className="bg-blue-600 hover:bg-blue-700 shadow-sm" 
          asChild
        >
          <Link to="/auth" className="flex items-center justify-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4 md:px-8 max-w-full 2xl:max-w-[1800px]">
        <div className="flex flex-col space-y-6">
          <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row'} justify-between items-center`}>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  DeliveryPro
                </h1>
              </div>
              <p className="text-gray-600 mb-4">
                Sistem pengiriman modern dan profesional
              </p>
            </div>
            
            {isMobile ? (
              <div className="flex justify-end w-full">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden border-gray-200 hover:bg-gray-50"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {isMobileMenuOpen && (
                  <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}

                <div className={`fixed top-0 right-0 h-screen bg-white shadow-lg w-4/5 max-w-xs transform transition-transform duration-300 ease-in-out z-10 p-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="flex flex-col space-y-6 pt-12">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Menu</h3>
                    {renderTopButtons()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {renderTopButtons()}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <DashboardNav activeView={activeView} onViewChange={setActiveView} />
          </div>
          
          <div className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {renderView()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
