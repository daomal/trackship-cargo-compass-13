import { Database } from './types';

// Extend the Database type to include custom fields
export interface ExtendedDatabase extends Database {
  public: {
    Tables: {
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
      };
      status_history: {
        Row: {
          id: string;
          shipment_id: string;
          previous_status: string;
          new_status: string;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          previous_status: string;
          new_status: string;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          previous_status?: string;
          new_status?: string;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      get_company_summaries: {
        Args: Record<PropertyKey, never>;
        Returns: {
          company: string;
          total: number;
          delivered: number;
          pending: number;
          failed: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
