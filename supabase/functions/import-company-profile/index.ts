import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ProcessingResult {
  ok_rows: string[]
  error_rows: Array<{ row: number; errors: string[] }>
  warnings: string[]
  estructura_accionarial: Array<{ company: string; data: any }>
  organigrama: Array<{ company: string; data: any }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Starting import-company-profile function ===')
    const { job_id } = await req.json()
    console.log('Received job_id:', job_id)

    if (!job_id) {
      console.log('No job_id provided')
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting import for job: ${job_id}`)

    // Get authorization header and create client with user context
    console.log('Checking authorization header...')
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    if (!authHeader) {
      console.log('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a client with the user's auth for checking admin status
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Check if user is admin using the user context
    console.log('Checking if user is admin...')
    const { data: isAdmin, error: adminError } = await userSupabase
      .rpc('is_current_user_admin')

    console.log('Admin check result - isAdmin:', isAdmin, 'error:', adminError)
    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError)
      return new Response(
        JSON.stringify({ error: 'Admin access required', details: adminError }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
     }

    // Get job details
    console.log('Fetching job details for:', job_id)
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('company_id, storage_path, tipo')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', jobError)
      return new Response(
        JSON.stringify({ error: 'Job not found', details: jobError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Job found:', job)

    // Update job status to processing
    console.log('Updating job status to processing')
    await supabase
      .from('import_jobs')
      .update({ estado: 'processing' })
      .eq('id', job_id)

    // Download file from storage
    console.log('Downloading file from storage:', job.storage_path)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path)

    console.log('Download result - fileData:', !!fileData, 'error:', downloadError)

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      await updateJobStatus(job_id, 'failed', { error: 'File download failed', details: downloadError })
      return new Response(
        JSON.stringify({ error: 'File download failed', details: downloadError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('File downloaded successfully, size:', fileData.size)

    // Convert file to text
    console.log('Converting file to text...')
    const fileText = await fileData.text()
    console.log('File text length:', fileText.length)
    console.log('First 200 chars:', fileText.substring(0, 200))
    
    // Parse CSV
    const lines = fileText.split('\n').filter(line => line.trim())
    console.log('Total lines found:', lines.length)
    if (lines.length < 2) {
      await updateJobStatus(job_id, 'failed', { error: 'File is empty or has no data rows' })
      return new Response(
        JSON.stringify({ error: 'File is empty or has no data rows' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const expectedHeaders = [
      'company_alias', 'sector', 'industria', 'anio_fundacion', 'empleados', 
      'ingresos_anuales', 'sede', 'sitio_web', 'descripcion', 
      'estructura_accionarial', 'organigrama'
    ]

    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      await updateJobStatus(job_id, 'failed', { 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      })
      return new Response(
        JSON.stringify({ error: `Missing required headers: ${missingHeaders.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get company mapping
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
    
    if (companiesError) {
      console.error('Error loading companies:', companiesError)
      await updateJobStatus(job_id, 'failed', { error: 'Failed to load companies' })
      return new Response(
        JSON.stringify({ error: 'Failed to load companies' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyMap = new Map(
      companies.map(c => [c.name.toLowerCase(), c.id])
    )

    // Process rows
    const result: ProcessingResult = {
      ok_rows: [],
      error_rows: [],
      warnings: [],
      estructura_accionarial: [],
      organigrama: []
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
      if (!row.trim()) continue

      try {
        const values = parseCSVRow(row)
        const rowData: { [key: string]: string } = {}
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        const errors: string[] = []

        // Find company
        const companyAlias = rowData.company_alias?.toLowerCase()
        const companyId = companyMap.get(companyAlias)
        
        if (!companyId) {
          errors.push(`Company '${rowData.company_alias}' not found`)
        }

        // Validate and parse numeric fields
        let anioFundacion: number | null = null
        if (rowData.anio_fundacion) {
          anioFundacion = parseInt(rowData.anio_fundacion)
          if (isNaN(anioFundacion) || anioFundacion <= 1800) {
            errors.push('anio_fundacion must be a number greater than 1800')
          }
        }

        let empleados: number | null = null
        if (rowData.empleados) {
          empleados = parseInt(rowData.empleados)
          if (isNaN(empleados) || empleados < 0) {
            errors.push('empleados must be a non-negative number')
          }
        }

        let ingresosAnuales: number | null = null
        if (rowData.ingresos_anuales) {
          ingresosAnuales = parseFloat(rowData.ingresos_anuales)
          if (isNaN(ingresosAnuales) || ingresosAnuales < 0) {
            errors.push('ingresos_anuales must be a non-negative number')
          }
        }

        // Validate and parse JSON fields
        let estructuraAccionarial: any = null
        if (rowData.estructura_accionarial) {
          try {
            estructuraAccionarial = JSON.parse(rowData.estructura_accionarial)
            if (companyId) {
              result.estructura_accionarial.push({
                company: rowData.company_alias,
                data: estructuraAccionarial
              })
            }
          } catch (e) {
            errors.push('estructura_accionarial must be valid JSON')
          }
        }

        let organigrama: any = null
        if (rowData.organigrama) {
          try {
            organigrama = JSON.parse(rowData.organigrama)
            if (companyId) {
              result.organigrama.push({
                company: rowData.company_alias,
                data: organigrama
              })
            }
          } catch (e) {
            errors.push('organigrama must be valid JSON')
          }
        }

        // Validate URL
        if (rowData.sitio_web) {
          try {
            new URL(rowData.sitio_web)
          } catch {
            errors.push('sitio_web must be a valid URL')
          }
        }

        if (errors.length > 0) {
          result.error_rows.push({ row: i + 1, errors })
          continue
        }

        if (!companyId) {
          result.error_rows.push({ row: i + 1, errors: ['Company not found'] })
          continue
        }

        // Upsert company profile
        const { error: upsertError } = await supabase.rpc('upsert_company_profile', {
          _company_id: companyId,
          _sector: rowData.sector || null,
          _industria: rowData.industria || null,
          "_año_fundacion": anioFundacion,
          _empleados: empleados,
          _ingresos_anuales: ingresosAnuales,
          _sede: rowData.sede || null,
          _sitio_web: rowData.sitio_web || null,
          _descripcion: rowData.descripcion || null
        })

        if (upsertError) {
          console.error('Upsert error:', upsertError)
          result.error_rows.push({ 
            row: i + 1, 
            errors: [`Database error: ${upsertError.message}`] 
          })
        } else {
          result.ok_rows.push(`Row ${i + 1}: ${rowData.company_alias}`)
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        result.error_rows.push({ 
          row: i + 1, 
          errors: [`Processing error: ${error.message}`] 
        })
      }
    }

    // Update job with results
    const status = result.error_rows.length === 0 ? 'done' : 'failed'
    await updateJobStatus(job_id, status, result)

    return new Response(
      JSON.stringify({ 
        status, 
        summary: {
          ok_rows: result.ok_rows.length,
          error_rows: result.error_rows.length,
          warnings: result.warnings.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in import-company-profile function:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    await updateJobStatus(job_id, 'failed', { 
      error: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Import failed', 
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function updateJobStatus(jobId: string, status: string, summary: any) {
  try {
    const { error } = await supabase
      .from('import_jobs')
      .update({ 
        estado: status, 
        resumen: summary,
        ok_rows: summary.ok_rows?.length || 0,
        error_rows: summary.error_rows?.length || 0,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', jobId)
    
    if (error) {
      console.error('Error updating job status:', error)
    }
  } catch (err) {
    console.error('Error in updateJobStatus:', err)
  }
}

function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}