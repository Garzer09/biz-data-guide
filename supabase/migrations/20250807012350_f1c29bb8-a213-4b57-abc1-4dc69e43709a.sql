-- Update existing data to match new constraint
UPDATE public.import_jobs 
SET tipo = 'pyg_anual' 
WHERE tipo = 'income';

-- Now apply the migration with the corrected data
-- Add storage_path column if it doesn't exist
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Make storage_path NOT NULL (set a default first for existing rows)
UPDATE public.import_jobs 
SET storage_path = 'unknown' 
WHERE storage_path IS NULL;

ALTER TABLE public.import_jobs 
ALTER COLUMN storage_path SET NOT NULL;

-- Add actualizado_en column if it doesn't exist
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT now();

-- Make actualizado_en NOT NULL
ALTER TABLE public.import_jobs 
ALTER COLUMN actualizado_en SET NOT NULL;

-- Add resumen JSONB column
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS resumen JSONB;

-- Update CHECK constraints for tipo (only 'pyg_anual' allowed)
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_tipo_check;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_tipo_check 
CHECK (tipo = 'pyg_anual');

-- Update CHECK constraints for estado
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_estado_check;

-- First update existing 'PENDING' values to 'pending'
UPDATE public.import_jobs 
SET estado = 'pending' 
WHERE estado = 'PENDING';

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_estado_check 
CHECK (estado IN ('pending','processing','done','failed'));

-- Change default for estado
ALTER TABLE public.import_jobs 
ALTER COLUMN estado SET DEFAULT 'pending';

-- Add foreign key constraint to companies with CASCADE
ALTER TABLE public.import_jobs 
DROP CONSTRAINT IF EXISTS import_jobs_company_id_fkey;

ALTER TABLE public.import_jobs 
ADD CONSTRAINT import_jobs_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Remove old columns that are replaced by resumen JSONB
ALTER TABLE public.import_jobs 
DROP COLUMN IF EXISTS total_rows,
DROP COLUMN IF EXISTS ok_rows,
DROP COLUMN IF EXISTS error_rows;

-- Create trigger for automatically updating actualizado_en
CREATE OR REPLACE FUNCTION update_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER trigger_update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_jobs_updated_at();