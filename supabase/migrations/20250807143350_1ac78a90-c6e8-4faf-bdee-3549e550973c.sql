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