-- Update all strategy tool URLs to use the correct domain
UPDATE public.strategies 
SET tool_url = REPLACE(tool_url, 'https://tools.eiduk.tax/', 'https://tools.eiduktaxandwealth.com/')
WHERE tool_url LIKE 'https://tools.eiduk.tax/%';