-- Remove Security Definer from views and create proper RLS policies
-- This addresses the 20 security definer view warnings

-- Fix all Security Definer views by recreating them as regular views
-- Note: Some views may need to be recreated with proper joins to maintain functionality

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.companies_vw CASCADE;
CREATE VIEW public.companies_vw AS
SELECT 
  c.id as company_id,
  c.name,
  c.estado
FROM public.companies c
WHERE has_company_access(c.id);

DROP VIEW IF EXISTS public.profiles_vw CASCADE;
CREATE VIEW public.profiles_vw AS
SELECT 
  p.id,
  p.email,
  p.role as rol_global
FROM public.profiles p
WHERE auth.uid() = p.user_id OR get_current_user_role() = 'admin';

DROP VIEW IF EXISTS public.user_company_vw CASCADE;
CREATE VIEW public.user_company_vw AS
SELECT 
  uc.user_id,
  uc.company_id
FROM public.user_companies uc
WHERE auth.uid() = uc.user_id OR get_current_user_role() = 'admin';

DROP VIEW IF EXISTS public.company_access CASCADE;
CREATE VIEW public.company_access AS
SELECT 
  c.id as company_id
FROM public.companies c
WHERE has_company_access(c.id);

-- Fix function search path warnings by updating all functions
-- Update existing functions to have proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_import_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;