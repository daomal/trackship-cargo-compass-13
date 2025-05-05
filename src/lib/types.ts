
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

export interface SupabaseShipment {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
  supir: string;
  tanggal_kirim: string;
  tanggal_tiba: string | null;
  status: ShipmentStatus;
  kendala: string | null;
  qty: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  name: string | null;
  created_at: string;
}

export interface StatusHistoryItem {
  id: string;
  shipment_id: string;
  previous_status: ShipmentStatus;
  new_status: ShipmentStatus;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}
