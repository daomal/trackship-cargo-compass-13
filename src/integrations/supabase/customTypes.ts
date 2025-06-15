
import { Database as GeneratedDatabase } from './types';

// Extend the Database with our custom types
export interface ExtendedDatabase extends GeneratedDatabase {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string
          name: string
          license_plate: string
        }
        Insert: {
          id?: string
          name: string
          license_plate: string
        }
        Update: {
          id?: string
          name?: string
          license_plate?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          role: "admin" | "user"
          driver_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          role?: "admin" | "user"
          driver_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          role?: "admin" | "user"
          driver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          }
        ]
      }
      shipments: {
        Row: {
          created_at: string | null
          id: string
          kendala: string | null
          no_surat_jalan: string
          perusahaan: string
          qty: number
          status: string
          driver_id: string | null
          tanggal_kirim: string
          tanggal_tiba: string | null
          tujuan: string
          updated_at: string | null
          updated_by: string | null
          waktu_tiba: string | null
          tracking_url: string | null
          current_lat: number | null
          current_lng: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kendala?: string | null
          no_surat_jalan: string
          perusahaan: string
          qty?: number
          status: string
          driver_id?: string | null
          tanggal_kirim: string
          tanggal_tiba?: string | null
          tujuan: string
          updated_at?: string | null
          updated_by?: string | null
          waktu_tiba?: string | null
          tracking_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kendala?: string | null
          no_surat_jalan?: string
          perusahaan?: string
          qty?: number
          status?: string
          driver_id?: string | null
          tanggal_kirim?: string
          tanggal_tiba?: string | null
          tujuan?: string
          updated_at?: string | null
          updated_by?: string | null
          waktu_tiba?: string | null
          tracking_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          }
        ]
      }
      kendala_reports: {
        Row: {
          id: string
          created_at: string
          shipment_id: string
          user_id: string | null
          author_name: string
          message: string
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          shipment_id: string
          user_id?: string | null
          author_name: string
          message: string
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          shipment_id?: string
          user_id?: string | null
          author_name?: string
          message?: string
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kendala_reports_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          }
        ]
      }
      status_history: {
        Row: {
          id: string
          shipment_id: string
          previous_status: string
          new_status: string
          notes: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          shipment_id: string
          previous_status: string
          new_status: string
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          shipment_id?: string
          previous_status?: string
          new_status?: string
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          content: string
          author_name: string
          user_id: string | null
          created_at: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          content: string
          author_name?: string
          user_id?: string | null
          created_at?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          content?: string
          author_name?: string
          user_id?: string | null
          created_at?: string | null
          image_url?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          mapbox_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          mapbox_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          mapbox_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_summaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          company: string
          total: number
          delivered: number
          pending: number
          failed: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
