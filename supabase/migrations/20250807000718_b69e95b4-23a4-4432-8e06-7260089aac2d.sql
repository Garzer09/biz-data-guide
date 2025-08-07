-- Create catalog_pyg_concepts table
CREATE TABLE public.catalog_pyg_concepts (
  concepto_codigo TEXT PRIMARY KEY,
  concepto_nombre TEXT NOT NULL,
  grupo TEXT,
  obligatorio BOOLEAN NOT NULL DEFAULT false
);

-- Create pyg_annual table
CREATE TABLE public.pyg_annual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  anio TEXT NOT NULL,
  concepto_codigo TEXT NOT NULL REFERENCES public.catalog_pyg_concepts(concepto_codigo),
  valor_total NUMERIC,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.catalog_pyg_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyg_annual ENABLE ROW LEVEL SECURITY;

-- RLS policies for catalog_pyg_concepts (read-only for authenticated users, manage for admins)
CREATE POLICY "Authenticated users can view catalog_pyg_concepts" 
ON public.catalog_pyg_concepts 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage catalog_pyg_concepts" 
ON public.catalog_pyg_concepts 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS policies for pyg_annual
CREATE POLICY "Users can view pyg_annual for assigned companies" 
ON public.pyg_annual 
FOR SELECT 
USING ((get_current_user_role() = 'admin') OR (EXISTS ( 
  SELECT 1 FROM user_companies 
  WHERE user_companies.user_id = auth.uid() 
  AND user_companies.company_id = pyg_annual.company_id
)));

CREATE POLICY "Only admins can manage pyg_annual" 
ON public.pyg_annual 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Insert the P&G concepts
INSERT INTO public.catalog_pyg_concepts (concepto_codigo, concepto_nombre, grupo, obligatorio) VALUES
('PYG_INGRESOS', 'Ingresos', 'INGRESOS', true),
('PYG_DEVOLUCIONES_DESCUENTOS', 'Devoluciones y Descuentos', 'INGRESOS', false),
('PYG_COSTE_VENTAS', 'Coste de Ventas', 'COSTES', true),
('PYG_GASTOS_PERSONAL', 'Gastos de Personal', 'GASTOS_OPERATIVOS', true),
('PYG_ALQUILERES', 'Alquileres', 'GASTOS_OPERATIVOS', false),
('PYG_MARKETING_VENTAS', 'Marketing y Ventas', 'GASTOS_OPERATIVOS', false),
('PYG_GASTOS_OPERATIVOS', 'Otros Gastos Operativos', 'GASTOS_OPERATIVOS', false),
('PYG_DEPRECIACION', 'Depreciación', 'AMORTIZACIONES', false),
('PYG_AMORTIZACION', 'Amortización', 'AMORTIZACIONES', false),
('PYG_OTROS_INGRESOS_OP', 'Otros Ingresos Operativos', 'OTROS_OPERATIVOS', false),
('PYG_OTROS_GASTOS_OP', 'Otros Gastos Operativos', 'OTROS_OPERATIVOS', false),
('PYG_INGRESOS_FIN', 'Ingresos Financieros', 'FINANCIEROS', false),
('PYG_GASTOS_FIN', 'Gastos Financieros', 'FINANCIEROS', false),
('PYG_RESULTADO_EXTRA', 'Resultado Extraordinario', 'EXTRAORDINARIOS', false),
('PYG_IMPUESTOS', 'Impuestos', 'IMPUESTOS', true);

-- Create index for better performance
CREATE INDEX idx_pyg_annual_company_anio ON public.pyg_annual(company_id, anio);
CREATE INDEX idx_pyg_annual_concepto ON public.pyg_annual(concepto_codigo);