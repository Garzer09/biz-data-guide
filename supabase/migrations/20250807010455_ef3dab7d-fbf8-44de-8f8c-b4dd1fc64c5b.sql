-- Update existing company_pages to include 'empresa' in enabled_pages if not already present
UPDATE company_pages 
SET enabled_pages = array_append(enabled_pages, 'empresa')
WHERE NOT ('empresa' = ANY(enabled_pages));

-- Update the default fallback in the component to include 'empresa'
-- This will be handled in the component code, but we ensure all existing records include it