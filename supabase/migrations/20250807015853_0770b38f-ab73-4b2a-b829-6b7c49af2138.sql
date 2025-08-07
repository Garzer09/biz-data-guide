-- Add new JSONB columns to company_profiles
ALTER TABLE public.company_profiles
  ADD COLUMN estructura_accionarial jsonb NULL,   -- e.g. [{"accionista":"Juan","%":40},…]
  ADD COLUMN organigrama jsonb NULL;              -- e.g. {"CEO":"María","CFO":"Luis",…}

-- Update the get_company_profile function to include new fields
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
  estructura_accionarial jsonb,
  organigrama jsonb,
  updated_at timestamptz
)
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT sector, industria, año_fundacion, empleados,
         ingresos_anuales, sede, sitio_web, descripcion,
         estructura_accionarial, organigrama, updated_at
  FROM public.company_profiles
  WHERE company_id = _company_id;
$$;

-- Update the upsert function to include the new parameters
CREATE OR REPLACE FUNCTION public.upsert_company_profile(
  _company_id          uuid,
  _sector              text,
  _industria           text,
  _año_fundacion       int,
  _empleados           int,
  _ingresos_anuales    numeric,
  _sede                text,
  _sitio_web           text,
  _descripcion         text,
  _estructura_accionarial jsonb,
  _organigrama         jsonb
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.company_profiles (
    company_id, sector, industria, año_fundacion,
    empleados, ingresos_anuales, sede, sitio_web,
    descripcion, estructura_accionarial, organigrama
  ) VALUES (
    _company_id, _sector, _industria, _año_fundacion,
    _empleados, _ingresos_anuales, _sede, _sitio_web,
    _descripcion, _estructura_accionarial, _organigrama
  )
  ON CONFLICT (company_id) DO UPDATE SET
    sector                  = EXCLUDED.sector,
    industria               = EXCLUDED.industria,
    año_fundacion           = EXCLUDED.año_fundacion,
    empleados               = EXCLUDED.empleados,
    ingresos_anuales        = EXCLUDED.ingresos_anuales,
    sede                    = EXCLUDED.sede,
    sitio_web               = EXCLUDED.sitio_web,
    descripcion             = EXCLUDED.descripcion,
    estructura_accionarial  = EXCLUDED.estructura_accionarial,
    organigrama             = EXCLUDED.organigrama,
    updated_at              = now();
END;
$$;