
import React from "react";
import { Shipment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart } from "recharts";
import {
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Visualisasi Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="bar">Batang</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Bar
                    dataKey="count"
                    name="Jumlah Pengiriman"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="pie">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="line">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} pengiriman`, "Jumlah"]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Jumlah Pengiriman"
                    stroke="#3B82F6"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataCharts;
