
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { Shipment } from "@/lib/types";
import { toast } from "sonner";

interface ExportOptionsProps {
  data: Shipment[];
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ data }) => {
  // Function to get formatted today's date
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  
  // Function to export as CSV
  const exportAsCSV = () => {
    try {
      // Define the CSV headers
      const headers = [
        "No. Surat Jalan",
        "Perusahaan",
        "Tujuan",
        "Supir",
        "Tanggal Kirim",
        "Tanggal Tiba",
        "Status",
        "Kendala",
        "Qty"
      ].join(",");
      
      // Convert data to CSV rows
      const csvRows = data.map((shipment) => {
        return [
          `"${shipment.noSuratJalan}"`,
          `"${shipment.perusahaan}"`,
          `"${shipment.tujuan}"`,
          `"${shipment.supir}"`,
          `"${shipment.tanggalKirim}"`,
          `"${shipment.tanggalTiba || ""}"`,
          `"${shipment.status}"`,
          `"${shipment.kendala || ""}"`,
          `${shipment.qty}`
        ].join(",");
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...csvRows].join("\n");
      
      // Create a Blob with the CSV data
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Create a link element to download the blob
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `pengiriman_${getTodayFormatted()}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Berhasil mengunduh file CSV");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Gagal mengunduh file. Silakan coba lagi.");
    }
  };

  // Function to export as PDF (mock)
  const exportAsPDF = () => {
    toast.info("Fitur ekspor PDF sedang dalam pengembangan");
  };
  
  // Export grouped by company
  const exportGroupedByCompany = () => {
    try {
      // Group data by company
      const groupedByCompany = data.reduce((acc, shipment) => {
        const company = shipment.perusahaan;
        if (!acc[company]) {
          acc[company] = [];
        }
        acc[company].push(shipment);
        return acc;
      }, {} as Record<string, Shipment[]>);
      
      // For each company create a section in the CSV
      const sections: string[] = [];
      
      // Add headers first
      const headers = [
        "No. Surat Jalan",
        "Tujuan",
        "Supir",
        "Tanggal Kirim",
        "Tanggal Tiba",
        "Status",
        "Kendala",
        "Qty"
      ].join(",");
      
      Object.entries(groupedByCompany).forEach(([company, shipments]) => {
        // Add company name as a section header
        sections.push(`"${company}"`);
        sections.push(headers);
        
        // Add the shipments for this company
        shipments.forEach(shipment => {
          const row = [
            `"${shipment.noSuratJalan}"`,
            `"${shipment.tujuan}"`,
            `"${shipment.supir}"`,
            `"${shipment.tanggalKirim}"`,
            `"${shipment.tanggalTiba || ""}"`,
            `"${shipment.status}"`,
            `"${shipment.kendala || ""}"`,
            `${shipment.qty}`
          ].join(",");
          sections.push(row);
        });
        
        // Add an empty line between companies
        sections.push("");
      });
      
      const csvContent = sections.join("\n");
      
      // Create a Blob with the CSV data
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Create a link element to download the blob
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `pengiriman_per_perusahaan_${getTodayFormatted()}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Berhasil mengunduh file CSV per perusahaan");
    } catch (error) {
      console.error("Error exporting CSV by company:", error);
      toast.error("Gagal mengunduh file. Silakan coba lagi.");
    }
  };
  
  // Export summary statistics
  const exportSummaryStats = () => {
    try {
      // Group data by company and calculate stats
      const companyStats = data.reduce((acc, shipment) => {
        const company = shipment.perusahaan;
        if (!acc[company]) {
          acc[company] = {
            name: company,
            total: 0,
            delivered: 0,
            pending: 0,
            failed: 0
          };
        }
        
        acc[company].total++;
        if (shipment.status === "terkirim") {
          acc[company].delivered++;
        } else if (shipment.status === "tertunda") {
          acc[company].pending++;
        } else if (shipment.status === "gagal") {
          acc[company].failed++;
        }
        
        return acc;
      }, {} as Record<string, { name: string; total: number; delivered: number; pending: number; failed: number }>);
      
      // Headers for the summary stats
      const headers = ["Perusahaan", "Total", "Terkirim", "Tertunda", "Gagal"].join(",");
      
      // Convert stats to rows
      const statRows = Object.values(companyStats).map(stat => {
        return [
          `"${stat.name}"`,
          stat.total,
          stat.delivered,
          stat.pending,
          stat.failed
        ].join(",");
      });
      
      const csvContent = [headers, ...statRows].join("\n");
      
      // Create a Blob with the CSV data
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Create a link element to download the blob
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `statistik_pengiriman_${getTodayFormatted()}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Berhasil mengunduh statistik pengiriman");
    } catch (error) {
      console.error("Error exporting statistics:", error);
      toast.error("Gagal mengunduh statistik. Silakan coba lagi.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> 
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsCSV}>
          Export Data Lengkap (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportGroupedByCompany}>
          Export Data per Perusahaan (CSV)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportSummaryStats}>
          Export Statistik Pengiriman (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportOptions;
