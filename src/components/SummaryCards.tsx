
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Package } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    total: number;
    delivered: number;
    pending: number;
    failed: number;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="card-3d bg-soft-blue-bg text-soft-blue-text border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
          <div className="rounded-full bg-white/30 p-2.5 backdrop-blur-sm">
            <Package className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{summary.total}</div>
          <p className="text-sm opacity-80">
            Jumlah seluruh pengiriman
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-3d bg-soft-green-bg text-soft-green-text border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terkirim</CardTitle>
          <div className="rounded-full bg-white/30 p-2.5 backdrop-blur-sm">
            <CheckCircle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{summary.delivered}</div>
          <p className="text-sm opacity-80">
            {summary.total > 0
              ? `${Math.round((summary.delivered / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-3d bg-soft-amber-bg text-soft-amber-text border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tertunda</CardTitle>
          <div className="rounded-full bg-white/30 p-2.5 backdrop-blur-sm">
            <Clock className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{summary.pending}</div>
          <p className="text-sm opacity-80">
            {summary.total > 0
              ? `${Math.round((summary.pending / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-3d bg-soft-rose-bg text-soft-rose-text border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gagal Kirim</CardTitle>
          <div className="rounded-full bg-white/30 p-2.5 backdrop-blur-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{summary.failed}</div>
          <p className="text-sm opacity-80">
            {summary.total > 0
              ? `${Math.round((summary.failed / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
