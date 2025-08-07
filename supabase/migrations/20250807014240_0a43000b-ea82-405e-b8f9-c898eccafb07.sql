-- Create or replace the KPIs annual year-over-year view
CREATE OR REPLACE VIEW public.vw_kpis_anual_yoy AS
WITH base AS (
  SELECT company_id, anio,
         facturacion, margen_ebitda_pct, beneficio_neto
  FROM public.vw_kpis_anual
)
SELECT
  company_id,
  anio,
  'facturacion' AS kpi,
  facturacion AS valor_actual,
  LAG(facturacion) OVER (PARTITION BY company_id ORDER BY anio::int) AS valor_anterior,
  CASE
    WHEN LAG(facturacion) OVER (PARTITION BY company_id ORDER BY anio::int) IS NULL THEN NULL
    ELSE (facturacion - LAG(facturacion) OVER (PARTITION BY company_id ORDER BY anio::int))
         / NULLIF(LAG(facturacion) OVER (PARTITION BY company_id ORDER BY anio::int), 0)
  END AS delta_pct
FROM base

UNION ALL

SELECT
  company_id,
  anio,
  'margen_ebitda_pct',
  margen_ebitda_pct,
  LAG(margen_ebitda_pct) OVER (PARTITION BY company_id ORDER BY anio::int),
  margen_ebitda_pct - LAG(margen_ebitda_pct) OVER (PARTITION BY company_id ORDER BY anio::int)
FROM base

UNION ALL

SELECT
  company_id,
  anio,
  'beneficio_neto',
  beneficio_neto,
  LAG(beneficio_neto) OVER (PARTITION BY company_id ORDER BY anio::int),
  CASE
    WHEN LAG(beneficio_neto) OVER (PARTITION BY company_id ORDER BY anio::int) IS NULL THEN NULL
    ELSE (beneficio_neto - LAG(beneficio_neto) OVER (PARTITION BY company_id ORDER BY anio::int))
         / NULLIF(LAG(beneficio_neto) OVER (PARTITION BY company_id ORDER BY anio::int), 0)
  END
FROM base;