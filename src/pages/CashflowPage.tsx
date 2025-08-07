import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { YearSelector } from "@/components/dashboard/year-selector";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download, Plus, DollarSign, Building2, AlertCircle, Gauge, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Calculator, Eye, Play, Clock, Target, Zap } from "lucide-react";

interface InsightData {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'warning' | 'info';
}

interface CashflowData {
  periodo: string;
  flujo_operativo?: number;
  flujo_inversion?: number;
  flujo_financiacion?: number;
}

export function CashflowPage() {
  const { companyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [operativoData, setOperativoData] = useState<CashflowData[]>([]);
  const [inversionData, setInversionData] = useState<CashflowData[]>([]);
  const [financiacionData, setFinanciacionData] = useState<CashflowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simulator state
  const [deltaCobro, setDeltaCobro] = useState([0]);
  const [deltaPago, setDeltaPago] = useState([0]);
  const [deltaInventario, setDeltaInventario] = useState([0]);

  // Load initial data
  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  // Load cashflow data when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchCashflows();
    }
  }, [selectedYear]);

  const fetchYears = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: yearList, error: errYears } = await supabase.rpc('get_cashflow_years', {
        _company_id: companyId
      });

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

  const fetchCashflows = useCallback(async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const [
        { data: op, error: e1 },
        { data: inv, error: e2 },
        { data: fin, error: e3 }
      ] = await Promise.all([
        supabase.rpc('get_cashflow_operativo', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_cashflow_inversion', { _company_id: companyId, _anio: selectedYear }),
        supabase.rpc('get_cashflow_financiacion', { _company_id: companyId, _anio: selectedYear }),
      ]);

      if (e1 || e2 || e3) {
        setError(e1?.message || e2?.message || e3?.message || 'Error cargando datos');
      } else {
        setOperativoData(op || []);
        setInversionData(inv || []);
        setFinanciacionData(fin || []);
      }
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      setError('Error cargando flujos de caja');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedYear]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    } else {
      return `€${value.toLocaleString()}`;
    }
  };

  const calculateSums = () => {
    const operativoSum = operativoData.reduce((sum, item) => sum + (item.flujo_operativo || 0), 0);
    const inversionSum = inversionData.reduce((sum, item) => sum + (item.flujo_inversion || 0), 0);
    const financiacionSum = financiacionData.reduce((sum, item) => sum + (item.flujo_financiacion || 0), 0);
    const flujoNeto = operativoSum + inversionSum + financiacionSum;

    return {
      operativo: operativoSum,
      inversion: inversionSum,
      financiacion: financiacionSum,
      neto: flujoNeto
    };
  };

  const getWaterfallData = () => {
    const sums = calculateSums();
    
    // Placeholder values for missing data - in real implementation these would come from additional RPC calls
    const beneficioNeto = 150000; // Placeholder
    const amortizaciones = 25000; // Placeholder
    const deltaNof = -30000; // Placeholder (negative working capital change)
    const dividendos = -20000; // Placeholder (negative as it's a cash outflow)
    
    let cumulative = 0;
    const data = [];

    // Starting point
    data.push({
      name: 'Beneficio Neto',
      value: beneficioNeto,
      cumulative: cumulative + beneficioNeto,
      type: 'addition',
      displayValue: beneficioNeto
    });
    cumulative += beneficioNeto;

    // Amortizaciones (addition)
    data.push({
      name: 'Amortizaciones',
      value: amortizaciones,
      cumulative: cumulative + amortizaciones,
      type: 'addition',
      displayValue: amortizaciones
    });
    cumulative += amortizaciones;

    // Delta NOF (can be positive or negative)
    data.push({
      name: 'Δ NOF',
      value: deltaNof,
      cumulative: cumulative + deltaNof,
      type: deltaNof >= 0 ? 'addition' : 'subtraction',
      displayValue: deltaNof
    });
    cumulative += deltaNof;

    // Flujo Operativo (total)
    data.push({
      name: 'Flujo Operativo',
      value: 0, // This is a total, so no additional value
      cumulative: cumulative,
      type: 'total',
      displayValue: cumulative
    });

    // Flujo Inversión (negative)
    const inversionNegative = Math.abs(sums.inversion); // Show as positive bar but it's a subtraction
    data.push({
      name: 'Inversiones',
      value: -inversionNegative,
      cumulative: cumulative - inversionNegative,
      type: 'subtraction',
      displayValue: -inversionNegative
    });
    cumulative -= inversionNegative;

    // Flujo Financiación (positive)
    const financiacionPositive = Math.max(0, sums.financiacion);
    data.push({
      name: 'Financiación',
      value: financiacionPositive,
      cumulative: cumulative + financiacionPositive,
      type: 'addition',
      displayValue: financiacionPositive
    });
    cumulative += financiacionPositive;

    // Dividendos (subtraction)
    data.push({
      name: 'Dividendos',
      value: dividendos,
      cumulative: cumulative + dividendos,
      type: 'subtraction',
      displayValue: dividendos
    });
    cumulative += dividendos;

    // Final total
    data.push({
      name: 'Flujo Neto',
      value: 0,
      cumulative: cumulative,
      type: 'total',
      displayValue: cumulative
    });

    return data;
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'addition':
        return '#10b981'; // Green
      case 'subtraction':
        return '#ef4444'; // Red
      case 'total':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  const getOrigenFondosData = () => {
    const sums = calculateSums();
    
    // Placeholder values - in real implementation these would come from additional data
    const fco = Math.max(0, sums.operativo); // Flujo de caja operativo (only positive)
    const nuevaFinanciacion = Math.max(0, sums.financiacion); // Nueva financiación (only positive)
    const desinversiones = 15000; // Placeholder for asset sales
    
    return [
      { name: 'FCO', value: fco, color: '#10b981' },
      { name: 'Nueva Financiación', value: nuevaFinanciacion, color: '#3b82f6' },
      { name: 'Desinversiones', value: desinversiones, color: '#8b5cf6' }
    ].filter(item => item.value > 0); // Only show positive values
  };

  const getAplicacionFondosData = () => {
    const sums = calculateSums();
    
    // Placeholder values - in real implementation these would come from additional data
    const inversiones = Math.abs(Math.min(0, sums.inversion)); // Inversiones (absolute value of negative investment)
    const amortizaciones = 25000; // Placeholder
    const dividendos = 20000; // Placeholder
    const incrementoTesoreria = 30000; // Placeholder
    
    return [
      { name: 'Inversiones', value: inversiones, color: '#ef4444' },
      { name: 'Amortizaciones', value: amortizaciones, color: '#f59e0b' },
      { name: 'Dividendos', value: dividendos, color: '#ec4899' },
      { name: 'Incremento Tesorería', value: incrementoTesoreria, color: '#06b6d4' }
    ].filter(item => item.value > 0); // Only show positive values
  };

  const getGaugeMetrics = () => {
    const sums = calculateSums();
    const fco = Math.max(0, sums.operativo);
    
    // Placeholder values - in real implementation these would come from additional data sources
    const qualityFco = 72; // Placeholder value between 0-100
    const inversiones = Math.abs(Math.min(0, sums.inversion)) || 1; // Avoid division by zero
    const servicioDeuda = 45000; // Placeholder for debt service
    
    const autofinanciacion = fco / inversiones;
    const coberturaDeuda = fco / servicioDeuda;
    
    return {
      qualityFco,
      autofinanciacion,
      coberturaDeuda,
      fco
    };
  };

  const getGaugeColor = (value: number, ranges: { red: [number, number], yellow: [number, number], green: [number, number] }) => {
    if (value >= ranges.red[0] && value < ranges.red[1]) return 'hsl(var(--destructive))';
    if (value >= ranges.yellow[0] && value < ranges.yellow[1]) return 'hsl(45, 93%, 47%)'; // Yellow
    if (value >= ranges.green[0]) return 'hsl(var(--success))';
    return 'hsl(var(--muted))';
  };

  const getGaugeColorByThreshold = (value: number, redMax: number, yellowMax: number) => {
    if (value < redMax) return 'hsl(var(--destructive))';
    if (value < yellowMax) return 'hsl(45, 93%, 47%)'; // Yellow
    return 'hsl(var(--success))';
  };

  const getInsightsAutomaticos = (): InsightData[] => {
    const metrics = getGaugeMetrics();
    const sums = calculateSums();
    const insights: InsightData[] = [];

    // FCO Quality insight
    if (metrics.qualityFco >= 75) {
      insights.push({
        icon: CheckCircle,
        title: "Excelente Calidad del FCO",
        description: `La calidad del flujo de caja operativo es alta (${metrics.qualityFco}/100), indicando una generación de efectivo consistente y predecible.`,
        type: 'positive'
      });
    } else if (metrics.qualityFco < 50) {
      insights.push({
        icon: AlertTriangle,
        title: "Calidad del FCO Requiere Atención",
        description: `La calidad del flujo de caja operativo es baja (${metrics.qualityFco}/100), sugiere revisar la gestión del capital de trabajo.`,
        type: 'negative'
      });
    }

    // Autofinanciación insight
    if (metrics.autofinanciacion >= 2) {
      insights.push({
        icon: TrendingUp,
        title: "Excelente Capacidad de Autofinanciación",
        description: `La empresa puede financiar ${metrics.autofinanciacion.toFixed(1)}x sus inversiones con flujo operativo, mostrando independencia financiera.`,
        type: 'positive'
      });
    } else if (metrics.autofinanciacion < 1) {
      insights.push({
        icon: TrendingDown,
        title: "Dependencia de Financiación Externa",
        description: `El FCO solo cubre ${(metrics.autofinanciacion * 100).toFixed(0)}% de las inversiones, requiriendo financiación externa.`,
        type: 'warning'
      });
    }

    // Cobertura de deuda insight
    if (metrics.coberturaDeuda >= 3) {
      insights.push({
        icon: CheckCircle,
        title: "Sólida Cobertura de Deuda",
        description: `El FCO cubre ${metrics.coberturaDeuda.toFixed(1)}x el servicio de deuda, proporcionando un margen de seguridad robusto.`,
        type: 'positive'
      });
    } else if (metrics.coberturaDeuda < 1.5) {
      insights.push({
        icon: AlertTriangle,
        title: "Riesgo en Cobertura de Deuda",
        description: `La cobertura de deuda es ${metrics.coberturaDeuda.toFixed(1)}x, por debajo del mínimo recomendado de 1.5x.`,
        type: 'negative'
      });
    }

    // Flujo neto insight
    if (sums.neto > 0) {
      insights.push({
        icon: TrendingUp,
        title: "Generación Neta Positiva",
        description: `El flujo neto positivo de €${sums.neto.toLocaleString()} indica una gestión eficiente del efectivo.`,
        type: 'positive'
      });
    } else {
      insights.push({
        icon: Info,
        title: "Flujo Neto Negativo",
        description: `El flujo neto de €${sums.neto.toLocaleString()} sugiere revisar la estrategia de inversión y financiación.`,
        type: 'info'
      });
    }

    return insights;
  };

  const CashflowSimulator = () => {
    // Placeholder values - in real implementation these would come from P&G data
    const ventasAnuales = 1200000; // Placeholder annual sales
    const costoVentasAnual = 800000; // Placeholder annual cost of sales
    const inventarioActual = 150000; // Placeholder current inventory
    const flujoOperativoBase = calculateSums().operativo;

    const calculateImpact = () => {
      const impactoCobro = (ventasAnuales / 360) * deltaCobro[0];
      const impactoPago = (costoVentasAnual / 360) * deltaPago[0];
      const impactoInventario = deltaInventario[0] * inventarioActual / 100; // Assuming percentage change
      
      const impactoTotal = flujoOperativoBase + impactoCobro - impactoPago + impactoInventario;
      
      return {
        impactoCobro,
        impactoPago,
        impactoInventario,
        impactoTotal,
        diferencia: impactoTotal - flujoOperativoBase
      };
    };

    const impacto = calculateImpact();

    const handleVerDetalle = () => {
      toast({
        title: "Detalle del Escenario",
        description: "Funcionalidad de detalle en desarrollo",
      });
    };

    const handleAplicarEscenario = () => {
      toast({
        title: "Aplicar Escenario",
        description: "Escenario aplicado para análisis futuro",
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Flujo de Caja
          </CardTitle>
          <CardDescription>
            Analiza el impacto de cambios en políticas de cobro, pago e inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sliders */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Delta Cobro (días)</label>
                <span className="text-sm text-muted-foreground">{deltaCobro[0]} días</span>
              </div>
              <Slider
                value={deltaCobro}
                onValueChange={setDeltaCobro}
                max={30}
                min={-30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30</span>
                <span>0</span>
                <span>+30</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Delta Pago (días)</label>
                <span className="text-sm text-muted-foreground">{deltaPago[0]} días</span>
              </div>
              <Slider
                value={deltaPago}
                onValueChange={setDeltaPago}
                max={30}
                min={-30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30</span>
                <span>0</span>
                <span>+30</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Delta Inventario (%)</label>
                <span className="text-sm text-muted-foreground">{deltaInventario[0]}%</span>
              </div>
              <Slider
                value={deltaInventario}
                onValueChange={setDeltaInventario}
                max={50}
                min={-50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="border-t pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">FCO Base</div>
                <div className="text-xl font-bold">€{flujoOperativoBase.toLocaleString()}</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Impacto Cobro</div>
                <div className={`text-xl font-bold ${impacto.impactoCobro >= 0 ? 'text-success' : 'text-destructive'}`}>
                  €{impacto.impactoCobro.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Impacto Pago</div>
                <div className={`text-xl font-bold ${impacto.impactoPago >= 0 ? 'text-success' : 'text-destructive'}`}>
                  €{(-impacto.impactoPago).toLocaleString()}
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Impacto Inventario</div>
                <div className={`text-xl font-bold ${impacto.impactoInventario >= 0 ? 'text-destructive' : 'text-success'}`}>
                  €{impacto.impactoInventario.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Nuevo FCO Proyectado</div>
                <div className={`text-3xl font-bold ${impacto.impactoTotal >= flujoOperativoBase ? 'text-success' : 'text-destructive'}`}>
                  €{impacto.impactoTotal.toLocaleString()}
                </div>
                <div className={`text-lg ${impacto.diferencia >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {impacto.diferencia >= 0 ? '+' : ''}€{impacto.diferencia.toLocaleString()} vs base
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <Button onClick={handleVerDetalle} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </Button>
              <Button onClick={handleAplicarEscenario} variant="default" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Aplicar escenario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getNOFMetrics = () => {
    // Placeholder values - in real implementation these would come from NOF RPC
    // These would be calculated from balance sheet data and sales/COGS figures
    const ventasAnuales = 1200000; // Placeholder
    const costoVentasAnual = 800000; // Placeholder
    const inventarioPromedio = 150000; // Placeholder
    const clientesPromedio = 200000; // Placeholder
    const proveedoresPromedio = 120000; // Placeholder
    
    const diasInventario = Math.round((inventarioPromedio * 360) / costoVentasAnual);
    const diasCobro = Math.round((clientesPromedio * 360) / ventasAnuales);
    const diasPago = Math.round((proveedoresPromedio * 360) / costoVentasAnual);
    const cicloConversion = diasInventario + diasCobro - diasPago;
    
    return {
      diasInventario,
      diasCobro,
      diasPago,
      cicloConversion,
      // Additional metrics for different tabs
      operativo: {
        diasInventario,
        diasCobro,
        diasPago,
        cicloConversion
      },
      inversion: {
        rotacionActivos: Math.round(ventasAnuales / (inventarioPromedio + clientesPromedio)),
        eficienciaCapital: Math.round((ventasAnuales / (inventarioPromedio + clientesPromedio)) * 100),
        periodoRecuperacion: Math.round(cicloConversion / 12), // Months
        rentabilidadOperativa: Math.round(((ventasAnuales - costoVentasAnual) / ventasAnuales) * 100)
      },
      financiacion: {
        apalancamientoProveedores: Math.round((proveedoresPromedio / costoVentasAnual) * 360),
        liquidezOperativa: Math.round(clientesPromedio / proveedoresPromedio),
        presionLiquidez: Math.round((diasCobro + diasInventario) / diasPago),
        margenSeguridad: Math.round(diasPago - (diasCobro + diasInventario))
      }
    };
  };

  const CashflowTabs = () => {
    const nofMetrics = getNOFMetrics();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis Detallado por Componente
          </CardTitle>
          <CardDescription>
            Métricas operativas, de inversión y financiación basadas en NOF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="operativo" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="operativo">Operativo</TabsTrigger>
              <TabsTrigger value="inversion">Inversión</TabsTrigger>
              <TabsTrigger value="financiacion">Financiación</TabsTrigger>
            </TabsList>
            
            <TabsContent value="operativo" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Días Inventario</div>
                      <div className="text-2xl font-bold">{nofMetrics.operativo.diasInventario}</div>
                      <div className="text-xs text-muted-foreground">días promedio</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Días Cobro</div>
                      <div className="text-2xl font-bold">{nofMetrics.operativo.diasCobro}</div>
                      <div className="text-xs text-muted-foreground">días promedio</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Días Pago</div>
                      <div className="text-2xl font-bold">{nofMetrics.operativo.diasPago}</div>
                      <div className="text-xs text-muted-foreground">días promedio</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ciclo Conversión</div>
                      <div className="text-2xl font-bold">{nofMetrics.operativo.cicloConversion}</div>
                      <div className="text-xs text-muted-foreground">días total</div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Fórmula del Ciclo de Conversión:</div>
                <div className="text-sm font-mono">
                  {nofMetrics.operativo.diasInventario} (Inventario) + {nofMetrics.operativo.diasCobro} (Cobro) - {nofMetrics.operativo.diasPago} (Pago) = {nofMetrics.operativo.cicloConversion} días
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inversion" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Target className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Rotación Activos</div>
                      <div className="text-2xl font-bold">{nofMetrics.inversion.rotacionActivos}x</div>
                      <div className="text-xs text-muted-foreground">veces por año</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Calculator className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Eficiencia Capital</div>
                      <div className="text-2xl font-bold">{nofMetrics.inversion.eficienciaCapital}%</div>
                      <div className="text-xs text-muted-foreground">uso eficiente</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Clock className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Período Recuperación</div>
                      <div className="text-2xl font-bold">{nofMetrics.inversion.periodoRecuperacion}</div>
                      <div className="text-xs text-muted-foreground">meses</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Rentabilidad Operativa</div>
                      <div className="text-2xl font-bold">{nofMetrics.inversion.rentabilidadOperativa}%</div>
                      <div className="text-xs text-muted-foreground">margen bruto</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financiacion" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Apalancamiento Proveedores</div>
                      <div className="text-2xl font-bold">{nofMetrics.financiacion.apalancamientoProveedores}</div>
                      <div className="text-xs text-muted-foreground">días financiación</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Liquidez Operativa</div>
                      <div className="text-2xl font-bold">{nofMetrics.financiacion.liquidezOperativa}x</div>
                      <div className="text-xs text-muted-foreground">ratio cobertura</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Presión Liquidez</div>
                      <div className="text-2xl font-bold">{nofMetrics.financiacion.presionLiquidez.toFixed(1)}x</div>
                      <div className="text-xs text-muted-foreground">factor tensión</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Margen Seguridad</div>
                      <div className="text-2xl font-bold">{nofMetrics.financiacion.margenSeguridad}</div>
                      <div className="text-xs text-muted-foreground">días margen</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  const InsightsAutomaticos = ({ insights }: { insights: InsightData[] }) => {
    const getInsightColor = (type: InsightData['type']) => {
      switch (type) {
        case 'positive':
          return 'text-success';
        case 'negative':
          return 'text-destructive';
        case 'warning':
          return 'text-yellow-600';
        case 'info':
          return 'text-blue-600';
        default:
          return 'text-muted-foreground';
      }
    };

    const getInsightBgColor = (type: InsightData['type']) => {
      switch (type) {
        case 'positive':
          return 'bg-success/10';
        case 'negative':
          return 'bg-destructive/10';
        case 'warning':
          return 'bg-yellow-50';
        case 'info':
          return 'bg-blue-50';
        default:
          return 'bg-muted/10';
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Insights Automáticos</h3>
          <p className="text-sm text-muted-foreground">Análisis inteligente basado en los datos de flujo de efectivo</p>
        </div>
        <div className="grid gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className={`${getInsightBgColor(insight.type)} border-l-4`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`${getInsightColor(insight.type)} mt-1`}>
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const formatYAxis = (value: number) => {
    return `€${(value / 1000).toFixed(0)}K`;
  };

  const handleExport = useCallback(() => {
    try {
      // Combine all datasets for export
      const combinedData = [
        ...operativoData.map(item => ({ ...item, tipo: 'operativo' })),
        ...inversionData.map(item => ({ ...item, tipo: 'inversion' })),
        ...financiacionData.map(item => ({ ...item, tipo: 'financiacion' }))
      ];

      // Create CSV content
      const headers = ['periodo', 'tipo', 'flujo_operativo', 'flujo_inversion', 'flujo_financiacion'];
      const csvContent = [
        headers.join(','),
        ...combinedData.map(row => [
          row.periodo,
          row.tipo || '',
          row.flujo_operativo || '',
          row.flujo_inversion || '',
          row.flujo_financiacion || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-${selectedYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Datos exportados",
        description: `Archivo cashflow-${selectedYear}.csv descargado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      });
    }
  }, [operativoData, inversionData, financiacionData, selectedYear, toast]);

  const handleAddPeriod = () => {
    toast({
      title: "Añadir período",
      description: "Funcionalidad para subir CSV en desarrollo",
    });
  };

  const sums = calculateSums();

  // Show error alert if there is one
  const errorAlert = error && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  // Show loading skeletons for main content
  if (isLoading && years.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (years.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sin datos de cashflow</h3>
          <p className="text-muted-foreground">No hay datos de flujos de efectivo disponibles para esta empresa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Estado de Flujos de Efectivo">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estado de Flujos de Efectivo</h1>
          <p className="text-muted-foreground">Análisis de flujos operativos, de inversión y financiación</p>
        </div>
        <div className="flex items-center gap-4">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={years}
          />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleAddPeriod} variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir período
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <MetricCard
              title="Flujo Operativo"
              value={formatCurrency(sums.operativo).replace('€', '')}
              unit="€"
              description="Actividades principales del negocio"
              trend={{
                value: "11.5%",
                isPositive: sums.operativo >= 0,
                label: "sobre ventas"
              }}
            />
            <MetricCard
              title="Flujo de Inversión"
              value={formatCurrency(sums.inversion).replace('€', '')}
              unit="€"
              description="Adquisiciones y ventas de activos"
              trend={{
                value: "8.2%",
                isPositive: sums.inversion >= 0,
                label: "sobre activos"
              }}
            />
            <MetricCard
              title="Flujo de Financiación"
              value={formatCurrency(sums.financiacion).replace('€', '')}
              unit="€"
              description="Operaciones con accionistas y acreedores"
              trend={{
                value: "Personalizado",
                isPositive: sums.financiacion >= 0,
                label: "indicador específico"
              }}
            />
            <MetricCard
              title="Flujo Neto"
              value={formatCurrency(sums.neto).replace('€', '')}
              unit="€"
              description="Resultado total del período"
              trend={{
                value: sums.neto >= 0 ? "Positivo" : "Negativo",
                isPositive: sums.neto >= 0,
                label: "flujo total"
              }}
            />
          </>
        )}
      </div>

      {/* Error Alert */}
      {errorAlert}

      {/* Loading state for main content */}
      {isLoading && selectedYear && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Análisis Waterfall – Generación y Aplicación de Fondos
              </CardTitle>
              <CardDescription>Flujo de efectivo desde beneficio hasta flujo neto</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getWaterfallData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString()}`, 'Importe']}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="cumulative" name="Acumulado">
                      {getWaterfallData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="space-y-6">
          {/* Origen de Fondos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Origen de Fondos</CardTitle>
              <CardDescription>Fuentes de financiamiento</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getOrigenFondosData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getOrigenFondosData().map((entry, index) => (
                        <Cell key={`origen-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {!isLoading && (
                <div className="mt-4 space-y-2">
                  {getOrigenFondosData().map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}: €{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aplicación de Fondos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aplicación de Fondos</CardTitle>
              <CardDescription>Destino de los recursos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getAplicacionFondosData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAplicacionFondosData().map((entry, index) => (
                        <Cell key={`aplicacion-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {!isLoading && (
                <div className="mt-4 space-y-2">
                  {getAplicacionFondosData().map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}: €{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gauge Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : (
          <>
            {/* Calidad FCO */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gauge className="h-5 w-5" />
                  Calidad FCO
                </CardTitle>
                <CardDescription>Indicador de calidad del flujo operativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: getGaugeColor(getGaugeMetrics().qualityFco, { red: [0, 50], yellow: [50, 75], green: [75, 100] }) }}>
                      {getGaugeMetrics().qualityFco}
                    </div>
                    <div className="text-sm text-muted-foreground">sobre 100</div>
                  </div>
                  <Progress 
                    value={getGaugeMetrics().qualityFco} 
                    className="h-2"
                    style={{ 
                      '--progress-background': getGaugeColor(getGaugeMetrics().qualityFco, { red: [0, 50], yellow: [50, 75], green: [75, 100] })
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="text-destructive">50</span>
                    <span className="text-yellow-600">75</span>
                    <span className="text-success">100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Autofinanciación */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gauge className="h-5 w-5" />
                  Autofinanciación
                </CardTitle>
                <CardDescription>FCO / Inversiones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: getGaugeColorByThreshold(getGaugeMetrics().autofinanciacion, 1, 2) }}>
                      {getGaugeMetrics().autofinanciacion.toFixed(2)}x
                    </div>
                    <div className="text-sm text-muted-foreground">ratio de cobertura</div>
                  </div>
                  <Progress 
                    value={Math.min(100, (getGaugeMetrics().autofinanciacion / 3) * 100)} 
                    className="h-2"
                    style={{ 
                      '--progress-background': getGaugeColorByThreshold(getGaugeMetrics().autofinanciacion, 1, 2)
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-destructive">&lt;1</span>
                    <span className="text-yellow-600">1-2</span>
                    <span className="text-success">&gt;2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cobertura Deuda */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gauge className="h-5 w-5" />
                  Cobertura Deuda
                </CardTitle>
                <CardDescription>FCO / Servicio de Deuda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: getGaugeColorByThreshold(getGaugeMetrics().coberturaDeuda, 1.5, 3) }}>
                      {getGaugeMetrics().coberturaDeuda.toFixed(2)}x
                    </div>
                    <div className="text-sm text-muted-foreground">ratio de cobertura</div>
                  </div>
                  <Progress 
                    value={Math.min(100, (getGaugeMetrics().coberturaDeuda / 5) * 100)} 
                    className="h-2"
                    style={{ 
                      '--progress-background': getGaugeColorByThreshold(getGaugeMetrics().coberturaDeuda, 1.5, 3)
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-destructive">&lt;1.5</span>
                    <span className="text-yellow-600">1.5-3</span>
                    <span className="text-success">&gt;3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cashflow Simulator */}
      <CashflowSimulator />

      {/* Cashflow Tabs */}
      <CashflowTabs />

      {/* Insights Automáticos */}
      <InsightsAutomaticos insights={getInsightsAutomaticos()} />

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Flujo Operativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo Operativo
            </CardTitle>
            <CardDescription>Actividades principales del negocio</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                {operativoData.length > 0 ? (
                  operativoData.map((item) => (
                    <div key={item.periodo} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{item.periodo}</span>
                      <span className="font-medium">€{item.flujo_operativo?.toLocaleString() || '0'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flujo de Inversión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo de Inversión
            </CardTitle>
            <CardDescription>Adquisiciones y ventas de activos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                {inversionData.length > 0 ? (
                  inversionData.map((item) => (
                    <div key={item.periodo} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{item.periodo}</span>
                      <span className="font-medium">€{item.flujo_inversion?.toLocaleString() || '0'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flujo de Financiación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo de Financiación
            </CardTitle>
            <CardDescription>Operaciones con accionistas y acreedores</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                {financiacionData.length > 0 ? (
                  financiacionData.map((item) => (
                    <div key={item.periodo} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{item.periodo}</span>
                      <span className="font-medium">€{item.flujo_financiacion?.toLocaleString() || '0'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}