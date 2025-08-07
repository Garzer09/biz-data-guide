-- Update get_current_user_role() to be exactly as specified
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update is_current_user_admin() to use get_current_user_role()
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

-- Update has_company_access() to follow the specified logic
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.is_current_user_admin() THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.user_companies 
        WHERE user_id = auth.uid() AND company_id = _company_id
      )
    END;
$$;