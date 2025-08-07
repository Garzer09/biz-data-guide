-- Actualizar la constraint de import_jobs para incluir debt_service
ALTER TABLE import_jobs DROP CONSTRAINT IF EXISTS import_jobs_tipo_check;

ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo IN (
  'pyg_anual', 
  'pyg_analytic', 
  'company_profile', 
  'balance_operativo', 
  'balance_financiero', 
  'cashflow_operativo', 
  'cashflow_inversion', 
  'cashflow_financiacion', 
  'ratios', 
  'debt_service',
  'debts'
));