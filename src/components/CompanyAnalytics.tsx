
import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shipment } from "@/lib/types";
import { startOfDay, endOfDay } from "date-fns";

interface CompanyAnalyticsProps {
  shipments: Shipment[];
  dateFrom?: Date;
  dateTo?: Date;
}

const CompanyAnalytics: React.FC<CompanyAnalyticsProps> = ({ 
  shipments, 
  dateFrom, 
  dateTo 
}) => {
  // Optimized company analytics calculation
  const companyAnalytics = useMemo(() => {
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

    const analytics = filteredShipments.reduce((acc, shipment) => {
      const company = shipment.perusahaan;
      if (!acc[company]) {
        acc[company] = {
          name: company,
          total: 0,
          terkirim: 0,
          tertunda: 0,
          gagal: 0,
          totalQty: 0,
          deliveryRate: 0,
        };
      }

      acc[company].total += 1;
      acc[company].totalQty += shipment.qty;
      
      if (shipment.status === "terkirim") {
        acc[company].terkirim += 1;
      } else if (shipment.status === "tertunda") {
        acc[company].tertunda += 1;
      } else if (shipment.status === "gagal") {
        acc[company].gagal += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate delivery rates and sort
    return Object.values(analytics)
      .map((company: any) => ({
        ...company,
        deliveryRate: company.total > 0 ? Math.round((company.terkirim / company.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total) // Sort by total shipments
      .slice(0, 20); // Limit to top 20 companies
  }, [shipments, dateFrom, dateTo]);

  const getDeliveryRateBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 75) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Analisis Performa Perusahaan</CardTitle>
        <CardDescription>
          Statistik pengiriman dan tingkat keberhasilan per perusahaan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Perusahaan</TableHead>
                <TableHead className="text-center font-semibold">Total</TableHead>
                <TableHead className="text-center font-semibold">Terkirim</TableHead>
                <TableHead className="text-center font-semibold">Tertunda</TableHead>
                <TableHead className="text-center font-semibold">Gagal</TableHead>
                <TableHead className="text-center font-semibold">Total Qty</TableHead>
                <TableHead className="text-center font-semibold">Success Rate</TableHead>
                <TableHead className="text-center font-semibold">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyAnalytics.length > 0 ? (
                companyAnalytics.map((company, index) => (
                  <TableRow key={company.name} className={index % 2 === 0 ? "bg-gray-50/50" : ""}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={company.name}>
                      {company.name}
                    </TableCell>
                    <TableCell className="text-center">{company.total}</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {company.terkirim}
                    </TableCell>
                    <TableCell className="text-center text-yellow-600 font-medium">
                      {company.tertunda}
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-medium">
                      {company.gagal}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {company.totalQty}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${
                        company.deliveryRate >= 90 ? 'text-green-600' :
                        company.deliveryRate >= 75 ? 'text-blue-600' :
                        company.deliveryRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {company.deliveryRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getDeliveryRateBadge(company.deliveryRate)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Tidak ada data untuk ditampilkan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CompanyAnalytics);
