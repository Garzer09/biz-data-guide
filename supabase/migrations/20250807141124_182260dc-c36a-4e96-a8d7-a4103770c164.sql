-- Add 'debts' to the import_jobs tipo check constraint
ALTER TABLE import_jobs 
DROP CONSTRAINT import_jobs_tipo_check;

ALTER TABLE import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo = ANY (ARRAY[
  'balance_operativo'::text, 
  'balance_financiero'::text, 
  'pyg_anual'::text, 
  'cashflow_operativo'::text, 
  'cashflow_inversion'::text, 
  'cashflow_financiacion'::text, 
  'company_profile'::text, 
  'ratios'::text,
  'debts'::text
]));