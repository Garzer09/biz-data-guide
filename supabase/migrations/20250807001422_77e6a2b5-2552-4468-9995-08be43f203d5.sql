-- Create allocation_rules table
CREATE TABLE public.allocation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  anio TEXT NOT NULL,
  concepto_codigo TEXT NOT NULL REFERENCES public.catalog_pyg_concepts(concepto_codigo),
  driver TEXT NOT NULL DEFAULT 'UNIFORME', -- 'UNIFORME' or 'PERSONALIZADO'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, anio, concepto_codigo)
);

-- Create allocation_weights table  
CREATE TABLE public.allocation_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allocation_rule_id UUID NOT NULL REFERENCES public.allocation_rules(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  peso NUMERIC NOT NULL CHECK (peso >= 0 AND peso <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(allocation_rule_id, mes)
);

-- Add is_allocated column to fs_income
ALTER TABLE public.fs_income ADD COLUMN is_allocated BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_weights ENABLE ROW LEVEL SECURITY;

-- RLS policies for allocation_rules
CREATE POLICY "Users can view allocation_rules for assigned companies" 
ON public.allocation_rules 
FOR SELECT 
USING ((get_current_user_role() = 'admin') OR (EXISTS ( 
  SELECT 1 FROM user_companies 
  WHERE user_companies.user_id = auth.uid() 
  AND user_companies.company_id = allocation_rules.company_id
)));

CREATE POLICY "Only admins can manage allocation_rules" 
ON public.allocation_rules 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS policies for allocation_weights
CREATE POLICY "Users can view allocation_weights for assigned companies" 
ON public.allocation_weights 
FOR SELECT 
USING ((get_current_user_role() = 'admin') OR (EXISTS ( 
  SELECT 1 FROM allocation_rules ar
  JOIN user_companies uc ON uc.company_id = ar.company_id
  WHERE ar.id = allocation_weights.allocation_rule_id 
  AND uc.user_id = auth.uid()
)));

CREATE POLICY "Only admins can manage allocation_weights" 
ON public.allocation_weights 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create function to allocate P&G data
CREATE OR REPLACE FUNCTION public.allocate_pyg(
  _company_id UUID,
  _anio TEXT,
  _mode TEXT DEFAULT 'REPLACE'
)
RETURNS TABLE (
  concepto_codigo TEXT,
  total_anual NUMERIC,
  suma_mensual NUMERIC,
  diferencia NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period_rec RECORD;
  _pyg_rec RECORD;
  _rule_rec RECORD;
  _weight_rec RECORD;
  _peso NUMERIC;
  _valor_mensual NUMERIC;
  _suma_control NUMERIC;
  _result_row RECORD;
BEGIN
  -- Validate parameters
  IF _company_id IS NULL OR _anio IS NULL THEN
    RAISE EXCEPTION 'company_id y anio son requeridos';
  END IF;

  -- Check if company exists
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = _company_id) THEN
    RAISE EXCEPTION 'Empresa no encontrada';
  END IF;

  -- Create periods for the year if they don't exist
  FOR i IN 1..12 LOOP
    INSERT INTO periods (company_id, tipo, periodo)
    VALUES (_company_id, 'MENSUAL', _anio || '-' || LPAD(i::TEXT, 2, '0'))
    ON CONFLICT (company_id, tipo, periodo) DO NOTHING;
  END LOOP;

  -- If mode is REPLACE, delete existing allocated records
  IF _mode = 'REPLACE' THEN
    DELETE FROM fs_income 
    WHERE company_id = _company_id 
    AND is_allocated = true
    AND period_id IN (
      SELECT id FROM periods 
      WHERE company_id = _company_id 
      AND tipo = 'MENSUAL' 
      AND periodo LIKE _anio || '%'
    );
  END IF;

  -- Process each P&G concept for the year
  FOR _pyg_rec IN 
    SELECT concepto_codigo, valor_total 
    FROM pyg_annual 
    WHERE company_id = _company_id 
    AND anio = _anio
  LOOP
    _suma_control := 0;
    
    -- Check if there's a custom allocation rule
    SELECT * INTO _rule_rec
    FROM allocation_rules 
    WHERE company_id = _company_id 
    AND anio = _anio 
    AND concepto_codigo = _pyg_rec.concepto_codigo
    AND driver = 'PERSONALIZADO';

    -- Allocate to each month
    FOR i IN 1..12 LOOP
      -- Get period_id for this month
      SELECT id INTO _period_rec
      FROM periods 
      WHERE company_id = _company_id 
      AND tipo = 'MENSUAL' 
      AND periodo = _anio || '-' || LPAD(i::TEXT, 2, '0');

      -- Determine weight
      IF _rule_rec.id IS NOT NULL THEN
        -- Use custom weights
        SELECT peso INTO _peso
        FROM allocation_weights 
        WHERE allocation_rule_id = _rule_rec.id 
        AND mes = i;
        
        -- If no weight found for this month, use 0
        _peso := COALESCE(_peso, 0);
      ELSE
        -- Use uniform distribution
        _peso := 1.0 / 12.0;
      END IF;

      -- Calculate monthly value
      _valor_mensual := _pyg_rec.valor_total * _peso;
      _suma_control := _suma_control + _valor_mensual;

      -- Insert/Update in fs_income
      INSERT INTO fs_income (
        company_id, 
        period_id, 
        concepto, 
        valor, 
        is_allocated
      )
      VALUES (
        _company_id,
        _period_rec.id,
        _pyg_rec.concepto_codigo,
        _valor_mensual,
        true
      )
      ON CONFLICT (company_id, period_id, concepto) 
      DO UPDATE SET 
        valor = EXCLUDED.valor,
        is_allocated = EXCLUDED.is_allocated;
    END LOOP;

    -- Return control data for this concept
    RETURN QUERY SELECT 
      _pyg_rec.concepto_codigo,
      _pyg_rec.valor_total,
      _suma_control,
      (_suma_control - _pyg_rec.valor_total),
      CASE 
        WHEN ABS(_suma_control - _pyg_rec.valor_total) < 0.01 THEN 'OK'
        ELSE 'DIFERENCIA'
      END;
  END LOOP;

  RETURN;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_allocation_rules_company_anio ON public.allocation_rules(company_id, anio);
CREATE INDEX idx_allocation_weights_rule_mes ON public.allocation_weights(allocation_rule_id, mes);
CREATE INDEX idx_fs_income_allocated ON public.fs_income(company_id, is_allocated) WHERE is_allocated = true;