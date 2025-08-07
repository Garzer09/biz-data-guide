-- Update the check constraint to allow 'company_profile' type
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_tipo_check;

-- Add the updated constraint with the new company_profile type
ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo IN ('pyg_anual', 'company_profile'));