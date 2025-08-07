-- Funciones auxiliares para datos básicos
CREATE OR REPLACE FUNCTION public.get_ingresos_totales(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT COALESCE(vp.ingresos, 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

CREATE OR REPLACE FUNCTION public.get_costes_variables_totales(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT COALESCE(vp.coste_ventas, 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

CREATE OR REPLACE FUNCTION public.get_costes_fijos_totales(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT COALESCE(vp.opex, 0)
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id AND vp.anio = _anio;
$$;

-- Margen de contribución total (Ingresos - Costes Variables)
CREATE OR REPLACE FUNCTION public.get_margen_contribucion_total(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_ingresos_totales(_company_id, _anio), 0) - 
    COALESCE(get_costes_variables_totales(_company_id, _anio), 0);
$$;

-- Ratio de margen de contribución (%)
CREATE OR REPLACE FUNCTION public.get_ratio_margen_contribucion(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_margen_contribucion_total(_company_id, _anio), 0) /
    NULLIF(get_ingresos_totales(_company_id, _anio), 0) * 100;
$$;

-- Punto de equilibrio en valor monetario (Break-even point)
CREATE OR REPLACE FUNCTION public.get_punto_equilibrio_valor(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_costes_fijos_totales(_company_id, _anio), 0) /
    NULLIF(
      COALESCE(get_ratio_margen_contribucion(_company_id, _anio), 0) / 100, 
      0
    );
$$;

-- Margen de seguridad en valor monetario
CREATE OR REPLACE FUNCTION public.get_margen_seguridad_valor(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_ingresos_totales(_company_id, _anio), 0) - 
    COALESCE(get_punto_equilibrio_valor(_company_id, _anio), 0);
$$;

-- Margen de seguridad en porcentaje
CREATE OR REPLACE FUNCTION public.get_margen_seguridad_porcentaje(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_margen_seguridad_valor(_company_id, _anio), 0) /
    NULLIF(get_ingresos_totales(_company_id, _anio), 0) * 100;
$$;

-- Grado de apalancamiento operativo (Operating leverage)
CREATE OR REPLACE FUNCTION public.get_apalancamiento_operativo(_company_id uuid, _anio text)
RETURNS numeric 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(get_margen_contribucion_total(_company_id, _anio), 0) /
    NULLIF(
      COALESCE(get_margen_contribucion_total(_company_id, _anio), 0) - 
      COALESCE(get_costes_fijos_totales(_company_id, _anio), 0), 
      0
    );
$$;

-- Función para obtener años disponibles para análisis de punto muerto
CREATE OR REPLACE FUNCTION public.get_analisis_punto_muerto_years(_company_id uuid)
RETURNS TABLE(anio text) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT DISTINCT vp.anio
  FROM vw_pyg_anual vp
  WHERE vp.company_id = _company_id
  AND vp.ingresos IS NOT NULL
  AND vp.coste_ventas IS NOT NULL
  AND vp.opex IS NOT NULL
  ORDER BY anio DESC;
$$;