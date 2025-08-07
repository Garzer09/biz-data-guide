CREATE OR REPLACE FUNCTION public.get_cashflow_financiacion(
  _company_id uuid, 
  _anio text
) 
RETURNS TABLE (
  periodo text, 
  flujo_financiacion numeric
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
      cf.periodo, 
      cf.flujo_financiacion
    FROM public.cashflows_financiacion cf
    WHERE cf.company_id = _company_id 
      AND cf.anio = _anio
    ORDER BY cf.periodo;
END;
$$;