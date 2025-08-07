-- Seed data for testing
-- First ensure we have sample companies
INSERT INTO companies (id, name, cif_nif, sector, estado) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Empresa Demo S.L.', 'B12345678', 'Servicios', 'ACTIVO'),
  ('22222222-2222-2222-2222-222222222222', 'TechCorp Solutions', 'B87654321', 'Tecnología', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- Seed P&G annual data for 2023 and 2024
INSERT INTO pyg_annual (company_id, anio, concepto_codigo, valor_total) VALUES
  -- Empresa Demo S.L. - 2023
  ('11111111-1111-1111-1111-111111111111', '2023', '7000', 2500000),  -- Ingresos
  ('11111111-1111-1111-1111-111111111111', '2023', '6000', -1500000), -- Coste Ventas
  ('11111111-1111-1111-1111-111111111111', '2023', '6400', -600000),  -- OPEX (Gastos personal)
  ('11111111-1111-1111-1111-111111111111', '2023', '6300', -50000),   -- Impuestos
  
  -- Empresa Demo S.L. - 2024
  ('11111111-1111-1111-1111-111111111111', '2024', '7000', 2800000),  -- Ingresos (+12%)
  ('11111111-1111-1111-1111-111111111111', '2024', '6000', -1650000), -- Coste Ventas (+10%)
  ('11111111-1111-1111-1111-111111111111', '2024', '6400', -650000),  -- OPEX (+8.3%)
  ('11111111-1111-1111-1111-111111111111', '2024', '6300', -55000),   -- Impuestos (+10%)
  
  -- TechCorp Solutions - 2023
  ('22222222-2222-2222-2222-222222222222', '2023', '7000', 1800000),  -- Ingresos
  ('22222222-2222-2222-2222-222222222222', '2023', '6000', -900000),  -- Coste Ventas
  ('22222222-2222-2222-2222-222222222222', '2023', '6400', -450000),  -- OPEX
  ('22222222-2222-2222-2222-222222222222', '2023', '6300', -35000),   -- Impuestos
  
  -- TechCorp Solutions - 2024
  ('22222222-2222-2222-2222-222222222222', '2024', '7000', 2200000),  -- Ingresos (+22.2%)
  ('22222222-2222-2222-2222-222222222222', '2024', '6000', -1100000), -- Coste Ventas (+22.2%)
  ('22222222-2222-2222-2222-222222222222', '2024', '6400', -500000),  -- OPEX (+11.1%)
  ('22222222-2222-2222-2222-222222222222', '2024', '6300', -42000)    -- Impuestos (+20%)
ON CONFLICT (company_id, anio, concepto_codigo) DO UPDATE SET 
  valor_total = EXCLUDED.valor_total;

-- Add concept catalog entries for better display
INSERT INTO catalog_pyg_concepts (concepto_codigo, concepto_nombre, grupo, obligatorio) VALUES
  ('7000', 'Ingresos por Ventas', 'INGRESOS', true),
  ('6000', 'Coste de Ventas', 'COSTES', true),
  ('6400', 'Gastos de Personal (OPEX)', 'GASTOS', true),
  ('6300', 'Tributos e Impuestos', 'GASTOS', true)
ON CONFLICT (concepto_codigo) DO UPDATE SET 
  concepto_nombre = EXCLUDED.concepto_nombre,
  grupo = EXCLUDED.grupo;

-- Create periods for monthly data allocation
INSERT INTO periods (company_id, tipo, periodo) 
SELECT 
  company_id,
  'MENSUAL',
  year || '-' || LPAD(month::text, 2, '0')
FROM 
  (SELECT unnest(ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']) as company_id) companies,
  (SELECT unnest(ARRAY['2023', '2024']) as year) years,
  (SELECT generate_series(1, 12) as month) months
ON CONFLICT (company_id, tipo, periodo) DO NOTHING;

-- Create sample user assignments (assuming we have test users)
-- This will be handled when users actually exist in the system