-- Function 1: Total Debt Capital
CREATE OR REPLACE FUNCTION public.get_total_debt(_company_id uuid, _escenario text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(capital), 0)
  FROM debts
  WHERE company_id = _company_id 
  AND escenario = _escenario
  AND has_company_access(_company_id);
$$;

-- Function 2: Weighted Average TIR
CREATE OR REPLACE FUNCTION public.get_weighted_tir(_company_id uuid, _escenario text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT
    CASE 
      WHEN NOT has_company_access(_company_id) THEN NULL
      WHEN SUM(capital) = 0 OR SUM(capital) IS NULL THEN NULL
      ELSE SUM(capital * COALESCE(tir, 0))::numeric / SUM(capital) 
    END
  FROM debts
  WHERE company_id = _company_id AND escenario = _escenario;
$$;

-- Function 3: Total Monthly Payment
CREATE OR REPLACE FUNCTION public.get_monthly_payment_total(_company_id uuid, _escenario text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(cuota), 0)
  FROM debts
  WHERE company_id = _company_id 
  AND escenario = _escenario
  AND has_company_access(_company_id);
$$;

-- Function 4: Get debt years for a company
CREATE OR REPLACE FUNCTION public.get_debt_years(_company_id uuid)
RETURNS TABLE(anio text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT EXTRACT(YEAR FROM created_at)::text AS anio
  FROM debts
  WHERE company_id = _company_id
  AND has_company_access(_company_id)
  ORDER BY anio DESC;
$$;

-- View: Debt Detail
CREATE OR REPLACE VIEW public.vw_debt_detail AS
SELECT
  d.id,
  d.company_id,
  d.entidad,
  d.tipo,
  d.capital        AS capital_pendiente,
  d.tir,
  CASE 
    WHEN d.plazo_meses IS NOT NULL 
    THEN CONCAT(d.plazo_meses, ' meses')
    ELSE 'No definido'
  END AS plazo_restante,
  d.cuota,
  d.proximo_venc   AS proximo_vencimiento,
  d.escenario,
  d.created_at
FROM public.debts d
WHERE has_company_access(d.company_id);

-- View: Debt Summary by Scenario
CREATE OR REPLACE VIEW public.vw_debt_summary AS
SELECT
  d.company_id,
  d.escenario,
  COUNT(*) AS num_deudas,
  SUM(d.capital) AS total_capital,
  AVG(d.tir) AS tir_promedio,
  SUM(d.cuota) AS cuota_total_mensual,
  MIN(d.proximo_venc) AS proximo_vencimiento,
  MAX(d.created_at) AS ultima_actualizacion
FROM public.debts d
WHERE has_company_access(d.company_id)
GROUP BY d.company_id, d.escenario;