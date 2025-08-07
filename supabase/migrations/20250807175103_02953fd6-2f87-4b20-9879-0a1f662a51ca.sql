-- Create missing views that were dropped during security fixes

-- Create vw_nof_summary view
CREATE OR REPLACE VIEW public.vw_nof_summary AS
SELECT 
  wob.company_id,
  LEFT(wob.periodo, 4) as anio,
  wob.periodo,
  -- Calculate NOF components
  COALESCE(wob.clientes, 0) + 
  COALESCE(wob.otros_deudores_op, 0) + 
  COALESCE(wob.inventario, 0) + 
  COALESCE(wob.anticipos_clientes, 0) + 
  COALESCE(wob.trabajos_en_curso, 0) -
  COALESCE(wob.proveedores, 0) - 
  COALESCE(wob.otros_acreedores_op, 0) as nof_total,
  -- Individual components
  COALESCE(wob.clientes, 0) as clientes,
  COALESCE(wob.inventario, 0) as inventario,
  COALESCE(wob.proveedores, 0) as proveedores,
  COALESCE(wob.otros_deudores_op, 0) as otros_deudores_op,
  COALESCE(wob.otros_acreedores_op, 0) as otros_acreedores_op,
  COALESCE(wob.anticipos_clientes, 0) as anticipos_clientes,
  COALESCE(wob.trabajos_en_curso, 0) as trabajos_en_curso,
  -- Calculate NOF days cycle
  CASE 
    WHEN vp.ingresos > 0 THEN 
      (COALESCE(wob.clientes, 0) + 
       COALESCE(wob.otros_deudores_op, 0) + 
       COALESCE(wob.inventario, 0) + 
       COALESCE(wob.anticipos_clientes, 0) + 
       COALESCE(wob.trabajos_en_curso, 0) -
       COALESCE(wob.proveedores, 0) - 
       COALESCE(wob.otros_acreedores_op, 0)) / (vp.ingresos / 360)
    ELSE NULL 
  END as dias_ciclo
FROM wc_operating_balances wob
LEFT JOIN vw_pyg_anual vp ON vp.company_id = wob.company_id 
  AND vp.anio = LEFT(wob.periodo, 4)
WHERE has_company_access(wob.company_id);

-- Create vw_pyg_analytic_segmento view  
CREATE OR REPLACE VIEW public.vw_pyg_analytic_segmento AS
SELECT 
  pa.company_id,
  pa.periodo,
  LEFT(pa.periodo, 4) as anio,
  pa.segmento,
  pa.concepto_codigo,
  cpc.concepto_nombre,
  cpc.grupo,
  SUM(pa.valor) as valor_total,
  COUNT(*) as num_registros
FROM pyg_analytic pa
INNER JOIN catalog_pyg_concepts cpc ON cpc.concepto_codigo = pa.concepto_codigo
WHERE pa.segmento IS NOT NULL
  AND has_company_access(pa.company_id)
GROUP BY 
  pa.company_id,
  pa.periodo,
  pa.segmento, 
  pa.concepto_codigo,
  cpc.concepto_nombre,
  cpc.grupo
ORDER BY 
  pa.company_id,
  pa.periodo,
  pa.segmento,
  cpc.grupo,
  pa.concepto_codigo;

-- Apply RLS policies to the views
ALTER VIEW public.vw_nof_summary OWNER TO postgres;
ALTER VIEW public.vw_pyg_analytic_segmento OWNER TO postgres;

-- Grant access to authenticated users
GRANT SELECT ON public.vw_nof_summary TO authenticated;
GRANT SELECT ON public.vw_pyg_analytic_segmento TO authenticated;