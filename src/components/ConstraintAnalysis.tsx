
import React from "react";
import { Shipment } from "@/lib/types";
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
  Cell,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConstraintAnalysisProps {
  shipments: Shipment[];
}

const ConstraintAnalysis: React.FC<ConstraintAnalysisProps> = ({ shipments }) => {
  const isMobile = useIsMobile();

  // Calculate constraint statistics
  const analyzeConstraints = () => {
    const constraints = new Map<string, number>();
    
    shipments.forEach((shipment) => {
      if (shipment.kendala) {
        constraints.set(
          shipment.kendala,
          (constraints.get(shipment.kendala) || 0) + 1
        );
      }
    });
    
    return Array.from(constraints.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const constraintData = analyzeConstraints();
  
  // Colors for alternating bars
  const barColors = ["#9b87f5", "#4CAF50", "#1EAEDB", "#ea384c"];

  return (
    <Card className="h-full data-card shadow-2xl bg-white">
      <CardHeader>
        <CardTitle className="text-[#8B4513]">Analisis Kendala</CardTitle>
        <CardDescription className="text-[#A97555]">
          Kendala yang paling sering terjadi dalam pengiriman
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constraintData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-[#A97555]">
            Tidak ada data kendala
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={constraintData}
                className="chart-3d"
                margin={{
                  top: 5,
                  right: 30,
                  left: isMobile ? 60 : 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: '#8B4513' }} />
                <YAxis dataKey="name" type="category" width={isMobile ? 100 : 150} tick={{ fill: '#8B4513' }} />
                <Tooltip
                  formatter={(value: number) => [`${value} kasus`, "Jumlah"]}
                  labelFormatter={(label) => `Kendala: ${label}`}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Kejadian"
                  radius={[0, 4, 4, 0]}
                >
                  {constraintData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConstraintAnalysis;
