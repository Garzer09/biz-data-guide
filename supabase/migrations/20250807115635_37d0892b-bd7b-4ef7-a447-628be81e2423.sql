-- Create ratios_financieros table for storing financial ratios
CREATE TABLE IF NOT EXISTS public.ratios_financieros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  anio text NOT NULL,
  periodo text NOT NULL,
  ratio_name text NOT NULL,
  ratio_value numeric,
  benchmark numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, anio, periodo, ratio_name)
);

-- Enable RLS on ratios_financieros
ALTER TABLE public.ratios_financieros ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ratios_financieros
CREATE POLICY "Only admins can manage ratios_financieros" 
ON public.ratios_financieros 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view ratios_financieros for assigned companies" 
ON public.ratios_financieros 
FOR SELECT 
USING (
  (get_current_user_role() = 'admin') OR 
  (EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = ratios_financieros.company_id
  ))
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ratios_financieros_updated_at
BEFORE UPDATE ON public.ratios_financieros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();