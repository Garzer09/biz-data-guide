-- Create view for company ratios with standardized format
CREATE OR REPLACE VIEW public.vw_ratios_empresa AS
SELECT 
  rf.company_id,
  rf.anio,
  rf.periodo,
  rf.ratio_name as nombre,
  rf.ratio_value as valor,
  rf.benchmark,
  rf.created_at,
  rf.updated_at,
  -- Add calculated fields for trend analysis
  CASE 
    WHEN rf.benchmark IS NOT NULL AND rf.ratio_value IS NOT NULL THEN
      CASE 
        WHEN rf.ratio_value >= rf.benchmark THEN 'FAVORABLE'
        WHEN rf.ratio_value >= rf.benchmark * 0.8 THEN 'ACEPTABLE' 
        ELSE 'DESFAVORABLE'
      END
    ELSE 'SIN_BENCHMARK'
  END as evaluacion,
  -- Calculate deviation from benchmark
  CASE 
    WHEN rf.benchmark IS NOT NULL AND rf.benchmark > 0 AND rf.ratio_value IS NOT NULL THEN
      ROUND(((rf.ratio_value - rf.benchmark) / rf.benchmark * 100), 2)
    ELSE NULL
  END as desviacion_pct
FROM public.ratios_financieros rf
WHERE rf.ratio_value IS NOT NULL
ORDER BY rf.company_id, rf.anio, rf.periodo, rf.ratio_name;

-- Create additional view for latest ratios per company
CREATE OR REPLACE VIEW public.vw_ratios_empresa_latest AS
SELECT DISTINCT ON (rf.company_id, rf.ratio_name) 
  rf.company_id,
  c.name as company_name,
  rf.anio,
  rf.periodo,
  rf.ratio_name as nombre,
  rf.ratio_value as valor,
  rf.benchmark,
  -- Evaluation
  CASE 
    WHEN rf.benchmark IS NOT NULL AND rf.ratio_value IS NOT NULL THEN
      CASE 
        WHEN rf.ratio_value >= rf.benchmark THEN 'FAVORABLE'
        WHEN rf.ratio_value >= rf.benchmark * 0.8 THEN 'ACEPTABLE' 
        ELSE 'DESFAVORABLE'
      END
    ELSE 'SIN_BENCHMARK'
  END as evaluacion,
  -- Deviation percentage
  CASE 
    WHEN rf.benchmark IS NOT NULL AND rf.benchmark > 0 AND rf.ratio_value IS NOT NULL THEN
      ROUND(((rf.ratio_value - rf.benchmark) / rf.benchmark * 100), 2)
    ELSE NULL
  END as desviacion_pct,
  rf.created_at,
  rf.updated_at
FROM public.ratios_financieros rf
INNER JOIN public.companies c ON c.id = rf.company_id
WHERE rf.ratio_value IS NOT NULL
ORDER BY rf.company_id, rf.ratio_name, rf.anio DESC, rf.periodo DESC;

-- Create view for ratio categories summary
CREATE OR REPLACE VIEW public.vw_ratios_categorias AS
SELECT 
  rf.company_id,
  c.name as company_name,
  rf.anio,
  rf.periodo,
  -- Liquidity ratios
  MAX(CASE WHEN rf.ratio_name = 'Liquidez Corriente' THEN rf.ratio_value END) as liquidez_corriente,
  MAX(CASE WHEN rf.ratio_name = 'Liquidez Corriente' THEN rf.benchmark END) as liquidez_corriente_benchmark,
  -- Leverage ratios  
  MAX(CASE WHEN rf.ratio_name = 'Ratio Endeudamiento' THEN rf.ratio_value END) as ratio_endeudamiento,
  MAX(CASE WHEN rf.ratio_name = 'Ratio Endeudamiento' THEN rf.benchmark END) as ratio_endeudamiento_benchmark,
  MAX(CASE WHEN rf.ratio_name = 'Apalancamiento' THEN rf.ratio_value END) as apalancamiento,
  MAX(CASE WHEN rf.ratio_name = 'Deuda/EBITDA' THEN rf.ratio_value END) as deuda_ebitda,
  MAX(CASE WHEN rf.ratio_name = 'Deuda/EBITDA' THEN rf.benchmark END) as deuda_ebitda_benchmark,
  -- Profitability ratios
  MAX(CASE WHEN rf.ratio_name = 'ROA' THEN rf.ratio_value END) as roa,
  MAX(CASE WHEN rf.ratio_name = 'ROA' THEN rf.benchmark END) as roa_benchmark,
  MAX(CASE WHEN rf.ratio_name = 'ROE' THEN rf.ratio_value END) as roe,
  MAX(CASE WHEN rf.ratio_name = 'ROE' THEN rf.benchmark END) as roe_benchmark,
  -- Activity ratios
  MAX(CASE WHEN rf.ratio_name = 'Rotación Activos' THEN rf.ratio_value END) as rotacion_activos,
  MAX(CASE WHEN rf.ratio_name = 'Rotación Activos' THEN rf.benchmark END) as rotacion_activos_benchmark,
  -- Coverage ratios
  MAX(CASE WHEN rf.ratio_name = 'Cobertura Intereses' THEN rf.ratio_value END) as cobertura_intereses,
  MAX(CASE WHEN rf.ratio_name = 'Cobertura Intereses' THEN rf.benchmark END) as cobertura_intereses_benchmark,
  -- Structure ratios
  MAX(CASE WHEN rf.ratio_name = 'Capitalización' THEN rf.ratio_value END) as capitalizacion,
  MAX(CASE WHEN rf.ratio_name = 'Capitalización' THEN rf.benchmark END) as capitalizacion_benchmark
FROM public.ratios_financieros rf
INNER JOIN public.companies c ON c.id = rf.company_id
WHERE rf.ratio_value IS NOT NULL
GROUP BY rf.company_id, c.name, rf.anio, rf.periodo
ORDER BY rf.company_id, rf.anio DESC, rf.periodo DESC;