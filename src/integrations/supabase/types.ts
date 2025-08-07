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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allocation_rules: {
        Row: {
          anio: string
          company_id: string
          concepto_codigo: string
          created_at: string
          driver: string
          id: string
          updated_at: string
        }
        Insert: {
          anio: string
          company_id: string
          concepto_codigo: string
          created_at?: string
          driver?: string
          id?: string
          updated_at?: string
        }
        Update: {
          anio?: string
          company_id?: string
          concepto_codigo?: string
          created_at?: string
          driver?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_rules_concepto_codigo_fkey"
            columns: ["concepto_codigo"]
            isOneToOne: false
            referencedRelation: "catalog_pyg_concepts"
            referencedColumns: ["concepto_codigo"]
          },
        ]
      }
      allocation_weights: {
        Row: {
          allocation_rule_id: string
          created_at: string
          id: string
          mes: number
          peso: number
        }
        Insert: {
          allocation_rule_id: string
          created_at?: string
          id?: string
          mes: number
          peso: number
        }
        Update: {
          allocation_rule_id?: string
          created_at?: string
          id?: string
          mes?: number
          peso?: number
        }
        Relationships: [
          {
            foreignKeyName: "allocation_weights_allocation_rule_id_fkey"
            columns: ["allocation_rule_id"]
            isOneToOne: false
            referencedRelation: "allocation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          actor_user_id: string
          creado_en: string
          entidad: string
          entidad_id: string | null
          id: string
        }
        Insert: {
          accion: string
          actor_user_id: string
          creado_en?: string
          entidad: string
          entidad_id?: string | null
          id?: string
        }
        Update: {
          accion?: string
          actor_user_id?: string
          creado_en?: string
          entidad?: string
          entidad_id?: string | null
          id?: string
        }
        Relationships: []
      }
      catalog_pyg_concepts: {
        Row: {
          concepto_codigo: string
          concepto_nombre: string
          grupo: string | null
          obligatorio: boolean
        }
        Insert: {
          concepto_codigo: string
          concepto_nombre: string
          grupo?: string | null
          obligatorio?: boolean
        }
        Update: {
          concepto_codigo?: string
          concepto_nombre?: string
          grupo?: string | null
          obligatorio?: boolean
        }
        Relationships: []
      }
      companies: {
        Row: {
          accounting_plan: string | null
          cif_nif: string | null
          coverage: string | null
          creado_en: string | null
          created_at: string
          currency: string | null
          estado: string | null
          id: string
          last_load: string | null
          name: string
          sector: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          accounting_plan?: string | null
          cif_nif?: string | null
          coverage?: string | null
          creado_en?: string | null
          created_at?: string
          currency?: string | null
          estado?: string | null
          id?: string
          last_load?: string | null
          name: string
          sector?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          accounting_plan?: string | null
          cif_nif?: string | null
          coverage?: string | null
          creado_en?: string | null
          created_at?: string
          currency?: string | null
          estado?: string | null
          id?: string
          last_load?: string | null
          name?: string
          sector?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_pages: {
        Row: {
          company_id: string
          created_at: string
          enabled_pages: string[] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled_pages?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled_pages?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile: {
        Row: {
          company_id: string
          created_at: string
          descripcion: string | null
          empleados: number | null
          industria: string | null
          sector: string | null
          sede_principal: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          descripcion?: string | null
          empleados?: number | null
          industria?: string | null
          sector?: string | null
          sede_principal?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          descripcion?: string | null
          empleados?: number | null
          industria?: string | null
          sector?: string | null
          sede_principal?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profile_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_balance: {
        Row: {
          company_id: string
          concepto: string
          created_at: string
          id: string
          period_id: string
          valor: number | null
        }
        Insert: {
          company_id: string
          concepto: string
          created_at?: string
          id?: string
          period_id: string
          valor?: number | null
        }
        Update: {
          company_id?: string
          concepto?: string
          created_at?: string
          id?: string
          period_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_balance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_balance_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_cashflow: {
        Row: {
          company_id: string
          concepto: string
          created_at: string
          id: string
          period_id: string
          valor: number | null
        }
        Insert: {
          company_id: string
          concepto: string
          created_at?: string
          id?: string
          period_id: string
          valor?: number | null
        }
        Update: {
          company_id?: string
          concepto?: string
          created_at?: string
          id?: string
          period_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_cashflow_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_cashflow_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_income: {
        Row: {
          company_id: string
          concepto: string
          created_at: string
          id: string
          is_allocated: boolean
          period_id: string
          valor: number | null
        }
        Insert: {
          company_id: string
          concepto: string
          created_at?: string
          id?: string
          is_allocated?: boolean
          period_id: string
          valor?: number | null
        }
        Update: {
          company_id?: string
          concepto?: string
          created_at?: string
          id?: string
          is_allocated?: boolean
          period_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_income_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_income_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      import_files: {
        Row: {
          created_at: string
          hash: string | null
          id: string
          job_id: string
          storage_path: string
          subido_por: string | null
        }
        Insert: {
          created_at?: string
          hash?: string | null
          id?: string
          job_id: string
          storage_path: string
          subido_por?: string | null
        }
        Update: {
          created_at?: string
          hash?: string | null
          id?: string
          job_id?: string
          storage_path?: string
          subido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          company_id: string
          creado_en: string
          error_rows: number | null
          estado: string
          id: string
          ok_rows: number | null
          tipo: string
          total_rows: number | null
        }
        Insert: {
          company_id: string
          creado_en?: string
          error_rows?: number | null
          estado?: string
          id?: string
          ok_rows?: number | null
          tipo: string
          total_rows?: number | null
        }
        Update: {
          company_id?: string
          creado_en?: string
          error_rows?: number | null
          estado?: string
          id?: string
          ok_rows?: number | null
          tipo?: string
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          company_id: string
          created_at: string
          id: string
          periodo: string
          tipo: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          periodo: string
          tipo: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          periodo?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          nombre: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nombre?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nombre?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pyg_annual: {
        Row: {
          anio: string
          company_id: string
          concepto_codigo: string
          creado_en: string
          id: string
          valor_total: number | null
        }
        Insert: {
          anio: string
          company_id: string
          concepto_codigo: string
          creado_en?: string
          id?: string
          valor_total?: number | null
        }
        Update: {
          anio?: string
          company_id?: string
          concepto_codigo?: string
          creado_en?: string
          id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_annual_concepto_codigo_fkey"
            columns: ["concepto_codigo"]
            isOneToOne: false
            referencedRelation: "catalog_pyg_concepts"
            referencedColumns: ["concepto_codigo"]
          },
        ]
      }
      ratios_calc: {
        Row: {
          company_id: string
          created_at: string
          id: string
          period_id: string
          ratio: string
          valor: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          period_id: string
          ratio: string
          valor?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          period_id?: string
          ratio?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratios_calc_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratios_calc_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_pyg: {
        Args: { _company_id: string; _anio: string; _mode?: string }
        Returns: {
          concepto_codigo: string
          total_anual: number
          suma_mensual: number
          diferencia: number
          status: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
