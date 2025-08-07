import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { YearSelector } from "@/components/dashboard/year-selector";
import { BreakEvenSimulator } from "@/components/breakeven/break-even-simulator";
import { BreakEvenChart } from "@/components/breakeven/break-even-chart";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  AlertCircle, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  TrendingUp,
  Shield,
  Activity,
  Download,
  Info
} from "lucide-react";

interface BreakevenData {
  ingresos_totales: number;
  costes_variables: number;
  costes_fijos: number;
  margen_contribucion_total: number;
  ratio_margen_contribucion: number;
  punto_equilibrio_valor: number;
  margen_seguridad_valor: number;
  margen_seguridad_porcentaje: number;
  apalancamiento_operativo: number;
}

interface SimulationScenario {
  unidadesBE: number;
  valorBE: number;
  margenSeg: number;
}

export function BreakevenPage() {
  const { companyId } = useParams();
  const { toast } = useToast();

  // State
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [scenario, setScenario] = useState<"base" | "optimista" | "pesimista">("base");
  const [breakevenData, setBreakevenData] = useState<BreakevenData | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load years on mount
  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  // Load breakeven analysis when year changes
  useEffect(() => {
    if (selectedYear && companyId) {
      fetchBreakevenAnalysis();
    }
  }, [selectedYear, companyId]);

  const fetchYears = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: yearList, error: errYears } = await supabase
        .rpc('get_analisis_punto_muerto_years', { _company_id: companyId });

      if (errYears) {
        setError(errYears.message);
        return;
      }
      
      const years = yearList?.map((item: any) => item.anio) || [];
      setYears(years);
      
      if (years.length > 0) {
        setSelectedYear(years[0]); // Select most recent year
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      setError('Error cargando años disponibles');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchBreakevenAnalysis = useCallback(async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Call all breakeven analysis functions in parallel
      const [
        { data: ingresos },
        { data: costesVariables },
        { data: costesFijos },
        { data: margenContribucionTotal },
        { data: ratioMargenContribucion },
        { data: puntoEquilibrio },
        { data: margenSeguridadValor },
        { data: margenSeguridadPorcentaje },
        { data: apalancamientoOperativo }
      ] = await Promise.all([
        supabase.rpc('get_ingresos_totales', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_costes_variables_totales', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_costes_fijos_totales', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_margen_contribucion_total', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_ratio_margen_contribucion', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_punto_equilibrio_valor', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_margen_seguridad_valor', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_margen_seguridad_porcentaje', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_apalancamiento_operativo', { _company_id: companyId, _anio: selectedYear })
      ]);

      setBreakevenData({
        ingresos_totales: ingresos || 0,
        costes_variables: costesVariables || 0,
        costes_fijos: costesFijos || 0,
        margen_contribucion_total: margenContribucionTotal || 0,
        ratio_margen_contribucion: ratioMargenContribucion || 0,
        punto_equilibrio_valor: puntoEquilibrio || 0,
        margen_seguridad_valor: margenSeguridadValor || 0,
        margen_seguridad_porcentaje: margenSeguridadPorcentaje || 0,
        apalancamiento_operativo: apalancamientoOperativo || 0
      });

    } catch (error) {
      console.error('Error fetching breakeven analysis:', error);
      setError('Error cargando análisis de punto muerto');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedYear]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number): string => {
    return value.toFixed(2);
  };

  // Show loading for initial load
  if (isLoading && years.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (years.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sin datos de análisis</h3>
          <p className="text-muted-foreground">No hay datos suficientes para realizar el análisis de punto muerto</p>
        </div>
      </div>
    );
  }

  const handleScenarioApply = (newScenario: SimulationScenario) => {
    setSimulationData(newScenario);
    toast({
      title: "Escenario aplicado",
      description: "Los datos de simulación han sido actualizados"
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Función no disponible",
      description: "La exportación a PDF estará disponible próximamente"
    });
  };

  // Use simulation data if available, otherwise use real data
  const displayData = simulationData ? {
    ...breakevenData!,
    punto_equilibrio_valor: simulationData.valorBE,
    margen_seguridad_porcentaje: simulationData.margenSeg,
  } : breakevenData;

  return (
    <TooltipProvider>
      <div className="space-y-6" role="main" aria-label="Análisis de Punto Muerto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis de Punto Muerto</h1>
            <p className="text-muted-foreground">Análisis de costes, margen de contribución y umbral de rentabilidad</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={scenario} onValueChange={(value: any) => setScenario(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Escenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="optimista">Optimista</SelectItem>
                <SelectItem value="pesimista">Pesimista</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={years}
            />
          </div>
        </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state for data */}
      {isLoading && selectedYear && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {!isLoading && breakevenData && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">Punto Muerto (Valor)</CardTitle>
                      <CardDescription className="text-xs">Umbral de rentabilidad</CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nivel de ventas necesario para cubrir todos los costes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(displayData?.punto_equilibrio_valor || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  en ventas
                  {displayData?.margen_seguridad_porcentaje && displayData.margen_seguridad_porcentaje < 20 && (
                    <Badge variant="destructive" className="ml-2 text-xs">Nivel crítico</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">Margen de Contribución</CardTitle>
                      <CardDescription className="text-xs">Por cada euro vendido</CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Porcentaje que contribuye a cubrir costes fijos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatPercentage(breakevenData.ratio_margen_contribucion)}
                </div>
                <div className="text-sm text-muted-foreground">por euro vendido</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-info/10 rounded-lg">
                      <Shield className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">Margen de Seguridad</CardTitle>
                      <CardDescription className="text-xs">Distancia al punto muerto</CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Porcentaje de ventas que puede perderse antes de entrar en pérdidas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (displayData?.margen_seguridad_porcentaje || 0) > 20 ? 'text-success' : 
                  (displayData?.margen_seguridad_porcentaje || 0) > 10 ? 'text-warning' : 'text-destructive'
                }`}>
                  {formatPercentage(displayData?.margen_seguridad_porcentaje || 0)}
                </div>
                <div className="text-sm text-muted-foreground">sobre ventas actuales</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Activity className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">Apalancamiento Operativo</CardTitle>
                      <CardDescription className="text-xs">Sensibilidad al volumen</CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Factor que multiplica el impacto de cambios en ventas sobre beneficios</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {formatRatio(breakevenData.apalancamiento_operativo)}x
                </div>
                <div className="text-sm text-muted-foreground">factor de apalancamiento</div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Simulator */}
          <BreakEvenSimulator
            initialData={{
              costesFijos: breakevenData.costes_fijos,
              precioUnitario: breakevenData.ingresos_totales / (breakevenData.ingresos_totales / 100), // Estimated unit price
              costesVariables: breakevenData.costes_variables,
              ingresos: breakevenData.ingresos_totales
            }}
            onScenarioApply={handleScenarioApply}
          />

          {/* Break-even Chart */}
          <BreakEvenChart
            data={{
              costesFijos: breakevenData.costes_fijos,
              precioUnitario: breakevenData.ingresos_totales / (breakevenData.ingresos_totales / 100),
              costesVariablesPct: (breakevenData.costes_variables / breakevenData.ingresos_totales) * 100,
              ventasActuales: breakevenData.ingresos_totales / (breakevenData.ingresos_totales / 100)
            }}
          />
          {/* Analysis Summary */}
          {breakevenData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Interpretación del Análisis
                </CardTitle>
                <CardDescription>
                  Evaluación del riesgo operativo y margen de maniobra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Situación Actual</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Umbral de rentabilidad:</span>
                        <span className="font-medium">{formatCurrency(breakevenData.punto_equilibrio_valor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margen sobre umbral:</span>
                        <span className={`font-medium ${breakevenData.margen_seguridad_porcentaje > 20 ? 'text-success' : breakevenData.margen_seguridad_porcentaje > 10 ? 'text-warning' : 'text-destructive'}`}>
                          {formatPercentage(breakevenData.margen_seguridad_porcentaje)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cobertura de costes fijos:</span>
                        <span className="font-medium">{formatRatio(breakevenData.margen_contribucion_total / breakevenData.costes_fijos)}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Evaluación de Riesgo</h4>
                    <div className="space-y-2 text-sm">
                      {breakevenData.margen_seguridad_porcentaje > 20 && (
                        <div className="p-3 bg-success/10 rounded-lg text-success">
                          <strong>Riesgo Bajo:</strong> Margen de seguridad robusto. La empresa puede soportar reducciones significativas en ventas.
                        </div>
                      )}
                      {breakevenData.margen_seguridad_porcentaje > 10 && breakevenData.margen_seguridad_porcentaje <= 20 && (
                        <div className="p-3 bg-warning/10 rounded-lg text-warning">
                          <strong>Riesgo Moderado:</strong> Margen de seguridad aceptable. Monitorear de cerca las fluctuaciones en ventas.
                        </div>
                      )}
                      {breakevenData.margen_seguridad_porcentaje <= 10 && (
                        <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                          <strong>Riesgo Alto:</strong> Margen de seguridad estrecho. Vulnerable a pequeñas reducciones en ventas.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </TooltipProvider>
  );
}