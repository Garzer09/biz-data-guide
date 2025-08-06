import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIDiagnosisProps {
  metrics: Array<{
    title: string;
    value: string;
    unit: string;
    description: string;
    trend?: {
      value: string;
      isPositive: boolean;
      label: string;
    };
  }>;
}

export function AIDiagnosis({ metrics }: AIDiagnosisProps) {
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateDiagnosis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-diagnosis', {
        body: { metrics }
      });

      if (error) throw error;

      setDiagnosis(data.diagnosis);
    } catch (error) {
      console.error('Error generating diagnosis:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el diagnóstico. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateDiagnosis();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Diagnóstico Financiero Inteligente
        </h2>
        <Button
          onClick={generateDiagnosis}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Brain className="h-5 w-5 animate-pulse" />
              <span>Analizando KPIs con IA...</span>
            </div>
          </div>
        ) : diagnosis ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {diagnosis}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Haz clic en "Actualizar" para generar un diagnóstico</p>
          </div>
        )}
      </Card>
    </section>
  );
}