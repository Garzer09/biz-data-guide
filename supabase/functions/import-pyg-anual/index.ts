import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { read, utils } from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJobRow {
  anio: string;
  concepto_codigo: string;
  valor_total: number;
}

interface ProcessingResult {
  ok_rows: Array<{ row: number; data: ImportJobRow }>;
  error_rows: Array<{ row: number; error: string; data?: any }>;
  warnings: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a separate client for RPC calls with the user's token
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Check if user is admin using our function
    const { data: isAdmin, error: adminError } = await userSupabase
      .rpc('is_current_user_admin')

    if (adminError || !isAdmin) {
      console.log('Authorization failed:', adminError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { job_id } = await req.json();
    
    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting P&G import for job:', job_id);

    // Load job details - using new schema
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('company_id, storage_path, tipo')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Error fetching import job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({ 
        estado: 'processing',
        actualizado_en: new Date().toISOString()
      })
      .eq('id', job_id)

    if (updateError) {
      console.log('Failed to update job status:', updateError)
    }

    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('import-files')
        .download(job.storage_path);

      if (downloadError || !fileData) {
        console.error('Error downloading file:', downloadError);
        await updateJobStatus(supabase, job_id, 'failed', {
          error_rows: [{ row: 0, error: 'Failed to download file from storage' }],
          ok_rows: [],
          warnings: []
        });
        return new Response(
          JSON.stringify({ error: 'Error descargando archivo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert file to CSV data
      const csvData = await parseFileToCSV(fileData, job.storage_path);

      // Validate and process the data
      const result = await processCSVData(supabase, csvData, job.company_id)

      // Check for mandatory concepts
      await checkMandatoryConcepts(supabase, result, job.company_id)

      // Determine final status
      const hasErrors = result.error_rows.length > 0
      const finalStatus = hasErrors ? 'failed' : 'done'

      // Update job with final status and summary
      await updateJobStatus(supabase, job_id, finalStatus, {
        ok_rows: result.ok_rows,
        error_rows: result.error_rows,
        warnings: result.warnings
      })

      console.log(`Import completed with status: ${finalStatus}`)
      console.log(`Processed ${result.ok_rows.length} successful rows, ${result.error_rows.length} error rows`)

      return new Response(
        JSON.stringify({
          status: finalStatus,
          summary: {
            ok_rows: result.ok_rows.length,
            error_rows: result.error_rows.length,
            warnings: result.warnings.length
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (processingError) {
      console.error('Processing error:', processingError);
      await updateJobStatus(supabase, job_id, 'failed', {
        error_rows: [{ row: 0, error: `Processing error: ${processingError.message}` }],
        ok_rows: [],
        warnings: []
      });
      return new Response(
        JSON.stringify({ 
          error: 'Error procesando archivo',
          details: processingError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function parseFileToCSV(fileData: Blob, storagePath: string): Promise<string[][]> {
  const buffer = await fileData.arrayBuffer()
  
  if (storagePath.toLowerCase().endsWith('.xlsx')) {
    // Parse XLSX file
    const workbook = read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const csvText = utils.sheet_to_csv(worksheet)
    return csvText.split('\n').map(row => row.split(','))
  } else {
    // Parse CSV file
    const text = new TextDecoder('utf-8').decode(buffer)
    return text.split('\n').map(row => row.split(','))
  }
}

async function processCSVData(supabase: any, csvData: string[][], companyId: string): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    ok_rows: [],
    error_rows: [],
    warnings: []
  }

  if (csvData.length === 0) {
    result.error_rows.push({ row: 0, error: 'File is empty' })
    return result
  }

  // Get header row and validate required columns
  const headers = csvData[0].map(h => h.trim().toLowerCase())
  const requiredColumns = ['anio', 'concepto_codigo', 'valor_total']
  
  const columnIndexes: { [key: string]: number } = {}
  for (const col of requiredColumns) {
    const index = headers.indexOf(col)
    if (index === -1) {
      result.error_rows.push({ row: 0, error: `Missing required column: ${col}` })
      return result
    }
    columnIndexes[col] = index
  }

  // Get valid concept codes
  const { data: validConcepts, error: conceptsError } = await supabase
    .from('catalog_pyg_concepts')
    .select('concepto_codigo')

  if (conceptsError) {
    result.error_rows.push({ row: 0, error: 'Failed to load concept catalog' })
    return result
  }

  const validConceptCodes = new Set(validConcepts.map((c: any) => c.concepto_codigo))

  // Process data rows
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i]
    if (row.length === 0 || row.every(cell => !cell.trim())) continue // Skip empty rows

    try {
      const anio = row[columnIndexes.anio]?.trim()
      const concepto_codigo = row[columnIndexes.concepto_codigo]?.trim()
      const valor_total_str = row[columnIndexes.valor_total]?.trim()

      // Validate required fields
      if (!anio || !concepto_codigo || !valor_total_str) {
        result.error_rows.push({
          row: i + 1,
          error: 'Missing required fields',
          data: { anio, concepto_codigo, valor_total: valor_total_str }
        })
        continue
      }

      // Validate concept code exists
      if (!validConceptCodes.has(concepto_codigo)) {
        result.error_rows.push({
          row: i + 1,
          error: `Invalid concept code: ${concepto_codigo}`,
          data: { anio, concepto_codigo, valor_total: valor_total_str }
        })
        continue
      }

      // Validate numeric value
      const valor_total = parseFloat(valor_total_str.replace(',', '.'))
      if (isNaN(valor_total)) {
        result.error_rows.push({
          row: i + 1,
          error: `Invalid numeric value: ${valor_total_str}`,
          data: { anio, concepto_codigo, valor_total: valor_total_str }
        })
        continue
      }

      // Perform UPSERT
      const { error: upsertError } = await supabase
        .from('pyg_annual')
        .upsert({
          company_id: companyId,
          anio,
          concepto_codigo,
          valor_total,
          creado_en: new Date().toISOString()
        }, {
          onConflict: 'company_id,anio,concepto_codigo'
        })

      if (upsertError) {
        result.error_rows.push({
          row: i + 1,
          error: `Database error: ${upsertError.message}`,
          data: { anio, concepto_codigo, valor_total }
        })
      } else {
        result.ok_rows.push({
          row: i + 1,
          data: { anio, concepto_codigo, valor_total }
        })
      }

    } catch (error) {
      result.error_rows.push({
        row: i + 1,
        error: `Processing error: ${error.message}`,
        data: row
      })
    }
  }

  return result
}

async function checkMandatoryConcepts(supabase: any, result: ProcessingResult, companyId: string) {
  // Get mandatory concepts
  const { data: mandatoryConcepts, error: mandatoryError } = await supabase
    .from('catalog_pyg_concepts')
    .select('concepto_codigo, concepto_nombre')
    .eq('obligatorio', true)

  if (mandatoryError) {
    result.warnings.push('Could not verify mandatory concepts')
    return
  }

  // Check which mandatory concepts are missing
  const processedConcepts = new Set(result.ok_rows.map(row => row.data.concepto_codigo))
  
  for (const concept of mandatoryConcepts) {
    if (!processedConcepts.has(concept.concepto_codigo)) {
      result.error_rows.push({
        row: 0,
        error: `Missing mandatory concept: ${concept.concepto_codigo} (${concept.concepto_nombre})`
      })
    }
  }
}

async function updateJobStatus(supabase: any, jobId: string, status: string, resumen: any) {
  const { error } = await supabase
    .from('import_jobs')
    .update({
      estado: status,
      resumen,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) {
    console.log('Failed to update job status:', error)
  }
}