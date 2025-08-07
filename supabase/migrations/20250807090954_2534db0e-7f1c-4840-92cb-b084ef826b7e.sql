-- Create functions to read from working balance tables

CREATE OR REPLACE FUNCTION public.get_wc_operating_balance(_company_id uuid, _anio text)
RETURNS TABLE(
  periodo text, 
  clientes numeric, 
  inventario numeric, 
  proveedores numeric, 
  otros_deudores_op numeric, 
  otros_acreedores_op numeric, 
  anticipos_clientes numeric, 
  trabajos_en_curso numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has access to company
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied to company data';
  END IF;

  RETURN QUERY
  SELECT 
    wob.periodo,
    COALESCE(wob.clientes, 0) AS clientes,
    COALESCE(wob.inventario, 0) AS inventario,
    COALESCE(wob.proveedores, 0) AS proveedores,
    COALESCE(wob.otros_deudores_op, 0) AS otros_deudores_op,
    COALESCE(wob.otros_acreedores_op, 0) AS otros_acreedores_op,
    COALESCE(wob.anticipos_clientes, 0) AS anticipos_clientes,
    COALESCE(wob.trabajos_en_curso, 0) AS trabajos_en_curso
  FROM wc_operating_balances wob
  WHERE wob.company_id = _company_id 
    AND wob.periodo LIKE _anio || '%'
  ORDER BY wob.periodo;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_wc_financial_balance(_company_id uuid, _anio text)
RETURNS TABLE(
  periodo text, 
  activo_corriente numeric, 
  activo_no_corriente numeric, 
  pasivo_corriente numeric, 
  pasivo_no_corriente numeric, 
  patrimonio_neto numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has access to company
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied to company data';
  END IF;

  RETURN QUERY
  SELECT 
    wfb.periodo,
    COALESCE(wfb.activo_corriente, 0) AS activo_corriente,
    COALESCE(wfb.activo_no_corriente, 0) AS activo_no_corriente,
    COALESCE(wfb.pasivo_corriente, 0) AS pasivo_corriente,
    COALESCE(wfb.pasivo_no_corriente, 0) AS pasivo_no_corriente,
    COALESCE(wfb.patrimonio_neto, 0) AS patrimonio_neto
  FROM wc_financial_balances wfb
  WHERE wfb.company_id = _company_id 
    AND wfb.periodo LIKE _anio || '%'
  ORDER BY wfb.periodo;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_wc_balance_years(_company_id uuid)
RETURNS TABLE(anio text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has access to company
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied to company data';
  END IF;

  RETURN QUERY
  SELECT DISTINCT LEFT(wfb.periodo, 4) AS anio
  FROM wc_financial_balances wfb
  WHERE wfb.company_id = _company_id 
  ORDER BY anio DESC;
END;
$function$;