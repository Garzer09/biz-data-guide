-- Function to duplicate scenario debts
CREATE OR REPLACE FUNCTION public.duplicate_debt_scenario(
  _company_id uuid,
  _old_scenario text,
  _new_scenario text
)
RETURNS TABLE(success boolean, message text, new_debts_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_count integer;
BEGIN
  -- Check if user has access to company
  IF NOT has_company_access(_company_id) THEN
    RETURN QUERY SELECT false, 'Access denied to company data'::text, 0::integer;
    RETURN;
  END IF;

  -- Check if old scenario exists
  IF NOT EXISTS (
    SELECT 1 FROM debts 
    WHERE company_id = _company_id AND escenario = _old_scenario
  ) THEN
    RETURN QUERY SELECT false, 'Source scenario not found'::text, 0::integer;
    RETURN;
  END IF;

  -- Check if new scenario already exists
  IF EXISTS (
    SELECT 1 FROM debts 
    WHERE company_id = _company_id AND escenario = _new_scenario
  ) THEN
    RETURN QUERY SELECT false, 'Target scenario already exists'::text, 0::integer;
    RETURN;
  END IF;

  -- Duplicate debts from old scenario to new scenario
  INSERT INTO debts (
    company_id,
    entidad,
    tipo,
    capital,
    tir,
    plazo_meses,
    cuota,
    proximo_venc,
    escenario
  )
  SELECT 
    company_id,
    entidad,
    tipo,
    capital,
    tir,
    plazo_meses,
    cuota,
    proximo_venc,
    _new_scenario
  FROM debts
  WHERE company_id = _company_id AND escenario = _old_scenario;

  GET DIAGNOSTICS _new_count = ROW_COUNT;

  RETURN QUERY SELECT true, 'Scenario duplicated successfully'::text, _new_count;
END;
$$;

-- Function to get available scenarios for a company
CREATE OR REPLACE FUNCTION public.get_debt_scenarios(_company_id uuid)
RETURNS TABLE(escenario text, num_deudas bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    d.escenario,
    COUNT(*) as num_deudas
  FROM debts d
  WHERE d.company_id = _company_id
  AND has_company_access(_company_id)
  GROUP BY d.escenario
  ORDER BY d.escenario;
$$;