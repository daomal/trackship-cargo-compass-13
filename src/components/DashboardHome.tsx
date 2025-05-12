
import React from "react";
import { Shipment } from "@/lib/types";
import SummaryCards from "./SummaryCards";
import DataCharts from "./DataCharts";
import DriverStatistics from "./DriverStatistics";
import ConstraintAnalysis from "./ConstraintAnalysis";
import CompanyAnalytics from "./CompanyAnalytics";

interface DashboardHomeProps {
  shipments: Shipment[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ shipments }) => {
  // Count summary data
  const summary = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === "terkirim").length,
    pending: shipments.filter(s => s.status === "tertunda").length,
    failed: shipments.filter(s => s.status === "gagal").length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div>
        <SummaryCards summary={summary} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataCharts shipments={shipments} />
        <ConstraintAnalysis shipments={shipments} />
      </div>

      {/* Driver Statistics */}
      <div>
        <DriverStatistics shipments={shipments} />
      </div>

      {/* Company Analytics */}
      <div>
        <CompanyAnalytics shipments={shipments} />
      </div>
    </div>
  );
};

export default DashboardHome;
