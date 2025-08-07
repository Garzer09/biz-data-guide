-- Create comprehensive P&G annual view with calculated metrics
CREATE OR REPLACE VIEW public.vw_pyg_anual AS
SELECT 
  company_id,
  anio,
  
  -- Base components (using COALESCE to handle nulls)
  COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) AS ingresos,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) AS coste_ventas,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) AS opex,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6810' THEN valor_total END), 0) AS dep,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6820' THEN valor_total END), 0) AS amort,
  COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) AS otros_ing_op,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0) AS otros_gas_op,
  COALESCE(SUM(CASE WHEN concepto_codigo = '7600' THEN valor_total END), 0) AS ing_fin,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6600' THEN valor_total END), 0) AS gas_fin,
  COALESCE(SUM(CASE WHEN concepto_codigo = '7700' THEN valor_total END), 0) AS extra,
  COALESCE(SUM(CASE WHEN concepto_codigo = '6300' THEN valor_total END), 0) AS impuestos,
  
  -- Calculated metrics
  COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
  COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) AS margen_bruto,
  
  COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
  COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
  COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
  COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
  COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0) AS ebitda,
  
  -- EBIT = EBITDA + Depreciation + Amortization
  (COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0)) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '6810' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6820' THEN valor_total END), 0) AS ebit,
  
  -- BAI = EBIT + Financial Income + Financial Expenses + Extraordinary
  (COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '6810' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6820' THEN valor_total END), 0)) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '7600' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6600' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '7700' THEN valor_total END), 0) AS bai,
  
  -- Net Profit = BAI + Taxes
  (COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '6810' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6820' THEN valor_total END), 0) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '7600' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '6600' THEN valor_total END), 0) + 
   COALESCE(SUM(CASE WHEN concepto_codigo = '7700' THEN valor_total END), 0)) +
   COALESCE(SUM(CASE WHEN concepto_codigo = '6300' THEN valor_total END), 0) AS beneficio_neto,
  
  -- Margin percentages
  CASE 
    WHEN COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) = 0 THEN NULL
    ELSE (COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
          COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
          COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
          COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
          COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0)) / 
         NULLIF(COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0), 0)
  END AS margen_ebitda_pct,
  
  CASE 
    WHEN COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) = 0 THEN NULL
    ELSE ((COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '6000' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '6400' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '7500' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '6500' THEN valor_total END), 0) +
           COALESCE(SUM(CASE WHEN concepto_codigo = '6810' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '6820' THEN valor_total END), 0) +
           COALESCE(SUM(CASE WHEN concepto_codigo = '7600' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '6600' THEN valor_total END), 0) + 
           COALESCE(SUM(CASE WHEN concepto_codigo = '7700' THEN valor_total END), 0)) +
           COALESCE(SUM(CASE WHEN concepto_codigo = '6300' THEN valor_total END), 0)) / 
          NULLIF(COALESCE(SUM(CASE WHEN concepto_codigo = '7000' THEN valor_total END), 0), 0)
  END AS margen_neto_pct

FROM public.pyg_annual
GROUP BY company_id, anio;

-- Create KPIs annual view
CREATE OR REPLACE VIEW public.vw_kpis_anual AS
SELECT 
  company_id,
  anio,
  ingresos AS facturacion,
  margen_ebitda_pct,
  beneficio_neto
FROM public.vw_pyg_anual;

-- Create year-over-year KPIs comparison view
CREATE OR REPLACE VIEW public.vw_kpis_anual_yoy AS
WITH kpi_data AS (
  SELECT 
    company_id,
    anio,
    'facturacion' AS kpi,
    facturacion AS valor_actual
  FROM public.vw_kpis_anual
  WHERE facturacion IS NOT NULL
  
  UNION ALL
  
  SELECT 
    company_id,
    anio,
    'margen_ebitda_pct' AS kpi,
    margen_ebitda_pct AS valor_actual
  FROM public.vw_kpis_anual
  WHERE margen_ebitda_pct IS NOT NULL
  
  UNION ALL
  
  SELECT 
    company_id,
    anio,
    'beneficio_neto' AS kpi,
    beneficio_neto AS valor_actual
  FROM public.vw_kpis_anual
  WHERE beneficio_neto IS NOT NULL
),
with_previous AS (
  SELECT 
    company_id,
    anio,
    kpi,
    valor_actual,
    LAG(valor_actual) OVER (
      PARTITION BY company_id, kpi 
      ORDER BY anio
    ) AS valor_anterior
  FROM kpi_data
)
SELECT 
  company_id,
  anio,
  kpi,
  valor_actual,
  valor_anterior,
  CASE 
    WHEN valor_anterior IS NULL OR valor_anterior = 0 THEN NULL
    ELSE ((valor_actual - valor_anterior) / valor_anterior) * 100
  END AS delta_pct
FROM with_previous
WHERE valor_anterior IS NOT NULL;

-- Enable RLS on all views (inherited from underlying tables)
ALTER VIEW public.vw_pyg_anual SET (security_invoker = true);
ALTER VIEW public.vw_kpis_anual SET (security_invoker = true);
ALTER VIEW public.vw_kpis_anual_yoy SET (security_invoker = true);