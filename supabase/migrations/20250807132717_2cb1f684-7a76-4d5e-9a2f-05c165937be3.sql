-- 1. Ratio Liquidez Corriente
CREATE OR REPLACE FUNCTION public.get_ratio_liquidez_corriente(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(activo_corriente),0)
    / NULLIF(SUM(pasivo_corriente),0)
  FROM wc_financial_balances
  WHERE company_id=_company_id AND periodo LIKE _anio||'%';
$$;

-- 2. Ratio Endeudamiento (Deuda Total / Activo Total)
CREATE OR REPLACE FUNCTION public.get_ratio_endeudamiento(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(pasivo_corriente + pasivo_no_corriente),0)
    / NULLIF(SUM(activo_corriente + activo_no_corriente),0)
  FROM wc_financial_balances
  WHERE company_id=_company_id AND periodo LIKE _anio||'%';
$$;

-- 3. ROA (Resultado Neto / Activo Total)
CREATE OR REPLACE FUNCTION public.get_roa(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(vp.beneficio_neto, 0)
    / NULLIF((
      SELECT SUM(activo_corriente + activo_no_corriente)
      FROM wc_financial_balances
      WHERE company_id = _company_id 
      AND periodo LIKE _anio||'%'
      ORDER BY periodo DESC
      LIMIT 1
    ), 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

-- 4. ROE (Resultado Neto / Patrimonio Neto)
CREATE OR REPLACE FUNCTION public.get_roe(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(vp.beneficio_neto, 0)
    / NULLIF((
      SELECT SUM(patrimonio_neto)
      FROM wc_financial_balances
      WHERE company_id = _company_id 
      AND periodo LIKE _anio||'%'
      ORDER BY periodo DESC
      LIMIT 1
    ), 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

-- 5. Rotación Activos (Ventas / Activo Total)
CREATE OR REPLACE FUNCTION public.get_rotacion_activos(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(vp.ingresos, 0)
    / NULLIF((
      SELECT SUM(activo_corriente + activo_no_corriente)
      FROM wc_financial_balances
      WHERE company_id = _company_id 
      AND periodo LIKE _anio||'%'
      ORDER BY periodo DESC
      LIMIT 1
    ), 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

-- 6. Cobertura Intereses (EBITDA / Gastos Financieros)
CREATE OR REPLACE FUNCTION public.get_cobertura_intereses(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(vp.ebitda, 0)
    / NULLIF(ABS(COALESCE(vp.gas_fin, 0)), 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

-- 7. Deuda/EBITDA (Deuda Neta / EBITDA)
CREATE OR REPLACE FUNCTION public.get_deuda_ebitda(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE((
      SELECT SUM(pasivo_corriente + pasivo_no_corriente)
      FROM wc_financial_balances
      WHERE company_id = _company_id 
      AND periodo LIKE _anio||'%'
      ORDER BY periodo DESC
      LIMIT 1
    ), 0)
    / NULLIF(COALESCE((
      SELECT vp.ebitda
      FROM vw_pyg_anual vp
      WHERE vp.company_id = _company_id AND vp.anio = _anio
    ), 0), 0);
$$;

-- 8. Apalancamiento (Deuda Total / Patrimonio Neto)
CREATE OR REPLACE FUNCTION public.get_apalancamiento(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(pasivo_corriente + pasivo_no_corriente), 0)
    / NULLIF(SUM(patrimonio_neto), 0)
  FROM wc_financial_balances
  WHERE company_id = _company_id AND periodo LIKE _anio||'%';
$$;

-- 9. Capitalización (Deuda L/P / (Deuda L/P + Patrimonio Neto))
CREATE OR REPLACE FUNCTION public.get_capitalizacion(_company_id uuid, _anio text)
RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(pasivo_no_corriente), 0)
    / NULLIF(SUM(pasivo_no_corriente + patrimonio_neto), 0)
  FROM wc_financial_balances
  WHERE company_id = _company_id AND periodo LIKE _anio||'%';
$$;

-- Vista unificada para todos los ratios calculados automáticamente
CREATE OR REPLACE VIEW public.vw_ratios_calculados AS
WITH distinct_companies_years AS (
  SELECT DISTINCT 
    wfb.company_id,
    LEFT(wfb.periodo, 4) AS anio
  FROM wc_financial_balances wfb
  WHERE EXISTS (
    SELECT 1 FROM vw_pyg_anual vp 
    WHERE vp.company_id = wfb.company_id 
    AND vp.anio = LEFT(wfb.periodo, 4)
  )
)
SELECT 
  company_id,
  anio,
  'ratio_liquidez' AS ratio_name,
  public.get_ratio_liquidez_corriente(company_id, anio) AS ratio_value,
  1.5 AS benchmark,
  'Liquidez Corriente' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_ratio_liquidez_corriente(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'ratio_endeudamiento' AS ratio_name,
  public.get_ratio_endeudamiento(company_id, anio) AS ratio_value,
  0.6 AS benchmark,
  'Ratio Endeudamiento' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_ratio_endeudamiento(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'roa' AS ratio_name,
  public.get_roa(company_id, anio) AS ratio_value,
  0.05 AS benchmark,
  'ROA' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_roa(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'roe' AS ratio_name,
  public.get_roe(company_id, anio) AS ratio_value,
  0.15 AS benchmark,
  'ROE' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_roe(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'rotacion_activos' AS ratio_name,
  public.get_rotacion_activos(company_id, anio) AS ratio_value,
  1.0 AS benchmark,
  'Rotación Activos' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_rotacion_activos(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'cobertura_intereses' AS ratio_name,
  public.get_cobertura_intereses(company_id, anio) AS ratio_value,
  3.0 AS benchmark,
  'Cobertura Intereses' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_cobertura_intereses(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'deuda_ebitda' AS ratio_name,
  public.get_deuda_ebitda(company_id, anio) AS ratio_value,
  3.0 AS benchmark,
  'Deuda/EBITDA' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_deuda_ebitda(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'apalancamiento' AS ratio_name,
  public.get_apalancamiento(company_id, anio) AS ratio_value,
  NULL AS benchmark,
  'Apalancamiento' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_apalancamiento(company_id, anio) IS NOT NULL

UNION ALL

SELECT 
  company_id,
  anio,
  'capitalizacion' AS ratio_name,
  public.get_capitalizacion(company_id, anio) AS ratio_value,
  0.7 AS benchmark,
  'Capitalización' AS ratio_display_name
FROM distinct_companies_years
WHERE public.get_capitalizacion(company_id, anio) IS NOT NULL;