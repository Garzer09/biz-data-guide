-- Create or update pyg_annual table structure
-- The table already exists, so we'll modify it to match specifications

-- Make valor_total NOT NULL
ALTER TABLE public.pyg_annual 
ALTER COLUMN valor_total SET NOT NULL;

-- Add foreign key constraint to companies with cascade delete
ALTER TABLE public.pyg_annual 
DROP CONSTRAINT IF EXISTS pyg_annual_company_id_fkey;

ALTER TABLE public.pyg_annual 
ADD CONSTRAINT pyg_annual_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- The foreign key to catalog_pyg_concepts was already created in previous migration
-- Add UNIQUE constraint on (company_id, anio, concepto_codigo)
ALTER TABLE public.pyg_annual 
DROP CONSTRAINT IF EXISTS pyg_annual_company_anio_concepto_unique;

ALTER TABLE public.pyg_annual 
ADD CONSTRAINT pyg_annual_company_anio_concepto_unique 
UNIQUE (company_id, anio, concepto_codigo);

-- Create index on (company_id, anio)
DROP INDEX IF EXISTS idx_pyg_annual_company_anio;
CREATE INDEX idx_pyg_annual_company_anio ON public.pyg_annual (company_id, anio);