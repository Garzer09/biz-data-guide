import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Target, RefreshCw } from "lucide-react";

interface NofSimulatorProps {
  currentNof: number;
  currentCycleDays: number;
  annualRevenue: number;
  onPlanGenerate: (results: SimulationResults) => void;
}

interface SimulationResults {
  nofOptimized: number;
  cashLiberation: number;
  roceImprovement: number;
  newCycleDays: number;
}

export function NofSimulator({ currentNof, currentCycleDays, annualRevenue, onPlanGenerate }: NofSimulatorProps) {
  const [deltaCobro, setDeltaCobro] = useState(0); // Days reduction in collections
  const [deltaInventario, setDeltaInventario] = useState(0); // Days reduction in inventory
  const [deltaPago, setDeltaPago] = useState(0); // Days increase in payment terms
  
  const [results, setResults] = useState<SimulationResults | null>(null);

  // Calculate simulation results in real-time
  useEffect(() => {
    const dailyRevenue = annualRevenue / 360;
    
    // Estimate impact on NOF based on cycle day changes
    const cobroImpact = deltaCobro * dailyRevenue;
    const inventarioImpact = deltaInventario * dailyRevenue * 0.7; // Assume 70% cost ratio
    const pagoImpact = deltaPago * dailyRevenue * 0.6; // Assume 60% supplier ratio
    
    const totalImpact = cobroImpact + inventarioImpact - pagoImpact; // Negative deltaPago reduces NOF
    const nofOptimized = currentNof - totalImpact;
    const cashLiberation = currentNof - nofOptimized;
    
    // Simplified ROCE calculation (assuming 15% annual profit margin)
    const annualProfit = annualRevenue * 0.15;
    const currentAssets = annualRevenue * 1.2; // Simplified asset estimation
    const currentROCE = annualProfit / currentAssets;
    const optimizedROCE = annualProfit / (currentAssets - cashLiberation);
    const roceImprovement = (optimizedROCE - currentROCE) * 100;
    
    const newCycleDays = currentCycleDays - deltaCobro - deltaInventario + deltaPago;
    
    setResults({
      nofOptimized,
      cashLiberation,
      roceImprovement,
      newCycleDays
    });
  }, [deltaCobro, deltaInventario, deltaPago, currentNof, currentCycleDays, annualRevenue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDays = (value: number) => {
    return `${Math.round(value)} días`;
  };

  const resetSimulation = () => {
    setDeltaCobro(0);
    setDeltaInventario(0);
    setDeltaPago(0);
  };

  const handleGeneratePlan = () => {
    if (results) {
      onPlanGenerate(results);
    }
  };

  const getImpactColor = (value: number) => {
    if (value > 0) return "text-success";
    if (value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Simulador de Optimización NOF</CardTitle>
              <CardDescription>Ajusta los parámetros para optimizar el capital de trabajo</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetSimulation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Controls */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span>Reducción Días de Cobro</span>
                <Badge variant="outline">{deltaCobro} días</Badge>
              </Label>
              <Slider
                value={[deltaCobro]}
                onValueChange={(value) => setDeltaCobro(value[0])}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Meta: Acelerar cobros mediante mejores procesos
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span>Reducción Días de Inventario</span>
                <Badge variant="outline">{deltaInventario} días</Badge>
              </Label>
              <Slider
                value={[deltaInventario]}
                onValueChange={(value) => setDeltaInventario(value[0])}
                max={45}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Meta: Optimizar stock mediante gestión just-in-time
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span>Ampliación Días de Pago</span>
                <Badge variant="outline">+{deltaPago} días</Badge>
              </Label>
              <Slider
                value={[deltaPago]}
                onValueChange={(value) => setDeltaPago(value[0])}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Meta: Negociar mejores términos con proveedores
              </p>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Resultados de la Simulación</h4>
              
              <div className="grid gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">NOF Optimizada</div>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(results.nofOptimized)}
                  </div>
                  <div className={`text-sm ${getImpactColor(results.cashLiberation)}`}>
                    Liberación: {formatCurrency(results.cashLiberation)}
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Nuevo Ciclo Operativo</div>
                  <div className="text-lg font-semibold text-info">
                    {formatDays(results.newCycleDays)}
                  </div>
                  <div className={`text-sm ${getImpactColor(currentCycleDays - results.newCycleDays)}`}>
                    Mejora: {formatDays(currentCycleDays - results.newCycleDays)}
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Mejora ROCE</div>
                  <div className="text-lg font-semibold text-success">
                    +{results.roceImprovement.toFixed(2)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Retorno sobre capital empleado
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGeneratePlan}
                className="w-full"
                disabled={results.cashLiberation <= 0}
              >
                <Target className="h-4 w-4 mr-2" />
                Generar Plan de Implementación
              </Button>
            </div>
          )}
        </div>

        {/* Impact Summary */}
        {results && results.cashLiberation > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="font-semibold text-sm">Resumen del Impacto</span>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Liberación de caja:</span>
                <span className="font-medium text-success">{formatCurrency(results.cashLiberation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reducción ciclo:</span>
                <span className="font-medium text-primary">{formatDays(currentCycleDays - results.newCycleDays)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mejora rentabilidad:</span>
                <span className="font-medium text-success">+{results.roceImprovement.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}