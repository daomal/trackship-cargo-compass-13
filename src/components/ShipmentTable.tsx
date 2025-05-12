
import React from "react";
import { Shipment } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface ShipmentTableProps {
  shipments: Shipment[];
  onShipmentUpdated?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const ShipmentTable: React.FC<ShipmentTableProps> = ({
  shipments,
  onShipmentUpdated,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}) => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "terkirim":
        return <Badge className="bg-green-500 hover:bg-green-600">Terkirim</Badge>;
      case "tertunda":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Tertunda</Badge>;
      case "gagal":
        return <Badge className="bg-red-500 hover:bg-red-600">Gagal</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Generate the array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages && totalPages <= 7) {
      // If there are 7 or fewer pages, show all page numbers
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (totalPages && totalPages > 7) {
      // If there are more than 7 pages, show first, last, and pages around current
      if (currentPage <= 3) {
        // If current page is among first 3, show first 5, ellipsis, and last
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // If current page is among last 3, show first, ellipsis, and last 5
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // If current page is somewhere in the middle, show first, ellipsis, current-1, current, current+1, ellipsis, last
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <Card className="bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-purple-900">Data Pengiriman</CardTitle>
        <CardDescription className="text-purple-700">
          {shipments.length} data pengiriman ditampilkan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shipments.length === 0 ? (
          <div className="text-center p-8 text-purple-600">
            Tidak ada data pengiriman yang sesuai dengan filter
          </div>
        ) : (
          <div className="rounded-md border border-purple-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-purple-100">
                  <TableRow>
                    <TableHead className="text-purple-900">No.</TableHead>
                    <TableHead className="text-purple-900">No Surat Jalan</TableHead>
                    {!isMobile && (
                      <>
                        <TableHead className="text-purple-900">Perusahaan</TableHead>
                        <TableHead className="text-purple-900">Tujuan</TableHead>
                      </>
                    )}
                    <TableHead className="text-purple-900">Supir</TableHead>
                    <TableHead className="text-purple-900">Tanggal Kirim</TableHead>
                    {!isMobile && (
                      <TableHead className="text-purple-900">Tanggal Tiba</TableHead>
                    )}
                    <TableHead className="text-purple-900">Status</TableHead>
                    {!isMobile && (
                      <TableHead className="text-purple-900">Kendala</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment, index) => (
                    <TableRow key={shipment.id} className="bg-white hover:bg-purple-50">
                      <TableCell className="text-black font-medium">{index + 1}</TableCell>
                      <TableCell className="text-black">{shipment.noSuratJalan}</TableCell>
                      {!isMobile && (
                        <>
                          <TableCell className="text-black">{shipment.perusahaan}</TableCell>
                          <TableCell className="text-black">{shipment.tujuan}</TableCell>
                        </>
                      )}
                      <TableCell className="text-black">{shipment.supir}</TableCell>
                      <TableCell className="text-black">{formatDate(shipment.tanggalKirim)}</TableCell>
                      {!isMobile && (
                        <TableCell className="text-black">
                          {formatDate(shipment.tanggalTiba || "")}
                        </TableCell>
                      )}
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      {!isMobile && (
                        <TableCell className="text-black">
                          {shipment.kendala || "-"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {totalPages && totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((pageNumber, i) => (
                  <PaginationItem key={i}>
                    {pageNumber === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={pageNumber === currentPage}
                        onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentTable;
