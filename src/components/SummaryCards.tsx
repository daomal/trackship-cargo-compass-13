
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
      <Card className="bg-gradient-to-br from-[#E8F3FF] to-[#F9FAFF] border border-[#E2EEFF] shadow-2xl hover:shadow-[0_20px_35px_rgba(0,0,0,0.25)] transition-all duration-500 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#1A4A9B]">Total Pengiriman</CardTitle>
          <div className="rounded-full bg-[#E8F3FF] p-2 transition-transform duration-300 hover:scale-110">
            <Package className="h-4 w-4 text-[#1A4A9B]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1A4A9B]">{summary.total}</div>
          <p className="text-xs text-[#4D72B1]">
            Jumlah seluruh pengiriman
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-[#E8F3FF] to-[#F9FAFF] border border-[#E2EEFF] shadow-2xl hover:shadow-[0_20px_35px_rgba(0,0,0,0.25)] transition-all duration-500 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.1s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#1A4A9B]">Terkirim</CardTitle>
          <div className="rounded-full bg-[#E8F3FF] p-2 transition-transform duration-300 hover:scale-110">
            <CheckCircle className="h-4 w-4 text-[#22C55E]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1A4A9B]">{summary.delivered}</div>
          <p className="text-xs text-[#4D72B1]">
            {summary.total > 0
              ? `${Math.round((summary.delivered / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-[#E8F3FF] to-[#F9FAFF] border border-[#E2EEFF] shadow-2xl hover:shadow-[0_20px_35px_rgba(0,0,0,0.25)] transition-all duration-500 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#1A4A9B]">Tertunda</CardTitle>
          <div className="rounded-full bg-[#E8F3FF] p-2 transition-transform duration-300 hover:scale-110">
            <Clock className="h-4 w-4 text-[#F59E0B]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1A4A9B]">{summary.pending}</div>
          <p className="text-xs text-[#4D72B1]">
            {summary.total > 0
              ? `${Math.round((summary.pending / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-[#E8F3FF] to-[#F9FAFF] border border-[#E2EEFF] shadow-2xl hover:shadow-[0_20px_35px_rgba(0,0,0,0.25)] transition-all duration-500 transform hover:-translate-y-2 rounded-xl stagger-item animate-fade-in" style={{animationDelay: "0.3s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#1A4A9B]">Gagal Kirim</CardTitle>
          <div className="rounded-full bg-[#E8F3FF] p-2 transition-transform duration-300 hover:scale-110">
            <AlertCircle className="h-4 w-4 text-[#EF4444]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1A4A9B]">{summary.failed}</div>
          <p className="text-xs text-[#4D72B1]">
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
