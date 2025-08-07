-- Create function to get financial ratios for a company and year
CREATE OR REPLACE FUNCTION public.get_ratios_financieros(_company_id uuid, _anio text)
RETURNS TABLE (
  ratio_name text,
  ratio_value numeric,
  benchmark numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _activo_corriente numeric;
  _pasivo_corriente numeric;
  _activo_no_corriente numeric;
  _pasivo_no_corriente numeric;
  _patrimonio_neto numeric;
  _activo_total numeric;
  _pasivo_total numeric;
  _deuda_total numeric;
  _deuda_neta numeric;
  _tesoreria numeric;
  _ingresos numeric;
  _beneficio_neto numeric;
  _ebitda numeric;
  _gastos_financieros numeric;
BEGIN
  -- Check if user has access to company
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied to company data';
  END IF;

  -- Get balance sheet data (latest period of the year)
  SELECT 
    COALESCE(wfb.activo_corriente, 0),
    COALESCE(wfb.pasivo_corriente, 0),
    COALESCE(wfb.activo_no_corriente, 0),
    COALESCE(wfb.pasivo_no_corriente, 0),
    COALESCE(wfb.patrimonio_neto, 0)
  INTO
    _activo_corriente,
    _pasivo_corriente,
    _activo_no_corriente,
    _pasivo_no_corriente,
    _patrimonio_neto
  FROM wc_financial_balances wfb
  WHERE wfb.company_id = _company_id 
    AND wfb.periodo LIKE _anio || '%'
  ORDER BY wfb.periodo DESC
  LIMIT 1;

  -- Calculate derived values
  _activo_total := COALESCE(_activo_corriente, 0) + COALESCE(_activo_no_corriente, 0);
  _pasivo_total := COALESCE(_pasivo_corriente, 0) + COALESCE(_pasivo_no_corriente, 0);
  _deuda_total := _pasivo_total;
  
  -- Get cash/treasury from balance (assuming it's part of activo corriente)
  _tesoreria := COALESCE(_activo_corriente * 0.1, 0); -- Placeholder estimation
  _deuda_neta := _deuda_total - _tesoreria;

  -- Get P&G data from annual view
  SELECT 
    COALESCE(vp.ingresos, 0),
    COALESCE(vp.beneficio_neto, 0),
    COALESCE(vp.ebitda, 0),
    COALESCE(vp.gas_fin, 0)
  INTO
    _ingresos,
    _beneficio_neto,
    _ebitda,
    _gastos_financieros
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id 
    AND vp.anio = _anio;

  -- Return financial ratios
  RETURN QUERY
    -- Liquidity ratios
    SELECT 'Liquidez Corriente'::text, 
           CASE WHEN _pasivo_corriente > 0 THEN _activo_corriente / _pasivo_corriente ELSE NULL END,
           1.5::numeric
    UNION ALL
    
    -- Leverage ratios
    SELECT 'Ratio Endeudamiento'::text,
           CASE WHEN _activo_total > 0 THEN _pasivo_total / _activo_total ELSE NULL END,
           0.3::numeric
    UNION ALL
    
    SELECT 'Apalancamiento'::text,
           CASE WHEN _patrimonio_neto > 0 THEN _deuda_total / _patrimonio_neto ELSE NULL END,
           NULL::numeric
    UNION ALL
    
    SELECT 'Deuda/EBITDA'::text,
           CASE WHEN _ebitda > 0 THEN _deuda_neta / _ebitda ELSE NULL END,
           3.0::numeric
    UNION ALL
    
    -- Profitability ratios
    SELECT 'ROA'::text,
           CASE WHEN _activo_total > 0 THEN _beneficio_neto / _activo_total ELSE NULL END,
           0.05::numeric
    UNION ALL
    
    SELECT 'ROE'::text,
           CASE WHEN _patrimonio_neto > 0 THEN _beneficio_neto / _patrimonio_neto ELSE NULL END,
           0.15::numeric
    UNION ALL
    
    -- Activity ratios
    SELECT 'Rotación Activos'::text,
           CASE WHEN _activo_total > 0 THEN _ingresos / _activo_total ELSE NULL END,
           1.0::numeric
    UNION ALL
    
    -- Coverage ratios
    SELECT 'Cobertura Intereses'::text,
           CASE WHEN _gastos_financieros > 0 THEN _ebitda / _gastos_financieros ELSE NULL END,
           3.0::numeric
    UNION ALL
    
    -- Structure ratios
    SELECT 'Capitalización'::text,
           CASE WHEN _pasivo_total > 0 THEN _pasivo_no_corriente / _pasivo_total ELSE NULL END,
           0.7::numeric;

END;
$$;