-- Create working balance tables for imports
CREATE TABLE IF NOT EXISTS public.wc_operating_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  periodo TEXT NOT NULL,
  clientes NUMERIC DEFAULT 0,
  inventario NUMERIC DEFAULT 0,
  proveedores NUMERIC DEFAULT 0,
  otros_deudores_op NUMERIC DEFAULT 0,
  otros_acreedores_op NUMERIC DEFAULT 0,
  anticipos_clientes NUMERIC DEFAULT 0,
  trabajos_en_curso NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

CREATE TABLE IF NOT EXISTS public.wc_financial_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  periodo TEXT NOT NULL,
  activo_corriente NUMERIC DEFAULT 0,
  activo_no_corriente NUMERIC DEFAULT 0,
  pasivo_corriente NUMERIC DEFAULT 0,
  pasivo_no_corriente NUMERIC DEFAULT 0,
  patrimonio_neto NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, periodo)
);

-- Enable RLS on both tables
ALTER TABLE public.wc_operating_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wc_financial_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for operating balances
CREATE POLICY "Only admins can manage wc_operating_balances"
ON public.wc_operating_balances
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view wc_operating_balances for assigned companies"
ON public.wc_operating_balances
FOR SELECT
USING (
  get_current_user_role() = 'admin' OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = wc_operating_balances.company_id
  )
);

-- Create RLS policies for financial balances
CREATE POLICY "Only admins can manage wc_financial_balances"
ON public.wc_financial_balances
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view wc_financial_balances for assigned companies"
ON public.wc_financial_balances
FOR SELECT
USING (
  get_current_user_role() = 'admin' OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = wc_financial_balances.company_id
  )
);

-- Create update triggers for timestamps
CREATE TRIGGER update_wc_operating_balances_updated_at
BEFORE UPDATE ON public.wc_operating_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wc_financial_balances_updated_at
BEFORE UPDATE ON public.wc_financial_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();