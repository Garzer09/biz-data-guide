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
      SELECT (activo_corriente + activo_no_corriente)
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
      SELECT patrimonio_neto
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
      SELECT (activo_corriente + activo_no_corriente)
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
      SELECT (pasivo_corriente + pasivo_no_corriente)
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

-- Función para obtener años disponibles de ratios calculados
CREATE OR REPLACE FUNCTION public.get_ratios_calculados_years(_company_id uuid)
RETURNS TABLE(anio text) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT DISTINCT LEFT(wfb.periodo, 4) AS anio
  FROM wc_financial_balances wfb
  WHERE wfb.company_id = _company_id
  AND EXISTS (
    SELECT 1 FROM vw_pyg_anual vp 
    WHERE vp.company_id = wfb.company_id 
    AND vp.anio = LEFT(wfb.periodo, 4)
  )
  ORDER BY anio DESC;
$$;