import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { YearSelector } from "@/components/dashboard/year-selector";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Target,
  Shield,
  Zap,
  Building2
} from "lucide-react";

interface RatioData {
  ratio_name: string;
  ratio_value: number | null;
  benchmark: number | null;
}

interface RatioCard {
  name: string;
  value: number | null;
  benchmark: number | null;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  format: 'ratio' | 'percentage' | 'times';
  higherIsBetter: boolean; // true for liquidity ratios, false for debt ratios
}

export function RatiosPage() {
  const { companyId } = useParams();
  const { toast } = useToast();

  // State
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [ratiosData, setRatiosData] = useState<RatioData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load years on mount
  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  // Load ratios when year changes
  useEffect(() => {
    if (selectedYear && companyId) {
      fetchRatios();
    }
  }, [selectedYear, companyId]);

  const fetchYears = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      // For now, we'll use the balance years as ratios years
      // In a real implementation, you'd create a specific get_ratios_years RPC
      const { data: yearList, error: errYears } = await supabase
        .rpc('get_balance_years', { _company_id: companyId });

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

  const fetchRatios = useCallback(async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: ratiosError } = await supabase
        .rpc('get_ratios_financieros', {
          _company_id: companyId,
          _anio: selectedYear
        });

      if (ratiosError) {
        setError(ratiosError.message);
        return;
      }

      setRatiosData(data || []);
    } catch (error) {
      console.error('Error fetching ratios:', error);
      setError('Error cargando ratios financieros');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedYear]);

  // Real-time subscription for import job updates
  useEffect(() => {
    if (!companyId) return;

    console.log('Setting up real-time subscription for company:', companyId);
    
    const channel = supabase
      .channel('import-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('Received import job update:', payload);
          
          const newData = payload.new as any;
          if (newData.tipo === 'ratios') {
            if (newData.estado === 'completed') {
              fetchRatios(); // Refresh ratios data
              toast({
                title: "Importación completada",
                description: "Los ratios financieros han sido importados correctamente",
              });
            } else if (newData.estado === 'error' || newData.estado === 'completed_with_errors') {
              toast({
                title: "Error en la importación",
                description: "Hubo problemas al importar los ratios financieros",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId, toast, fetchRatios]);

  const formatRatioValue = (value: number | null, format: 'ratio' | 'percentage' | 'times'): string => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'times':
        return `${value.toFixed(2)}x`;
      case 'ratio':
      default:
        return value.toFixed(2);
    }
  };

  const getRatioColor = (value: number | null, benchmark: number | null, higherIsBetter: boolean): string => {
    if (value === null || benchmark === null) return 'text-muted-foreground';
    
    const threshold = benchmark * 0.8; // 80% of benchmark for yellow
    
    if (higherIsBetter) {
      // For ratios where higher is better (liquidity ratios)
      if (value >= benchmark) return 'text-success';
      if (value >= threshold) return 'text-warning';
      return 'text-destructive';
    } else {
      // For ratios where lower is better (debt ratios)
      if (value <= benchmark) return 'text-success';
      if (value <= benchmark * 1.25) return 'text-warning';
      return 'text-destructive';
    }
  };

  const getRatioIcon = (value: number | null, benchmark: number | null, higherIsBetter: boolean) => {
    if (value === null || benchmark === null) return AlertCircle;
    
    const meetsTarget = higherIsBetter ? value >= benchmark : value <= benchmark;
    return meetsTarget ? TrendingUp : TrendingDown;
  };

  // Define ratio cards configuration
  const getRatioCards = (): RatioCard[] => {
    const ratioMap = new Map(ratiosData.map(r => [r.ratio_name, r]));
    
    return [
      {
        name: 'Liquidez Corriente',
        value: ratioMap.get('Liquidez Corriente')?.ratio_value || null,
        benchmark: ratioMap.get('Liquidez Corriente')?.benchmark || null,
        icon: DollarSign,
        category: 'Liquidez',
        format: 'ratio',
        higherIsBetter: true
      },
      {
        name: 'Ratio Endeudamiento',
        value: ratioMap.get('Ratio Endeudamiento')?.ratio_value || null,
        benchmark: ratioMap.get('Ratio Endeudamiento')?.benchmark || null,
        icon: Shield,
        category: 'Apalancamiento',
        format: 'percentage',
        higherIsBetter: false
      },
      {
        name: 'ROA',
        value: ratioMap.get('ROA')?.ratio_value || null,
        benchmark: ratioMap.get('ROA')?.benchmark || null,
        icon: Target,
        category: 'Rentabilidad',
        format: 'percentage',
        higherIsBetter: true
      },
      {
        name: 'ROE',
        value: ratioMap.get('ROE')?.ratio_value || null,
        benchmark: ratioMap.get('ROE')?.benchmark || null,
        icon: TrendingUp,
        category: 'Rentabilidad',
        format: 'percentage',
        higherIsBetter: true
      },
      {
        name: 'Rotación Activos',
        value: ratioMap.get('Rotación Activos')?.ratio_value || null,
        benchmark: ratioMap.get('Rotación Activos')?.benchmark || null,
        icon: Zap,
        category: 'Actividad',
        format: 'times',
        higherIsBetter: true
      },
      {
        name: 'Apalancamiento',
        value: ratioMap.get('Apalancamiento')?.ratio_value || null,
        benchmark: ratioMap.get('Apalancamiento')?.benchmark || null,
        icon: BarChart3,
        category: 'Apalancamiento',
        format: 'ratio',
        higherIsBetter: false
      },
      {
        name: 'Deuda/EBITDA',
        value: ratioMap.get('Deuda/EBITDA')?.ratio_value || null,
        benchmark: ratioMap.get('Deuda/EBITDA')?.benchmark || null,
        icon: PieChart,
        category: 'Cobertura',
        format: 'times',
        higherIsBetter: false
      },
      {
        name: 'Cobertura Intereses',
        value: ratioMap.get('Cobertura Intereses')?.ratio_value || null,
        benchmark: ratioMap.get('Cobertura Intereses')?.benchmark || null,
        icon: Shield,
        category: 'Cobertura',
        format: 'times',
        higherIsBetter: true
      },
      {
        name: 'Capitalización',
        value: ratioMap.get('Capitalización')?.ratio_value || null,
        benchmark: ratioMap.get('Capitalización')?.benchmark || null,
        icon: Building2,
        category: 'Estructura',
        format: 'percentage',
        higherIsBetter: true
      }
    ];
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
          <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sin datos de ratios</h3>
          <p className="text-muted-foreground">No hay datos de ratios financieros disponibles para esta empresa</p>
        </div>
      </div>
    );
  }

  const ratioCards = getRatioCards();

  return (
    <div className="space-y-6" role="main" aria-label="Ratios Financieros">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ratios Financieros</h1>
          <p className="text-muted-foreground">Análisis de indicadores financieros clave con benchmarks sectoriales</p>
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
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* Ratios Grid */}
      {!isLoading && selectedYear && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ratioCards.map((ratio) => {
            const Icon = ratio.icon;
            const ValueIcon = getRatioIcon(ratio.value, ratio.benchmark, ratio.higherIsBetter);
            const valueColor = getRatioColor(ratio.value, ratio.benchmark, ratio.higherIsBetter);
            
            return (
              <Card key={ratio.name} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{ratio.name}</CardTitle>
                        <CardDescription className="text-xs">{ratio.category}</CardDescription>
                      </div>
                    </div>
                    <ValueIcon className={`h-4 w-4 ${valueColor}`} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Current Value */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${valueColor}`}>
                        {formatRatioValue(ratio.value, ratio.format)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Valor actual</div>
                  </div>

                  {/* Benchmark */}
                  {ratio.benchmark && (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatRatioValue(ratio.benchmark, ratio.format)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Benchmark sectorial</div>
                    </div>
                  )}

                  {/* Performance indicator */}
                  {ratio.value !== null && ratio.benchmark !== null && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">vs. Benchmark:</span>
                        <span className={valueColor}>
                          {ratio.higherIsBetter 
                            ? (ratio.value >= ratio.benchmark ? 'Cumple' : 'No cumple')
                            : (ratio.value <= ratio.benchmark ? 'Cumple' : 'No cumple')
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No data indicator */}
                  {ratio.value === null && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground text-center">
                        Sin datos disponibles
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary insights */}
      {!isLoading && ratioCards.some(r => r.value !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumen del Análisis
            </CardTitle>
            <CardDescription>
              Evaluación general de los ratios financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Ratios that meet benchmark */}
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {ratioCards.filter(r => {
                    if (r.value === null || r.benchmark === null) return false;
                    return r.higherIsBetter ? r.value >= r.benchmark : r.value <= r.benchmark;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Ratios que cumplen benchmark</div>
              </div>

              {/* Ratios close to benchmark */}
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <div className="text-2xl font-bold text-warning">
                  {ratioCards.filter(r => {
                    if (r.value === null || r.benchmark === null) return false;
                    const threshold = r.benchmark * 0.8;
                    if (r.higherIsBetter) {
                      return r.value < r.benchmark && r.value >= threshold;
                    } else {
                      return r.value > r.benchmark && r.value <= r.benchmark * 1.25;
                    }
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Ratios cercanos al objetivo</div>
              </div>

              {/* Ratios below benchmark */}
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {ratioCards.filter(r => {
                    if (r.value === null || r.benchmark === null) return false;
                    if (r.higherIsBetter) {
                      return r.value < r.benchmark * 0.8;
                    } else {
                      return r.value > r.benchmark * 1.25;
                    }
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Ratios que requieren atención</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}