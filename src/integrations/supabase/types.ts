export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string
          license_plate: string
          name: string
        }
        Insert: {
          id?: string
          license_plate: string
          name: string
        }
        Update: {
          id?: string
          license_plate?: string
          name?: string
        }
        Relationships: []
      }
      kendala_reports: {
        Row: {
          author_name: string
          created_at: string
          id: string
          message: string
          photo_url: string | null
          shipment_id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          message: string
          photo_url?: string | null
          shipment_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          photo_url?: string | null
          shipment_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kendala_reports_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
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
      shipments: {
        Row: {
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          driver_id: string | null
          id: string
          kendala: string | null
          no_surat_jalan: string
          perusahaan: string
          qty: number
          status: string
          tanggal_kirim: string
          tanggal_tiba: string | null
          tracking_url: string | null
          tujuan: string
          updated_at: string | null
          updated_by: string | null
          waktu_tiba: string | null
        }
        Insert: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          driver_id?: string | null
          id?: string
          kendala?: string | null
          no_surat_jalan: string
          perusahaan: string
          qty?: number
          status: string
          tanggal_kirim: string
          tanggal_tiba?: string | null
          tracking_url?: string | null
          tujuan: string
          updated_at?: string | null
          updated_by?: string | null
          waktu_tiba?: string | null
        }
        Update: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          driver_id?: string | null
          id?: string
          kendala?: string | null
          no_surat_jalan?: string
          perusahaan?: string
          qty?: number
          status?: string
          tanggal_kirim?: string
          tanggal_tiba?: string | null
          tracking_url?: string | null
          tujuan?: string
          updated_at?: string | null
          updated_by?: string | null
          waktu_tiba?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          new_status: string
          notes: string | null
          previous_status: string
          shipment_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          previous_status: string
          shipment_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user"],
    },
  },
} as const
