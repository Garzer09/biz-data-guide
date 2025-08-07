-- Add 'empresa' to the default enabled pages for company_pages
UPDATE company_pages 
SET enabled_pages = ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'sensibilidad', 'proyecciones', 'eva', 'conclusiones']
WHERE enabled_pages = ARRAY['dashboard', 'pyg', 'balance', 'cashflow', 'ratios', 'sensibilidad', 'proyecciones', 'eva', 'conclusiones'];

-- Update the default value for new company_pages entries
ALTER TABLE company_pages 
ALTER COLUMN enabled_pages SET DEFAULT ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'sensibilidad', 'proyecciones', 'eva', 'conclusiones'];