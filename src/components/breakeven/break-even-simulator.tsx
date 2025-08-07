import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sliders, RefreshCw } from "lucide-react";

interface BreakEvenSimulatorProps {
  initialData: {
    costesFijos: number;
    precioUnitario: number;
    costesVariables: number;
    ingresos: number;
  };
  onScenarioApply: (scenario: {
    unidadesBE: number;
    valorBE: number;
    margenSeg: number;
  }) => void;
}

export function BreakEvenSimulator({ initialData, onScenarioApply }: BreakEvenSimulatorProps) {
  const [costesFijos, setCostesFijos] = useState(initialData.costesFijos);
  const [precioUnitario, setPrecioUnitario] = useState(initialData.precioUnitario);
  const [costesVariablesPct, setCostesVariablesPct] = useState(
    initialData.costesVariables / initialData.ingresos * 100
  );
  const [ventasActuales, setVentasActuales] = useState(
    initialData.ingresos / initialData.precioUnitario
  );

  const [calculatedResults, setCalculatedResults] = useState({
    unidadesBE: 0,
    valorBE: 0,
    margenSeg: 0
  });

  // Recalculate when any value changes
  useEffect(() => {
    const margenContribucionUnitario = precioUnitario - (precioUnitario * costesVariablesPct / 100);
    const unidadesBE = margenContribucionUnitario > 0 ? costesFijos / margenContribucionUnitario : 0;
    const valorBE = unidadesBE * precioUnitario;
    const ventasActualesValor = ventasActuales * precioUnitario;
    const margenSeg = ventasActualesValor > 0 ? ((ventasActualesValor - valorBE) / ventasActualesValor) * 100 : 0;

    setCalculatedResults({
      unidadesBE,
      valorBE,
      margenSeg
    });
  }, [costesFijos, precioUnitario, costesVariablesPct, ventasActuales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatUnits = (value: number) => {
    return new Intl.NumberFormat('es-ES').format(Math.round(value));
  };

  const resetToOriginal = () => {
    setCostesFijos(initialData.costesFijos);
    setPrecioUnitario(initialData.precioUnitario);
    setCostesVariablesPct(initialData.costesVariables / initialData.ingresos * 100);
    setVentasActuales(initialData.ingresos / initialData.precioUnitario);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sliders className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Simulador Interactivo</CardTitle>
              <CardDescription>Ajusta las variables para simular diferentes escenarios</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetToOriginal}>
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
              <Label className="text-sm font-medium">
                Costes Fijos: {formatCurrency(costesFijos)}
              </Label>
              <Slider
                value={[costesFijos]}
                onValueChange={(value) => setCostesFijos(value[0])}
                max={initialData.costesFijos * 2}
                min={0}
                step={1000}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Precio Unitario: {formatCurrency(precioUnitario)}
              </Label>
              <Slider
                value={[precioUnitario]}
                onValueChange={(value) => setPrecioUnitario(value[0])}
                max={initialData.precioUnitario * 1.5}
                min={initialData.precioUnitario * 0.5}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Costes Variables: {costesVariablesPct.toFixed(1)}%
              </Label>
              <Slider
                value={[costesVariablesPct]}
                onValueChange={(value) => setCostesVariablesPct(value[0])}
                max={100}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Ventas Actuales: {formatUnits(ventasActuales)} unidades
              </Label>
              <Slider
                value={[ventasActuales]}
                onValueChange={(value) => setVentasActuales(value[0])}
                max={(initialData.ingresos / initialData.precioUnitario) * 2}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Resultados Simulados</h4>
            
            <div className="grid gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Punto de Equilibrio</div>
                <div className="text-lg font-semibold text-primary">
                  {formatUnits(calculatedResults.unidadesBE)} unidades
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(calculatedResults.valorBE)}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Margen de Seguridad</div>
                <div className={`text-lg font-semibold ${
                  calculatedResults.margenSeg > 20 ? 'text-success' : 
                  calculatedResults.margenSeg > 10 ? 'text-warning' : 'text-destructive'
                }`}>
                  {calculatedResults.margenSeg.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {calculatedResults.margenSeg > 20 ? 'Riesgo Bajo' : 
                   calculatedResults.margenSeg > 10 ? 'Riesgo Moderado' : 'Riesgo Alto'}
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onScenarioApply(calculatedResults)}
              className="w-full"
            >
              Aplicar Escenario
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}