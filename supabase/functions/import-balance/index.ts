import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { read, utils } from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BalanceRow {
  periodo: string
  [key: string]: string | number
}

interface ProcessResult {
  ok_rows: number
  error_rows: number
  warnings: string[]
}

const OPERATING_COLUMNS = {
  required: ['periodo', 'clientes', 'inventario', 'proveedores'],
  optional: ['otros_deudores_op', 'otros_acreedores_op', 'anticipos_clientes', 'trabajos_en_curso']
}

const FINANCIAL_COLUMNS = {
  required: ['periodo', 'activo_corriente', 'activo_no_corriente', 'pasivo_corriente', 'pasivo_no_corriente', 'patrimonio_neto'],
  optional: []
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set auth for the client
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''))

    // Verify admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_current_user_admin')
    if (roleError || !isAdmin) {
      console.error('Role verification failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { job_id, tipo } = await req.json()

    if (!job_id || !tipo) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id or tipo parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['operativo', 'financiero'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tipo. Must be "operativo" or "financiero"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing balance import for job_id: ${job_id}, tipo: ${tipo}`)

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('company_id, storage_path, tipo')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', jobError)
      return new Response(
        JSON.stringify({ error: 'Import job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path)

    if (downloadError || !fileData) {
      console.error('File download failed:', downloadError)
      await supabase
        .from('import_jobs')
        .update({
          estado: 'failed',
          resumen: { error: 'Failed to download file', details: downloadError?.message }
        })
        .eq('id', job_id)

      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert file to array buffer and parse
    const arrayBuffer = await fileData.arrayBuffer()
    let rows: BalanceRow[] = []

    try {
      if (job.storage_path.endsWith('.xlsx')) {
        const workbook = read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        rows = utils.sheet_to_json(workbook.Sheets[sheetName])
      } else {
        // Assume CSV
        const text = new TextDecoder().decode(arrayBuffer)
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: BalanceRow = { periodo: '' }
            headers.forEach((header, index) => {
              const value = values[index] || ''
              row[header] = isNaN(Number(value)) ? value : Number(value)
            })
            return row
          })
        }
      }
    } catch (parseError) {
      console.error('File parsing failed:', parseError)
      await supabase
        .from('import_jobs')
        .update({
          estado: 'failed',
          resumen: { error: 'Failed to parse file', details: parseError.message }
        })
        .eq('id', job_id)

      return new Response(
        JSON.stringify({ error: 'Failed to parse file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and process data
    const result = await processBalanceData(supabase, rows, job.company_id, tipo)

    // Update job status
    const jobStatus = result.error_rows === 0 ? 'done' : 'failed'
    await supabase
      .from('import_jobs')
      .update({
        estado: jobStatus,
        ok_rows: result.ok_rows,
        error_rows: result.error_rows,
        total_rows: rows.length,
        resumen: {
          ok_rows: result.ok_rows,
          error_rows: result.error_rows,
          warnings: result.warnings,
          tipo: tipo
        }
      })
      .eq('id', job_id)

    console.log(`Import completed: ${result.ok_rows} success, ${result.error_rows} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${rows.length} rows`,
        ok_rows: result.ok_rows,
        error_rows: result.error_rows,
        warnings: result.warnings
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import balance error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processBalanceData(
  supabase: any,
  rows: BalanceRow[],
  company_id: string,
  tipo: 'operativo' | 'financiero'
): Promise<ProcessResult> {
  const result: ProcessResult = {
    ok_rows: 0,
    error_rows: 0,
    warnings: []
  }

  const columns = tipo === 'operativo' ? OPERATING_COLUMNS : FINANCIAL_COLUMNS
  const tableName = tipo === 'operativo' ? 'wc_operating_balances' : 'wc_financial_balances'

  // Validate columns
  if (rows.length === 0) {
    result.warnings.push('No data rows found')
    return result
  }

  const fileColumns = Object.keys(rows[0])
  const missingRequired = columns.required.filter(col => !fileColumns.includes(col))
  
  if (missingRequired.length > 0) {
    result.warnings.push(`Missing required columns: ${missingRequired.join(', ')}`)
    result.error_rows = rows.length
    return result
  }

  // Process each row
  for (const row of rows) {
    try {
      // Validate periodo format
      if (!row.periodo || typeof row.periodo !== 'string') {
        result.error_rows++
        result.warnings.push(`Invalid periodo format in row: ${JSON.stringify(row)}`)
        continue
      }

      // Prepare data for upsert
      const data: any = {
        company_id,
        periodo: row.periodo
      }

      // Add all available columns
      const allColumns = columns.required.concat(columns.optional);
      allColumns.forEach(col => {
        if (col !== 'periodo' && row[col] !== undefined) {
          const value = Number(row[col])
          data[col] = isNaN(value) ? 0 : value
        }
      })

      // Upsert to database
      const { error: upsertError } = await supabase
        .from(tableName)
        .upsert(data, {
          onConflict: 'company_id,periodo'
        })

      if (upsertError) {
        console.error(`Upsert error for row ${row.periodo}:`, upsertError)
        result.error_rows++
        result.warnings.push(`Failed to save row ${row.periodo}: ${upsertError.message}`)
      } else {
        result.ok_rows++
      }

    } catch (rowError) {
      console.error(`Row processing error:`, rowError)
      result.error_rows++
      result.warnings.push(`Error processing row: ${rowError.message}`)
    }
  }

  return result
}