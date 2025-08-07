-- Update company_pages to include all the new page structure
UPDATE company_pages 
SET enabled_pages = ARRAY[
  'dashboard',
  'company_profile', 
  'pyg',
  'balance',
  'ratios', 
  'cashflow',
  'nof',
  'breakeven',
  'debts',
  'debt_service',
  'pyg_analytic',
  'sales_segments',
  'assumptions',
  'projections', 
  'sensitivity',
  'eva',
  'conclusions'
]
WHERE enabled_pages IS NOT NULL;

-- For companies that don't have any pages configured yet, set the default
INSERT INTO company_pages (company_id, enabled_pages)
SELECT c.id, ARRAY[
  'dashboard',
  'company_profile', 
  'pyg',
  'balance',
  'ratios', 
  'cashflow',
  'nof',
  'breakeven',
  'debts',
  'debt_service',
  'pyg_analytic',
  'sales_segments',
  'assumptions',
  'projections', 
  'sensitivity',
  'eva',
  'conclusions'
]
FROM companies c
WHERE c.id NOT IN (SELECT company_id FROM company_pages);