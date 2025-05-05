
export type ShipmentStatus = "terkirim" | "gagal" | "tertunda";

export interface Shipment {
  id: string;
  noSuratJalan: string;
  perusahaan: string;
  tujuan: string;
  supir: string;
  tanggalKirim: string;
  tanggalTiba: string | null;
  status: ShipmentStatus;
  kendala: string | null;
  qty: number;
}

export interface Driver {
  id: string;
  name: string;
}

export interface FilterOptions {
  dateRange: [Date | null, Date | null];
  status: ShipmentStatus | "all";
  driver: string | "all";
}

export interface ConstraintItem {
  name: string;
  count: number;
}
