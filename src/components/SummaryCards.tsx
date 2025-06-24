
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Shipment } from "@/lib/types";
import { startOfDay, endOfDay } from "date-fns";

interface SummaryCardsProps {
  shipments: Shipment[];
  dateFrom?: Date;
  dateTo?: Date;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  shipments, 
  dateFrom, 
  dateTo 
}) => {
  // Optimized calculations with useMemo
  const summaryData = useMemo(() => {
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

    const totalShipments = filteredShipments.length;
    const terkirim = filteredShipments.filter(s => s.status === "terkirim").length;
    const tertunda = filteredShipments.filter(s => s.status === "tertunda").length;
    const gagal = filteredShipments.filter(s => s.status === "gagal").length;
    const totalQty = filteredShipments.reduce((sum, s) => sum + s.qty, 0);

    const deliveryRate = totalShipments > 0 ? Math.round((terkirim / totalShipments) * 100) : 0;

    return {
      totalShipments,
      terkirim,
      tertunda,
      gagal,
      totalQty,
      deliveryRate
    };
  }, [shipments, dateFrom, dateTo]);

  const cards = [
    {
      title: "Total Pengiriman",
      value: summaryData.totalShipments,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Berhasil Terkirim",
      value: summaryData.terkirim,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Masih Tertunda",
      value: summaryData.tertunda,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Tingkat Keberhasilan",
      value: `${summaryData.deliveryRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              {card.title === "Total Pengiriman" && (
                <p className="text-xs text-gray-500 mt-1">
                  Total Qty: {summaryData.totalQty}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default React.memo(SummaryCards);
