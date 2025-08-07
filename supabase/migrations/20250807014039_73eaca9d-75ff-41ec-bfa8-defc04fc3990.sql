-- Create or replace the P&G annual view with all calculated metrics
CREATE OR REPLACE VIEW public.vw_pyg_anual AS
SELECT
  company_id,
  anio,
  -- Base components
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) as ingresos,
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) as coste_ventas,
  SUM(CASE WHEN concepto_codigo IN (
      'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
      'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
    ) THEN valor_total ELSE 0 END) as opex,
  SUM(CASE WHEN concepto_codigo = 'PYG_DEPRECIACION' THEN valor_total ELSE 0 END) as dep,
  SUM(CASE WHEN concepto_codigo = 'PYG_AMORTIZACION' THEN valor_total ELSE 0 END) as amort,
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) as otros_ing_op,
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) as otros_gas_op,
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS_FIN' THEN valor_total ELSE 0 END) as ing_fin,
  SUM(CASE WHEN concepto_codigo = 'PYG_GASTOS_FIN' THEN valor_total ELSE 0 END) as gas_fin,
  SUM(CASE WHEN concepto_codigo = 'PYG_RESULTADO_EXTRA' THEN valor_total ELSE 0 END) as extra,
  SUM(CASE WHEN concepto_codigo = 'PYG_IMPUESTOS' THEN valor_total ELSE 0 END) as impuestos,
  
  -- Calculated metrics
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) as margen_bruto,
  
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo IN (
      'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
      'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
    ) THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) as ebitda,
  
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo IN (
      'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
      'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
    ) THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_DEPRECIACION' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_AMORTIZACION' THEN valor_total ELSE 0 END) as ebit,
  
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo IN (
      'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
      'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
    ) THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_DEPRECIACION' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_AMORTIZACION' THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS_FIN' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_GASTOS_FIN' THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_RESULTADO_EXTRA' THEN valor_total ELSE 0 END) as bai,
  
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
  SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo IN (
      'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
      'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
    ) THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_DEPRECIACION' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_AMORTIZACION' THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS_FIN' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_GASTOS_FIN' THEN valor_total ELSE 0 END) +
  SUM(CASE WHEN concepto_codigo = 'PYG_RESULTADO_EXTRA' THEN valor_total ELSE 0 END) -
  SUM(CASE WHEN concepto_codigo = 'PYG_IMPUESTOS' THEN valor_total ELSE 0 END) as beneficio_neto,
  
  -- Percentage calculations
  CASE 
    WHEN SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) != 0 THEN
      (SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
       SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo IN (
           'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
           'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
         ) THEN valor_total ELSE 0 END) +
       SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END)) * 100.0 /
      SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END)
    ELSE 0
  END as margen_ebitda_pct,
  
  CASE 
    WHEN SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) != 0 THEN
      (SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END) - 
       SUM(CASE WHEN concepto_codigo = 'PYG_COSTE_VENTAS' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo IN (
           'PYG_GASTOS_OPERATIVOS','PYG_GASTOS_PERSONAL','PYG_ALQUILERES',
           'PYG_MARKETING_VENTAS','PYG_OTROS_GASTOS_OP'
         ) THEN valor_total ELSE 0 END) +
       SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_INGRESOS_OP' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_OTROS_GASTOS_OP' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_DEPRECIACION' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_AMORTIZACION' THEN valor_total ELSE 0 END) +
       SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS_FIN' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_GASTOS_FIN' THEN valor_total ELSE 0 END) +
       SUM(CASE WHEN concepto_codigo = 'PYG_RESULTADO_EXTRA' THEN valor_total ELSE 0 END) -
       SUM(CASE WHEN concepto_codigo = 'PYG_IMPUESTOS' THEN valor_total ELSE 0 END)) * 100.0 /
      SUM(CASE WHEN concepto_codigo = 'PYG_INGRESOS' THEN valor_total ELSE 0 END)
    ELSE 0
  END as margen_neto_pct

FROM public.pyg_annual
GROUP BY company_id, anio;