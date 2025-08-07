-- Create analytical P&G table
CREATE TABLE public.pyg_analytic (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id),
  periodo         text NOT NULL,             -- e.g. '2023' o '2023-03'
  concepto_codigo text NOT NULL REFERENCES catalog_pyg_concepts(concepto_codigo),
  valor           numeric NOT NULL,
  segmento        text,                      -- opcional
  centro_coste    text,                      -- opcional
  creado_en       timestamp with time zone DEFAULT now()
);

-- Add RLS policies for pyg_analytic
ALTER TABLE public.pyg_analytic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage pyg_analytic" 
ON public.pyg_analytic 
FOR ALL 
USING (get_current_user_role() = 'admin') 
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view pyg_analytic for assigned companies" 
ON public.pyg_analytic 
FOR SELECT 
USING (
  get_current_user_role() = 'admin' OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = pyg_analytic.company_id
  )
);

-- Create indexes for better performance
CREATE INDEX idx_pyg_analytic_company_periodo ON public.pyg_analytic(company_id, periodo);
CREATE INDEX idx_pyg_analytic_concepto_codigo ON public.pyg_analytic(concepto_codigo);
CREATE INDEX idx_pyg_analytic_segmento ON public.pyg_analytic(segmento) WHERE segmento IS NOT NULL;
CREATE INDEX idx_pyg_analytic_centro_coste ON public.pyg_analytic(centro_coste) WHERE centro_coste IS NOT NULL;

-- Create analytical detail view
CREATE OR REPLACE VIEW public.vw_pyg_analytic_detail AS
SELECT 
  a.id, 
  a.company_id, 
  a.periodo, 
  a.segmento, 
  a.centro_coste,
  c.concepto_nombre,
  c.grupo,
  a.concepto_codigo,
  a.valor,
  a.creado_en
FROM pyg_analytic a
JOIN catalog_pyg_concepts c ON c.concepto_codigo = a.concepto_codigo;

-- Create analytical summary view
CREATE OR REPLACE VIEW public.vw_pyg_analytic_summary AS
SELECT 
  company_id, 
  periodo, 
  concepto_codigo,
  concepto_nombre,
  grupo,
  SUM(valor) AS total_valor,
  COUNT(*) AS num_registros
FROM public.vw_pyg_analytic_detail
GROUP BY company_id, periodo, concepto_codigo, concepto_nombre, grupo;

-- Create contribution margin by cost center view
CREATE OR REPLACE VIEW public.vw_pyg_contribucion_centrocoste AS
SELECT 
  a.company_id, 
  a.periodo, 
  a.centro_coste,
  SUM(CASE WHEN c.grupo = 'INGRESOS' THEN a.valor ELSE 0 END) AS ingresos,
  SUM(CASE WHEN c.grupo = 'COSTE_VENTAS' THEN a.valor ELSE 0 END) AS coste_ventas,
  SUM(CASE WHEN c.grupo = 'INGRESOS' THEN a.valor ELSE 0 END) + 
  SUM(CASE WHEN c.grupo = 'COSTE_VENTAS' THEN a.valor ELSE 0 END) AS margen_bruto,
  CASE 
    WHEN SUM(CASE WHEN c.grupo = 'INGRESOS' THEN a.valor ELSE 0 END) > 0 THEN
      (SUM(CASE WHEN c.grupo = 'INGRESOS' THEN a.valor ELSE 0 END) + 
       SUM(CASE WHEN c.grupo = 'COSTE_VENTAS' THEN a.valor ELSE 0 END)) * 100.0 / 
       SUM(CASE WHEN c.grupo = 'INGRESOS' THEN a.valor ELSE 0 END)
    ELSE NULL
  END AS margen_contribucion_pct
FROM pyg_analytic a
JOIN catalog_pyg_concepts c ON c.concepto_codigo = a.concepto_codigo
WHERE a.centro_coste IS NOT NULL
GROUP BY a.company_id, a.periodo, a.centro_coste;

-- Create analytical breakdown by segment view
CREATE OR REPLACE VIEW public.vw_pyg_analytic_segmento AS
SELECT 
  a.company_id, 
  a.periodo, 
  a.segmento,
  c.grupo,
  c.concepto_nombre,
  SUM(a.valor) AS total_valor
FROM pyg_analytic a
JOIN catalog_pyg_concepts c ON c.concepto_codigo = a.concepto_codigo
WHERE a.segmento IS NOT NULL
GROUP BY a.company_id, a.periodo, a.segmento, c.grupo, c.concepto_nombre
ORDER BY a.company_id, a.periodo, a.segmento, c.grupo;

-- Function to get analytical years for a company
CREATE OR REPLACE FUNCTION public.get_pyg_analytic_years(_company_id uuid)
RETURNS TABLE(anio text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT LEFT(periodo, 4) AS anio
  FROM pyg_analytic
  WHERE company_id = _company_id
  AND has_company_access(_company_id)
  ORDER BY anio DESC;
$function$;

-- Function to get cost centers for a company and year
CREATE OR REPLACE FUNCTION public.get_centros_coste(_company_id uuid, _anio text)
RETURNS TABLE(centro_coste text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT a.centro_coste
  FROM pyg_analytic a
  WHERE a.company_id = _company_id
  AND a.periodo LIKE _anio || '%'
  AND a.centro_coste IS NOT NULL
  AND has_company_access(_company_id)
  ORDER BY a.centro_coste;
$function$;

-- Function to get segments for a company and year
CREATE OR REPLACE FUNCTION public.get_segmentos(_company_id uuid, _anio text)
RETURNS TABLE(segmento text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT a.segmento
  FROM pyg_analytic a
  WHERE a.company_id = _company_id
  AND a.periodo LIKE _anio || '%'
  AND a.segmento IS NOT NULL
  AND has_company_access(_company_id)
  ORDER BY a.segmento;
$function$;