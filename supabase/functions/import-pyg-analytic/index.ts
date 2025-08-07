import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ImportJobRow {
  company_code: string;
  periodo: string;
  concepto_codigo: string;
  valor: number;
  segmento?: string;
  centro_coste?: string;
}

interface ProcessingResult {
  successRows: ImportJobRow[];
  errorRows: Array<{ row: any; error: string }>;
  warnings: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Import P&G Analytic function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request data
    const { job_id } = await req.json();
    console.log('📋 Processing job_id:', job_id);

    if (!job_id) {
      throw new Error('job_id is required');
    }

    // Authenticate user and check admin permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin by checking their profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking user profile:', profileError);
      throw new Error('Failed to verify user profile');
    }

    if (profile?.role !== 'admin') {
      throw new Error('Admin permissions required');
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error('Import job not found');
    }

    console.log('📄 Job details:', job);

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ estado: 'processing' })
      .eq('id', job_id);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('📁 File downloaded successfully');

    // Parse the file
    const csvData = await parseFileToCSV(fileData, job.storage_path);
    console.log(`📊 Parsed ${csvData.length} rows from file`);

    // Process the CSV data
    const result = await processCSVData(supabase, csvData, job.company_id);
    
    // Check for mandatory concepts or other validations if needed
    await checkPyGAnalyticValidations(supabase, result, job.company_id);

    // Update job status and summary
    const summary = {
      total_rows: csvData.length - 1, // Subtract header row
      ok_rows: result.successRows.length,
      error_rows: result.errorRows.length,
      warnings: result.warnings,
      errors: result.errorRows.map(er => ({
        row: er.row,
        error: er.error
      }))
    };

    await updateJobStatus(supabase, job_id, 'done', summary);

    console.log('✅ Import completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in import function:', error);
    
    // Try to update job status to failed if we have job_id
    const requestBody = await req.clone().json().catch(() => ({}));
    if (requestBody.job_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await updateJobStatus(supabase, requestBody.job_id, 'failed', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status: 'failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function parseFileToCSV(fileData: Blob, storagePath: string): Promise<string[][]> {
  console.log('🔄 Parsing file:', storagePath);
  
  if (storagePath.toLowerCase().endsWith('.csv')) {
    const text = await fileData.text();
    return text.trim().split('\n').map(row => 
      row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );
  } else if (storagePath.toLowerCase().endsWith('.xlsx') || storagePath.toLowerCase().endsWith('.xls')) {
    // For Excel files, we'll need to implement Excel parsing
    // For now, throw an error suggesting CSV format
    throw new Error('Excel files not supported yet. Please convert to CSV format.');
  } else {
    throw new Error('Unsupported file format. Please use CSV format.');
  }
}

async function processCSVData(supabase: any, csvData: string[][], companyId: string): Promise<ProcessingResult> {
  console.log('🔄 Processing CSV data');
  
  if (csvData.length < 2) {
    throw new Error('El archivo debe contener al menos una fila de datos además del encabezado');
  }

  const headers = csvData[0].map(h => h.toLowerCase().trim());
  const result: ProcessingResult = {
    successRows: [],
    errorRows: [],
    warnings: []
  };

  // Validate required headers
  const requiredHeaders = ['company_code', 'periodo', 'concepto_codigo', 'valor'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missingHeaders.join(', ')}`);
  }

  // Get the company's company_code to validate
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('company_code')
    .eq('id', companyId)
    .single();

  if (companyError) {
    throw new Error('No se pudo obtener el código de la empresa');
  }

  // Get valid concept codes
  const { data: concepts, error: conceptsError } = await supabase
    .from('catalog_pyg_concepts')
    .select('concepto_codigo');

  if (conceptsError) {
    throw new Error('No se pudo obtener el catálogo de conceptos P&G');
  }

  const validConcepts = new Set(concepts.map(c => c.concepto_codigo));

  // Process each data row
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    
    try {
      if (row.length !== headers.length) {
        throw new Error(`Fila ${i + 1}: Número incorrecto de columnas`);
      }

      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index]?.trim();
      });

      // Validate required fields
      if (!rowData.company_code) {
        throw new Error(`Fila ${i + 1}: company_code es obligatorio`);
      }

      if (!rowData.periodo) {
        throw new Error(`Fila ${i + 1}: periodo es obligatorio`);
      }

      if (!rowData.concepto_codigo) {
        throw new Error(`Fila ${i + 1}: concepto_codigo es obligatorio`);
      }

      if (!rowData.valor || isNaN(parseFloat(rowData.valor))) {
        throw new Error(`Fila ${i + 1}: valor debe ser un número válido`);
      }

      // Validate company_code matches
      if (rowData.company_code !== company.company_code) {
        throw new Error(`Fila ${i + 1}: company_code '${rowData.company_code}' no coincide con la empresa seleccionada`);
      }

      // Validate concept code exists
      if (!validConcepts.has(rowData.concepto_codigo)) {
        throw new Error(`Fila ${i + 1}: concepto_codigo '${rowData.concepto_codigo}' no existe en el catálogo`);
      }

      // Validate period format
      if (!/^\d{4}(-\d{2})?$/.test(rowData.periodo)) {
        throw new Error(`Fila ${i + 1}: periodo debe tener formato YYYY o YYYY-MM`);
      }

      // Prepare data for insertion
      const insertData = {
        company_id: companyId,
        periodo: rowData.periodo,
        concepto_codigo: rowData.concepto_codigo,
        valor: parseFloat(rowData.valor),
        segmento: rowData.segmento || null,
        centro_coste: rowData.centro_coste || null
      };

      // Check for existing record (upsert logic)
      const { data: existing, error: existingError } = await supabase
        .from('pyg_analytic')
        .select('id')
        .eq('company_id', companyId)
        .eq('periodo', insertData.periodo)
        .eq('concepto_codigo', insertData.concepto_codigo)
        .eq('segmento', insertData.segmento || '')
        .eq('centro_coste', insertData.centro_coste || '');

      if (existingError) {
        throw new Error(`Error checking existing record: ${existingError.message}`);
      }

      let upsertResult;
      if (existing && existing.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('pyg_analytic')
          .update(insertData)
          .eq('id', existing[0].id);

        if (updateError) {
          throw new Error(`Error updating record: ${updateError.message}`);
        }
        upsertResult = { action: 'updated' };
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('pyg_analytic')
          .insert(insertData);

        if (insertError) {
          throw new Error(`Error inserting record: ${insertError.message}`);
        }
        upsertResult = { action: 'inserted' };
      }

      result.successRows.push({ ...rowData, ...upsertResult });

    } catch (error) {
      console.error(`Error processing row ${i + 1}:`, error);
      result.errorRows.push({
        row: row,
        error: error.message
      });
    }
  }

  console.log(`✅ Processed ${result.successRows.length} successful rows, ${result.errorRows.length} errors`);
  return result;
}

async function checkPyGAnalyticValidations(supabase: any, result: ProcessingResult, companyId: string): Promise<void> {
  // Add any specific validations for P&G Analytic data here
  // For example, check for data consistency, mandatory segments, etc.
  
  console.log('🔍 Running P&G Analytic validations');
  
  // Check if there are any INGRESOS records
  const { data: ingresosCheck, error: ingresosError } = await supabase
    .from('pyg_analytic')
    .select('concepto_codigo')
    .eq('company_id', companyId)
    .like('concepto_codigo', '%INGRESO%')
    .limit(1);

  if (ingresosError) {
    console.warn('Could not check for INGRESOS records:', ingresosError);
  } else if (!ingresosCheck || ingresosCheck.length === 0) {
    result.warnings.push('No se encontraron registros de INGRESOS para esta empresa');
  }

  // Additional validations can be added here
}

async function updateJobStatus(supabase: any, jobId: string, status: string, resumen: any): Promise<void> {
  const { error } = await supabase
    .from('import_jobs')
    .update({
      estado: status,
      resumen: resumen,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
    throw new Error(`Failed to update job status: ${error.message}`);
  }
}