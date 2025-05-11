
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

interface ConstraintAnalysisProps {
  shipments: Shipment[];
}

const ConstraintAnalysis: React.FC<ConstraintAnalysisProps> = ({ shipments }) => {
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
    <Card className="h-full bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-purple-900">Analisis Kendala</CardTitle>
        <CardDescription className="text-purple-700">
          Kendala yang paling sering terjadi dalam pengiriman
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constraintData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-purple-600">
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
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip
                  formatter={(value: number) => [`${value} kasus`, "Jumlah"]}
                  labelFormatter={(label) => `Kendala: ${label}`}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Kejadian"
                  fill="#8B5CF6"
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
