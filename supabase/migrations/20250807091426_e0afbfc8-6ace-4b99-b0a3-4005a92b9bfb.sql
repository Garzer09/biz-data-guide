-- Flujo Operativo mensual
CREATE TABLE IF NOT EXISTS public.cashflows_operativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  anio text NOT NULL,          -- '2024'
  periodo text NOT NULL,       -- '2024-01'
  flujo_operativo numeric NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

-- Flujo de Inversión mensual
CREATE TABLE IF NOT EXISTS public.cashflows_inversion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  anio text NOT NULL,
  periodo text NOT NULL,
  flujo_inversion numeric NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

-- Flujo de Financiación mensual
CREATE TABLE IF NOT EXISTS public.cashflows_financiacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  anio text NOT NULL,
  periodo text NOT NULL,
  flujo_financiacion numeric NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

-- Enable RLS on all cashflow tables
ALTER TABLE public.cashflows_operativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflows_inversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflows_financiacion ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cashflows_operativo
CREATE POLICY "Only admins can manage cashflows_operativo" 
ON public.cashflows_operativo 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Users can view cashflows_operativo for assigned companies" 
ON public.cashflows_operativo 
FOR SELECT 
USING (
  get_current_user_role() = 'admin'::text OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = cashflows_operativo.company_id
  )
);

-- RLS Policies for cashflows_inversion
CREATE POLICY "Only admins can manage cashflows_inversion" 
ON public.cashflows_inversion 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Users can view cashflows_inversion for assigned companies" 
ON public.cashflows_inversion 
FOR SELECT 
USING (
  get_current_user_role() = 'admin'::text OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = cashflows_inversion.company_id
  )
);

-- RLS Policies for cashflows_financiacion
CREATE POLICY "Only admins can manage cashflows_financiacion" 
ON public.cashflows_financiacion 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Users can view cashflows_financiacion for assigned companies" 
ON public.cashflows_financiacion 
FOR SELECT 
USING (
  get_current_user_role() = 'admin'::text OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = cashflows_financiacion.company_id
  )
);