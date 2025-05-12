
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
      <Card className="bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900">Total Pengiriman</CardTitle>
          <div className="rounded-full bg-purple-100 p-2 transition-transform duration-300 hover:scale-110">
            <Package className="h-4 w-4 text-purple-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{summary.total}</div>
          <p className="text-xs text-purple-700">
            Jumlah seluruh pengiriman
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-white to-green-100 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.1s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Terkirim</CardTitle>
          <div className="rounded-full bg-green-100 p-2 transition-transform duration-300 hover:scale-110">
            <CheckCircle className="h-4 w-4 text-green-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">{summary.delivered}</div>
          <p className="text-xs text-green-700">
            {summary.total > 0
              ? `${Math.round((summary.delivered / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-white to-amber-100 border border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-800">Tertunda</CardTitle>
          <div className="rounded-full bg-amber-100 p-2 transition-transform duration-300 hover:scale-110">
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-800">{summary.pending}</div>
          <p className="text-xs text-amber-700">
            {summary.total > 0
              ? `${Math.round((summary.pending / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-white to-red-100 border border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.3s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Gagal Kirim</CardTitle>
          <div className="rounded-full bg-red-100 p-2 transition-transform duration-300 hover:scale-110">
            <AlertCircle className="h-4 w-4 text-red-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-800">{summary.failed}</div>
          <p className="text-xs text-red-700">
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
