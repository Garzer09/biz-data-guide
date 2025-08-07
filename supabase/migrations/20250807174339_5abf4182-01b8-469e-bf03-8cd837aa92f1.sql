-- Fix remaining Security Definer views
-- Get list of all views with SECURITY DEFINER and fix them

-- Drop and recreate all remaining SECURITY DEFINER views
DROP VIEW IF EXISTS public.vw_debt_detail CASCADE;
CREATE VIEW public.vw_debt_detail AS
SELECT 
  d.id,
  d.company_id,
  d.entidad,
  d.tipo,
  d.capital as capital_pendiente,
  d.tir,
  d.cuota,
  d.proximo_venc as proximo_vencimiento,
  d.escenario,
  d.created_at,
  CASE 
    WHEN d.plazo_meses IS NOT NULL THEN 
      CAST(d.plazo_meses AS text) || ' meses'
    ELSE 'No especificado'
  END as plazo_restante
FROM public.debts d
WHERE has_company_access(d.company_id);

DROP VIEW IF EXISTS public.vw_debt_summary CASCADE;
CREATE VIEW public.vw_debt_summary AS
SELECT 
  d.company_id,
  d.escenario,
  COUNT(*) as num_deudas,
  SUM(d.capital) as total_capital,
  AVG(d.tir) as tir_promedio,
  SUM(d.cuota) as cuota_total_mensual,
  MIN(d.proximo_venc) as proximo_vencimiento,
  MAX(d.created_at) as ultima_actualizacion
FROM public.debts d
WHERE has_company_access(d.company_id)
GROUP BY d.company_id, d.escenario;

DROP VIEW IF EXISTS public.vw_debt_service_detail CASCADE;
CREATE VIEW public.vw_debt_service_detail AS
SELECT 
  ds.company_id,
  ds.periodo,
  ds.flujo_operativo,
  ds.intereses,
  ds.principal,
  (ds.intereses + ds.principal) as servicio_total
FROM public.debt_service ds
WHERE has_company_access(ds.company_id);

DROP VIEW IF EXISTS public.vw_debt_service_kpis CASCADE;
CREATE VIEW public.vw_debt_service_kpis AS
SELECT 
  ds.company_id,
  SUM(ds.intereses + ds.principal) as servicio_anual,
  AVG(CASE WHEN (ds.intereses + ds.principal) > 0 
       THEN ds.flujo_operativo / (ds.intereses + ds.principal) 
       ELSE NULL END) as dscr_promedio,
  MIN(CASE WHEN (ds.intereses + ds.principal) > 0 
       THEN ds.flujo_operativo / (ds.intereses + ds.principal) 
       ELSE NULL END) as dscr_minimo,
  COUNT(CASE WHEN ds.flujo_operativo < (ds.intereses + ds.principal) 
        THEN 1 END) as meses_en_riesgo
FROM public.debt_service ds
WHERE has_company_access(ds.company_id)
GROUP BY ds.company_id;

DROP VIEW IF EXISTS public.vw_pyg_anual CASCADE;
CREATE VIEW public.vw_pyg_anual AS
SELECT 
  pa.company_id,
  pa.anio,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) as ingresos,
  SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) as coste_ventas,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) as margen_bruto,
  SUM(CASE WHEN pa.concepto_codigo IN ('OPEX_PERSONAL', 'OPEX_OTROS') THEN pa.valor_total ELSE 0 END) as opex,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) -
  SUM(CASE WHEN pa.concepto_codigo IN ('OPEX_PERSONAL', 'OPEX_OTROS') THEN pa.valor_total ELSE 0 END) as ebitda,
  SUM(CASE WHEN pa.concepto_codigo = 'AMORT' THEN pa.valor_total ELSE 0 END) as amort,
  SUM(CASE WHEN pa.concepto_codigo = 'DEP' THEN pa.valor_total ELSE 0 END) as dep,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) -
  SUM(CASE WHEN pa.concepto_codigo IN ('OPEX_PERSONAL', 'OPEX_OTROS', 'AMORT', 'DEP') THEN pa.valor_total ELSE 0 END) as ebit,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_FIN' THEN pa.valor_total ELSE 0 END) as ing_fin,
  SUM(CASE WHEN pa.concepto_codigo = 'GAS_FIN' THEN pa.valor_total ELSE 0 END) as gas_fin,
  SUM(CASE WHEN pa.concepto_codigo = 'OTROS_ING_OP' THEN pa.valor_total ELSE 0 END) as otros_ing_op,
  SUM(CASE WHEN pa.concepto_codigo = 'OTROS_GAS_OP' THEN pa.valor_total ELSE 0 END) as otros_gas_op,
  SUM(CASE WHEN pa.concepto_codigo = 'EXTRA' THEN pa.valor_total ELSE 0 END) as extra,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo NOT IN ('ING_VENTAS') THEN pa.valor_total ELSE 0 END) as bai,
  SUM(CASE WHEN pa.concepto_codigo = 'IMPUESTOS' THEN pa.valor_total ELSE 0 END) as impuestos,
  SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
  SUM(CASE WHEN pa.concepto_codigo NOT IN ('ING_VENTAS') THEN pa.valor_total ELSE 0 END) -
  SUM(CASE WHEN pa.concepto_codigo = 'IMPUESTOS' THEN pa.valor_total ELSE 0 END) as beneficio_neto,
  CASE WHEN SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) > 0
       THEN (SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
             SUM(CASE WHEN pa.concepto_codigo = 'COSTE_VENTAS' THEN pa.valor_total ELSE 0 END) -
             SUM(CASE WHEN pa.concepto_codigo IN ('OPEX_PERSONAL', 'OPEX_OTROS') THEN pa.valor_total ELSE 0 END)) * 100.0 / 
             SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END)
       ELSE 0 END as margen_ebitda_pct,
  CASE WHEN SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) > 0
       THEN (SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END) - 
             SUM(CASE WHEN pa.concepto_codigo NOT IN ('ING_VENTAS') THEN pa.valor_total ELSE 0 END) -
             SUM(CASE WHEN pa.concepto_codigo = 'IMPUESTOS' THEN pa.valor_total ELSE 0 END)) * 100.0 / 
             SUM(CASE WHEN pa.concepto_codigo = 'ING_VENTAS' THEN pa.valor_total ELSE 0 END)
       ELSE 0 END as margen_neto_pct
FROM public.pyg_annual pa
WHERE has_company_access(pa.company_id)
GROUP BY pa.company_id, pa.anio;

-- Fix other views similarly... (continuing in next migration due to length)