
import { Database } from './types';

// Extend the Database type to include custom fields
export interface ExtendedDatabase extends Database {
  public: {
    Tables: {
      notes: Database['public']['Tables']['notes'];
      profiles: Database['public']['Tables']['profiles'];
      shipments: {
        Row: {
          created_at: string;
          id: string;
          kendala: string;
          no_surat_jalan: string;
          perusahaan: string;
          qty: number;
          status: string;
          supir: string;
          tanggal_kirim: string;
          tanggal_tiba: string;
          tujuan: string;
          updated_at: string;
          updated_by: string;
          waktu_tiba: string;
          tracking_url: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kendala?: string | null;
          no_surat_jalan: string;
          perusahaan: string;
          qty: number;
          status: string;
          supir: string;
          tanggal_kirim: string;
          tanggal_tiba?: string | null;
          tujuan: string;
          updated_at?: string;
          updated_by?: string | null;
          waktu_tiba?: string | null;
          tracking_url?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          kendala?: string | null;
          no_surat_jalan?: string;
          perusahaan?: string;
          qty?: number;
          status?: string;
          supir?: string;
          tanggal_kirim?: string;
          tanggal_tiba?: string | null;
          tujuan?: string;
          updated_at?: string;
          updated_by?: string | null;
          waktu_tiba?: string | null;
          tracking_url?: string | null;
        };
        Relationships: [];
      };
      status_history: Database['public']['Tables']['status_history'];
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
}
