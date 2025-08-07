import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RatiosRow {
  company_code?: string;
  anio?: string;
  periodo?: string;
  ratio_name?: string;
  ratio_value?: number;
  benchmark?: number;
  [key: string]: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set the user context for RLS
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin privileges
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_current_user_admin');
    if (adminError || !isAdmin) {
      console.error('Admin verification failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verification successful for user:', user.id);

    // Get request body
    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing import job:', job_id);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Import job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path);

    if (fileError || !fileData) {
      console.error('Failed to download file:', fileError);
      await supabase
        .from('import_jobs')
        .update({ 
          estado: 'error',
          resumen: { error: 'File not found or could not be downloaded' }
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV content
    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      await supabase
        .from('import_jobs')
        .update({ 
          estado: 'error',
          resumen: { error: 'Empty file' }
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ error: 'Empty file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse header and data
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    console.log('CSV headers:', headers);
    console.log('Data lines to process:', dataLines.length);

    // Get company mapping
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_code');

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      await supabase
        .from('import_jobs')
        .update({ 
          estado: 'error',
          resumen: { error: 'Failed to fetch companies' }
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ error: 'Failed to fetch companies' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyMap = new Map(companies?.map(c => [c.company_code, c.id]) || []);

    // Process rows
    let totalRows = 0;
    let okRows = 0;
    let errorRows = 0;
    const errors: string[] = [];

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ 
        estado: 'processing',
        total_rows: dataLines.length
      })
      .eq('id', job_id);

    for (const line of dataLines) {
      totalRows++;
      
      try {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: RatiosRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });

        // Validate required fields
        if (!row.company_code) {
          throw new Error('Missing company_code');
        }

        if (!row.anio) {
          throw new Error('Missing anio');
        }

        if (!row.periodo) {
          throw new Error('Missing periodo');
        }

        if (!row.ratio_name) {
          throw new Error('Missing ratio_name');
        }

        // Map company_code to company_id
        const companyId = companyMap.get(row.company_code);
        if (!companyId) {
          throw new Error(`Company not found: ${row.company_code}`);
        }

        // Parse numeric values
        const ratioValue = row.ratio_value ? parseFloat(row.ratio_value.toString()) : null;
        const benchmark = row.benchmark ? parseFloat(row.benchmark.toString()) : null;

        // Upsert ratio data
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
          });

        if (upsertError) {
          throw new Error(`Database error: ${upsertError.message}`);
        }

        okRows++;
        console.log(`Processed row ${totalRows}: ${row.company_code} - ${row.ratio_name}`);

      } catch (error) {
        errorRows++;
        const errorMsg = `Row ${totalRows}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update job with final results
    const finalStatus = errorRows > 0 ? (okRows > 0 ? 'completed_with_errors' : 'error') : 'completed';
    
    await supabase
      .from('import_jobs')
      .update({
        estado: finalStatus,
        total_rows: totalRows,
        ok_rows: okRows,
        error_rows: errorRows,
        resumen: {
          processed_at: new Date().toISOString(),
          total_rows: totalRows,
          successful_rows: okRows,
          error_rows: errorRows,
          errors: errors.slice(0, 10), // Limit to first 10 errors
          success_rate: totalRows > 0 ? Math.round((okRows / totalRows) * 100) : 0
        }
      })
      .eq('id', job_id);

    console.log(`Import completed. Total: ${totalRows}, OK: ${okRows}, Errors: ${errorRows}`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        total_rows: totalRows,
        ok_rows: okRows,
        error_rows: errorRows,
        status: finalStatus,
        errors: errors.slice(0, 5) // Return first 5 errors in response
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});