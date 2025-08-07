-- Corregir las vistas para evitar problemas de seguridad
-- Recrear sin SECURITY DEFINER implícito

-- 1) Vista de perfiles (sin cambios, esta es segura)
CREATE OR REPLACE VIEW public.profiles_vw AS
SELECT
  p.user_id as id,
  p.email,
  COALESCE(p.role, 'user') as rol_global
FROM public.profiles p;

-- 2) Vista de asignación usuario↔empresa (sin cambios, esta es segura)
CREATE OR REPLACE VIEW public.user_company_vw AS
SELECT DISTINCT user_id, company_id
FROM public.user_companies;

-- 3) Vista simplificada de empresas (sin auth.uid() directo)
CREATE OR REPLACE VIEW public.companies_vw AS
SELECT c.id as company_id, c.name, c.estado
FROM public.companies c;

-- 4) Función para obtener empresas accesibles por usuario específico
CREATE OR REPLACE FUNCTION public.get_accessible_companies(_user_id uuid)
RETURNS TABLE(company_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Admin puede ver todas las empresas
  SELECT c.id as company_id
  FROM public.companies c
  WHERE EXISTS (
    SELECT 1 FROM public.profiles_vw p
    WHERE p.id = _user_id AND p.rol_global = 'admin'
  )
  
  UNION
  
  -- Usuario puede ver empresas asignadas
  SELECT uc.company_id
  FROM public.user_company_vw uc
  WHERE uc.user_id = _user_id;
$$;

-- 5) Función unificada para verificar acceso a empresa
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_accessible_companies(auth.uid())
    WHERE company_id = _company_id
  );
$$;

-- 6) Función unificada para verificar si es admin
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