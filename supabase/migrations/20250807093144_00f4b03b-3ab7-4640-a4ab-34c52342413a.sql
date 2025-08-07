-- Add company_code field to companies table
ALTER TABLE public.companies ADD COLUMN company_code text;

-- Create unique index on company_code
CREATE UNIQUE INDEX companies_company_code_key ON public.companies(company_code) WHERE company_code IS NOT NULL;

-- Add some sample company codes for existing companies
UPDATE public.companies SET company_code = 'EMP_DEMO_2' WHERE name = 'Empresa Demo 2';
UPDATE public.companies SET company_code = 'EMP_DEMO_3' WHERE name = 'Empresa Demo 3';
UPDATE public.companies SET company_code = 'ALAN_COAR' WHERE name = 'Alan Coar';
UPDATE public.companies SET company_code = 'CAROLINA_DURANTE' WHERE name = 'Carolina Durante';
UPDATE public.companies SET company_code = 'PRUEBA_AAA' WHERE name = 'Prueba AAA';