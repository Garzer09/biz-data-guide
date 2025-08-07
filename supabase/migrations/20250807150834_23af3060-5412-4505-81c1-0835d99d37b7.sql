-- 1.1 Tabla de servicio_deuda mensual
CREATE TABLE public.debt_service (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id),
  periodo        text NOT NULL,       -- p.ej. '2023-06'
  principal      numeric NOT NULL,    -- amortización
  intereses      numeric NOT NULL,    -- gastos financieros
  flujo_operativo numeric NOT NULL,   -- FCO/EBITDA
  creado_en      timestamp with time zone DEFAULT now()
);

-- Enable RLS on debt_service table
ALTER TABLE public.debt_service ENABLE ROW LEVEL SECURITY;

-- RLS policies for debt_service
CREATE POLICY "debt_service_select" 
ON public.debt_service FOR SELECT 
USING (is_current_user_admin() OR has_company_access(company_id));

CREATE POLICY "debt_service_write" 
ON public.debt_service FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

-- 2.1 Años y Meses Disponibles
CREATE OR REPLACE FUNCTION public.get_debt_service_periods(_company_id uuid)
RETURNS TABLE(periodo text) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ds.periodo
  FROM public.debt_service ds
  WHERE ds.company_id = _company_id
    AND has_company_access(_company_id)
  ORDER BY periodo DESC;
$$;

-- 2.2 Vista Resumen Mensual
CREATE OR REPLACE VIEW public.vw_debt_service_detail AS
SELECT
  company_id, 
  periodo,
  (principal + intereses) AS servicio_total,
  principal, 
  intereses,
  flujo_operativo
FROM public.debt_service;

-- 2.3 Cálculo de KPIs (corregido sin window functions en FILTER)
CREATE OR REPLACE VIEW public.vw_debt_service_kpis AS
WITH latest_year AS (
  SELECT company_id, LEFT(MAX(periodo), 4) AS anio_actual
  FROM public.debt_service 
  GROUP BY company_id
)
SELECT
  d.company_id,
  AVG((d.principal + d.intereses) / NULLIF(d.flujo_operativo,0)) AS dscr_promedio,
  MIN((d.principal + d.intereses) / NULLIF(d.flujo_operativo,0)) AS dscr_minimo,
  SUM(CASE WHEN (d.principal + d.intereses) / NULLIF(d.flujo_operativo,0) < 1 THEN 1 ELSE 0 END) 
    AS meses_en_riesgo,
  SUM(CASE WHEN d.periodo LIKE ly.anio_actual || '-%' THEN (d.principal + d.intereses) ELSE 0 END) 
    AS servicio_anual
FROM public.debt_service d
INNER JOIN latest_year ly ON d.company_id = ly.company_id
GROUP BY d.company_id;