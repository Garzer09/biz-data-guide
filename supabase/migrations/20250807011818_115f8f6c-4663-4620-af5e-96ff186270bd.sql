-- Update catalog_pyg_concepts table structure
ALTER TABLE public.catalog_pyg_concepts 
DROP CONSTRAINT IF EXISTS catalog_pyg_concepts_pkey;

ALTER TABLE public.catalog_pyg_concepts 
ADD PRIMARY KEY (concepto_codigo);

-- Make grupo NOT NULL and add CHECK constraint
UPDATE public.catalog_pyg_concepts 
SET grupo = 'Ingresos' 
WHERE grupo IS NULL;

ALTER TABLE public.catalog_pyg_concepts 
ALTER COLUMN grupo SET NOT NULL;

ALTER TABLE public.catalog_pyg_concepts 
ADD CONSTRAINT catalog_pyg_concepts_grupo_check 
CHECK (grupo IN ('Ingresos','Costes','Gastos','Financieros','No Operativo','Impuestos'));

-- Make concepto_nombre NOT NULL
ALTER TABLE public.catalog_pyg_concepts 
ALTER COLUMN concepto_nombre SET NOT NULL;

-- Insert the 15 standard concepts
INSERT INTO public.catalog_pyg_concepts (concepto_codigo, concepto_nombre, grupo, obligatorio) VALUES
('PYG_INGRESOS','Ingresos','Ingresos',TRUE),
('PYG_DEVOLUCIONES_DESCUENTOS','Devoluciones/Descuentos','Ingresos',FALSE),
('PYG_COSTE_VENTAS','Coste de Ventas','Costes',TRUE),
('PYG_GASTOS_PERSONAL','Gastos de Personal','Gastos',FALSE),
('PYG_ALQUILERES','Alquileres y Suministros','Gastos',FALSE),
('PYG_MARKETING_VENTAS','Marketing y Ventas','Gastos',FALSE),
('PYG_GASTOS_OPERATIVOS','Otros Gastos Operativos','Gastos',TRUE),
('PYG_DEPRECIACION','Depreciación','Gastos',FALSE),
('PYG_AMORTIZACION','Amortización','Gastos',FALSE),
('PYG_OTROS_INGRESOS_OP','Otros Ingresos Operativos','Ingresos',FALSE),
('PYG_OTROS_GASTOS_OP','Otros Gastos Operativos','Gastos',FALSE),
('PYG_INGRESOS_FIN','Ingresos Financieros','Financieros',FALSE),
('PYG_GASTOS_FIN','Gastos Financieros','Financieros',FALSE),
('PYG_RESULTADO_EXTRA','Resultado Extraordinario','No Operativo',FALSE),
('PYG_IMPUESTOS','Impuestos','Impuestos',TRUE)
ON CONFLICT (concepto_codigo) DO NOTHING;