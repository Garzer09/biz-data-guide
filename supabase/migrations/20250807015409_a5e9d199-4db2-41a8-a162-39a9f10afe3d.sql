CREATE OR REPLACE FUNCTION public.upsert_company_profile(
  _company_id       uuid,
  _sector           text,
  _industria        text,
  _año_fundacion    int,
  _empleados        int,
  _ingresos_anuales numeric,
  _sede             text,
  _sitio_web        text,
  _descripcion      text
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.company_profiles (
    company_id, sector, industria, año_fundacion,
    empleados, ingresos_anuales, sede, sitio_web, descripcion
  ) VALUES (
    _company_id, _sector, _industria, _año_fundacion,
    _empleados, _ingresos_anuales, _sede, _sitio_web, _descripcion
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
    updated_at = now();
END;
$$;