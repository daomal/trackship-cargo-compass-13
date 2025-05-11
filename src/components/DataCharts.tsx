
import React from "react";
import { Shipment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  // Prepare data for bar chart (shipments per day)
  const prepareBarChartData = () => {
    const dateMap = new Map<string, number>();
    
    shipments.forEach((shipment) => {
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
    
    shipments.forEach((shipment) => {
      statusCount[shipment.status]++;
    });
    
    return [
      { name: "Terkirim", value: statusCount.terkirim, color: "#22C55E" },
      { name: "Tertunda", value: statusCount.tertunda, color: "#F59E0B" },
      { name: "Gagal", value: statusCount.gagal, color: "#EF4444" },
    ];
  };
  
  // Prepare data for line chart (shipments trend)
  const prepareLineChartData = () => {
    const dateMap = new Map<string, number>();
    
    shipments.forEach((shipment) => {
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

  return (
    <Card className="bg-gradient-to-br from-white to-purple-100 animate-fade-in shadow-lg border border-purple-200 text-purple-900">
      <CardHeader className="border-b border-purple-200">
        <CardTitle className="text-purple-900">Visualisasi Data</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {/* Bar Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Pengiriman per Tanggal</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-sm border border-purple-100">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fill: '#4B5563' }} />
                <YAxis tick={{ fill: '#4B5563' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Pengiriman"
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Status Pengiriman</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-sm border border-purple-100">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
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
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Trend Pengiriman</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-sm border border-purple-100">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fill: '#4B5563' }} />
                <YAxis tick={{ fill: '#4B5563' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Jumlah Pengiriman"
                  stroke="#8B5CF6"
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
