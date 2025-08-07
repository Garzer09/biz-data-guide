-- First, update existing data
UPDATE public.import_jobs 
SET tipo = 'pyg_anual' 
WHERE tipo = 'income';

UPDATE public.import_jobs 
SET estado = 'done' 
WHERE estado = 'COMPLETED';

UPDATE public.import_jobs 
SET estado = 'pending' 
WHERE estado = 'PENDING';

UPDATE public.import_jobs 
SET estado = 'failed' 
WHERE estado = 'FAILED';

UPDATE public.import_jobs 
SET estado = 'processing' 
WHERE estado = 'PROCESSING';

-- Add new columns
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS resumen JSONB;

-- Set defaults for new columns
UPDATE public.import_jobs 
SET storage_path = 'unknown' 
WHERE storage_path IS NULL;

UPDATE public.import_jobs 
SET actualizado_en = creado_en 
WHERE actualizado_en IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.import_jobs 
ALTER COLUMN storage_path SET NOT NULL;

ALTER TABLE public.import_jobs 
ALTER COLUMN actualizado_en SET NOT NULL;

-- Now add constraints after data is cleaned
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_tipo_check;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo = 'pyg_anual');

ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_estado_check;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_estado_check 
CHECK (estado IN ('pending','processing','done','failed'));

-- Set new defaults
ALTER TABLE public.import_jobs 
ALTER COLUMN estado SET DEFAULT 'pending';

-- Add foreign key
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_company_id_fkey;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;