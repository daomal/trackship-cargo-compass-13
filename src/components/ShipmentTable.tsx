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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/sonner";
import { MoreHorizontal, Calendar, Edit, Trash2, FileText, Clock, Link, MapPin, Map } from "lucide-react";
import { format } from "date-fns";
import { Shipment, ShipmentStatus, Driver } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { updateShipment, deleteShipment, getShipmentStatusHistory, subscribeToShipments, getDrivers } from "@/lib/shipmentService";

interface ShipmentTableProps {
  shipments: Shipment[];
  onShipmentUpdated?: () => void;
}

const ITEMS_PER_PAGE = 15;
const DEFAULT_TRACKING_URL = "https://www.google.com/maps";

const KENDALA_OPTIONS = [
  "COA Lama",
  "Invoice Lama", 
  "DN Tambahan / Dadakan"
];

const ShipmentTable: React.FC<ShipmentTableProps> = ({ shipments, onShipmentUpdated }) => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isEditDriverDialogOpen, setIsEditDriverDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isEditTrackingUrlDialogOpen, setIsEditTrackingUrlDialogOpen] = useState(false);
  const [isEditKendalaDialogOpen, setIsEditKendalaDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kendala, setKendala] = useState("");
  const [kendalaType, setKendalaType] = useState<string>("custom");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("tertunda");
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localShipments, setLocalShipments] = useState<Shipment[]>(shipments);
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toTimeString().substring(0, 5)
  );
  const [driverEditId, setDriverEditId] = useState<string | null>(null);
  const [editableDriverId, setEditableDriverId] = useState<string>("");
  const [qtyEditId, setQtyEditId] = useState<string | null>(null);
  const [editableQty, setEditableQty] = useState<number>(0);
  const [trackingUrl, setTrackingUrl] = useState<string>(DEFAULT_TRACKING_URL);
  const [rowTrackingUrl, setRowTrackingUrl] = useState<string>("");
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    setLocalShipments(shipments);
  }, [shipments]);

  useEffect(() => {
    const unsubscribe = subscribeToShipments((updatedShipments) => {
      setLocalShipments(updatedShipments);
    });

    const savedTrackingUrl = localStorage.getItem("trackingUrl");
    if (savedTrackingUrl) {
      setTrackingUrl(savedTrackingUrl);
    }

    fetchDrivers();

    return () => unsubscribe();
  }, []);

  const fetchDrivers = async () => {
    try {
      const driversData = await getDrivers();
      setDrivers(driversData);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const totalPages = Math.ceil(localShipments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, localShipments.length);
  const paginatedShipments = localShipments.slice(startIndex, endIndex);
  const totalQuantity = localShipments.reduce((total, shipment) => total + shipment.qty, 0);

  const renderStatusBadge = (status: ShipmentStatus) => {
    const statusClasses = {
      terkirim: "bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm",
      tertunda: "bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm",
      gagal: "bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm",
    };

    const statusText = {
      terkirim: "Terkirim",
      tertunda: "Tertunda",
      gagal: "Gagal",
    };

    return <span className={statusClasses[status]}>{statusText[status]}</span>;
  };

  const handleOpenEditKendalaDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setKendala(shipment.kendala || "");
    // Check if current kendala matches one of the predefined options
    if (KENDALA_OPTIONS.includes(shipment.kendala || "")) {
      setKendalaType(shipment.kendala || "");
    } else {
      setKendalaType("custom");
    }
    setIsEditKendalaDialogOpen(true);
  };

  const handleUpdateKendala = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      const finalKendala = kendalaType === "custom" ? kendala : kendalaType;
      
      await updateShipment(currentShipment.id, {
        kendala: finalKendala || null
      });
      
      toast("Berhasil", {
        description: "Kendala berhasil diperbarui",
      });
      setIsEditKendalaDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        setLocalShipments(prev => 
          prev.map(s => s.id === currentShipment.id ? {...s, kendala: finalKendala} : s)
        );
      }
    } catch (error) {
      console.error("Error updating kendala:", error);
      toast("Error", {
        description: "Gagal memperbarui kendala",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      toast("Berhasil", {
        description: "Qty berhasil diperbarui",
      });
      setQtyEditId(null);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        setLocalShipments(prev => 
          prev.map(s => s.id === qtyEditId ? {...s, qty: editableQty} : s)
        );
      }
    } catch (error) {
      console.error("Error updating qty:", error);
      toast("Error", {
        description: "Gagal memperbarui qty",
      });
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQtySave();
    } else if (e.key === 'Escape') {
      setQtyEditId(null);
    }
  };

  const handleOpenTrackingDialog = () => {
    setIsTrackingDialogOpen(true);
  };

  const handleSaveTrackingUrl = () => {
    localStorage.setItem("trackingUrl", trackingUrl);
    toast("Berhasil", {
      description: "URL tracking berhasil disimpan",
    });
    setIsTrackingDialogOpen(false);
  };

  const handleOpenEditTrackingUrlDialog = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setRowTrackingUrl(shipment.trackingUrl || trackingUrl);
    setIsEditTrackingUrlDialogOpen(true);
  };

  const handleSaveRowTrackingUrl = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      await updateShipment(currentShipment.id, {
        trackingUrl: rowTrackingUrl
      });
      
      toast("Berhasil", {
        description: "URL tracking berhasil disimpan",
      });
      
      setIsEditTrackingUrlDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      } else {
        setLocalShipments(prev => 
          prev.map(s => s.id === currentShipment.id ? {...s, trackingUrl: rowTrackingUrl} : s)
        );
      }
    } catch (error) {
      console.error("Error updating tracking URL:", error);
      toast("Error", {
        description: "Gagal memperbarui URL tracking",
      });
    } finally {
      setIsLoading(false);
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
    setSelectedDriverId(shipment.driverId || "");
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
      toast("Error", {
        description: "Gagal memuat riwayat status",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateDriver = async () => {
    if (!currentShipment || !selectedDriverId.trim()) {
      toast("Error", {
        description: "Supir harus dipilih",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateShipment(currentShipment.id, {
        driverId: selectedDriverId
      });
      
      toast("Berhasil", {
        description: "Supir berhasil diperbarui",
      });
      setIsEditDriverDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      toast("Error", {
        description: "Gagal memperbarui supir",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      if (newStatus === "gagal" && !kendala) {
        toast("Error", {
          description: "Kendala harus diisi jika status gagal",
        });
        return;
      }
      
      const updateData: Partial<Shipment> = {
        status: newStatus,
      };
      
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
      
      toast("Berhasil", {
        description: `Status pengiriman berhasil diubah ke ${newStatus}`,
      });
      setIsStatusDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast("Error", {
        description: "Gagal mengubah status pengiriman",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShipment = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      await updateShipment(currentShipment.id, {
        kendala: kendala || null
      });
      
      toast("Berhasil", {
        description: "Data pengiriman berhasil diperbarui",
      });
      setIsEditDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast("Error", {
        description: "Gagal memperbarui data pengiriman",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!currentShipment) return;
    
    setIsLoading(true);
    
    try {
      await deleteShipment(currentShipment.id);
      
      toast("Berhasil", {
        description: "Data pengiriman berhasil dihapus",
      });
      setIsDeleteDialogOpen(false);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error deleting shipment:", error);
      toast("Error", {
        description: "Gagal menghapus data pengiriman",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDriverEdit = (shipment: Shipment, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDriverEditId(shipment.id);
    setEditableDriverId(shipment.driverId || "");
  };

  const handleDriverIdChange = (value: string) => {
    setEditableDriverId(value);
  };

  const handleDriverIdSave = async () => {
    if (!driverEditId || !editableDriverId.trim()) {
      return;
    }
    
    try {
      await updateShipment(driverEditId, {
        driverId: editableDriverId
      });
      
      toast("Berhasil", {
        description: "Supir berhasil diperbarui",
      });
      setDriverEditId(null);
      
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      toast("Error", {
        description: "Gagal memperbarui supir",
      });
    }
  };

  // Modified function to handle tracking URL correctly
  const navigateToTracking = (shipment: Shipment) => {
    const shipmentTrackingUrl = shipment.trackingUrl || trackingUrl;
    
    // Don't append any parameters to the URL, just open it as is
    console.log("Navigating to tracking URL:", shipmentTrackingUrl);
    window.open(shipmentTrackingUrl, '_blank');
  };

  return (
    <>
      <Card className="glass-table">
        <CardHeader className="bg-gradient-to-r from-soft-blue-bg/30 to-soft-blue-bg/20 border-b border-white/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-foreground">Daftar Pengiriman</CardTitle>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenTrackingDialog}
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <Map className="h-4 w-4" />
                Konfigurasi URL Tracking Default
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableHead className="w-[180px] font-semibold text-gray-700">Track Lokasi</TableHead>
                  <TableHead className="w-[140px] font-semibold text-gray-700">No. Surat Jalan</TableHead>
                  <TableHead className="w-[150px] font-semibold text-gray-700">Perusahaan</TableHead>
                  <TableHead className="w-[160px] font-semibold text-gray-700">Kendala</TableHead>
                  <TableHead className="w-[140px] font-semibold text-gray-700">Supir</TableHead>
                  <TableHead className="w-[110px] font-semibold text-gray-700">Tanggal Kirim</TableHead>
                  <TableHead className="w-[140px] font-semibold text-gray-700">Tanggal & Waktu Tiba</TableHead>
                  <TableHead className="w-[100px] font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="w-[80px] text-right font-semibold text-gray-700">Qty</TableHead>
                  {isAdmin && <TableHead className="w-[60px] font-semibold text-gray-700">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center h-32 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-300" />
                        <span>Tidak ada data pengiriman</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedShipments.map((shipment, index) => (
                    <TableRow key={shipment.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-sm"
                            onClick={() => navigateToTracking(shipment)}
                          >
                            <MapPin className="h-4 w-4" />
                            Lacak
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditTrackingUrlDialog(shipment)}
                              title="Edit URL Tracking"
                              className="p-2 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 truncate" title={shipment.noSuratJalan}>
                          {shipment.noSuratJalan}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-700 truncate" title={shipment.perusahaan}>
                          {shipment.perusahaan}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline justify-start font-normal max-w-full"
                            onClick={() => handleOpenEditKendalaDialog(shipment)}
                          >
                            <span className="truncate block max-w-[140px]" title={shipment.kendala || "Belum ada kendala"}>
                              {shipment.kendala || "Belum ada kendala"}
                            </span>
                          </Button>
                        ) : (
                          <div className="text-gray-600 truncate" title={shipment.kendala || "-"}> 
                            {shipment.kendala || "-"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          driverEditId === shipment.id ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                value={editableDriverId}
                                onValueChange={handleDriverIdChange}
                              >
                                <SelectTrigger className="py-1 h-8 text-xs">
                                  <SelectValue placeholder="Pilih Supir" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border shadow-lg">
                                  {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={driver.id}>
                                      {driver.name} - {driver.licensePlate}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                size="sm"
                                onClick={handleDriverIdSave}
                                className="h-8 px-2 text-xs"
                              >
                                Simpan
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline justify-start font-normal"
                              onClick={(e) => handleStartDriverEdit(shipment, e)}
                            >
                              <span className="truncate block max-w-[120px]" title={shipment.drivers?.name || "Belum dipilih"}>
                                {shipment.drivers?.name || "Belum dipilih"}
                              </span>
                            </Button>
                          )
                        ) : (
                          <div className="text-gray-600 truncate" title={shipment.drivers?.name || "Belum dipilih"}>
                            {shipment.drivers?.name || "Belum dipilih"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {shipment.tanggalKirim}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {shipment.tanggalTiba 
                            ? (shipment.waktuTiba 
                              ? `${shipment.tanggalTiba} ${shipment.waktuTiba}` 
                              : shipment.tanggalTiba) 
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(shipment.status)}
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
                                className="py-1 h-8 w-16 text-right text-sm"
                              />
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              onClick={(e) => handleStartQtyEdit(shipment, e)}
                            >
                              {shipment.qty}
                            </Button>
                          )
                        ) : (
                          <div className="font-medium text-gray-700">{shipment.qty}</div>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
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
                              <DropdownMenuItem onClick={() => handleOpenEditKendalaDialog(shipment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Kendala
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleStartDriverEdit(shipment, e);}}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Supir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleStartQtyEdit(shipment, e);}}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Qty
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditTrackingUrlDialog(shipment)}>
                                <Link className="mr-2 h-4 w-4" />
                                Edit URL Tracking
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
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableCell colSpan={isAdmin ? 8 : 8} className="text-right font-semibold text-gray-700">
                    Total Qty:
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900 text-lg">{totalQuantity}</TableCell>
                  {isAdmin && <TableCell></TableCell>}
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else {
                      const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      pageNumber = start + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="hover:bg-gray-100"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Kendala Dialog */}
      <Dialog open={isEditKendalaDialogOpen} onOpenChange={setIsEditKendalaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kendala</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Pilih Jenis Kendala</Label>
              <RadioGroup value={kendalaType} onValueChange={setKendalaType}>
                {KENDALA_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Lainnya (tulis sendiri)</Label>
                </div>
              </RadioGroup>
            </div>
            
            {kendalaType === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="kendala-custom">Kendala Khusus</Label>
                <Textarea
                  id="kendala-custom"
                  value={kendala}
                  onChange={(e) => setKendala(e.target.value)}
                  placeholder="Tulis kendala..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditKendalaDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateKendala} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfigurasi URL Tracking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking-url">URL Tracking</Label>
              <Input
                id="tracking-url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="Masukkan URL tracking"
              />
              <p className="text-sm text-muted-foreground">
                URL ini akan digunakan untuk tombol tracking pada semua data pengiriman.
                Pastikan URL valid dan dapat diakses.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveTrackingUrl} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={isEditDriverDialogOpen} onOpenChange={setIsEditDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supir</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="driver-select">Pilih Supir</Label>
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Supir" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <Dialog open={isEditTrackingUrlDialogOpen} onOpenChange={setIsEditTrackingUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit URL Tracking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="row-tracking-url">URL Tracking untuk {currentShipment?.noSuratJalan}</Label>
              <Input
                id="row-tracking-url"
                value={rowTrackingUrl}
                onChange={(e) => setRowTrackingUrl(e.target.value)}
                placeholder="Masukkan URL tracking khusus untuk pengiriman ini"
              />
              <p className="text-sm text-muted-foreground">
                URL ini akan digunakan untuk melacak pengiriman ini. 
                Kosongkan untuk menggunakan URL tracking default.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTrackingUrlDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveRowTrackingUrl} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentTable;
