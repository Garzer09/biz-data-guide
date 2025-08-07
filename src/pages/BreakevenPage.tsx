import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { YearSelector } from "@/components/dashboard/year-selector";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  AlertCircle, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  TrendingUp,
  Shield,
  Activity
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

export function BreakevenPage() {
  const { companyId } = useParams();
  const { toast } = useToast();

  // State
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [breakevenData, setBreakevenData] = useState<BreakevenData | null>(null);
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

  return (
    <div className="space-y-6" role="main" aria-label="Análisis de Punto Muerto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Punto Muerto</h1>
          <p className="text-muted-foreground">Análisis de costes, margen de contribución y umbral de rentabilidad</p>
        </div>
        <div className="flex items-center gap-4">
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

      {/* Breakeven Analysis Cards */}
      {!isLoading && breakevenData && (
        <>
          {/* Financial Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <CardDescription className="text-xs">Facturación del período</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(breakevenData.ingresos_totales)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Costes Variables</CardTitle>
                    <CardDescription className="text-xs">Coste de ventas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(breakevenData.costes_variables)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <PieChart className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Costes Fijos</CardTitle>
                    <CardDescription className="text-xs">Gastos operativos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(breakevenData.costes_fijos)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Margen de Contribución</CardTitle>
                    <CardDescription className="text-xs">Ingresos - Costes Variables</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(breakevenData.margen_contribucion_total)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPercentage(breakevenData.ratio_margen_contribucion)} del total de ingresos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Punto de Equilibrio</CardTitle>
                    <CardDescription className="text-xs">Umbral de rentabilidad</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(breakevenData.punto_equilibrio_valor)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPercentage((breakevenData.punto_equilibrio_valor / breakevenData.ingresos_totales) * 100)} de ingresos actuales
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Shield className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Margen de Seguridad</CardTitle>
                    <CardDescription className="text-xs">Distancia al punto muerto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-info">
                  {formatCurrency(breakevenData.margen_seguridad_valor)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPercentage(breakevenData.margen_seguridad_porcentaje)} sobre ingresos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Activity className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Apalancamiento Operativo</CardTitle>
                    <CardDescription className="text-xs">Sensibilidad al volumen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {formatRatio(breakevenData.apalancamiento_operativo)}x
                </div>
                <div className="text-sm text-muted-foreground">
                  Factor de apalancamiento
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Summary */}
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
        </>
      )}
    </div>
  );
}