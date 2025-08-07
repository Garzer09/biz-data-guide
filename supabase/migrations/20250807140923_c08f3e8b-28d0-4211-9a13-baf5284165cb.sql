-- Update company_pages to include pool-bancario for all companies
UPDATE company_pages 
SET enabled_pages = enabled_pages || ARRAY['pool-bancario']
WHERE NOT ('pool-bancario' = ANY(enabled_pages));

-- For companies that don't have a company_pages record yet, create one with default pages including pool-bancario
INSERT INTO company_pages (company_id, enabled_pages)
SELECT c.id, ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'breakeven', 'nof', 'pool-bancario']
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_pages cp WHERE cp.company_id = c.id
);