
import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { updateShipment, getShipmentStatusHistory } from "@/lib/shipmentService";
import { Shipment, ShipmentStatus, StatusHistoryItem } from "@/lib/types";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";

interface ShipmentTableProps {
  shipments: Shipment[];
  onShipmentUpdated: () => void;
}

const ShipmentTable: React.FC<ShipmentTableProps> = ({ shipments, onShipmentUpdated }) => {
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false);
  const [isEditTrackingUrlDialogOpen, setIsEditTrackingUrlDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [rowStatus, setRowStatus] = useState<ShipmentStatus | undefined>(undefined);
  const [rowNotes, setRowNotes] = useState<string>("");
  const [rowTrackingUrl, setRowTrackingUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
	const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "noSuratJalan",
      header: "No. Surat Jalan",
    },
    {
      accessorKey: "perusahaan",
      header: "Perusahaan",
    },
    {
      accessorKey: "tujuan",
      header: "Tujuan",
    },
    {
      accessorKey: "supir",
      header: "Supir",
    },
		{
			accessorKey: "tanggalKirim",
			header: "Tanggal Kirim",
			cell: ({ row }) => {
				const date = new Date(row.getValue("tanggalKirim"));
				return format(date, 'dd/MM/yyyy');
			},
		},
    {
      accessorKey: "tanggalTiba",
      header: "Tanggal Tiba",
			cell: ({ row }) => {
				const tanggalTiba = row.original.tanggalTiba;
				if (!tanggalTiba) return '-';
				const date = new Date(tanggalTiba);
				return format(date, 'dd/MM/yyyy');
			},
    },
    {
      accessorKey: "qty",
      header: "Kuantitas",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        let badgeColor = "secondary";
        if (status === "terkirim") {
          badgeColor = "green";
        } else if (status === "tertunda") {
          badgeColor = "yellow";
        } else if (status === "gagal") {
          badgeColor = "red";
        }
        return (
          <Badge className={`bg-${badgeColor}-500 text-white`}>{status}</Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const shipment = row.original;

        const handleEditStatus = () => {
          setCurrentShipment(shipment);
          setRowStatus(shipment.status);
          setIsEditStatusDialogOpen(true);
        };

        const handleEditTrackingUrl = () => {
          setCurrentShipment(shipment);
          setRowTrackingUrl(shipment.trackingUrl || null);
          setIsEditTrackingUrlDialogOpen(true);
        };

				const handleShowHistory = async () => {
					setCurrentShipment(shipment);
					try {
						const history = await getShipmentStatusHistory(shipment.id);
						setStatusHistory(history);
						setIsHistoryDialogOpen(true);
					} catch (error) {
						console.error("Error fetching status history:", error);
						toast({
							title: "Gagal memuat riwayat status",
							description: "Terjadi kesalahan saat memuat riwayat status pengiriman ini.",
							variant: "destructive",
						});
					}
				};

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleEditStatus}>
                <Edit className="mr-2 h-4 w-4" /> Edit Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditTrackingUrl}>
                <Edit className="mr-2 h-4 w-4" /> Edit URL Dilacak
              </DropdownMenuItem>
							<DropdownMenuItem onClick={handleShowHistory}>
								Lihat Riwayat Status
							</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Unduh</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: shipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleStatusSave = async () => {
    setIsProcessing(true);
    try {
      if (!currentShipment) {
        throw new Error("No shipment selected");
      }
      
      const updatedShipment = await updateShipment(currentShipment.id, {
        status: rowStatus,
      });
      
      setIsEditStatusDialogOpen(false);
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
      
      toast({
        title: "Status diperbarui",
        description: "Status pengiriman telah berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Error updating shipment status:", error);
      toast({
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status pengiriman.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTrackingUrl = async () => {
    setIsProcessing(true);
    try {
      // Make sure we have a current shipment
      if (!currentShipment) {
        throw new Error("No shipment selected");
      }
      
      // Format URL if needed (add https:// if missing)
      let formattedUrl = rowTrackingUrl ? rowTrackingUrl.trim() : null;
      if (formattedUrl && !formattedUrl.startsWith('http') && formattedUrl.trim() !== '') {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      console.log("Updating tracking URL for shipment:", currentShipment.id, "URL:", formattedUrl);
      
      // Update shipment with tracking URL
      const updatedShipment = await updateShipment(currentShipment.id, {
        trackingUrl: formattedUrl
      });
      
      console.log("Shipment updated successfully:", updatedShipment);
      
      // Close dialog and refresh data
      setIsEditTrackingUrlDialogOpen(false);
      if (onShipmentUpdated) {
        onShipmentUpdated();
      }
      
      toast({
        title: "URL dilacak diperbarui",
        description: formattedUrl ? "URL dilacak telah disimpan" : "URL dilacak telah dihapus",
      });
    } catch (error) {
      console.error("Error updating tracking URL:", error);
      toast({
        title: "Gagal memperbarui URL dilacak",
        description: "Terjadi kesalahan saat menyimpan URL dilacak",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Status Dialog */}
      <Dialog open={isEditStatusDialogOpen} onOpenChange={setIsEditStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Status Pengiriman</DialogTitle>
            <DialogDescription>
              Ubah status pengiriman dan berikan catatan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <select
                id="status"
                value={rowStatus}
                onChange={(e) =>
                  setRowStatus(e.target.value as ShipmentStatus)
                }
                className="col-span-3 rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="terkirim">Terkirim</option>
                <option value="tertunda">Tertunda</option>
                <option value="gagal">Gagal</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right mt-2">
                Catatan
              </Label>
              <Textarea
                id="notes"
                value={rowNotes}
                onChange={(e) => setRowNotes(e.target.value)}
                className="col-span-3 rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditStatusDialogOpen(false)}
              className="mr-2"
            >
              Batal
            </Button>
            <Button type="button" onClick={handleStatusSave} disabled={isProcessing}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tracking URL Dialog */}
      <Dialog open={isEditTrackingUrlDialogOpen} onOpenChange={setIsEditTrackingUrlDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit URL Dilacak</DialogTitle>
            <DialogDescription>
              Masukkan atau ubah URL untuk melacak pengiriman.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackingUrl" className="text-right">
                URL Dilacak
              </Label>
              <Input
                id="trackingUrl"
                value={rowTrackingUrl || ""}
                onChange={(e) => setRowTrackingUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditTrackingUrlDialogOpen(false)}
              className="mr-2"
            >
              Batal
            </Button>
            <Button type="button" onClick={handleSaveTrackingUrl} disabled={isProcessing}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

			{/* Status History Dialog */}
			<Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Riwayat Status Pengiriman</DialogTitle>
						<DialogDescription>
							Riwayat perubahan status untuk pengiriman ini.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{statusHistory.length > 0 ? (
							statusHistory.map((item) => (
								<div key={item.id} className="border rounded-md p-4">
									<p className="text-sm text-muted-foreground">
										Tanggal: {new Date(item.created_at).toLocaleDateString()}
									</p>
									<p>
										Status Sebelumnya: {item.previous_status}
									</p>
									<p>
										Status Baru: {item.new_status}
									</p>
									{item.notes && (
										<p>
											Catatan: {item.notes}
										</p>
									)}
								</div>
							))
						) : (
							<p>Tidak ada riwayat status untuk pengiriman ini.</p>
						)}
					</div>
					<div className="flex justify-end">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setIsHistoryDialogOpen(false)}
						>
							Tutup
						</Button>
					</div>
				</DialogContent>
			</Dialog>
    </div>
  );
};

export default ShipmentTable;
