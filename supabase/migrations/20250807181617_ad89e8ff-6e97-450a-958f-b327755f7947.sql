-- Create view for sales segments analysis
CREATE OR REPLACE VIEW public.vw_sales_segments AS
SELECT
  pa.company_id,
  pa.periodo,
  pa.segmento,
  SUM(pa.valor) FILTER (WHERE pa.concepto_codigo = 'PYG_INGRESOS') AS ventas,
  SUM(pa.valor) FILTER (WHERE cpc.grupo = 'COSTES_VARIABLES') * -1 AS costes_variables,
  SUM(pa.valor) FILTER (WHERE cpc.grupo = 'COSTES_FIJOS') * -1 AS costes_fijos,
  (SUM(pa.valor) FILTER (WHERE pa.concepto_codigo = 'PYG_INGRESOS')
   + SUM(pa.valor) FILTER (WHERE cpc.grupo = 'COSTES_VARIABLES')) AS margen_contribucion
FROM public.pyg_analytic pa
LEFT JOIN public.catalog_pyg_concepts cpc ON pa.concepto_codigo = cpc.concepto_codigo
WHERE pa.segmento IS NOT NULL
GROUP BY pa.company_id, pa.periodo, pa.segmento;

-- Create function to get available years for sales segments
CREATE OR REPLACE FUNCTION public.get_sales_segments_years(_company_id uuid)
RETURNS TABLE(anio text) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT DISTINCT LEFT(periodo, 4) AS anio
  FROM public.vw_sales_segments
  WHERE company_id = _company_id
    AND has_company_access(_company_id)
  ORDER BY anio DESC;
$$;