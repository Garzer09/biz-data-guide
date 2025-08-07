import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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
      console.log('ERROR: No job_id provided')
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('company_id, storage_path')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.error('Error fetching job:', jobError)
      throw new Error('Job not found')
    }

    console.log('Processing job for company:', job.company_id)
    console.log('Storage path:', job.storage_path)

    // Download file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path)

    if (storageError || !fileData) {
      console.error('Error downloading file:', storageError)
      throw new Error('Failed to download file')
    }

    // Parse CSV data
    const fileContent = await fileData.text()
    console.log('File content length:', fileContent.length)
    
    const lines = fileContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows')
    }

    // Skip header and get data row
    const dataLine = lines[1]
    const values = dataLine.split(',').map(val => val.trim().replace(/"/g, ''))
    
    console.log('Parsed values:', values)

    // Map CSV columns to database fields
    const [
      sector,
      industria, 
      año_fundacion_str,
      empleados_str,
      ingresos_anuales_str,
      sede,
      sitio_web,
      descripcion,
      estructura_accionarial,
      organigrama
    ] = values

    // Convert numeric values
    const año_fundacion = año_fundacion_str ? parseInt(año_fundacion_str) : null
    const empleados = empleados_str ? parseInt(empleados_str) : null
    const ingresos_anuales = ingresos_anuales_str ? parseFloat(ingresos_anuales_str) : null

    console.log('Converted data:', {
      sector, industria, año_fundacion, empleados, ingresos_anuales,
      sede, sitio_web, descripcion, estructura_accionarial, organigrama
    })

    // Use the upsert function to save data
    const { error: upsertError } = await supabase.rpc('upsert_company_profile', {
      _company_id: job.company_id,
      _sector: sector || null,
      _industria: industria || null,
      "_año_fundacion": año_fundacion,
      _empleados: empleados,
      _ingresos_anuales: ingresos_anuales,
      _sede: sede || null,
      _sitio_web: sitio_web || null,
      _descripcion: descripcion || null,
      _estructura_accionarial: estructura_accionarial || null,
      _organigrama: organigrama || null
    })

    if (upsertError) {
      console.error('Error upserting company profile:', upsertError)
      throw upsertError
    }

    console.log('Company profile data saved successfully')

    // Update job status to done in database
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({ 
        estado: 'done',
        resumen: {
          ok_rows: 1,
          error_rows: 0,
          imported_data: {
            sector, industria, año_fundacion, empleados, ingresos_anuales,
            sede, sitio_web, descripcion, estructura_accionarial, organigrama
          }
        }
      })
      .eq('id', job_id)

    if (updateError) {
      console.error('Error updating job status:', updateError)
      throw updateError
    }

    console.log('Job status updated to done')

    // Return the expected response format
    return new Response(
      JSON.stringify({ 
        status: 'done', 
        summary: {
          ok_rows: 1,
          error_rows: 0
        },
        message: 'Company profile import completed successfully',
        job_id: job_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('ERROR in import-company-profile function:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Function failed', 
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})