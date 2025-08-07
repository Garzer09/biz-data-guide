-- Create company_profile table
CREATE TABLE public.company_profile (
  company_id UUID NOT NULL PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  sector TEXT,
  industria TEXT,
  empleados INTEGER,
  sede_principal TEXT,
  web TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company_profile for assigned companies"
ON public.company_profile
FOR SELECT
USING (
  (get_current_user_role() = 'admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = company_profile.company_id
  ))
);

CREATE POLICY "Only admins can manage company_profile"
ON public.company_profile
FOR ALL
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_company_profile_updated_at
BEFORE UPDATE ON public.company_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();