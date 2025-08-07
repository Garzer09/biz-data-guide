-- Create unified break-even view
CREATE OR REPLACE VIEW public.vw_punto_muerto AS
SELECT
  company_id,
  periodo,
  get_punto_equilibrio_valor(company_id, LEFT(periodo,4)) AS valor,
  get_margen_seguridad_valor(company_id, LEFT(periodo,4)) AS margen_seguridad_valor,
  get_margen_seguridad_porcentaje(company_id, LEFT(periodo,4)) AS margen_seguridad,
  get_margen_contribucion_total(company_id, LEFT(periodo,4)) AS margen_contribucion
FROM periods
WHERE tipo = 'MENSUAL'
  AND EXISTS (
    SELECT 1 FROM vw_pyg_anual vp 
    WHERE vp.company_id = periods.company_id 
    AND vp.anio = LEFT(periods.periodo, 4)
  )
GROUP BY company_id, periodo;