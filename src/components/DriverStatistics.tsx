
import React from "react";
import { Shipment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DriverStatisticsProps {
  shipments: Shipment[];
}

interface DriverStats {
  name: string;
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  reasons: string[];
}

const DriverStatistics: React.FC<DriverStatisticsProps> = ({ shipments }) => {
  // Process shipment data to get driver statistics
  const getDriverStats = (): DriverStats[] => {
    const driverMap = new Map<string, DriverStats>();
    
    shipments.forEach((shipment) => {
      const driverName = shipment.supir;
      
      // Skip if driver name is empty
      if (!driverName) return;
      
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, {
          name: driverName,
          total: 0,
          delivered: 0,
          pending: 0,
          failed: 0,
          reasons: []
        });
      }
      
      const driverStats = driverMap.get(driverName)!;
      
      // Increment counters
      driverStats.total++;
      
      if (shipment.status === "terkirim") {
        driverStats.delivered++;
      } else if (shipment.status === "tertunda") {
        driverStats.pending++;
      } else if (shipment.status === "gagal") {
        driverStats.failed++;
        
        // Add reason if available and not already in the list
        if (shipment.kendala && !driverStats.reasons.includes(shipment.kendala)) {
          driverStats.reasons.push(shipment.kendala);
        }
      }
    });
    
    // Convert map to array and sort by total deliveries
    return Array.from(driverMap.values())
      .sort((a, b) => b.total - a.total);
  };

  const driverStats = getDriverStats();

  return (
    <Card className="bg-gradient-mint animate-fade-in shadow-lg border border-blue-100 text-navy-600">
      <CardHeader className="border-b border-blue-100">
        <CardTitle className="text-navy-600">Statistik Performa Supir</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border border-blue-100 bg-white/90 overflow-hidden driver-stats-table">
          <Table>
            <TableHeader className="bg-gradient-mint/50">
              <TableRow>
                <TableHead>Nama Supir</TableHead>
                <TableHead className="text-center">Total Pengiriman</TableHead>
                <TableHead className="text-center">Terkirim</TableHead>
                <TableHead className="text-center">Tertunda</TableHead>
                <TableHead className="text-center">Gagal</TableHead>
                <TableHead>Alasan Gagal/Tertunda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32">
                    Tidak ada data supir
                  </TableCell>
                </TableRow>
              ) : (
                driverStats.map((driver) => (
                  <TableRow key={driver.name} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell className="text-center">{driver.total}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {driver.delivered}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        {driver.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        {driver.failed}
                      </span>
                    </TableCell>
                    <TableCell>
                      {driver.reasons.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm">
                          {driver.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverStatistics;
