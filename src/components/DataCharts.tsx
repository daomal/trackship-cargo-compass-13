
import React, { useState, useEffect } from "react";
import { Shipment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw } from "lucide-react";
import {
  BarChart,
  PieChart,
  LineChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell,
  Line,
} from "recharts";

interface DataChartsProps {
  shipments: Shipment[];
}

const DataCharts: React.FC<DataChartsProps> = ({ shipments }) => {
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

  // Prepare data for bar chart (shipments per day)
  const prepareBarChartData = () => {
    const dateMap = new Map<string, number>();
    
    filteredShipments.forEach((shipment) => {
      const date = shipment.tanggalKirim;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    return Array.from(dateMap).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Prepare data for pie chart (shipment status distribution)
  const preparePieChartData = () => {
    const statusCount = {
      terkirim: 0,
      tertunda: 0,
      gagal: 0,
    };
    
    filteredShipments.forEach((shipment) => {
      statusCount[shipment.status]++;
    });
    
    return [
      { name: "Terkirim", value: statusCount.terkirim, color: "#10b981" },
      { name: "Tertunda", value: statusCount.tertunda, color: "#3b82f6" },
      { name: "Gagal", value: statusCount.gagal, color: "#f43f5e" },
    ];
  };
  
  // Prepare data for line chart (shipments trend)
  const prepareLineChartData = () => {
    const dateMap = new Map<string, number>();
    
    filteredShipments.forEach((shipment) => {
      const date = shipment.tanggalKirim;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    return Array.from(dateMap).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();
  const lineChartData = prepareLineChartData();

  // Colors for alternating bars
  const barColors = ["#6366f1", "#10b981", "#3b82f6", "#f43f5e"];

  return (
    <Card className="glass-card">
      <CardHeader className="border-b border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-slate-800">Visualisasi Data</CardTitle>
          
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
        
        <div className="text-sm text-slate-600">
          Menampilkan {filteredShipments.length} dari {shipments.length} pengiriman
          {dateRange[0] && dateRange[1] && (
            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              {format(dateRange[0], "dd/MM/yyyy")} - {format(dateRange[1], "dd/MM/yyyy")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {/* Bar Chart */}
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Pengiriman per Tanggal</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#475569' }} />
                <YAxis tick={{ fill: '#475569' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Pengiriman"
                  radius={[4, 4, 0, 0]}
                >
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Status Pengiriman</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Trend Pengiriman</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#475569' }} />
                <YAxis tick={{ fill: '#475569' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Jumlah Pengiriman"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCharts;
