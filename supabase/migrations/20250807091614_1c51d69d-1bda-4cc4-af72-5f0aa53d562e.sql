CREATE OR REPLACE FUNCTION public.get_cashflow_inversion(
  _company_id uuid, 
  _anio text
) 
RETURNS TABLE (
  periodo text, 
  flujo_inversion numeric
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
      ci.periodo, 
      ci.flujo_inversion
    FROM public.cashflows_inversion ci
    WHERE ci.company_id = _company_id 
      AND ci.anio = _anio
    ORDER BY ci.periodo;
END;
$$;