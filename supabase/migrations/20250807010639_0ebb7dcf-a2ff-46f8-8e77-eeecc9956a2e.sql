-- 1) Vista de perfiles con rol derivado de la columna 'role' en profiles
CREATE OR REPLACE VIEW public.profiles_vw AS
SELECT
  p.user_id as id,
  p.email,
  COALESCE(p.role, 'user') as rol_global
FROM public.profiles p;

-- 2) Vista de asignación usuario↔empresa
CREATE OR REPLACE VIEW public.user_company_vw AS
SELECT DISTINCT user_id, company_id
FROM public.user_companies;

-- 3) Vista de empresas accesibles por el usuario autenticado
CREATE OR REPLACE VIEW public.company_access AS
SELECT c.id as company_id
FROM public.companies c
WHERE EXISTS (
  SELECT 1 FROM public.profiles_vw p
  WHERE p.id = auth.uid() AND p.rol_global = 'admin'
)
OR EXISTS (
  SELECT 1 FROM public.user_company_vw uc
  WHERE uc.user_id = auth.uid() AND uc.company_id = c.id
);

-- 4) Función unificada para verificar acceso a empresa
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_access
    WHERE company_id = _company_id
  );
$$;

-- 5) Función unificada para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles_vw
    WHERE id = auth.uid() AND rol_global = 'admin'
  );
$$;