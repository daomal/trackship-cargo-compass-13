
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
import { MoreHorizontal, Calendar, Edit, Trash2, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { updateShipment, deleteShipment, getShipmentStatusHistory, subscribeToShipments } from "@/lib/shipmentService";

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
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isEditDriverDialogOpen, setIsEditDriverDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kendala, setKendala] = useState("");
  const [driverName, setDriverName] = useState("");
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("tertunda");
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localShipments, setLocalShipments] = useState<Shipment[]>(shipments);
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toTimeString().substring(0, 5)
  );
  const [driverEditId, setDriverEditId] = useState<string | null>(null);
  const [editableDriverName, setEditableDriverName] = useState("");
  const [qtyEditId, setQtyEditId] = useState<string | null>(null);
  const [editableQty, setEditableQty] = useState<number>(0);
  
  // Real-time updates
  useEffect(() => {
    setLocalShipments(shipments);
  }, [shipments]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToShipments((updatedShipments) => {
      setLocalShipments(updatedShipments);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);
  
  // Calculate total pages
  const totalPages = Math.ceil(localShipments.length / ITEMS_PER_PAGE);
  
  // Calculate current items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, localShipments.length);
  const paginatedShipments = localShipments.slice(startIndex, endIndex);

  // Calculate total quantity
  const totalQuantity = localShipments.reduce((total, shipment) => total + shipment.qty, 0);

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

  // Function for in-place qty editing
  const handleStartQtyEdit = (shipment: Shipment, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQtyEditId(shipment.id);
    setEditableQty(shipment.qty);
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setEditableQty(value);
    }
  };

  const handleQtySave = async () => {
    if (!qtyEditId) {
      return;
    }
    
    try {
      await updateShipment(qtyEditId, {
        qty: editableQty
      });
      
      toast.success("Qty berhasil diperbarui");
      setQtyEditId(null);
      
      // Update data either through callback or local state
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        // Update local data if no refresh callback provided
        setLocalShipments(prev => 
          prev.map(s => s.id === qtyEditId ? {...s, qty: editableQty} : s)
        );
      }
    } catch (error) {
      console.error("Error updating qty:", error);
      toast.error("Gagal memperbarui qty");
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQtySave();
    } else if (e.key === 'Escape') {
      setQtyEditId(null);
    }
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
    setKendala(shipment.kendala || "");
    setCurrentTime(new Date().toTimeString().substring(0, 5));
    setIsStatusDialogOpen(true);
  };

  const handleOpenEditDriverDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setDriverName(shipment.supir);
    setIsEditDriverDialogOpen(true);
  };
  
  const handleOpenHistoryDialog = async (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setIsHistoryDialogOpen(true);
    
    try {
      setIsLoadingHistory(true);
      const history = await getShipmentStatusHistory(shipment.id);
      setStatusHistory(history);
    } catch (error) {
      console.error("Error fetching status history:", error);
      toast.error("Gagal memuat riwayat status");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateDriver = async () => {
    if (!currentShipment || !driverName.trim()) {
      toast.error("Nama supir tidak boleh kosong");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updateData: Partial<Shipment> = {
        supir: driverName
      };
      
      await updateShipment(currentShipment.id, updateData);
      
      toast.success("Nama supir berhasil diperbarui");
      setIsEditDriverDialogOpen(false);
      
      // Refresh data
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        // Update local data if no refresh callback provided
        setLocalShipments(prev => 
          prev.map(s => s.id === currentShipment.id ? {...s, supir: driverName} : s)
        );
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      toast.error("Gagal memperbarui nama supir");
    } finally {
      setIsLoading(false);
    }
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
        const today = format(new Date(), "yyyy-MM-dd");
        updateData.tanggalTiba = today;
        updateData.waktuTiba = currentTime;
        updateData.kendala = null;
      } else if (newStatus === "tertunda") {
        updateData.tanggalTiba = null;
        updateData.waktuTiba = null;
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

  // Function to handle in-place driver editing
  const handleStartDriverEdit = (shipment: Shipment, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDriverEditId(shipment.id);
    setEditableDriverName(shipment.supir);
  };

  const handleDriverNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableDriverName(e.target.value);
  };

  const handleDriverNameSave = async () => {
    if (!driverEditId || !editableDriverName.trim()) {
      return;
    }
    
    try {
      await updateShipment(driverEditId, {
        supir: editableDriverName
      });
      
      toast.success("Nama supir berhasil diperbarui");
      setDriverEditId(null);
      
      // Update data either through callback or local state
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        // Update local data if no refresh callback provided
        setLocalShipments(prev => 
          prev.map(s => s.id === driverEditId ? {...s, supir: editableDriverName} : s)
        );
      }
    } catch (error) {
      console.error("Error updating driver name:", error);
      toast.error("Gagal memperbarui nama supir");
    }
  };

  const handleDriverNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDriverNameSave();
    } else if (e.key === 'Escape') {
      setDriverEditId(null);
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
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Supir</TableHead>
                  <TableHead>Tanggal Kirim</TableHead>
                  <TableHead>Tanggal & Waktu Tiba</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kendala</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  {isAdmin && <TableHead className="w-[60px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center h-32">
                      Tidak ada data pengiriman
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.noSuratJalan}
                      </TableCell>
                      <TableCell>{shipment.perusahaan}</TableCell>
                      <TableCell>{shipment.tujuan}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          driverEditId === shipment.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                value={editableDriverName}
                                onChange={(e) => setEditableDriverName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleDriverNameSave();
                                  } else if (e.key === 'Escape') {
                                    setDriverEditId(null);
                                  }
                                }}
                                onBlur={handleDriverNameSave}
                                autoFocus
                                className="py-1 h-8"
                              />
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => handleStartDriverEdit(shipment, e)}
                            >
                              {shipment.supir}
                            </Button>
                          )
                        ) : (
                          shipment.supir
                        )}
                      </TableCell>
                      <TableCell>{shipment.tanggalKirim}</TableCell>
                      <TableCell>
                        {shipment.tanggalTiba 
                          ? (shipment.waktuTiba 
                            ? `${shipment.tanggalTiba} ${shipment.waktuTiba}` 
                            : shipment.tanggalTiba) 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(shipment.status)}
                      </TableCell>
                      <TableCell>
                        {shipment.kendala || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          qtyEditId === shipment.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input 
                                type="number"
                                value={editableQty}
                                onChange={handleQtyChange}
                                onKeyDown={handleQtyKeyDown}
                                onBlur={handleQtySave}
                                autoFocus
                                className="py-1 h-8 w-20 text-right"
                              />
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => handleStartQtyEdit(shipment, e)}
                            >
                              {shipment.qty}
                            </Button>
                          )
                        ) : (
                          shipment.qty
                        )}
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
                              <DropdownMenuItem onClick={() => handleOpenHistoryDialog(shipment)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Riwayat Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(shipment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Keterangan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleStartDriverEdit(shipment, e);}}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Supir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleStartQtyEdit(shipment, e);}}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Qty
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
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 8} className="text-right font-medium">
                    Total Qty:
                  </TableCell>
                  <TableCell className="text-right font-medium">{totalQuantity}</TableCell>
                  {isAdmin && <TableCell></TableCell>}
                </TableRow>
              </TableFooter>
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
            
            {/* Show time input if status is "terkirim" */}
            {newStatus === "terkirim" && (
              <div className="grid gap-2">
                <Label htmlFor="waktu-tiba">Waktu Tiba</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="waktu-tiba"
                    type="time"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            
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

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDriverDialogOpen} onOpenChange={setIsEditDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nama Supir</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="driver-name">Nama Supir</Label>
              <Input
                id="driver-name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Masukkan nama supir"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDriverDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateDriver} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Riwayat Status Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm mb-2">
              <strong>No. Surat Jalan:</strong> {currentShipment?.noSuratJalan}
            </div>
            <div className="text-sm mb-4">
              <strong>Perusahaan:</strong> {currentShipment?.perusahaan}
            </div>
            
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : statusHistory.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status Lama</TableHead>
                      <TableHead>Status Baru</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                        <TableCell>{renderStatusBadge(item.previous_status as ShipmentStatus)}</TableCell>
                        <TableCell>{renderStatusBadge(item.new_status as ShipmentStatus)}</TableCell>
                        <TableCell>{item.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tidak ada riwayat status untuk pengiriman ini
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Tutup
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
