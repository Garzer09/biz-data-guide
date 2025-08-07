-- Create or replace the KPIs annual view
CREATE OR REPLACE VIEW public.vw_kpis_anual AS
SELECT
  company_id,
  anio,
  ingresos AS facturacion,
  CASE WHEN ingresos <> 0
    THEN (ingresos + coste_ventas + opex + otros_ing_op + otros_gas_op) / ingresos
    ELSE NULL 
  END AS margen_ebitda_pct,
  (ingresos + coste_ventas + opex + otros_ing_op + otros_gas_op
   + dep + amort + ing_fin + gas_fin + extra + impuestos) AS beneficio_neto
FROM public.vw_pyg_anual;