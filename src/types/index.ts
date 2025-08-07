/**
 * Centralized TypeScript types for better type safety
 * Replaces excessive use of 'any' types throughout the application
 */

// Database and API Response Types
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: DatabaseError | null;
  count?: number;
  status?: number;
}

// Company Related Types
export interface Company {
  id: string;
  name: string;
  cif_nif?: string;
  currency?: string;
  accounting_plan?: string;
  coverage?: string;
  sector?: string;
  estado?: string;
  last_load?: string | null;
  status?: "FAILED" | "SUCCESS" | "PENDING";
  creado_en?: string;
  actualizado_en?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCompanyAccess {
  user_id: string;
  company_id: string;
  granted_at: string;
  granted_by: string;
}

// Import and Data Management Types
export interface ImportJob {
  id: string;
  company_id: string;
  tipo: string;
  estado: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  storage_path: string;
  resumen: ImportJobSummary;
  creado_en: string;
  actualizado_en: string;
  companies?: Company;
  error_details?: string;
}

export interface ImportJobSummary {
  total_rows?: number;
  processed_rows?: number;
  failed_rows?: number;
  warnings?: string[];
  errors?: string[];
  file_name?: string;
  file_size?: number;
}

// Financial Data Types
export interface PyGAnnualData {
  company_id: string;
  anio: string;
  ingresos: number;
  coste_ventas: number;
  opex: number;
  dep: number;
  amort: number;
  otros_ing_op: number;
  otros_gas_op: number;
  ing_fin: number;
  gas_fin: number;
  extra: number;
  impuestos: number;
  margen_bruto: number;
  ebitda: number;
  ebit: number;
  bai: number;
  beneficio_neto: number;
  margen_ebitda_pct: number;
  margen_neto_pct: number;
}

export interface PyGAnalyticData {
  id: string;
  company_id: string;
  anio: string;
  mes: string;
  concepto: string;
  importe: number;
  tipo: 'INGRESO' | 'GASTO';
  categoria: string;
  subcategoria?: string;
}

export interface BalanceData {
  company_id: string;
  anio: string;
  cuenta: string;
  descripcion: string;
  importe: number;
  tipo: 'ACTIVO' | 'PASIVO';
  categoria: string;
}

export interface DebtServiceData {
  id: string;
  company_id: string;
  anio: string;
  entidad: string;
  producto: string;
  saldo_inicial: number;
  principal_pagado: number;
  intereses_pagados: number;
  saldo_final: number;
  tipo_interes: number;
}

export interface RatiosData {
  company_id: string;
  anio: string;
  liquidez: number;
  solvencia: number;
  rentabilidad_economica: number;
  rentabilidad_financiera: number;
  endeudamiento: number;
  cobertura_gastos_financieros: number;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface WaterfallDataPoint extends ChartDataPoint {
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
}

// Form Types
export interface FormState<T> {
  data: T;
  isSubmitting: boolean;
  errors: Partial<Record<keyof T, string>>;
  isDirty: boolean;
}

// UI Component Props Types
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  formatter?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Security and Audit Types
export interface SecurityAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AllocationRule {
  id: string;
  company_id: string;
  source_account: string;
  target_accounts: string[];
  allocation_method: 'PERCENTAGE' | 'AMOUNT' | 'RULE_BASED';
  allocation_values: number[];
  active: boolean;
  created_at: string;
}

// Generic utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

// Event handler types
export type AsyncEventHandler<T = void> = (
  ...args: unknown[]
) => Promise<T>;

export type EventHandler<T = void> = (...args: unknown[]) => T;

// File upload types
export interface FileUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

// Navigation and routing types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: string;
  data?: unknown;
}

// Type guards
export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  return typeof obj === 'object' && obj !== null && ('data' in obj || 'error' in obj);
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof Error && 'code' in error;
};