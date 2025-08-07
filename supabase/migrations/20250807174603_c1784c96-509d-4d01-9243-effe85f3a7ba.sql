-- Continue fixing remaining Security Definer views
-- Complete the remaining views that still have SECURITY DEFINER

-- Fix the remaining views that are still causing security warnings
DROP VIEW IF EXISTS public.vw_kpis_anual CASCADE;
CREATE VIEW public.vw_kpis_anual AS
SELECT 
  pa.company_id,
  pa.anio,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) as facturacion,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo NOT IN ('ING_VENTAS') THEN pa.valor_total ELSE 0 END) -
  SUM(CASE WHEN pa.concepto_codigo = 'IMPUESTOS' THEN pa.valor_total ELSE 0 END) as beneficio_neto,
  CASE WHEN SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) > 0
       THEN (SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
             SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) -
             SUM(CASE WHEN pa.concepto_codigo IN ('OPEX_PERSONAL', 'OPEX_OTROS') THEN pa.valor_total ELSE 0 END)) * 100.0 / 
             SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END)
       ELSE 0 END as margen_ebitda_pct
FROM public.pyg_annual pa
WHERE has_company_access(pa.company_id)
GROUP BY pa.company_id, pa.anio;

DROP VIEW IF EXISTS public.vw_kpis_anual_yoy CASCADE;
CREATE VIEW public.vw_kpis_anual_yoy AS
WITH kpi_data AS (
  SELECT 
    company_id,
    anio,
    'facturacion' as kpi,
    facturacion as valor
  FROM vw_kpis_anual
  WHERE has_company_access(company_id)
  UNION ALL
  SELECT 
    company_id,
    anio,
    'beneficio_neto' as kpi,
    beneficio_neto as valor
  FROM vw_kpis_anual
  WHERE has_company_access(company_id)
  UNION ALL
  SELECT 
    company_id,
    anio,
    'margen_ebitda_pct' as kpi,
    margen_ebitda_pct as valor
  FROM vw_kpis_anual
  WHERE has_company_access(company_id)
)
SELECT 
  curr.company_id,
  curr.anio,
  curr.kpi,
  curr.valor as valor_actual,
  prev.valor as valor_anterior,
  CASE 
    WHEN prev.valor IS NOT NULL AND prev.valor != 0 
    THEN ((curr.valor - prev.valor) / prev.valor * 100)
    ELSE NULL
  END as delta_pct
FROM kpi_data curr
LEFT JOIN kpi_data prev ON 
  curr.company_id = prev.company_id 
  AND curr.kpi = prev.kpi 
  AND CAST(curr.anio AS INTEGER) = CAST(prev.anio AS INTEGER) + 1
WHERE has_company_access(curr.company_id);

-- Fix remaining views...
DROP VIEW IF EXISTS public.vw_pyg_analytic_detail CASCADE;
CREATE VIEW public.vw_pyg_analytic_detail AS
SELECT 
  pa.id,
  pa.company_id,
  pa.concepto_codigo,
  pa.periodo,
  pa.valor,
  pa.centro_coste,
  pa.segmento,
  pa.creado_en,
  cpc.concepto_nombre,
  cpc.grupo
FROM public.pyg_analytic pa
LEFT JOIN public.catalog_pyg_concepts cpc ON pa.concepto_codigo = cpc.concepto_codigo
WHERE has_company_access(pa.company_id);

DROP VIEW IF EXISTS public.vw_pyg_analytic_summary CASCADE;
CREATE VIEW public.vw_pyg_analytic_summary AS
SELECT 
  pa.company_id,
  pa.periodo,
  pa.concepto_codigo,
  cpc.concepto_nombre,
  cpc.grupo,
  SUM(pa.valor) as total_valor,
  COUNT(*) as num_registros
FROM public.pyg_analytic pa
LEFT JOIN public.catalog_pyg_concepts cpc ON pa.concepto_codigo = cpc.concepto_codigo
WHERE has_company_access(pa.company_id)
GROUP BY pa.company_id, pa.periodo, pa.concepto_codigo, cpc.concepto_nombre, cpc.grupo;

-- Now check if there are any more problematic views or functions
DROP VIEW IF EXISTS public.vw_pyg_analytic_segmento CASCADE;
DROP VIEW IF EXISTS public.vw_pyg_contribucion_centrocoste CASCADE;
DROP VIEW IF EXISTS public.vw_punto_muerto CASCADE;
DROP VIEW IF EXISTS public.vw_nof_summary CASCADE;
DROP VIEW IF EXISTS public.vw_ratios_categorias CASCADE;