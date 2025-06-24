
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
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
    },
    {
      title: "Berhasil Terkirim",
      value: summaryData.terkirim,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
    },
    {
      title: "Masih Tertunda",
      value: summaryData.tertunda,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      gradientFrom: "from-yellow-500",
      gradientTo: "to-yellow-600",
    },
    {
      title: "Tingkat Keberhasilan",
      value: `${summaryData.deliveryRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradientFrom: "from-purple-500",
      gradientTo: "to-purple-600",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className="relative bg-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              borderRadius: '16px',
            }}
          >
            {/* 3D Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 tracking-wide">
                {card.title}
              </CardTitle>
              <div 
                className={`p-3 rounded-xl bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} shadow-lg transform transition-transform hover:scale-110`}
                style={{
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-gray-900 mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {card.value}
              </div>
              {card.title === "Total Pengiriman" && (
                <p className="text-xs text-gray-500 font-medium">
                  Total Qty: {summaryData.totalQty}
                </p>
              )}
            </CardContent>
            
            {/* Bottom glow effect */}
            <div 
              className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo} rounded-full opacity-40 blur-sm`}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default React.memo(SummaryCards);
