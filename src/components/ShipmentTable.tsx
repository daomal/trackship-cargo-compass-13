
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MoreHorizontal, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { updateShipment, deleteShipment } from "@/lib/shipmentService";

interface ShipmentTableProps {
  shipments: Shipment[];
  onShipmentUpdated?: () => void;
}

const ITEMS_PER_PAGE = 10;

const ShipmentTable: React.FC<ShipmentTableProps> = ({ shipments, onShipmentUpdated }) => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kendala, setKendala] = useState("");
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("tertunda");
  
  // Calculate total pages
  const totalPages = Math.ceil(shipments.length / ITEMS_PER_PAGE);
  
  // Calculate current items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, shipments.length);
  const paginatedShipments = shipments.slice(startIndex, endIndex);

  // Helper function for status badge
  const renderStatusBadge = (status: ShipmentStatus) => {
    const statusClasses = {
      terkirim: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium",
      tertunda: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium",
      gagal: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium",
    };

    const statusText = {
      terkirim: "Terkirim",
      tertunda: "Tertunda",
      gagal: "Gagal",
    };

    return <span className={statusClasses[status]}>{statusText[status]}</span>;
  };

  const handleOpenEditDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setKendala(shipment.kendala || "");
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenStatusDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setNewStatus(shipment.status);
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      // For "gagal" status, kendala is required
      if (newStatus === "gagal" && !kendala) {
        toast.error("Kendala harus diisi jika status gagal");
        return;
      }
      
      // Prepare update data
      const updateData: Partial<Shipment> = {
        status: newStatus,
      };
      
      // Update kendala and tanggalTiba based on status
      if (newStatus === "gagal") {
        updateData.kendala = kendala;
      } else if (newStatus === "terkirim") {
        updateData.tanggalTiba = format(new Date(), "yyyy-MM-dd");
        updateData.kendala = null;
      } else if (newStatus === "tertunda") {
        updateData.tanggalTiba = null;
        updateData.kendala = kendala || null;
      }
      
      await updateShipment(currentShipment.id, updateData);
      
      toast.success(`Status pengiriman berhasil diubah ke ${newStatus}`);
      setIsStatusDialogOpen(false);
      
      // Refresh data
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengubah status pengiriman");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShipment = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      const updateData: Partial<Shipment> = {
        kendala: kendala || null
      };
      
      await updateShipment(currentShipment.id, updateData);
      
      toast.success("Data pengiriman berhasil diperbarui");
      setIsEditDialogOpen(false);
      
      // Refresh data
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast.error("Gagal memperbarui data pengiriman");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      await deleteShipment(currentShipment.id);
      
      toast.success("Data pengiriman berhasil dihapus");
      setIsDeleteDialogOpen(false);
      
      // Refresh data
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error deleting shipment:", error);
      toast.error("Gagal menghapus data pengiriman");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
                  {isAdmin && <TableHead className="w-[60px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center h-32">
                      Tidak ada data pengiriman
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedShipments.map((shipment) => (
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
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenStatusDialog(shipment)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(shipment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Keterangan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDeleteDialog(shipment)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Data
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
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
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else {
                      // For more pages, show window around current page
                      const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      pageNumber = start + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
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

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ShipmentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terkirim">Terkirim</SelectItem>
                  <SelectItem value="tertunda">Tertunda</SelectItem>
                  <SelectItem value="gagal">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show kendala field if status is "gagal" or "tertunda" */}
            {(newStatus === "gagal" || newStatus === "tertunda") && (
              <div className="grid gap-2">
                <Label htmlFor="kendala">Kendala / Keterangan</Label>
                <Textarea
                  id="kendala"
                  value={kendala}
                  onChange={(e) => setKendala(e.target.value)}
                  placeholder="Masukkan kendala atau keterangan"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Keterangan Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kendala-edit">Kendala / Keterangan</Label>
              <Textarea
                id="kendala-edit"
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                placeholder="Masukkan kendala atau keterangan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateShipment} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menghapus data pengiriman ini?</p>
            <p className="font-medium mt-2">No. Surat Jalan: {currentShipment?.noSuratJalan}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteShipment} disabled={isLoading}>
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentTable;
