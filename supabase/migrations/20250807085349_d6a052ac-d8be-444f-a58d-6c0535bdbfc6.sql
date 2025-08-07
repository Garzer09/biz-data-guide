-- Remove 'profile' from enabled_pages array for all companies
UPDATE company_pages 
SET enabled_pages = array_remove(enabled_pages, 'profile')
WHERE 'profile' = ANY(enabled_pages);