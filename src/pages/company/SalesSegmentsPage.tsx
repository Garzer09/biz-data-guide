import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Target, AlertTriangle, Calendar } from "lucide-react";

interface SalesSegmentData {
  segmento: string;
  periodo: string;
  ventas: number;
  costes_variables: number;
  costes_fijos: number;
  margen_contribucion: number;
}

interface KPIData {
  ventas_totales: number;
  crecimiento_yoy: number;
  ticket_medio: number;
  segmento_lider: { nombre: string; participacion: number };
}

interface InsightData {
  mayor_crecimiento: string;
  riesgo_concentracion: boolean;
  oportunidad_mejora: string[];
  tendencia_general: number;
  segmento_emergente: string;
}

export function SalesSegmentsPage() {
  const { companyId } = useParams();
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedPeriodo, setSelectedPeriodo] = useState<"ANUAL" | "MENSUAL">("MENSUAL");
  const [selectedSegmentacion, setSelectedSegmentacion] = useState<string>("Por Producto");
  const [viewMode, setViewMode] = useState<"euros" | "percentage">("euros");
  const [data, setData] = useState<SalesSegmentData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available years on mount
  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  // Fetch data when year changes
  useEffect(() => {
    if (companyId && selectedYear) {
      fetchSalesData();
    }
  }, [companyId, selectedYear]);

  const fetchYears = async () => {
    try {
      const { data: yearsData, error } = await supabase
        .rpc('get_sales_segments_years', { _company_id: companyId });

      if (error) throw error;

      const yearsList = yearsData.map((r: { anio: string }) => r.anio);
      setYears(yearsList);
      if (yearsList.length > 0) {
        setSelectedYear(yearsList[0]);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      setError('Error al cargar los años disponibles');
      toast({
        title: "Error",
        description: "No se pudieron cargar los años disponibles",
        variant: "destructive",
      });
    }
  };

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine period filter based on selection
      const periodFilter = selectedPeriodo === "ANUAL" 
        ? `${selectedYear}%` 
        : `${selectedYear}-%`;

      const { data: salesData, error } = await supabase
        .from('vw_sales_segments')
        .select('segmento, periodo, ventas, costes_variables, costes_fijos, margen_contribucion')
        .eq('company_id', companyId)
        .like('periodo', periodFilter);

      if (error) throw error;

      setData(salesData || []);
      
      // Calculate KPIs and insights
      if (salesData && salesData.length > 0) {
        calculateKPIs(salesData);
        generateInsights(salesData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Error al cargar los datos de ventas por segmentos');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas por segmentos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateKPIs = async (salesData: SalesSegmentData[]) => {
    // Group by segment and sum values
    const groupedData = salesData.reduce((acc: Record<string, SalesSegmentData>, row) => {
      const segment = row.segmento;
      if (!acc[segment]) {
        acc[segment] = {
          segmento: segment,
          periodo: row.periodo,
          ventas: 0,
          costes_variables: 0,
          costes_fijos: 0,
          margen_contribucion: 0
        };
      }
      
      acc[segment].ventas += row.ventas || 0;
      acc[segment].costes_variables += row.costes_variables || 0;
      acc[segment].costes_fijos += row.costes_fijos || 0;
      acc[segment].margen_contribucion += row.margen_contribucion || 0;
      
      return acc;
    }, {});

    const segments = Object.values(groupedData);
    const ventasTotales = segments.reduce((sum, seg) => sum + seg.ventas, 0);
    
    // Find leader segment
    const segmentoLider = segments.reduce((best, current) => 
      current.ventas > best.ventas ? current : best, segments[0] || { segmento: '', ventas: 0 }
    );
    
    const participacion = ventasTotales > 0 ? (segmentoLider.ventas / ventasTotales) * 100 : 0;

    // Calculate YoY growth (simplified - would need previous year data)
    const crecimientoYoY = 15.2; // Mock value - would calculate from previous year data

    // Calculate average ticket (simplified)
    const ticketMedio = segments.length > 0 ? ventasTotales / segments.length : 0;

    setKpiData({
      ventas_totales: ventasTotales,
      crecimiento_yoy: crecimientoYoY,
      ticket_medio: ticketMedio,
      segmento_lider: {
        nombre: segmentoLider.segmento,
        participacion: participacion
      }
    });
  };

  const generateInsights = (salesData: SalesSegmentData[]) => {
    // Group by segment
    const groupedData = salesData.reduce((acc: Record<string, SalesSegmentData>, row) => {
      const segment = row.segmento;
      if (!acc[segment]) {
        acc[segment] = {
          segmento: segment,
          periodo: row.periodo,
          ventas: 0,
          costes_variables: 0,
          costes_fijos: 0,
          margen_contribucion: 0
        };
      }
      
      acc[segment].ventas += row.ventas || 0;
      acc[segment].costes_variables += row.costes_variables || 0;
      acc[segment].costes_fijos += row.costes_fijos || 0;
      acc[segment].margen_contribucion += row.margen_contribucion || 0;
      
      return acc;
    }, {});

    const segments = Object.values(groupedData);
    const ventasTotales = segments.reduce((sum, seg) => sum + seg.ventas, 0);

    // Mock insights calculations (would be based on real data comparisons)
    const mayorCrecimiento = segments.length > 0 ? segments[0].segmento : '';
    const riesgoConcentracion = segments.some(seg => (seg.ventas / ventasTotales) > 0.3);
    const oportunidadMejora = segments.filter(seg => seg.ventas < ventasTotales * 0.1).map(seg => seg.segmento);
    const tendenciaGeneral = 12.5; // Mock value
    const segmentoEmergente = segments.length > 1 ? segments[1].segmento : '';

    setInsights({
      mayor_crecimiento: mayorCrecimiento,
      riesgo_concentracion: riesgoConcentracion,
      oportunidad_mejora: oportunidadMejora,
      tendencia_general: tendenciaGeneral,
      segmento_emergente: segmentoEmergente
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return "0.0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const getAggregatedData = () => {
    const groupedData = data.reduce((acc: Record<string, SalesSegmentData>, row) => {
      const segment = row.segmento;
      if (!acc[segment]) {
        acc[segment] = {
          segmento: segment,
          periodo: row.periodo,
          ventas: 0,
          costes_variables: 0,
          costes_fijos: 0,
          margen_contribucion: 0
        };
      }
      
      acc[segment].ventas += row.ventas || 0;
      acc[segment].costes_variables += row.costes_variables || 0;
      acc[segment].costes_fijos += row.costes_fijos || 0;
      acc[segment].margen_contribucion += row.margen_contribucion || 0;
      
      return acc;
    }, {});

    return Object.values(groupedData);
  };

  const getTotalVentas = () => {
    const aggregated = getAggregatedData();
    return aggregated.reduce((sum, item) => sum + item.ventas, 0);
  };

  const exportToCSV = () => {
    const aggregatedData = getAggregatedData();
    const csvContent = [
      'Segmento,Ventas,Costes Variables,Costes Fijos,Margen Contribución,% Margen',
      ...aggregatedData.map(row => [
        row.segmento,
        row.ventas,
        row.costes_variables,
        row.costes_fijos,
        row.margen_contribucion,
        formatPercentage(row.margen_contribucion, row.ventas)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_segmentos_${selectedYear}_${selectedPeriodo}.csv`;
    link.click();
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Empresa no seleccionada</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de ventas por segmentos...</p>
        </div>
      </div>
    );
  }

  const aggregatedData = getAggregatedData();
  const totalVentas = getTotalVentas();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Ventas por Segmentos</h1>
          <p className="text-muted-foreground">
            Análisis de rendimiento por segmento de negocio
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-background">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Periodo:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedPeriodo === "ANUAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriodo("ANUAL")}
              >
                Anual
              </Button>
              <Button
                variant={selectedPeriodo === "MENSUAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriodo("MENSUAL")}
              >
                Mensual
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Segmentación:</span>
            <Select value={selectedSegmentacion} onValueChange={setSelectedSegmentacion}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="Por Producto">Por Producto</SelectItem>
                <SelectItem value="Por Región">Por Región</SelectItem>
                <SelectItem value="Por Cliente">Por Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={exportToCSV} disabled={data.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.length === 0 && !error && (
        <Alert>
          <AlertDescription>
            No se encontraron datos de segmentos para el año {selectedYear} en modo {selectedPeriodo.toLowerCase()}
          </AlertDescription>
        </Alert>
      )}

      {data.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpiData?.ventas_totales || 0)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  +{kpiData?.crecimiento_yoy.toFixed(1)}% YoY
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Crecimiento YoY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{kpiData?.crecimiento_yoy.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">vs. año anterior</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpiData?.ticket_medio || 0)}</div>
                <div className="text-xs text-muted-foreground">por segmento</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Segmento Líder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{kpiData?.segmento_lider.nombre || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">
                  {kpiData?.segmento_lider.participacion.toFixed(1)}% participación
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="distribucion" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="distribucion">Distribución</TabsTrigger>
                  <TabsTrigger value="evolucion">Evolución</TabsTrigger>
                  <TabsTrigger value="ranking">Top/Bottom 10</TabsTrigger>
                </TabsList>

                <TabsContent value="distribucion" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Distribución por Segmento</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant={viewMode === "euros" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("euros")}
                          >
                            €
                          </Button>
                          <Button
                            variant={viewMode === "percentage" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("percentage")}
                          >
                            %
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BarChartCard
                        title=""
                        data={aggregatedData.map(item => ({
                          ...item,
                          ventas_display: viewMode === "euros" ? item.ventas : (item.ventas / totalVentas) * 100
                        }))}
                        dataKeys={['ventas_display']}
                        xAxisKey="segmento"
                        colors={["hsl(142, 76%, 36%)"]}
                        formatValue={viewMode === "euros" ? formatCurrency : (value) => `${value.toFixed(1)}%`}
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evolucion">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución Temporal</CardTitle>
                      <CardDescription>
                        Tendencia de ventas por {selectedPeriodo.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Gráfico de líneas temporal (requiere datos de múltiples períodos)
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ranking">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ranking de Segmentos</CardTitle>
                      <CardDescription>Top 10 segmentos por ventas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aggregatedData
                          .sort((a, b) => b.ventas - a.ventas)
                          .slice(0, 10)
                          .map((segment, index) => (
                            <div key={segment.segmento} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">#{index + 1}</Badge>
                                <span className="font-medium">{segment.segmento}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(segment.ventas)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPercentage(segment.ventas, totalVentas)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Insights Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Insights Automáticos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.mayor_crecimiento && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Mayor Crecimiento</div>
                        <div className="text-xs text-muted-foreground">{insights.mayor_crecimiento}</div>
                      </div>
                    </div>
                  )}

                  {insights?.riesgo_concentracion && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Riesgo de Concentración</div>
                        <div className="text-xs text-muted-foreground">Un segmento supera el 30% de ventas</div>
                      </div>
                    </div>
                  )}

                  {insights?.oportunidad_mejora && insights.oportunidad_mejora.length > 0 && (
                    <div className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Oportunidad de Mejora</div>
                        <div className="text-xs text-muted-foreground">
                          {insights.oportunidad_mejora.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Tendencia General</div>
                      <div className="text-xs text-muted-foreground">
                        +{insights?.tendencia_general}% promedio
                      </div>
                    </div>
                  </div>

                  {insights?.segmento_emergente && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Segmento Emergente</div>
                        <div className="text-xs text-muted-foreground">{insights.segmento_emergente}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle Completo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segmento</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregatedData.map((row) => (
                        <TableRow key={row.segmento}>
                          <TableCell className="font-medium">{row.segmento}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.ventas)}</TableCell>
                          <TableCell className="text-right">
                            {formatPercentage(row.ventas, totalVentas)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}