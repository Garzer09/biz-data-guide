CREATE OR REPLACE FUNCTION public.get_cashflow_years(
  _company_id uuid
) 
RETURNS TABLE (
  anio text
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
    SELECT DISTINCT t.anio
    FROM (
      SELECT co.anio FROM public.cashflows_operativo co WHERE co.company_id = _company_id
      UNION
      SELECT ci.anio FROM public.cashflows_inversion ci WHERE ci.company_id = _company_id
      UNION
      SELECT cf.anio FROM public.cashflows_financiacion cf WHERE cf.company_id = _company_id
    ) t
    ORDER BY t.anio DESC;
END;
$$;