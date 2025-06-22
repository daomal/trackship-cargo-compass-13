
import React, { useState, useEffect } from "react";
import { Shipment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw } from "lucide-react";
import SummaryCards from "./SummaryCards";
import DataCharts from "./DataCharts";
import DriverStatistics from "./DriverStatistics";
import ConstraintAnalysis from "./ConstraintAnalysis";
import CompanyAnalytics from "./CompanyAnalytics";
import AppDownloadInfo from "./AppDownloadInfo";

interface DashboardHomeProps {
  shipments: Shipment[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ shipments }) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>(shipments);

  useEffect(() => {
    applyDateFilter();
  }, [dateRange, shipments]);

  const applyDateFilter = () => {
    if (!dateRange[0] || !dateRange[1]) {
      setFilteredShipments(shipments);
      return;
    }

    const filtered = shipments.filter(shipment => {
      const shipmentDate = new Date(shipment.tanggalKirim);
      return shipmentDate >= dateRange[0]! && shipmentDate <= dateRange[1]!;
    });

    setFilteredShipments(filtered);
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
  };

  // Count summary data from filtered shipments
  const summary = {
    total: filteredShipments.length,
    delivered: filteredShipments.filter(s => s.status === "terkirim").length,
    pending: filteredShipments.filter(s => s.status === "tertunda").length,
    failed: filteredShipments.filter(s => s.status === "gagal").length
  };

  return (
    <div className="space-y-8 w-full animate-fade-in max-w-full">
      {/* App Download Info */}
      <AppDownloadInfo />
      
      {/* Global Date Filter */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Filter Dashboard</h2>
            <p className="text-sm text-slate-600">
              Menampilkan {filteredShipments.length} dari {shipments.length} pengiriman
              {dateRange[0] && dateRange[1] && (
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                  {format(dateRange[0], "dd/MM/yyyy")} - {format(dateRange[1], "dd/MM/yyyy")}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal glass-button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange[0] ? format(dateRange[0], "dd/MM/yyyy") : "Dari Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange[0] || undefined}
                    onSelect={(date) => setDateRange([date, dateRange[1]])}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal glass-button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange[1] ? format(dateRange[1], "dd/MM/yyyy") : "Sampai Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange[1] || undefined}
                    onSelect={(date) => setDateRange([dateRange[0], date])}
                    initialFocus
                    disabled={(date) => (dateRange[0] ? date < dateRange[0] : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              variant="outline" 
              onClick={resetDateFilter}
              className="glass-button"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="w-full">
        <SummaryCards summary={summary} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        <div className="h-full shadow-xl hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden">
          <DataCharts shipments={filteredShipments} hideFilter={true} />
        </div>
        <div className="h-full shadow-xl hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden">
          <ConstraintAnalysis shipments={filteredShipments} />
        </div>
      </div>

      {/* Driver Statistics */}
      <div className="w-full shadow-xl hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden animate-slide-in">
        <DriverStatistics shipments={filteredShipments} />
      </div>

      {/* Company Analytics */}
      <div className="w-full shadow-xl hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden animate-scale-in">
        <CompanyAnalytics shipments={filteredShipments} />
      </div>
    </div>
  );
};

export default DashboardHome;
