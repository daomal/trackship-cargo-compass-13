
import React from "react";
import { Truck, MessageSquare, LayoutDashboard } from "lucide-react";
import { DashboardView } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface DashboardNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 animate-fade-in">
      <Button
        variant={activeView === "dashboard" ? "default" : "outline"}
        className={
          activeView === "dashboard"
            ? "bg-gradient-to-r from-[#1A4A9B] to-[#4D72B1] text-white shadow-lg transform transition-all duration-300 rounded-xl hover:translate-y-[-2px] hover:shadow-xl"
            : "bg-white/90 text-[#1A4A9B] hover:bg-[#E8F3FF] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 shadow-md border-[#E2EEFF] rounded-xl"
        }
        onClick={() => onViewChange("dashboard")}
      >
        <LayoutDashboard className="mr-2 h-4 w-4" />
        Dashboard
      </Button>

      <Button
        variant={activeView === "shipments" ? "default" : "outline"}
        className={
          activeView === "shipments"
            ? "bg-gradient-to-r from-[#1A4A9B] to-[#4D72B1] text-white shadow-lg transform transition-all duration-300 rounded-xl hover:translate-y-[-2px] hover:shadow-xl"
            : "bg-white/90 text-[#1A4A9B] hover:bg-[#E8F3FF] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 shadow-md border-[#E2EEFF] rounded-xl"
        }
        onClick={() => onViewChange("shipments")}
      >
        <Truck className="mr-2 h-4 w-4" />
        Tabel Pengiriman
      </Button>

      <Button
        variant={activeView === "notes" ? "default" : "outline"}
        className={
          activeView === "notes"
            ? "bg-gradient-to-r from-[#1A4A9B] to-[#4D72B1] text-white shadow-lg transform transition-all duration-300 rounded-xl hover:translate-y-[-2px] hover:shadow-xl"
            : "bg-white/90 text-[#1A4A9B] hover:bg-[#E8F3FF] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 shadow-md border-[#E2EEFF] rounded-xl"
        }
        onClick={() => onViewChange("notes")}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Forum Catatan
      </Button>
    </div>
  );
};

export default DashboardNav;
