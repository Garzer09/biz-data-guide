import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { YearSelector } from "@/components/dashboard/year-selector";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  BarChart3,
  Download,
  Settings,
  Info,
  Target
} from "lucide-react";

interface NofSummary {
  nof_total: number;
  dias_ciclo: number;
  clientes: number;
  inventario: number;
  otros_deudores: number;
  anticipos_clientes: number;
  trabajos_en_curso: number;
  proveedores: number;
  otros_acreedores: number;
}

interface NofComponent {
  componente: string;
  valor: number;
}

interface NofRatio {
  ratio_name: string;
  ratio_value: number;
  interpretation: string;
}

export function NofPage() {
  const { companyId } = useParams();
  const { toast } = useToast();

  // State
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [summary, setSummary] = useState<NofSummary | null>(null);
  const [components, setComponents] = useState<NofComponent[]>([]);
  const [ratios, setRatios] = useState<NofRatio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load years on mount
  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  // Load NOF data when year changes
  useEffect(() => {
    if (selectedYear && companyId) {
      fetchNofData();
    }
  }, [selectedYear, companyId]);

  const fetchYears = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: yearList, error: errYears } = await supabase
        .rpc('get_nof_years', { _company_id: companyId });

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

  const fetchNofData = useCallback(async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all NOF data in parallel
      const [
        { data: summaryData },
        { data: componentsData },
        { data: ratiosData }
      ] = await Promise.all([
        supabase
          .from('vw_nof_summary')
          .select('*')
          .eq('company_id', companyId)
          .like('periodo', `${selectedYear}%`)
          .order('periodo', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .rpc('get_nof_components', { 
            _company_id: companyId, 
            _anio: selectedYear 
          }),
        supabase
          .rpc('get_nof_ratios', { 
            _company_id: companyId, 
            _anio: selectedYear 
          })
      ]);

      setSummary(summaryData);
      setComponents(componentsData || []);
      setRatios(ratiosData || []);

    } catch (error) {
      console.error('Error fetching NOF data:', error);
      setError('Error cargando análisis NOF');
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

  const formatDays = (value: number): string => {
    return `${value.toFixed(0)} días`;
  };

  const getEfficiencyStatus = (diasCiclo: number): { status: string; color: string } => {
    if (diasCiclo < 30) return { status: "Excelente", color: "bg-success" };
    if (diasCiclo < 60) return { status: "Buena", color: "bg-primary" };
    if (diasCiclo < 90) return { status: "Regular", color: "bg-warning" };
    return { status: "Mejorable", color: "bg-destructive" };
  };

  const handleExport = () => {
    toast({
      title: "Función no disponible",
      description: "La exportación estará disponible próximamente"
    });
  };

  const handleSimulate = () => {
    toast({
      title: "Función no disponible", 
      description: "El simulador estará disponible próximamente"
    });
  };

  const handleRecommendations = () => {
    toast({
      title: "Función no disponible",
      description: "Las recomendaciones estarán disponibles próximamente"
    });
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
          <h3 className="text-lg font-semibold mb-2">Sin datos de NOF</h3>
          <p className="text-muted-foreground">No hay datos operativos suficientes para el análisis NOF</p>
        </div>
      </div>
    );
  }

  const efficiencyStatus = summary ? getEfficiencyStatus(summary.dias_ciclo) : null;

  return (
    <div className="space-y-6" role="main" aria-label="Análisis NOF">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Necesidades Operativas de Financiación (NOF)</h1>
            <p className="text-muted-foreground">Análisis del capital de trabajo y ciclo operativo</p>
          </div>
          {efficiencyStatus && (
            <Badge variant="secondary" className={`${efficiencyStatus.color} text-white`}>
              Eficiencia: {efficiencyStatus.status}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleRecommendations}>
            <Info className="h-4 w-4 mr-2" />
            Recomendaciones
          </Button>
          <Button variant="outline" size="sm" onClick={handleSimulate}>
            <Settings className="h-4 w-4 mr-2" />
            Simular
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
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

      {/* NOF Analysis Cards */}
      {!isLoading && summary && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">NOF Total</CardTitle>
                    <CardDescription className="text-xs">Necesidades de financiación</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`text-2xl font-bold ${summary.nof_total >= 0 ? 'text-warning' : 'text-success'}`}>
                  {formatCurrency(summary.nof_total)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {summary.nof_total >= 0 ? 'Financiación requerida' : 'Autofinanciación operativa'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Clock className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Días de Ciclo</CardTitle>
                    <CardDescription className="text-xs">Duración del ciclo operativo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-info">
                  {formatDays(summary.dias_ciclo)}
                </div>
                <div className="text-sm text-muted-foreground">
                  vs Sector: ±15 días (benchmark)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <CardDescription className="text-xs">Cuentas por cobrar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(summary.clientes)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {((summary.clientes / Math.abs(summary.nof_total)) * 100).toFixed(1)}% del NOF
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Target className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Inventario</CardTitle>
                    <CardDescription className="text-xs">Stock operativo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(summary.inventario)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {((summary.inventario / Math.abs(summary.nof_total)) * 100).toFixed(1)}% del NOF
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
                    <CardDescription className="text-xs">Cuentas por pagar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(summary.proveedores)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Financiación automática
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Impacto en Caja</CardTitle>
                    <CardDescription className="text-xs">Efecto en liquidez</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`text-2xl font-bold ${summary.nof_total >= 0 ? 'text-destructive' : 'text-success'}`}>
                  {summary.nof_total >= 0 ? '-' : '+'}{formatCurrency(Math.abs(summary.nof_total))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Efecto neto en tesorería
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Waterfall Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis de Componentes NOF
              </CardTitle>
              <CardDescription>
                Desglose waterfall de los elementos que componen las necesidades operativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {components.map((component, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">{component.componente}</div>
                    <div className={`text-lg font-bold ${
                      component.valor >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatCurrency(component.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ratios Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análisis de Ratios NOF
              </CardTitle>
              <CardDescription>
                Interpretación y análisis de los indicadores operativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratios.map((ratio, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{ratio.ratio_name}</h4>
                      <div className="text-lg font-bold text-primary">
                        {ratio.ratio_name.includes('%') 
                          ? `${ratio.ratio_value?.toFixed(1)}%` 
                          : ratio.ratio_name.includes('Días')
                          ? formatDays(ratio.ratio_value || 0)
                          : formatCurrency(ratio.ratio_value || 0)
                        }
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ratio.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}