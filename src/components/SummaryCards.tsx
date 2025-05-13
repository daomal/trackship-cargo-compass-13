
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
      <Card className="book-style-card book-card book-card-purple stagger-item animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#4a2d7c]">Total Pengiriman</CardTitle>
          <div className="rounded-full bg-[#f0e8ff] p-2 transition-transform duration-300 hover:scale-110">
            <Package className="h-4 w-4 text-[#9b87f5]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#6E59A5]">{summary.total}</div>
          <p className="text-xs text-[#7E69AB]">
            Jumlah seluruh pengiriman
          </p>
        </CardContent>
      </Card>
      
      <Card className="book-style-card book-card book-card-green stagger-item animate-fade-in" style={{animationDelay: "0.1s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#2c6e31]">Terkirim</CardTitle>
          <div className="rounded-full bg-[#e8f7e8] p-2 transition-transform duration-300 hover:scale-110">
            <CheckCircle className="h-4 w-4 text-[#4CAF50]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#2c6e31]">{summary.delivered}</div>
          <p className="text-xs text-[#4a7e4e]">
            {summary.total > 0
              ? `${Math.round((summary.delivered / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="book-style-card book-card book-card-blue stagger-item animate-fade-in" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#1a5e8a]">Tertunda</CardTitle>
          <div className="rounded-full bg-[#e6f7fd] p-2 transition-transform duration-300 hover:scale-110">
            <Clock className="h-4 w-4 text-[#1EAEDB]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a5e8a]">{summary.pending}</div>
          <p className="text-xs text-[#3d7ea3]">
            {summary.total > 0
              ? `${Math.round((summary.pending / summary.total) * 100)}% dari total pengiriman`
              : "0% dari total pengiriman"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="book-style-card book-card book-card-red stagger-item animate-fade-in" style={{animationDelay: "0.3s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#9e2a2a]">Gagal Kirim</CardTitle>
          <div className="rounded-full bg-[#fde8e8] p-2 transition-transform duration-300 hover:scale-110">
            <AlertCircle className="h-4 w-4 text-[#ea384c]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#9e2a2a]">{summary.failed}</div>
          <p className="text-xs text-[#c14e4e]">
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
