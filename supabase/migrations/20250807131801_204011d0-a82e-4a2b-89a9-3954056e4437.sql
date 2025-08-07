-- Update import_jobs table constraint to include ratios type
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_tipo_check;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo IN (
  'balance_operativo', 
  'balance_financiero', 
  'pyg_anual', 
  'cashflow_operativo', 
  'cashflow_inversion', 
  'cashflow_financiacion', 
  'company_profile',
  'ratios'
));

-- Create function to get available years for ratios
CREATE OR REPLACE FUNCTION public.get_ratios_years(_company_id uuid)
RETURNS TABLE(anio text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if user has access to company
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied to company data';
  END IF;

  RETURN QUERY
  SELECT DISTINCT rf.anio
  FROM ratios_financieros rf
  WHERE rf.company_id = _company_id 
  ORDER BY anio DESC;
END;
$function$;