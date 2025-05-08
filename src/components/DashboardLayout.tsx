
import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogIn, User, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import SummaryCards from "./SummaryCards";
import ShipmentTable from "./ShipmentTable";
import DataCharts from "./DataCharts";
import ConstraintAnalysis from "./ConstraintAnalysis";
import DataFilters from "./DataFilters";
import { Shipment, ShipmentStatus, FilterOptions } from "@/lib/types";
import { getShipments } from "@/lib/shipmentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout = () => {
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: [null, null],
    status: "all",
    driver: "all",
    company: "all"
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
    
    setFilteredShipments(filtered);
  };

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold text-navy-500">Dashboard Pengiriman</h1>
                <p className="text-muted-foreground">
                  Pantau dan kelola data pengiriman dalam satu tempat
                </p>
              </div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <User className="w-4 h-4 mr-1" /> 
                    {user.email}
                  </div>
                  
                  {isAdmin && (
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700" asChild>
                      <Link to="/admin">
                        <UserCog className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => signOut()}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button variant="default" asChild>
                  <Link to="/auth">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
              )}
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
                <ShipmentTable shipments={filteredShipments} />
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
