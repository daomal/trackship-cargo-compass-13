
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
          <Package className="h-4 w-4 text-navy-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total}</div>
          <p className="text-xs text-muted-foreground">
            Jumlah seluruh pengiriman
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terkirim</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.delivered}</div>
          <p className="text-xs text-muted-foreground">
            {summary.total > 0
              ? `${Math.round((summary.delivered / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tertunda</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.pending}</div>
          <p className="text-xs text-muted-foreground">
            {summary.total > 0
              ? `${Math.round((summary.pending / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gagal Kirim</CardTitle>
          <AlertCircle className="h-4 w-4 text-error" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.failed}</div>
          <p className="text-xs text-muted-foreground">
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
