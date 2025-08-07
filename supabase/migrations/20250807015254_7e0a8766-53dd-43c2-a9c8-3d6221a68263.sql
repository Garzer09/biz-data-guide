-- Create company_profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  company_id    uuid        PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  sector        text        NULL,
  industria     text        NULL,
  año_fundacion int         NULL,
  empleados     int         NULL,
  ingresos_anuales numeric   NULL,
  sede          text        NULL,
  sitio_web     text        NULL,
  descripcion   text        NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for company_profiles
CREATE POLICY "Users can view company_profiles for assigned companies" 
ON public.company_profiles 
FOR SELECT 
USING (
  (get_current_user_role() = 'admin'::text) OR 
  (EXISTS ( 
    SELECT 1
    FROM user_companies
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = company_profiles.company_id
  ))
);

CREATE POLICY "Only admins can manage company_profiles" 
ON public.company_profiles 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();