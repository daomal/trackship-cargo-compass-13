
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shipment } from "@/lib/types";

interface ShipmentTableProps {
  shipments: Shipment[];
}

const ITEMS_PER_PAGE = 5;

const ShipmentTable: React.FC<ShipmentTableProps> = ({ shipments }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(shipments.length / ITEMS_PER_PAGE);
  
  // Calculate current items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, shipments.length);
  const currentShipments = shipments.slice(startIndex, endIndex);

  // Helper function for status badge
  const renderStatusBadge = (status: Shipment["status"]) => {
    const statusMap = {
      terkirim: "status-delivered",
      tertunda: "status-pending",
      gagal: "status-failed",
    };

    const statusTextMap = {
      terkirim: "Terkirim",
      tertunda: "Tertunda",
      gagal: "Gagal",
    };

    return <span className={statusMap[status]}>{statusTextMap[status]}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pengiriman</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">No. Surat Jalan</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Supir</TableHead>
                <TableHead>Tanggal Kirim</TableHead>
                <TableHead>Tanggal Tiba</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kendala</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32">
                    Tidak ada data pengiriman
                  </TableCell>
                </TableRow>
              ) : (
                currentShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.noSuratJalan}
                    </TableCell>
                    <TableCell>{shipment.tujuan}</TableCell>
                    <TableCell>{shipment.supir}</TableCell>
                    <TableCell>{shipment.tanggalKirim}</TableCell>
                    <TableCell>
                      {shipment.tanggalTiba || "-"}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      {shipment.kendala || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setCurrentPage(index + 1)}
                      isActive={currentPage === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
