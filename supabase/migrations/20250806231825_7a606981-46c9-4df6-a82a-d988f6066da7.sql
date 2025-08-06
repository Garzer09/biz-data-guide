-- First, drop all existing policies to allow column modification
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view assigned companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all company assignments" ON public.user_companies;
DROP POLICY IF EXISTS "Admins can manage company assignments" ON public.user_companies;
DROP POLICY IF EXISTS "Users can view their company assignments" ON public.user_companies;

-- Update existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Update role values to match new requirements (admin/user)
UPDATE public.profiles SET role = 'admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'user' WHERE role != 'admin';

-- Add constraint for rol_global
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_rol_global_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_rol_global_check 
CHECK (role IN ('admin', 'user'));

-- Update existing companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cif_nif TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'ACTIVO',
ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create periods table
CREATE TABLE IF NOT EXISTS public.periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensual', 'trimestral', 'anual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

-- Create fs_income table (P&G)
CREATE TABLE IF NOT EXISTS public.fs_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  valor DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fs_balance table
CREATE TABLE IF NOT EXISTS public.fs_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  valor DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fs_cashflow table
CREATE TABLE IF NOT EXISTS public.fs_cashflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  valor DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratios_calc table
CREATE TABLE IF NOT EXISTS public.ratios_calc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  ratio TEXT NOT NULL,
  valor DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_pages table
CREATE TABLE IF NOT EXISTS public.company_pages (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE PRIMARY KEY,
  enabled_pages TEXT[] DEFAULT ARRAY['dashboard','pyg','balance','cashflow','ratios','sensibilidad','proyecciones','eva','conclusiones'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import_jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('income', 'balance', 'cashflow', 'ratios')),
  estado TEXT NOT NULL DEFAULT 'PENDING',
  total_rows INTEGER DEFAULT 0,
  ok_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import_files table
CREATE TABLE IF NOT EXISTS public.import_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  hash TEXT,
  subido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_periods_company_id ON public.periods(company_id);
CREATE INDEX IF NOT EXISTS idx_periods_company_period ON public.periods(company_id, periodo);

CREATE INDEX IF NOT EXISTS idx_fs_income_company_period ON public.fs_income(company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_fs_balance_company_period ON public.fs_balance(company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_fs_cashflow_company_period ON public.fs_cashflow(company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_ratios_calc_company_period ON public.ratios_calc(company_id, period_id);

CREATE INDEX IF NOT EXISTS idx_import_jobs_company_id ON public.import_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_import_files_job_id ON public.import_files(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON public.audit_log(entidad, entidad_id);

-- Enable RLS on new tables
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratios_calc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate policies using security definer function
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view assigned companies" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = companies.id
  )
);

CREATE POLICY "Admins can view all companies" ON public.companies
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage companies" ON public.companies
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view their company assignments" ON public.user_companies
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all company assignments" ON public.user_companies
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage company assignments" ON public.user_companies
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS policies for financial data tables
CREATE POLICY "Users can view periods for assigned companies" ON public.periods
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = periods.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage periods" ON public.periods
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view fs_income for assigned companies" ON public.fs_income
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_income.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage fs_income" ON public.fs_income
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view fs_balance for assigned companies" ON public.fs_balance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_balance.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage fs_balance" ON public.fs_balance
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view fs_cashflow for assigned companies" ON public.fs_cashflow
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_cashflow.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage fs_cashflow" ON public.fs_cashflow
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view ratios_calc for assigned companies" ON public.ratios_calc
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = ratios_calc.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage ratios_calc" ON public.ratios_calc
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view company_pages for assigned companies" ON public.company_pages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = company_pages.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage company_pages" ON public.company_pages
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view import_jobs for assigned companies" ON public.import_jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = import_jobs.company_id
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage import_jobs" ON public.import_jobs
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view import_files for their jobs" ON public.import_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.import_jobs ij
    JOIN public.user_companies uc ON uc.company_id = ij.company_id
    WHERE ij.id = import_files.job_id 
    AND uc.user_id = auth.uid()
  ) OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage import_files" ON public.import_files
FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view relevant audit_log" ON public.audit_log
FOR SELECT USING (
  actor_user_id = auth.uid() OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "System can insert audit_log" ON public.audit_log
FOR INSERT WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_company_pages_updated_at
BEFORE UPDATE ON public.company_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default company_pages entries for existing companies
INSERT INTO public.company_pages (company_id)
SELECT id FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_pages);