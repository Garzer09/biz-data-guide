import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { read, utils } from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJob {
  id: string;
  company_id: string;
  tipo: string;
  estado: string;
}

interface ImportFile {
  job_id: string;
  storage_path: string;
}

interface PygRowData {
  anio: string;
  concepto_codigo: string;
  valor_total: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { job_id } = await req.json();
    
    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting P&G import for job:', job_id);

    // Get import job details
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !importJob) {
      console.error('Error fetching import job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get import file details
    const { data: importFile, error: fileError } = await supabaseClient
      .from('import_files')
      .select('storage_path')
      .eq('job_id', job_id)
      .single();

    if (fileError || !importFile) {
      console.error('Error fetching import file:', fileError);
      await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
      return new Response(
        JSON.stringify({ error: 'Archivo no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    await updateJobStatus(supabaseClient, job_id, 'PROCESSING', 0, 0, 0);

    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('import-files')
        .download(importFile.storage_path);

      if (downloadError || !fileData) {
        console.error('Error downloading file:', downloadError);
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
        return new Response(
          JSON.stringify({ error: 'Error descargando archivo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse file content
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let csvData: string;
      const fileName = importFile.storage_path.toLowerCase();
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel file
        const workbook = read(uint8Array, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        csvData = utils.sheet_to_csv(worksheet);
      } else if (fileName.endsWith('.csv')) {
        // Parse CSV file
        csvData = new TextDecoder('utf-8').decode(uint8Array);
      } else {
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
        return new Response(
          JSON.stringify({ error: 'Formato de archivo no soportado. Use CSV o XLSX.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse CSV data
      const rows = csvData.trim().split('\n').map(row => row.split(','));
      
      if (rows.length < 2) {
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
        return new Response(
          JSON.stringify({ error: 'El archivo debe contener al menos una fila de datos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1);

      // Validate required columns
      const requiredColumns = ['anio', 'concepto_codigo', 'valor_total'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
        return new Response(
          JSON.stringify({ 
            error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get column indices
      const anioIndex = headers.indexOf('anio');
      const conceptoIndex = headers.indexOf('concepto_codigo');
      const valorIndex = headers.indexOf('valor_total');

      // Parse data rows
      const pygData: any[] = [];
      const parseErrors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2; // +2 because we skip header and 0-index

        try {
          const anio = row[anioIndex]?.trim();
          const concepto_codigo = row[conceptoIndex]?.trim();
          const valor_total_str = row[valorIndex]?.trim();

          if (!anio || !concepto_codigo || !valor_total_str) {
            parseErrors.push(`Fila ${rowNum}: campos requeridos vacíos`);
            continue;
          }

          const valor_total = parseFloat(valor_total_str);
          if (isNaN(valor_total)) {
            parseErrors.push(`Fila ${rowNum}: valor_total no es un número válido`);
            continue;
          }

          pygData.push({
            company_id: importJob.company_id,
            anio,
            concepto_codigo,
            valor_total
          });
        } catch (error) {
          parseErrors.push(`Fila ${rowNum}: error de parsing - ${error.message}`);
        }
      }

      if (pygData.length === 0) {
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, parseErrors.length, dataRows.length);
        return new Response(
          JSON.stringify({ 
            error: 'No se pudieron procesar datos válidos',
            parseErrors 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate data using the validation function
      const { data: validationResult, error: validationError } = await supabaseClient.functions
        .invoke('validate-pyg-data', {
          body: { 
            data: pygData,
            action: 'validate' 
          }
        });

      if (validationError) {
        console.error('Validation function error:', validationError);
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, pygData.length, dataRows.length);
        return new Response(
          JSON.stringify({ error: 'Error en validación de datos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!validationResult.isValid) {
        await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, pygData.length, dataRows.length);
        return new Response(
          JSON.stringify({ 
            error: 'Datos no válidos',
            validationErrors: validationResult.errors,
            validationWarnings: validationResult.warnings,
            parseErrors
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Perform UPSERT operations
      let successCount = 0;
      let errorCount = 0;
      const upsertErrors: string[] = [];

      for (const item of pygData) {
        try {
          const { error: upsertError } = await supabaseClient
            .from('pyg_annual')
            .upsert(item, {
              onConflict: 'company_id,anio,concepto_codigo'
            });

          if (upsertError) {
            errorCount++;
            upsertErrors.push(`${item.concepto_codigo} ${item.anio}: ${upsertError.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errorCount++;
          upsertErrors.push(`${item.concepto_codigo} ${item.anio}: ${error.message}`);
        }
      }

      // Update job status
      const finalStatus = errorCount > 0 ? 'ERROR' : 'COMPLETED';
      await updateJobStatus(supabaseClient, job_id, finalStatus, successCount, errorCount + parseErrors.length, dataRows.length);

      console.log(`Import completed: ${successCount} success, ${errorCount} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Importación completada: ${successCount} registros exitosos, ${errorCount} errores`,
          totalRows: dataRows.length,
          successCount,
          errorCount: errorCount + parseErrors.length,
          validationWarnings: validationResult.warnings || [],
          parseErrors,
          upsertErrors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('Processing error:', processingError);
      await updateJobStatus(supabaseClient, job_id, 'ERROR', 0, 0, 1);
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

async function updateJobStatus(
  supabaseClient: any, 
  jobId: string, 
  estado: string, 
  okRows: number, 
  errorRows: number, 
  totalRows: number
) {
  const { error } = await supabaseClient
    .from('import_jobs')
    .update({
      estado,
      ok_rows: okRows,
      error_rows: errorRows,
      total_rows: totalRows
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
  }
}