-- Add the missing columns to company_profiles table
ALTER TABLE public.company_profiles 
  ADD COLUMN estructura_accionarial text,
  ADD COLUMN organigrama text;

-- Update the upsert_company_profile function to include the new columns
CREATE OR REPLACE FUNCTION public.upsert_company_profile(
  _company_id uuid,
  _sector text,
  _industria text,
  "_año_fundacion" integer,
  _empleados integer,
  _ingresos_anuales numeric,
  _sede text,
  _sitio_web text,
  _descripcion text,
  _estructura_accionarial text,
  _organigrama text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.company_profiles (
    company_id, sector, industria, año_fundacion,
    empleados, ingresos_anuales, sede, sitio_web, descripcion,
    estructura_accionarial, organigrama
  ) VALUES (
    _company_id, _sector, _industria, _año_fundacion,
    _empleados, _ingresos_anuales, _sede, _sitio_web, _descripcion,
    _estructura_accionarial, _organigrama
  )
  ON CONFLICT (company_id) DO UPDATE SET
    sector = EXCLUDED.sector,
    industria = EXCLUDED.industria,
    año_fundacion = EXCLUDED.año_fundacion,
    empleados = EXCLUDED.empleados,
    ingresos_anuales = EXCLUDED.ingresos_anuales,
    sede = EXCLUDED.sede,
    sitio_web = EXCLUDED.sitio_web,
    descripcion = EXCLUDED.descripcion,
    estructura_accionarial = EXCLUDED.estructura_accionarial,
    organigrama = EXCLUDED.organigrama,
    updated_at = now();
END;
$function$