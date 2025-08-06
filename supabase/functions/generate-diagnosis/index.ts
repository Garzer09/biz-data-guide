import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Format metrics for AI analysis
    const metricsText = metrics.map((metric: any) => {
      const trendText = metric.trend ? ` (Tendencia: ${metric.trend.label})` : '';
      return `${metric.title}: ${metric.value}${metric.unit} - ${metric.description}${trendText}`;
    }).join('\n');

    const prompt = `Eres un experto analista financiero. Analiza los siguientes KPIs financieros y proporciona un diagnóstico profesional en español:

${metricsText}

Proporciona un análisis detallado que incluya:
1. Evaluación general de la salud financiera
2. Fortalezas identificadas
3. Áreas de preocupación o riesgo
4. Recomendaciones específicas
5. Perspectivas futuras basadas en las tendencias

Sé específico, profesional y constructivo en tu análisis. Limita la respuesta a aproximadamente 300-400 palabras.`;

    console.log('Generating diagnosis with OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un analista financiero senior con amplia experiencia en diagnósticos empresariales. Proporciona análisis precisos, profesionales y constructivos.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const diagnosis = data.choices[0].message.content;

    console.log('Diagnosis generated successfully');

    return new Response(JSON.stringify({ diagnosis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-diagnosis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});