import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export function AIAnalysis() {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-financial-analysis', {
        body: { 
          prompt: "Realiza un análisis financiero integral de una empresa considerando indicadores clave como facturación, márgenes EBITDA, beneficio neto, liquidez, endeudamiento y fondo de maniobra. Proporciona insights estratégicos, identificación de fortalezas y áreas de mejora, y recomendaciones específicas para optimizar el rendimiento financiero." 
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Análisis generado",
        description: "El análisis financiero con IA se ha completado exitosamente.",
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el análisis. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análisis Financiero con IA
          </CardTitle>
          <CardDescription>
            Obtén insights profundos y recomendaciones estratégicas basadas en inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Análisis de tendencias
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Identificación de riesgos
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Recomendaciones estratégicas
              </div>
            </div>
            <Button 
              onClick={generateAnalysis} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando análisis...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generar Análisis IA
                </>
              )}
            </Button>
          </div>

          {analysis && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-3 text-foreground">Resultado del Análisis:</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          )}

          {!analysis && !isLoading && (
            <div className="mt-6 p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Haz clic en "Generar Análisis IA" para obtener insights financieros inteligentes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}