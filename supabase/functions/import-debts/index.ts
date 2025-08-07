import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobSummary {
  total_rows: number;
  ok_rows: number;
  error_rows: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { job_id, scenario = 'base' } = requestBody;
    
    // Security: Validate request body
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }
    
    // Security: Validate scenario parameter
    if (typeof scenario !== 'string' || scenario.length > 50) {
      throw new Error('Invalid scenario parameter');
    }
    
    console.log('Processing debt import job:', job_id, 'for scenario:', scenario);

    if (!job_id) {
      throw new Error('job_id is required');
    }

    // Get job info
    const { data: jobData, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !jobData) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ estado: 'processing' })
      .eq('id', job_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(jobData.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Parse CSV content with security validation
    const csvText = await fileData.text();
    
    // Security: Validate file size (10MB limit)
    if (csvText.length > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB');
    }
    
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least header and one data row');
    }
    
    if (lines.length > 10000) {
      throw new Error('Too many rows. Maximum is 10,000 rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV Headers:', headers);

    // Validate required columns
    const requiredColumns = ['entidad', 'tipo', 'capital', 'tir', 'plazo_meses', 'cuota', 'proximo_venc'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const summary: JobSummary = {
      total_rows: lines.length - 1,
      ok_rows: 0,
      error_rows: 0,
      errors: []
    };

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          throw new Error(`Row ${i}: Column count mismatch`);
        }

        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Security: Validate and convert data types with sanitization
        const debtData = {
          company_id: jobData.company_id,
          entidad: String(rowData.entidad || '').substring(0, 255), // Limit string length
          tipo: String(rowData.tipo || '').substring(0, 100),
          capital: parseFloat(rowData.capital),
          tir: rowData.tir ? parseFloat(rowData.tir) : null,
          plazo_meses: rowData.plazo_meses ? parseInt(rowData.plazo_meses) : null,
          cuota: rowData.cuota ? parseFloat(rowData.cuota) : null,
          proximo_venc: rowData.proximo_venc || null,
          escenario: String(rowData.escenario || scenario).substring(0, 50)
        };
        
        // Security: Additional bounds checking
        if (debtData.capital < -1e12 || debtData.capital > 1e12) {
          throw new Error(`Row ${i}: Capital amount out of allowed range`);
        }

        // Validate required fields
        if (!debtData.entidad || !debtData.tipo || isNaN(debtData.capital) || debtData.capital <= 0) {
          throw new Error(`Row ${i}: Invalid required data - entidad, tipo, and capital > 0 are required`);
        }

        // Validate TIR if provided
        if (debtData.tir !== null && (isNaN(debtData.tir) || debtData.tir < 0 || debtData.tir > 100)) {
          throw new Error(`Row ${i}: TIR must be between 0 and 100`);
        }

        // Validate date format if provided
        if (debtData.proximo_venc && !/^\d{4}-\d{2}-\d{2}$/.test(debtData.proximo_venc)) {
          throw new Error(`Row ${i}: Date must be in YYYY-MM-DD format`);
        }

        // Insert debt record
        const { error: insertError } = await supabase
          .from('debts')
          .insert(debtData);

        if (insertError) {
          throw new Error(`Row ${i}: Database error - ${insertError.message}`);
        }

        summary.ok_rows++;
        console.log(`Successfully processed row ${i}`);

      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        summary.error_rows++;
        summary.errors.push(`Row ${i}: ${error.message}`);
      }
    }

    // Update job with results
    const finalStatus = summary.error_rows === 0 ? 'done' : (summary.ok_rows === 0 ? 'failed' : 'done');
    
    await supabase
      .from('import_jobs')
      .update({
        estado: finalStatus,
        ok_rows: summary.ok_rows,
        error_rows: summary.error_rows,
        total_rows: summary.total_rows,
        resumen: summary
      })
      .eq('id', job_id);

    console.log('Import completed:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        summary: summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in import-debts function:', error);

    // Update job status to failed if we have job_id
    try {
      const { job_id } = await req.json();
      if (job_id) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
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
        status: 400,
      }
    );
  }
});