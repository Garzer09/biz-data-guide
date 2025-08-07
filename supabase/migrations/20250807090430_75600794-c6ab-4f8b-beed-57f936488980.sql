-- Update the check constraint to include new balance import types
ALTER TABLE public.import_jobs 
DROP CONSTRAINT import_jobs_tipo_check;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo = ANY (ARRAY['pyg_anual'::text, 'company_profile'::text, 'balance_operativo'::text, 'balance_financiero'::text]));