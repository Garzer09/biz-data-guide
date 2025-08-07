import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { read, utils } from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RatiosRow {
  company_code?: string
  anio?: string
  periodo?: string
  ratio_name?: string
  ratio_value?: number
  benchmark?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      authHeader: !!authHeader 
    });
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    
    // Create a user client for RPC verification
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })
    
    // Verify admin role
    const { data: isAdmin, error: roleError } = await supabaseUser.rpc('is_current_user_admin')
    if (roleError || !isAdmin) {
      console.error('Role verification failed:', { roleError, isAdmin })
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.', details: roleError?.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin verification successful')

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    const { job_id } = requestBody

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ratios import for job_id: ${job_id}`)

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('company_id, storage_path')
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
          estado: 'error',
          resumen: { error: 'Failed to download file', details: downloadError?.message }
        })
        .eq('id', job_id)

      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse CSV content
    const arrayBuffer = await fileData.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      await supabase
        .from('import_jobs')
        .update({
          estado: 'error',
          resumen: { error: 'File must contain headers and at least one data row' }
        })
        .eq('id', job_id)

      return new Response(
        JSON.stringify({ error: 'Invalid file format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse headers and data
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('CSV headers:', headers)
    
    const rows: RatiosRow[] = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: RatiosRow = {}
      headers.forEach((header, index) => {
        const value = values[index] || ''
        if (header === 'ratio_value' || header === 'benchmark') {
          row[header] = value ? Number(value) : null
        } else {
          row[header] = value
        }
      })
      return row
    })

    console.log(`Processing ${rows.length} rows`)

    // Get company mapping
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, company_code')

    if (companyError) {
      console.error('Failed to fetch companies:', companyError)
      await supabase
        .from('import_jobs')
        .update({
          estado: 'error',
          resumen: { error: 'Failed to fetch company mapping' }
        })
        .eq('id', job_id)

      return new Response(
        JSON.stringify({ error: 'Failed to fetch company mapping' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyMap = new Map(companies.map(c => [c.company_code, c.id]))

    // Process data
    let okRows = 0
    let errorRows = 0
    const errors: string[] = []

    for (const [index, row] of rows.entries()) {
      try {
        // Validate required fields
        if (!row.ratio_name) {
          errors.push(`Row ${index + 2}: Missing ratio_name`)
          errorRows++
          continue
        }

        if (!row.anio) {
          errors.push(`Row ${index + 2}: Missing anio`)
          errorRows++
          continue
        }

        if (!row.periodo) {
          errors.push(`Row ${index + 2}: Missing periodo`)
          errorRows++
          continue
        }

        // Map company
        let companyId = job.company_id
        if (row.company_code && companyMap.has(row.company_code)) {
          companyId = companyMap.get(row.company_code)
        }

        // Parse numeric values
        const ratioValue = row.ratio_value !== null && row.ratio_value !== undefined ? Number(row.ratio_value) : null
        const benchmark = row.benchmark !== null && row.benchmark !== undefined ? Number(row.benchmark) : null

        // Upsert to database
        const { error: upsertError } = await supabase
          .from('ratios_financieros')
          .upsert({
            company_id: companyId,
            anio: row.anio,
            periodo: row.periodo,
            ratio_name: row.ratio_name,
            ratio_value: ratioValue,
            benchmark: benchmark
          }, {
            onConflict: 'company_id,anio,periodo,ratio_name'
          })

        if (upsertError) {
          console.error(`Upsert error for row ${index + 2}:`, upsertError)
          errors.push(`Row ${index + 2}: ${upsertError.message}`)
          errorRows++
        } else {
          okRows++
        }

      } catch (rowError) {
        console.error(`Row processing error for row ${index + 2}:`, rowError)
        errors.push(`Row ${index + 2}: ${rowError.message}`)
        errorRows++
      }
    }

    // Update job status
    const status = errorRows === 0 ? 'done' : (okRows > 0 ? 'completed_with_errors' : 'error')
    await supabase
      .from('import_jobs')
      .update({
        estado: status,
        ok_rows: okRows,
        error_rows: errorRows,
        total_rows: rows.length,
        resumen: {
          ok_rows: okRows,
          error_rows: errorRows,
          total_rows: rows.length,
          errors: errors.slice(0, 10), // Limit errors shown
          sample_errors: errors.slice(0, 5)
        }
      })
      .eq('id', job_id)

    console.log(`Import completed: ${okRows} success, ${errorRows} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${rows.length} rows`,
        ok_rows: okRows,
        error_rows: errorRows,
        errors: errors.slice(0, 10)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})