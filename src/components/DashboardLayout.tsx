
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, User, UserCog, BarChart2, Truck, Menu, X, Home, FileText, MessageSquare, PanelLeft } from "lucide-react";
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

    // Handle kendala filter
    if (filters.kendalaFilter && filters.kendalaFilter !== "all") {
      if (filters.kendalaFilter === "with-kendala") {
        filtered = filtered.filter(shipment => shipment.kendala && shipment.kendala.trim() !== "");
      } else if (filters.kendalaFilter === "without-kendala") {
        filtered = filtered.filter(shipment => !shipment.kendala || shipment.kendala.trim() === "");
      } else {
        filtered = filtered.filter(shipment => shipment.kendala === filters.kendalaFilter);
      }
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
  const kendalaOptions = Array.from(new Set(shipments.map(s => s.kendala).filter(Boolean))) as string[];

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
              kendalaOptions={kendalaOptions}
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

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "shipments", label: "Data Pengiriman", icon: FileText },
    { id: "notes", label: "Catatan", icon: MessageSquare },
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen animate-fade-in">
        <div className="container mx-auto py-6 px-4 max-w-full">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col space-y-2">
                  <h1 className="text-2xl font-bold text-slate-800">Dashboard Pengiriman</h1>
                  <p className="text-slate-600">
                    Pantau dan kelola data pengiriman
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative z-20 glass-button"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>

              {isMobileMenuOpen && (
                <>
                  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10" onClick={() => setIsMobileMenuOpen(false)}></div>
                  <div className="fixed top-0 right-0 h-screen glass-sidebar w-4/5 max-w-xs transform transition-transform duration-300 ease-in-out z-10 p-6">
                    <div className="flex flex-col space-y-6 pt-12">
                      <h3 className="text-xl font-bold mb-4 text-slate-800">Menu</h3>
                      
                      <div className="space-y-3">
                        <Button variant="outline" asChild className="w-full justify-start glass-button">
                          <Link to="/public-data" className="flex items-center">
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Lihat Data Publik
                          </Link>
                        </Button>
                        
                        <Button variant="outline" asChild className="w-full justify-start glass-button">
                          <a href="https://trayekbaru.netlify.app/" target="_blank" rel="noopener noreferrer">
                            <Truck className="mr-2 h-4 w-4" />
                            Trayek Driver
                          </a>
                        </Button>
                        
                        {user ? (
                          <>
                            {isAdmin && (
                              <Button variant="default" asChild className="w-full justify-start glass-button-primary">
                                <Link to="/admin">
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Panel Admin
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" onClick={() => signOut()} className="w-full justify-start glass-button">
                              Logout
                            </Button>
                          </>
                        ) : (
                          <Button variant="default" asChild className="w-full justify-start glass-button-primary">
                            <Link to="/auth">
                              <LogIn className="mr-2 h-4 w-4" />
                              Login
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DashboardNav activeView={activeView} onViewChange={setActiveView} />
            
            <div className="w-full">
              {renderView()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full animate-fade-in">
      {/* Icon-Only Sidebar */}
      <div className="sidebar-icon-only glass-sidebar flex-shrink-0 relative">
        <div className="p-4 h-full flex flex-col">
          {/* Header Icon */}
          <div className="mb-8 flex items-center justify-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm">
              <Home className="h-6 w-6 text-indigo-600" />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex-1 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as DashboardView)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeView === item.id
                    ? 'bg-indigo-500/20 text-indigo-700 shadow-lg'
                    : 'text-slate-600 hover:bg-white/30 hover:text-slate-800'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="sidebar-text whitespace-nowrap font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mt-8 pt-6 border-t border-white/20">
            <Button variant="outline" asChild className="w-full justify-start glass-button text-sm p-2 group">
              <Link to="/public-data" className="flex items-center gap-3">
                <BarChart2 className="h-4 w-4 flex-shrink-0" />
                <span className="sidebar-text whitespace-nowrap">Data Publik</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full justify-start glass-button text-sm p-2 group">
              <a href="https://trayekbaru.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <Truck className="h-4 w-4 flex-shrink-0" />
                <span className="sidebar-text whitespace-nowrap">Trayek Driver</span>
              </a>
            </Button>
            
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="default" asChild className="w-full justify-start glass-button-primary text-sm p-2 group">
                    <Link to="/admin" className="flex items-center gap-3">
                      <UserCog className="h-4 w-4 flex-shrink-0" />
                      <span className="sidebar-text whitespace-nowrap">Panel Admin</span>
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => signOut()} className="w-full justify-start glass-button text-sm p-2 group">
                  <LogIn className="h-4 w-4 flex-shrink-0" />
                  <span className="sidebar-text whitespace-nowrap">Logout</span>
                </Button>
              </>
            ) : (
              <Button variant="default" asChild className="w-full justify-start glass-button-primary text-sm p-2 group">
                <Link to="/auth" className="flex items-center gap-3">
                  <LogIn className="h-4 w-4 flex-shrink-0" />
                  <span className="sidebar-text whitespace-nowrap">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-full">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
