-- Create RPC function for operational balance
CREATE OR REPLACE FUNCTION public.get_balance_operativo(
  _company_id UUID,
  _anio TEXT
)
RETURNS TABLE (
  periodo TEXT,
  clientes NUMERIC,
  inventario NUMERIC,
  proveedores NUMERIC,
  otros_deudores_op NUMERIC,
  otros_acreedores_op NUMERIC,
  anticipos_clientes NUMERIC,
  trabajos_en_curso NUMERIC
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
    p.periodo,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_CLIENTES' THEN fb.valor END), 0) AS clientes,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_INVENTARIO' THEN fb.valor END), 0) AS inventario,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_PROVEEDORES' THEN fb.valor END), 0) AS proveedores,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_OTROS_DEUDORES' THEN fb.valor END), 0) AS otros_deudores_op,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_OTROS_ACREEDORES' THEN fb.valor END), 0) AS otros_acreedores_op,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_ANTICIPOS_CLIENTES' THEN fb.valor END), 0) AS anticipos_clientes,
    COALESCE(SUM(CASE WHEN fb.concepto = 'BAL_TRABAJOS_EN_CURSO' THEN fb.valor END), 0) AS trabajos_en_curso
  FROM periods p
  LEFT JOIN fs_balance fb ON fb.period_id = p.id AND fb.company_id = p.company_id
  WHERE p.company_id = _company_id 
    AND p.periodo LIKE _anio || '%'
    AND p.tipo = 'MENSUAL'
  GROUP BY p.periodo
  ORDER BY p.periodo;
END;
$function$;

-- Create RPC function for financial balance
CREATE OR REPLACE FUNCTION public.get_balance_financiero(
  _company_id UUID,
  _anio TEXT
)
RETURNS TABLE (
  periodo TEXT,
  activo_corriente NUMERIC,
  activo_no_corriente NUMERIC,
  pasivo_corriente NUMERIC,
  pasivo_no_corriente NUMERIC,
  patrimonio_neto NUMERIC
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
    p.periodo,
    COALESCE(SUM(CASE WHEN fb.concepto IN ('BAL_ACTIVO_CORRIENTE', 'BAL_CLIENTES', 'BAL_INVENTARIO', 'BAL_TESORERIA') THEN fb.valor END), 0) AS activo_corriente,
    COALESCE(SUM(CASE WHEN fb.concepto IN ('BAL_ACTIVO_NO_CORRIENTE', 'BAL_INMOVILIZADO') THEN fb.valor END), 0) AS activo_no_corriente,
    COALESCE(SUM(CASE WHEN fb.concepto IN ('BAL_PASIVO_CORRIENTE', 'BAL_PROVEEDORES', 'BAL_DEUDAS_CORTO_PLAZO') THEN fb.valor END), 0) AS pasivo_corriente,
    COALESCE(SUM(CASE WHEN fb.concepto IN ('BAL_PASIVO_NO_CORRIENTE', 'BAL_DEUDAS_LARGO_PLAZO') THEN fb.valor END), 0) AS pasivo_no_corriente,
    COALESCE(SUM(CASE WHEN fb.concepto IN ('BAL_PATRIMONIO_NETO', 'BAL_CAPITAL', 'BAL_RESERVAS', 'BAL_RESULTADOS') THEN fb.valor END), 0) AS patrimonio_neto
  FROM periods p
  LEFT JOIN fs_balance fb ON fb.period_id = p.id AND fb.company_id = p.company_id
  WHERE p.company_id = _company_id 
    AND p.periodo LIKE _anio || '%'
    AND p.tipo = 'MENSUAL'
  GROUP BY p.periodo
  ORDER BY p.periodo;
END;
$function$;

-- Create function to get available years for balance data
CREATE OR REPLACE FUNCTION public.get_balance_years(_company_id UUID)
RETURNS TABLE (anio TEXT)
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
  SELECT DISTINCT LEFT(p.periodo, 4) AS anio
  FROM periods p
  INNER JOIN fs_balance fb ON fb.period_id = p.id AND fb.company_id = p.company_id
  WHERE p.company_id = _company_id 
    AND p.tipo = 'MENSUAL'
  ORDER BY anio DESC;
END;
$function$;