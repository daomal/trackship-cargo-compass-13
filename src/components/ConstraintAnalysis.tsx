
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

  return (
    <Card className="h-full bg-gradient-to-br from-[#E8F3FF] to-[#F9FAFF] border border-[#E2EEFF] shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1A4A9B]">Analisis Kendala</CardTitle>
        <CardDescription className="text-[#4D72B1]">
          Kendala yang paling sering terjadi dalam pengiriman
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constraintData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-[#4D72B1]">
            Tidak ada data kendala
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={constraintData}
                margin={{
                  top: 5,
                  right: 30,
                  left: isMobile ? 60 : 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1A4A9B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#4D72B1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={isMobile ? 100 : 150} />
                <Tooltip
                  formatter={(value: number) => [`${value} kasus`, "Jumlah"]}
                  labelFormatter={(label) => `Kendala: ${label}`}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Kejadian"
                  fill="url(#barGradient)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConstraintAnalysis;
