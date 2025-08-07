import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

interface JobSummary {
  total_rows: number;
  successful_rows: number;
  error_rows: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { job_id } = requestBody;
    
    // Security: Validate request body
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }

    if (!job_id) {
      throw new Error('job_id is required');
    }

    console.log(`Processing debt service import for job: ${job_id}`);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ estado: 'processing' })
      .eq('id', job_id);

    console.log(`Job found: ${job.tipo} for company ${job.company_id}`);

    // Download CSV file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(job.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Parse CSV content with security validation
    const csvText = await fileData.text();
    
    // Security: Validate file size (10MB limit)
    if (csvText.length > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB');
    }
    
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }
    
    if (lines.length > 10000) {
      throw new Error('Too many rows. Maximum is 10,000 rows');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV Headers:', headers);

    // Validate required columns
    const requiredColumns = ['company_code', 'periodo', 'principal', 'intereses', 'flujo_operativo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Get company mapping
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_code')
      .not('company_code', 'is', null);

    if (companiesError) {
      throw new Error(`Failed to get companies: ${companiesError.message}`);
    }

    const companyMap = new Map(
      companies.map(c => [c.company_code, c.id])
    );

    const summary: JobSummary = {
      total_rows: lines.length - 1, // Exclude header
      successful_rows: 0,
      error_rows: 0,
      errors: []
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Validate and map company_code to company_id
        if (!rowData.company_code) {
          throw new Error(`Row ${i}: company_code is required`);
        }

        const company_id = companyMap.get(rowData.company_code);
        if (!company_id) {
          throw new Error(`Row ${i}: Company not found for code: ${rowData.company_code}`);
        }

        // Validate periodo format (YYYY-MM)
        const periodoRegex = /^\d{4}-\d{2}$/;
        if (!periodoRegex.test(rowData.periodo)) {
          throw new Error(`Row ${i}: Invalid periodo format. Expected YYYY-MM, got: ${rowData.periodo}`);
        }

        // Security: Validate and parse numeric fields with bounds checking
        const principal = parseFloat(rowData.principal || '0');
        const intereses = parseFloat(rowData.intereses || '0');
        const flujo_operativo = parseFloat(rowData.flujo_operativo || '0');

        if (isNaN(principal) || isNaN(intereses) || isNaN(flujo_operativo)) {
          throw new Error(`Row ${i}: Invalid numeric values`);
        }
        
        // Security: Validate numeric bounds
        if (principal < -1e12 || principal > 1e12 || 
            intereses < -1e12 || intereses > 1e12 || 
            flujo_operativo < -1e12 || flujo_operativo > 1e12) {
          throw new Error(`Row ${i}: Numeric values out of allowed range`);
        }

        // Upsert debt service record
        const { error: upsertError } = await supabase
          .from('debt_service')
          .upsert({
            company_id,
            periodo: rowData.periodo,
            principal,
            intereses,
            flujo_operativo
          }, {
            onConflict: 'company_id,periodo'
          });

        if (upsertError) {
          throw new Error(`Row ${i}: Database error: ${upsertError.message}`);
        }

        summary.successful_rows++;
        console.log(`✓ Row ${i} processed successfully`);

      } catch (error) {
        summary.error_rows++;
        const errorMsg = `Row ${i}: ${error.message}`;
        summary.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    // Update job with final status and summary
    const finalStatus = summary.error_rows === 0 ? 'done' : 
                       summary.successful_rows === 0 ? 'failed' : 'done';

    await supabase
      .from('import_jobs')
      .update({
        estado: finalStatus,
        total_rows: summary.total_rows,
        ok_rows: summary.successful_rows,
        error_rows: summary.error_rows,
        resumen: summary
      })
      .eq('id', job_id);

    console.log(`Import completed. Status: ${finalStatus}`);
    console.log(`Summary: ${summary.successful_rows}/${summary.total_rows} rows successful`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        status: finalStatus,
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in import-debt-service function:', error);

    // Try to update job status to failed
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { job_id } = await req.json();
      if (job_id) {
        await supabase
          .from('import_jobs')
          .update({
            estado: 'failed',
            resumen: { error: error.message }
          })
          .eq('id', job_id);
      }
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});