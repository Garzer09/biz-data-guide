import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseUser.rpc('get_current_user_role')
    if (roleError || userRole !== 'admin') {
      console.log('Authorization failed:', roleError)
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    const { job_id, tipo } = await req.json()
    console.log('Processing cashflow import:', { job_id, tipo })

    if (!job_id || !tipo) {
      return new Response('Missing job_id or tipo', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Validate tipo
    const validTypes = ['operativo', 'inversion', 'financiacion']
    if (!validTypes.includes(tipo)) {
      return new Response('Invalid tipo. Must be: operativo, inversion, or financiacion', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.log('Job not found:', jobError)
      return new Response('Job not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Mark job as processing
    await supabaseAdmin
      .from('import_jobs')
      .update({ 
        estado: 'processing',
        actualizado_en: new Date().toISOString()
      })
      .eq('id', job_id)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('import-files')
      .download(job.storage_path)

    if (downloadError || !fileData) {
      console.log('Download error:', downloadError)
      await supabaseAdmin
        .from('import_jobs')
        .update({ 
          estado: 'failed',
          resumen: { error: 'Failed to download file' },
          actualizado_en: new Date().toISOString()
        })
        .eq('id', job_id)
      
      return new Response('Failed to download file', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Parse CSV content
    const fileContent = await fileData.text()
    const lines = fileContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      await supabaseAdmin
        .from('import_jobs')
        .update({ 
          estado: 'failed',
          resumen: { error: 'File is empty or has no data rows' },
          actualizado_en: new Date().toISOString()
        })
        .eq('id', job_id)
      
      return new Response('File is empty', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Parse header and validate columns
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('Headers found:', headers)

    let requiredColumns: string[]
    let valueColumn: string
    let tableName: string

    switch (tipo) {
      case 'operativo':
        requiredColumns = ['company_code', 'periodo', 'flujo_operativo']
        valueColumn = 'flujo_operativo'
        tableName = 'cashflows_operativo'
        break
      case 'inversion':
        requiredColumns = ['company_code', 'periodo', 'flujo_inversion']
        valueColumn = 'flujo_inversion'
        tableName = 'cashflows_inversion'
        break
      case 'financiacion':
        requiredColumns = ['company_code', 'periodo', 'flujo_financiacion']
        valueColumn = 'flujo_financiacion'
        tableName = 'cashflows_financiacion'
        break
    }

    // Check required columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    if (missingColumns.length > 0) {
      const errorMsg = `Missing required columns: ${missingColumns.join(', ')}`
      await supabaseAdmin
        .from('import_jobs')
        .update({ 
          estado: 'failed',
          resumen: { error: errorMsg },
          actualizado_en: new Date().toISOString()
        })
        .eq('id', job_id)
      
      return new Response(errorMsg, { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get column indices
    const companyIndex = headers.indexOf('company_code')
    const periodoIndex = headers.indexOf('periodo')
    const valueIndex = headers.indexOf(valueColumn)

    // Get companies for mapping
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, company_code')

    const companyMap = new Map(companies?.map(c => [c.company_code, c.id]) || [])

    // Process data rows
    let okRows = 0
    let errorRows = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''))
      
      if (row.length < headers.length) {
        errorRows++
        errors.push(`Row ${i + 1}: Insufficient columns`)
        continue
      }

      const companyCode = row[companyIndex]
      const periodo = row[periodoIndex]
      const value = parseFloat(row[valueIndex])

      // Validate periodo format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(periodo)) {
        errorRows++
        errors.push(`Row ${i + 1}: Invalid periodo format '${periodo}'. Expected YYYY-MM`)
        continue
      }

      // Map company code to company_id
      const companyId = companyMap.get(companyCode)
      if (!companyId) {
        errorRows++
        errors.push(`Row ${i + 1}: Company code '${companyCode}' not found`)
        continue
      }

      if (isNaN(value)) {
        errorRows++
        errors.push(`Row ${i + 1}: Invalid ${valueColumn} value '${row[valueIndex]}'`)
        continue
      }

      // Extract anio from periodo
      const anio = periodo.substring(0, 4)

      // Upsert data
      try {
        const upsertData = {
          company_id: companyId,
          anio,
          periodo,
          [valueColumn]: value
        }

        const { error: upsertError } = await supabaseAdmin
          .from(tableName)
          .upsert(upsertData, { 
            onConflict: 'company_id,periodo',
            ignoreDuplicates: false 
          })

        if (upsertError) {
          console.log('Upsert error:', upsertError)
          errorRows++
          errors.push(`Row ${i + 1}: Database error - ${upsertError.message}`)
        } else {
          okRows++
        }
      } catch (error) {
        console.log('Processing error:', error)
        errorRows++
        errors.push(`Row ${i + 1}: Processing error - ${error.message}`)
      }
    }

    // Update job with results
    const finalStatus = errorRows === 0 ? 'done' : (okRows > 0 ? 'done' : 'failed')
    const resumen = {
      ok_rows: okRows,
      error_rows: errorRows,
      total_rows: lines.length - 1,
      errors: errors.slice(0, 10), // Limit errors for storage
      tipo: tipo,
      table: tableName
    }

    await supabaseAdmin
      .from('import_jobs')
      .update({ 
        estado: finalStatus,
        ok_rows: okRows,
        error_rows: errorRows,
        total_rows: lines.length - 1,
        resumen,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', job_id)

    console.log('Import completed:', resumen)

    return new Response(JSON.stringify({
      success: true,
      message: 'Cashflow import completed',
      results: resumen
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import cashflow error:', error)
    return new Response(`Internal server error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
})