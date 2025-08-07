-- Update company_pages table to include debt page for all existing companies
UPDATE public.company_pages 
SET enabled_pages = array_append(enabled_pages, 'debt')
WHERE NOT ('debt' = ANY(enabled_pages));

-- For companies that don't have a company_pages record yet, create one with debt included
INSERT INTO public.company_pages (company_id, enabled_pages)
SELECT c.id, ARRAY['dashboard', 'empresa', 'pyg', 'balance', 'cashflow', 'ratios', 'sensibilidad', 'proyecciones', 'eva', 'conclusiones', 'nof', 'debt']
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_pages cp WHERE cp.company_id = c.id
);