-- Update company_pages to include dead-point (breakeven) in enabled pages
UPDATE public.company_pages 
SET enabled_pages = array_append(enabled_pages, 'dead-point')
WHERE NOT ('dead-point' = ANY(enabled_pages));

-- For companies that don't have company_pages record yet, create one with breakeven included
INSERT INTO public.company_pages (company_id, enabled_pages)
SELECT c.id, ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'dead-point']::text[]
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_pages cp 
  WHERE cp.company_id = c.id
);

-- Update existing companies to include dead-point if they don't have it
UPDATE public.company_pages 
SET enabled_pages = array_append(enabled_pages, 'dead-point'),
    updated_at = now()
WHERE NOT ('dead-point' = ANY(enabled_pages));