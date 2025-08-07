-- Add NOF page to company enabled pages
UPDATE public.company_pages 
SET enabled_pages = array_append(enabled_pages, 'nof'),
    updated_at = now()
WHERE NOT ('nof' = ANY(enabled_pages));

-- For companies that don't have company_pages record yet, include nof
INSERT INTO public.company_pages (company_id, enabled_pages)
SELECT c.id, ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'dead-point', 'nof']::text[]
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_pages cp 
  WHERE cp.company_id = c.id
);

-- Ensure all existing companies have nof in their enabled pages
UPDATE public.company_pages 
SET enabled_pages = array_append(enabled_pages, 'nof'),
    updated_at = now()
WHERE NOT ('nof' = ANY(enabled_pages));