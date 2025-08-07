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
      cashflows_financiacion: {
        Row: {
          anio: string
          company_id: string
          creado_en: string
          flujo_financiacion: number
          id: string
          periodo: string
        }
        Insert: {
          anio: string
          company_id: string
          creado_en?: string
          flujo_financiacion: number
          id?: string
          periodo: string
        }
        Update: {
          anio?: string
          company_id?: string
          creado_en?: string
          flujo_financiacion?: number
          id?: string
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_financiacion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflows_financiacion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cashflows_financiacion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cashflows_inversion: {
        Row: {
          anio: string
          company_id: string
          creado_en: string
          flujo_inversion: number
          id: string
          periodo: string
        }
        Insert: {
          anio: string
          company_id: string
          creado_en?: string
          flujo_inversion: number
          id?: string
          periodo: string
        }
        Update: {
          anio?: string
          company_id?: string
          creado_en?: string
          flujo_inversion?: number
          id?: string
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_inversion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflows_inversion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cashflows_inversion_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cashflows_operativo: {
        Row: {
          anio: string
          company_id: string
          creado_en: string
          flujo_operativo: number
          id: string
          periodo: string
        }
        Insert: {
          anio: string
          company_id: string
          creado_en?: string
          flujo_operativo: number
          id?: string
          periodo: string
        }
        Update: {
          anio?: string
          company_id?: string
          creado_en?: string
          flujo_operativo?: number
          id?: string
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_operativo_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflows_operativo_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cashflows_operativo_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      catalog_pyg_concepts: {
        Row: {
          concepto_codigo: string
          concepto_nombre: string
          grupo: string
          obligatorio: boolean
        }
        Insert: {
          concepto_codigo: string
          concepto_nombre: string
          grupo: string
          obligatorio?: boolean
        }
        Update: {
          concepto_codigo?: string
          concepto_nombre?: string
          grupo?: string
          obligatorio?: boolean
        }
        Relationships: []
      }
      companies: {
        Row: {
          accounting_plan: string | null
          cif_nif: string | null
          company_code: string | null
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
          company_code?: string | null
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
          company_code?: string | null
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
          {
            foreignKeyName: "company_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
          {
            foreignKeyName: "company_profile_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_profile_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          año_fundacion: number | null
          company_id: string
          created_at: string
          descripcion: string | null
          empleados: number | null
          estructura_accionarial: string | null
          industria: string | null
          ingresos_anuales: number | null
          organigrama: string | null
          sector: string | null
          sede: string | null
          sitio_web: string | null
          updated_at: string
        }
        Insert: {
          año_fundacion?: number | null
          company_id: string
          created_at?: string
          descripcion?: string | null
          empleados?: number | null
          estructura_accionarial?: string | null
          industria?: string | null
          ingresos_anuales?: number | null
          organigrama?: string | null
          sector?: string | null
          sede?: string | null
          sitio_web?: string | null
          updated_at?: string
        }
        Update: {
          año_fundacion?: number | null
          company_id?: string
          created_at?: string
          descripcion?: string | null
          empleados?: number | null
          estructura_accionarial?: string | null
          industria?: string | null
          ingresos_anuales?: number | null
          organigrama?: string | null
          sector?: string | null
          sede?: string | null
          sitio_web?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      debt_scenarios: {
        Row: {
          activo: boolean | null
          company_id: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          company_id: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          company_id?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debt_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      debt_service: {
        Row: {
          company_id: string
          creado_en: string | null
          flujo_operativo: number
          id: string
          intereses: number
          periodo: string
          principal: number
        }
        Insert: {
          company_id: string
          creado_en?: string | null
          flujo_operativo: number
          id?: string
          intereses: number
          periodo: string
          principal: number
        }
        Update: {
          company_id?: string
          creado_en?: string | null
          flujo_operativo?: number
          id?: string
          intereses?: number
          periodo?: string
          principal?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      debts: {
        Row: {
          capital: number
          company_id: string
          created_at: string | null
          cuota: number | null
          entidad: string
          escenario: string
          id: string
          plazo_meses: number | null
          proximo_venc: string | null
          tipo: string
          tir: number | null
        }
        Insert: {
          capital: number
          company_id: string
          created_at?: string | null
          cuota?: number | null
          entidad: string
          escenario?: string
          id?: string
          plazo_meses?: number | null
          proximo_venc?: string | null
          tipo: string
          tir?: number | null
        }
        Update: {
          capital?: number
          company_id?: string
          created_at?: string | null
          cuota?: number | null
          entidad?: string
          escenario?: string
          id?: string
          plazo_meses?: number | null
          proximo_venc?: string | null
          tipo?: string
          tir?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
            foreignKeyName: "fs_balance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fs_balance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
            foreignKeyName: "fs_cashflow_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fs_cashflow_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
            foreignKeyName: "fs_income_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fs_income_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
          actualizado_en: string
          company_id: string
          creado_en: string
          error_rows: number | null
          estado: string
          id: string
          ok_rows: number | null
          resumen: Json | null
          storage_path: string
          tipo: string
          total_rows: number | null
        }
        Insert: {
          actualizado_en?: string
          company_id: string
          creado_en?: string
          error_rows?: number | null
          estado?: string
          id?: string
          ok_rows?: number | null
          resumen?: Json | null
          storage_path: string
          tipo: string
          total_rows?: number | null
        }
        Update: {
          actualizado_en?: string
          company_id?: string
          creado_en?: string
          error_rows?: number | null
          estado?: string
          id?: string
          ok_rows?: number | null
          resumen?: Json | null
          storage_path?: string
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
          {
            foreignKeyName: "import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
      pyg_analytic: {
        Row: {
          centro_coste: string | null
          company_id: string
          concepto_codigo: string
          creado_en: string | null
          id: string
          periodo: string
          segmento: string | null
          valor: number
        }
        Insert: {
          centro_coste?: string | null
          company_id: string
          concepto_codigo: string
          creado_en?: string | null
          id?: string
          periodo: string
          segmento?: string | null
          valor: number
        }
        Update: {
          centro_coste?: string | null
          company_id?: string
          concepto_codigo?: string
          creado_en?: string | null
          id?: string
          periodo?: string
          segmento?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_concepto_codigo_fkey"
            columns: ["concepto_codigo"]
            isOneToOne: false
            referencedRelation: "catalog_pyg_concepts"
            referencedColumns: ["concepto_codigo"]
          },
        ]
      }
      pyg_annual: {
        Row: {
          anio: string
          company_id: string
          concepto_codigo: string
          creado_en: string
          id: string
          valor_total: number
        }
        Insert: {
          anio: string
          company_id: string
          concepto_codigo: string
          creado_en?: string
          id?: string
          valor_total: number
        }
        Update: {
          anio?: string
          company_id?: string
          concepto_codigo?: string
          creado_en?: string
          id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
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
            foreignKeyName: "ratios_calc_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ratios_calc_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
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
      ratios_financieros: {
        Row: {
          anio: string
          benchmark: number | null
          company_id: string
          created_at: string
          id: string
          periodo: string
          ratio_name: string
          ratio_value: number | null
          updated_at: string
        }
        Insert: {
          anio: string
          benchmark?: number | null
          company_id: string
          created_at?: string
          id?: string
          periodo: string
          ratio_name: string
          ratio_value?: number | null
          updated_at?: string
        }
        Update: {
          anio?: string
          benchmark?: number | null
          company_id?: string
          created_at?: string
          id?: string
          periodo?: string
          ratio_name?: string
          ratio_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      security_audit: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      wc_financial_balances: {
        Row: {
          activo_corriente: number | null
          activo_no_corriente: number | null
          company_id: string
          created_at: string
          id: string
          pasivo_corriente: number | null
          pasivo_no_corriente: number | null
          patrimonio_neto: number | null
          periodo: string
          updated_at: string
        }
        Insert: {
          activo_corriente?: number | null
          activo_no_corriente?: number | null
          company_id: string
          created_at?: string
          id?: string
          pasivo_corriente?: number | null
          pasivo_no_corriente?: number | null
          patrimonio_neto?: number | null
          periodo: string
          updated_at?: string
        }
        Update: {
          activo_corriente?: number | null
          activo_no_corriente?: number | null
          company_id?: string
          created_at?: string
          id?: string
          pasivo_corriente?: number | null
          pasivo_no_corriente?: number | null
          patrimonio_neto?: number | null
          periodo?: string
          updated_at?: string
        }
        Relationships: []
      }
      wc_operating_balances: {
        Row: {
          anticipos_clientes: number | null
          clientes: number | null
          company_id: string
          created_at: string
          id: string
          inventario: number | null
          otros_acreedores_op: number | null
          otros_deudores_op: number | null
          periodo: string
          proveedores: number | null
          trabajos_en_curso: number | null
          updated_at: string
        }
        Insert: {
          anticipos_clientes?: number | null
          clientes?: number | null
          company_id: string
          created_at?: string
          id?: string
          inventario?: number | null
          otros_acreedores_op?: number | null
          otros_deudores_op?: number | null
          periodo: string
          proveedores?: number | null
          trabajos_en_curso?: number | null
          updated_at?: string
        }
        Update: {
          anticipos_clientes?: number | null
          clientes?: number | null
          company_id?: string
          created_at?: string
          id?: string
          inventario?: number | null
          otros_acreedores_op?: number | null
          otros_deudores_op?: number | null
          periodo?: string
          proveedores?: number | null
          trabajos_en_curso?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      companies_vw: {
        Row: {
          company_id: string | null
          estado: string | null
          name: string | null
        }
        Insert: {
          company_id?: string | null
          estado?: string | null
          name?: string | null
        }
        Update: {
          company_id?: string | null
          estado?: string | null
          name?: string | null
        }
        Relationships: []
      }
      company_access: {
        Row: {
          company_id: string | null
        }
        Insert: {
          company_id?: string | null
        }
        Update: {
          company_id?: string | null
        }
        Relationships: []
      }
      profiles_vw: {
        Row: {
          email: string | null
          id: string | null
          rol_global: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          rol_global?: never
        }
        Update: {
          email?: string | null
          id?: string | null
          rol_global?: never
        }
        Relationships: []
      }
      user_company_vw: {
        Row: {
          company_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_debt_detail: {
        Row: {
          capital_pendiente: number | null
          company_id: string | null
          created_at: string | null
          cuota: number | null
          entidad: string | null
          escenario: string | null
          id: string | null
          plazo_restante: string | null
          proximo_vencimiento: string | null
          tipo: string | null
          tir: number | null
        }
        Insert: {
          capital_pendiente?: number | null
          company_id?: string | null
          created_at?: string | null
          cuota?: number | null
          entidad?: string | null
          escenario?: string | null
          id?: string | null
          plazo_restante?: never
          proximo_vencimiento?: string | null
          tipo?: string | null
          tir?: number | null
        }
        Update: {
          capital_pendiente?: number | null
          company_id?: string | null
          created_at?: string | null
          cuota?: number | null
          entidad?: string | null
          escenario?: string | null
          id?: string | null
          plazo_restante?: never
          proximo_vencimiento?: string | null
          tipo?: string | null
          tir?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_debt_service_detail: {
        Row: {
          company_id: string | null
          flujo_operativo: number | null
          intereses: number | null
          periodo: string | null
          principal: number | null
          servicio_total: number | null
        }
        Insert: {
          company_id?: string | null
          flujo_operativo?: number | null
          intereses?: number | null
          periodo?: string | null
          principal?: number | null
          servicio_total?: never
        }
        Update: {
          company_id?: string | null
          flujo_operativo?: number | null
          intereses?: number | null
          periodo?: string | null
          principal?: number | null
          servicio_total?: never
        }
        Relationships: [
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_debt_service_kpis: {
        Row: {
          company_id: string | null
          dscr_minimo: number | null
          dscr_promedio: number | null
          meses_en_riesgo: number | null
          servicio_anual: number | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debt_service_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_debt_summary: {
        Row: {
          company_id: string | null
          cuota_total_mensual: number | null
          escenario: string | null
          num_deudas: number | null
          proximo_vencimiento: string | null
          tir_promedio: number | null
          total_capital: number | null
          ultima_actualizacion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "debts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_kpis_anual: {
        Row: {
          anio: string | null
          beneficio_neto: number | null
          company_id: string | null
          facturacion: number | null
          margen_ebitda_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_kpis_anual_yoy: {
        Row: {
          anio: string | null
          company_id: string | null
          delta_pct: number | null
          kpi: string | null
          valor_actual: number | null
          valor_anterior: number | null
        }
        Relationships: []
      }
      vw_nof_summary: {
        Row: {
          anticipos_clientes: number | null
          clientes: number | null
          company_id: string | null
          dias_ciclo: number | null
          inventario: number | null
          nof_total: number | null
          otros_acreedores: number | null
          otros_deudores: number | null
          periodo: string | null
          proveedores: number | null
          trabajos_en_curso: number | null
        }
        Insert: {
          anticipos_clientes?: never
          clientes?: never
          company_id?: string | null
          dias_ciclo?: never
          inventario?: never
          nof_total?: never
          otros_acreedores?: never
          otros_deudores?: never
          periodo?: string | null
          proveedores?: never
          trabajos_en_curso?: never
        }
        Update: {
          anticipos_clientes?: never
          clientes?: never
          company_id?: string | null
          dias_ciclo?: never
          inventario?: never
          nof_total?: never
          otros_acreedores?: never
          otros_deudores?: never
          periodo?: string | null
          proveedores?: never
          trabajos_en_curso?: never
        }
        Relationships: []
      }
      vw_punto_muerto: {
        Row: {
          company_id: string | null
          margen_contribucion: number | null
          margen_seguridad: number | null
          margen_seguridad_valor: number | null
          periodo: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_pyg_analytic_detail: {
        Row: {
          centro_coste: string | null
          company_id: string | null
          concepto_codigo: string | null
          concepto_nombre: string | null
          creado_en: string | null
          grupo: string | null
          id: string | null
          periodo: string | null
          segmento: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_concepto_codigo_fkey"
            columns: ["concepto_codigo"]
            isOneToOne: false
            referencedRelation: "catalog_pyg_concepts"
            referencedColumns: ["concepto_codigo"]
          },
        ]
      }
      vw_pyg_analytic_segmento: {
        Row: {
          company_id: string | null
          concepto_nombre: string | null
          grupo: string | null
          periodo: string | null
          segmento: string | null
          total_valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_pyg_analytic_summary: {
        Row: {
          company_id: string | null
          concepto_codigo: string | null
          concepto_nombre: string | null
          grupo: string | null
          num_registros: number | null
          periodo: string | null
          total_valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_concepto_codigo_fkey"
            columns: ["concepto_codigo"]
            isOneToOne: false
            referencedRelation: "catalog_pyg_concepts"
            referencedColumns: ["concepto_codigo"]
          },
        ]
      }
      vw_pyg_anual: {
        Row: {
          amort: number | null
          anio: string | null
          bai: number | null
          beneficio_neto: number | null
          company_id: string | null
          coste_ventas: number | null
          dep: number | null
          ebit: number | null
          ebitda: number | null
          extra: number | null
          gas_fin: number | null
          impuestos: number | null
          ing_fin: number | null
          ingresos: number | null
          margen_bruto: number | null
          margen_ebitda_pct: number | null
          margen_neto_pct: number | null
          opex: number | null
          otros_gas_op: number | null
          otros_ing_op: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_annual_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_pyg_contribucion_centrocoste: {
        Row: {
          centro_coste: string | null
          company_id: string | null
          coste_ventas: number | null
          ingresos: number | null
          margen_bruto: number | null
          margen_contribucion_pct: number | null
          periodo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_vw"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pyg_analytic_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_access"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vw_ratios_categorias: {
        Row: {
          anio: string | null
          apalancamiento: number | null
          capitalizacion: number | null
          capitalizacion_benchmark: number | null
          cobertura_intereses: number | null
          cobertura_intereses_benchmark: number | null
          company_id: string | null
          company_name: string | null
          deuda_ebitda: number | null
          deuda_ebitda_benchmark: number | null
          liquidez_corriente: number | null
          liquidez_corriente_benchmark: number | null
          periodo: string | null
          ratio_endeudamiento: number | null
          ratio_endeudamiento_benchmark: number | null
          roa: number | null
          roa_benchmark: number | null
          roe: number | null
          roe_benchmark: number | null
          rotacion_activos: number | null
          rotacion_activos_benchmark: number | null
        }
        Relationships: []
      }
      vw_ratios_empresa: {
        Row: {
          anio: string | null
          benchmark: number | null
          company_id: string | null
          created_at: string | null
          desviacion_pct: number | null
          evaluacion: string | null
          nombre: string | null
          periodo: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          anio?: string | null
          benchmark?: number | null
          company_id?: string | null
          created_at?: string | null
          desviacion_pct?: never
          evaluacion?: never
          nombre?: string | null
          periodo?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          anio?: string | null
          benchmark?: number | null
          company_id?: string | null
          created_at?: string | null
          desviacion_pct?: never
          evaluacion?: never
          nombre?: string | null
          periodo?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      vw_ratios_empresa_latest: {
        Row: {
          anio: string | null
          benchmark: number | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          desviacion_pct: number | null
          evaluacion: string | null
          nombre: string | null
          periodo: string | null
          updated_at: string | null
          valor: number | null
        }
        Relationships: []
      }
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
      duplicate_debt_scenario: {
        Args: {
          _company_id: string
          _old_scenario: string
          _new_scenario: string
        }
        Returns: {
          success: boolean
          message: string
          new_debts_count: number
        }[]
      }
      get_accessible_companies: {
        Args: { _user_id: string }
        Returns: {
          company_id: string
        }[]
      }
      get_analisis_punto_muerto_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_apalancamiento: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_apalancamiento_operativo: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_balance_financiero: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          activo_corriente: number
          activo_no_corriente: number
          pasivo_corriente: number
          pasivo_no_corriente: number
          patrimonio_neto: number
        }[]
      }
      get_balance_operativo: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          clientes: number
          inventario: number
          proveedores: number
          otros_deudores_op: number
          otros_acreedores_op: number
          anticipos_clientes: number
          trabajos_en_curso: number
        }[]
      }
      get_balance_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_capitalizacion: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_cashflow_financiacion: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          flujo_financiacion: number
        }[]
      }
      get_cashflow_inversion: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          flujo_inversion: number
        }[]
      }
      get_cashflow_operativo: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          flujo_operativo: number
        }[]
      }
      get_cashflow_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_centros_coste: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          centro_coste: string
        }[]
      }
      get_cobertura_intereses: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_company_profile: {
        Args: { _company_id: string }
        Returns: {
          sector: string
          industria: string
          año_fundacion: number
          empleados: number
          ingresos_anuales: number
          sede: string
          sitio_web: string
          descripcion: string
          updated_at: string
        }[]
      }
      get_costes_fijos_totales: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_costes_variables_totales: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_debt_scenarios: {
        Args: { _company_id: string }
        Returns: {
          escenario: string
          num_deudas: number
        }[]
      }
      get_debt_service_periods: {
        Args: { _company_id: string }
        Returns: {
          periodo: string
        }[]
      }
      get_debt_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_deuda_ebitda: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_ingresos_totales: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_margen_contribucion_total: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_margen_seguridad_porcentaje: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_margen_seguridad_valor: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_monthly_payment_total: {
        Args: { _company_id: string; _escenario: string }
        Returns: number
      }
      get_nof_components: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          componente: string
          valor: number
        }[]
      }
      get_nof_days_cycle: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_nof_ratios: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          ratio_name: string
          ratio_value: number
          interpretation: string
        }[]
      }
      get_nof_total: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_nof_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_punto_equilibrio_valor: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_pyg_analytic_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_ratio_endeudamiento: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_ratio_liquidez_corriente: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_ratio_margen_contribucion: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_ratios_calculados_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_ratios_financieros: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          ratio_name: string
          ratio_value: number
          benchmark: number
        }[]
      }
      get_ratios_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_roa: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_roe: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_rotacion_activos: {
        Args: { _company_id: string; _anio: string }
        Returns: number
      }
      get_segmentos: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          segmento: string
        }[]
      }
      get_total_debt: {
        Args: { _company_id: string; _escenario: string }
        Returns: number
      }
      get_wc_balance_years: {
        Args: { _company_id: string }
        Returns: {
          anio: string
        }[]
      }
      get_wc_financial_balance: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          activo_corriente: number
          activo_no_corriente: number
          pasivo_corriente: number
          pasivo_no_corriente: number
          patrimonio_neto: number
        }[]
      }
      get_wc_operating_balance: {
        Args: { _company_id: string; _anio: string }
        Returns: {
          periodo: string
          clientes: number
          inventario: number
          proveedores: number
          otros_deudores_op: number
          otros_acreedores_op: number
          anticipos_clientes: number
          trabajos_en_curso: number
        }[]
      }
      get_weighted_tir: {
        Args: { _company_id: string; _escenario: string }
        Returns: number
      }
      has_company_access: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          _action: string
          _resource_type: string
          _resource_id?: string
          _details?: Json
        }
        Returns: undefined
      }
      upsert_company_profile: {
        Args:
          | {
              _company_id: string
              _sector: string
              _industria: string
              _año_fundacion: number
              _empleados: number
              _ingresos_anuales: number
              _sede: string
              _sitio_web: string
              _descripcion: string
            }
          | {
              _company_id: string
              _sector: string
              _industria: string
              _año_fundacion: number
              _empleados: number
              _ingresos_anuales: number
              _sede: string
              _sitio_web: string
              _descripcion: string
              _estructura_accionarial: string
              _organigrama: string
            }
        Returns: undefined
      }
      validate_file_upload: {
        Args: {
          _file_size: number
          _content_type: string
          _max_size_mb?: number
        }
        Returns: boolean
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
