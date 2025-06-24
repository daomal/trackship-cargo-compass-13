
import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Shipment } from "@/lib/types";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DataChartsProps {
  shipments: Shipment[];
  dateFrom?: Date;
  dateTo?: Date;
}

// Optimized color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const STATUS_COLORS = {
  terkirim: '#22C55E',
  tertunda: '#F59E0B',
  gagal: '#EF4444'
};

const DataCharts: React.FC<DataChartsProps> = ({ shipments, dateFrom, dateTo }) => {
  // Optimized data processing with useMemo
  const chartData = useMemo(() => {
    let filteredShipments = shipments;

    // Apply date filtering
    if (dateFrom || dateTo) {
      filteredShipments = shipments.filter(shipment => {
        const shipmentDate = new Date(shipment.tanggalKirim);
        const from = dateFrom ? startOfDay(dateFrom) : new Date('1900-01-01');
        const to = dateTo ? endOfDay(dateTo) : new Date();
        return shipmentDate >= from && shipmentDate <= to;
      });
    }

    // Company data for bar chart
    const companyData = filteredShipments.reduce((acc, shipment) => {
      const company = shipment.perusahaan;
      if (!acc[company]) {
        acc[company] = { name: company, count: 0, qty: 0 };
      }
      acc[company].count += 1;
      acc[company].qty += shipment.qty;
      return acc;
    }, {} as Record<string, { name: string; count: number; qty: number }>);

    // Status data for pie chart
    const statusData = filteredShipments.reduce((acc, shipment) => {
      const status = shipment.status;
      if (!acc[status]) {
        acc[status] = { name: status, value: 0 };
      }
      acc[status].value += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    // Daily trend data for line chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = filteredShipments.filter(s => s.tanggalKirim === dateStr).length;
      return {
        date: format(date, 'dd/MM'),
        count,
        fullDate: dateStr
      };
    });

    return {
      companyData: Object.values(companyData).slice(0, 10), // Limit to top 10
      statusData: Object.values(statusData),
      trendData: last7Days,
      totalShipments: filteredShipments.length,
      totalQty: filteredShipments.reduce((sum, s) => sum + s.qty, 0)
    };
  }, [shipments, dateFrom, dateTo]);

  // Optimized custom tooltip components
  const CustomTooltip = React.memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Company Distribution Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Distribusi per Perusahaan</CardTitle>
          <CardDescription>
            Jumlah pengiriman per perusahaan (Top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.companyData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                interval={0}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Status Pengiriman</CardTitle>
          <CardDescription>
            Distribusi status pengiriman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {chartData.statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length] 
                  }}
                />
                <span className="text-sm capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis Chart */}
      <Card className="shadow-sm md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tren Pengiriman (7 Hari Terakhir)</CardTitle>
          <CardDescription>
            Jumlah pengiriman per hari dalam seminggu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(DataCharts);
