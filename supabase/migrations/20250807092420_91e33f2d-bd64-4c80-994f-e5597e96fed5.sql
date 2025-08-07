-- Drop the existing check constraint
ALTER TABLE public.import_jobs DROP CONSTRAINT import_jobs_tipo_check;

-- Add the updated check constraint that includes cashflow types
ALTER TABLE public.import_jobs ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo = ANY (ARRAY[
  'pyg_anual'::text, 
  'company_profile'::text, 
  'balance_operativo'::text, 
  'balance_financiero'::text,
  'cashflow_operativo'::text,
  'cashflow_inversion'::text,
  'cashflow_financiacion'::text
]));