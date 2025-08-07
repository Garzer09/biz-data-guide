-- Add 'profile' to the enabled pages for the company
UPDATE company_pages 
SET enabled_pages = array_append(enabled_pages, 'profile')
WHERE company_id = '6f9127b8-e137-4bd9-8545-16110bc0023f' 
AND NOT ('profile' = ANY(enabled_pages));