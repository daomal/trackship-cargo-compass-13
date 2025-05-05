
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { Shipment } from "@/lib/types";
import { toast } from "sonner";

interface ExportOptionsProps {
  data: Shipment[];
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ data }) => {
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
      link.setAttribute("download", `pengiriman_${new Date().toISOString().split("T")[0]}.csv`);
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
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportOptions;
