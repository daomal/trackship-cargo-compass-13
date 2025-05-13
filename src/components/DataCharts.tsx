
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
      { name: "Terkirim", value: statusCount.terkirim, color: "#4CAF50" },
      { name: "Tertunda", value: statusCount.tertunda, color: "#1EAEDB" },
      { name: "Gagal", value: statusCount.gagal, color: "#ea384c" },
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

  // Colors for alternating bars
  const barColors = ["#9b87f5", "#4CAF50", "#1EAEDB", "#ea384c"];

  return (
    <Card className="data-card animate-fade-in shadow-2xl bg-white">
      <CardHeader className="border-b border-[#e6d9c7]">
        <CardTitle className="text-[#8B4513]">Visualisasi Data</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {/* Bar Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-[#8B4513] mb-2">Pengiriman per Tanggal</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-xl border border-[#e6d9c7]">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
              <BarChart data={barChartData} className="chart-3d">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fill: '#8B4513' }} />
                <YAxis tick={{ fill: '#8B4513' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e6d9c7' }}
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
        <div className="chart-container">
          <h3 className="text-lg font-medium text-[#8B4513] mb-2">Status Pengiriman</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-xl border border-[#e6d9c7]">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
              <PieChart className="chart-3d">
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
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e6d9c7' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-medium text-[#8B4513] mb-2">Trend Pengiriman</h3>
          <div className="w-full h-[300px] p-2 bg-white rounded-md shadow-xl border border-[#e6d9c7]">
            <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper">
              <LineChart data={lineChartData} className="chart-3d">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fill: '#8B4513' }} />
                <YAxis tick={{ fill: '#8B4513' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e6d9c7' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Jumlah Pengiriman"
                  stroke="#9b87f5"
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
