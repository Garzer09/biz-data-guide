import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PygData {
  company_id: string;
  anio: string;
  concepto_codigo: string;
  valor_total: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: PygData[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: requestData, action } = await req.json();
    
    if (!Array.isArray(requestData) || requestData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un array de datos P&G' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating P&G data:', { dataLength: requestData.length, action });

    // Get catalog concepts
    const { data: catalogConcepts, error: catalogError } = await supabaseClient
      .from('catalog_pyg_concepts')
      .select('*');

    if (catalogError) {
      console.error('Error fetching catalog:', catalogError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener catálogo de conceptos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const obligatoryConcepts = catalogConcepts
      .filter(c => c.obligatorio)
      .map(c => c.concepto_codigo);

    const opexConcepts = catalogConcepts
      .filter(c => c.grupo === 'GASTOS_OPERATIVOS')
      .map(c => c.concepto_codigo);

    const validationResult = validatePygData(requestData, obligatoryConcepts, opexConcepts);

    // If action is 'insert' and validation passes, insert the data
    if (action === 'insert' && validationResult.isValid) {
      // Check for existing records
      const existingRecords = [];
      for (const item of requestData) {
        const { data: existing } = await supabaseClient
          .from('pyg_annual')
          .select('id')
          .eq('company_id', item.company_id)
          .eq('anio', item.anio)
          .eq('concepto_codigo', item.concepto_codigo)
          .maybeSingle();

        if (existing) {
          existingRecords.push(`${item.concepto_codigo} para ${item.anio}`);
        }
      }

      if (existingRecords.length > 0) {
        validationResult.errors.push(`Ya existen registros para: ${existingRecords.join(', ')}`);
        validationResult.isValid = false;
      }

      if (validationResult.isValid) {
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('pyg_annual')
          .insert(requestData)
          .select();

        if (insertError) {
          console.error('Error inserting data:', insertError);
          return new Response(
            JSON.stringify({ error: 'Error al insertar datos' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Data inserted successfully:', insertedData?.length, 'records');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${insertedData?.length} registros insertados exitosamente`,
            data: insertedData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function validatePygData(data: PygData[], obligatoryConcepts: string[], opexConcepts: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Group by company and year
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.company_id}-${item.anio}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PygData[]>);

  for (const [key, yearData] of Object.entries(groupedData)) {
    const [companyId, year] = key.split('-');
    const concepts = yearData.map(item => item.concepto_codigo);

    // 1. Validate mandatory concepts
    const missingObligatory = obligatoryConcepts.filter(concept => !concepts.includes(concept));
    if (missingObligatory.length > 0) {
      errors.push(`Conceptos obligatorios faltantes para ${year}: ${missingObligatory.join(', ')}`);
    }

    // 2. Validate at least one OPEX
    const hasOpex = opexConcepts.some(opex => concepts.includes(opex));
    if (!hasOpex) {
      errors.push(`Se requiere al menos un concepto de gastos operativos para ${year}`);
    }

    // 3. Validate signs
    yearData.forEach(item => {
      if (item.concepto_codigo === 'PYG_INGRESOS' || item.concepto_codigo === 'PYG_OTROS_INGRESOS_OP' || item.concepto_codigo === 'PYG_INGRESOS_FIN') {
        if (item.valor_total <= 0) {
          warnings.push(`${item.concepto_codigo} para ${year}: se esperaba valor positivo (${item.valor_total})`);
        }
      } else if (item.concepto_codigo.includes('COSTE') || item.concepto_codigo.includes('GASTO') || item.concepto_codigo.includes('DEPRECIACION') || item.concepto_codigo.includes('AMORTIZACION')) {
        if (item.valor_total >= 0) {
          warnings.push(`${item.concepto_codigo} para ${year}: se esperaba valor negativo (${item.valor_total})`);
        }
      }
    });

    // 4. Check for duplicates within the same dataset
    const conceptCounts = concepts.reduce((acc, concept) => {
      acc[concept] = (acc[concept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(conceptCounts).forEach(([concept, count]) => {
      if (count > 1) {
        errors.push(`Concepto duplicado en ${year}: ${concept} (${count} veces)`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : undefined
  };
}