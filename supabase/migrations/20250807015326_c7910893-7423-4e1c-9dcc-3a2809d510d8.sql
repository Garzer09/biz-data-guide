CREATE OR REPLACE FUNCTION public.get_company_profile(_company_id uuid)
RETURNS TABLE (
  sector text, 
  industria text, 
  año_fundacion int,
  empleados int, 
  ingresos_anuales numeric,
  sede text, 
  sitio_web text, 
  descripcion text,
  updated_at timestamptz
)
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT sector, industria, año_fundacion, empleados,
         ingresos_anuales, sede, sitio_web, descripcion,
         updated_at
  FROM public.company_profiles
  WHERE company_id = _company_id;
$$;