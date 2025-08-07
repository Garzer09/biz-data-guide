-- 1. NOF Total (en €) - Working Capital Needs
CREATE OR REPLACE FUNCTION public.get_nof_total(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  -- Check access first
  SELECT
    CASE 
      WHEN NOT has_company_access(_company_id) THEN NULL
      ELSE
        COALESCE(
          SUM(
            (COALESCE(b.clientes,0)
             + COALESCE(b.otros_deudores_op,0)
             + COALESCE(b.inventario,0)
             + COALESCE(b.anticipos_clientes,0)
             + COALESCE(b.trabajos_en_curso,0))
            - (COALESCE(b.proveedores,0)
               + COALESCE(b.otros_acreedores_op,0))
          ),0)
    END
  FROM wc_operating_balances b
  WHERE b.company_id = _company_id
    AND b.periodo LIKE _anio || '%';
$$;

-- 2. Días de ciclo (NOF en € / ventas diarias)
CREATE OR REPLACE FUNCTION public.get_nof_days_cycle(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT
    CASE 
      WHEN NOT has_company_access(_company_id) THEN NULL
      WHEN ventas_diarias = 0 OR ventas_diarias IS NULL THEN NULL
      ELSE get_nof_total(_company_id,_anio) / ventas_diarias
    END
  FROM (
    SELECT
      COALESCE(vp.ingresos,0) / NULLIF(360,0) AS ventas_diarias
    FROM vw_pyg_anual vp
    WHERE vp.company_id = _company_id
      AND vp.anio = _anio
  ) sub;
$$;

-- 3. Desglose componentes NOF
CREATE OR REPLACE FUNCTION public.get_nof_components(_company_id uuid, _anio text)
RETURNS TABLE(
  componente text,
  valor numeric
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 'Existencias'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(SUM(inventario), 0) 
              ELSE NULL 
         END   
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Clientes'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(SUM(clientes), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Otros Deudores'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(SUM(otros_deudores_op), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Anticipos Clientes'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(SUM(anticipos_clientes), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Trabajos en Curso'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(SUM(trabajos_en_curso), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Proveedores'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(-SUM(proveedores), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%' 
  
  UNION ALL
  
  SELECT 'Otros Acreedores'::text, 
         CASE WHEN has_company_access(_company_id) 
              THEN COALESCE(-SUM(otros_acreedores_op), 0) 
              ELSE NULL 
         END 
  FROM wc_operating_balances 
  WHERE company_id = _company_id AND periodo LIKE _anio || '%';
$$;

-- 4. Function to get NOF years available
CREATE OR REPLACE FUNCTION public.get_nof_years(_company_id uuid)
RETURNS TABLE(anio text)
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT DISTINCT LEFT(wob.periodo, 4) AS anio
  FROM wc_operating_balances wob
  WHERE wob.company_id = _company_id
    AND has_company_access(_company_id)
  ORDER BY anio DESC;
$$;

-- 5. Vista unificada NOF
CREATE OR REPLACE VIEW public.vw_nof_summary AS
SELECT
  wob.company_id,
  wob.periodo,
  get_nof_total(wob.company_id, LEFT(wob.periodo,4)) AS nof_total,
  get_nof_days_cycle(wob.company_id, LEFT(wob.periodo,4)) AS dias_ciclo,
  -- Individual components for analysis
  COALESCE(wob.clientes, 0) AS clientes,
  COALESCE(wob.inventario, 0) AS inventario,
  COALESCE(wob.otros_deudores_op, 0) AS otros_deudores,
  COALESCE(wob.anticipos_clientes, 0) AS anticipos_clientes,
  COALESCE(wob.trabajos_en_curso, 0) AS trabajos_en_curso,
  COALESCE(wob.proveedores, 0) AS proveedores,
  COALESCE(wob.otros_acreedores_op, 0) AS otros_acreedores
FROM wc_operating_balances wob
WHERE has_company_access(wob.company_id);

-- 6. NOF Ratios calculation
CREATE OR REPLACE FUNCTION public.get_nof_ratios(_company_id uuid, _anio text)
RETURNS TABLE(
  ratio_name text,
  ratio_value numeric,
  interpretation text
)
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  WITH nof_data AS (
    SELECT 
      get_nof_total(_company_id, _anio) AS nof_total,
      get_nof_days_cycle(_company_id, _anio) AS dias_ciclo,
      COALESCE(vp.ingresos, 0) AS ingresos
    FROM vw_pyg_anual vp
    WHERE vp.company_id = _company_id AND vp.anio = _anio
  )
  SELECT 'NOF Total'::text, 
         CASE WHEN has_company_access(_company_id) THEN nof_total ELSE NULL END,
         CASE 
           WHEN nof_total > 0 THEN 'NOF positiva: empresa financia a clientes/inventario'
           WHEN nof_total < 0 THEN 'NOF negativa: proveedores financian la operación'
           ELSE 'NOF neutra'
         END::text
  FROM nof_data
  
  UNION ALL
  
  SELECT 'Días de Ciclo'::text,
         CASE WHEN has_company_access(_company_id) THEN dias_ciclo ELSE NULL END,
         CASE 
           WHEN dias_ciclo > 60 THEN 'Ciclo largo: revisar gestión de cobros/inventario'
           WHEN dias_ciclo > 30 THEN 'Ciclo normal: gestión adecuada'
           WHEN dias_ciclo > 0 THEN 'Ciclo corto: gestión eficiente'
           WHEN dias_ciclo < 0 THEN 'Ciclo negativo: proveedores financian totalmente'
           ELSE 'Sin datos suficientes'
         END::text
  FROM nof_data
  
  UNION ALL
  
  SELECT 'NOF sobre Ventas (%)'::text,
         CASE 
           WHEN has_company_access(_company_id) AND ingresos > 0 
           THEN (nof_total / ingresos) * 100 
           ELSE NULL 
         END,
         CASE 
           WHEN ingresos = 0 THEN 'Sin ventas para comparar'
           WHEN (nof_total / ingresos) * 100 > 20 THEN 'Alto: NOF elevada respecto a ventas'
           WHEN (nof_total / ingresos) * 100 > 10 THEN 'Moderado: NOF aceptable'
           WHEN (nof_total / ingresos) * 100 > 0 THEN 'Bajo: NOF controlada'
           ELSE 'Negativo: proveedores financian operación'
         END::text
  FROM nof_data;
$$;