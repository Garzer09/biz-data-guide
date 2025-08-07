CREATE OR REPLACE FUNCTION public.get_cashflow_operativo(
  _company_id uuid, 
  _anio text
) 
RETURNS TABLE (
  periodo text,
  flujo_operativo numeric
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
    SELECT 
      co.periodo,
      co.flujo_operativo
    FROM public.cashflows_operativo co
    WHERE co.company_id = _company_id
      AND co.anio = _anio
    ORDER BY co.periodo;
END;
$$;