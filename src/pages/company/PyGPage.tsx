import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { logger, logError, logPerformance } from "@/lib/logger";
import type { PyGAnnualData } from "@/types";

interface PyGAnnualData {
  company_id: string;
  anio: string;
  ingresos: number;
  coste_ventas: number;
  opex: number;
  dep: number;
  amort: number;
  otros_ing_op: number;
  otros_gas_op: number;
  ing_fin: number;
  gas_fin: number;
  extra: number;
  impuestos: number;
  margen_bruto: number;
  ebitda: number;
  ebit: number;
  bai: number;
  beneficio_neto: number;
  margen_ebitda_pct: number;
  margen_neto_pct: number;
}

interface TableRow {
  concepto: string;
  actual: number;
  porcentaje_ventas: number;
  año_anterior: number | null;
  delta: number | null;
  delta_pct: number | null;
}

interface WaterfallDataPoint {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'subtotal';
  color: string;
}

export function PyGPage() {
  const { companyId } = useParams();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [currentData, setCurrentData] = useState<PyGAnnualData | null>(null);
  const [previousData, setPreviousData] = useState<PyGAnnualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Validate access and load data
  useEffect(() => {
    if (!companyId) return;

    const validateAccessAndLoadData = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.info(`Validating access for company ${companyId}`, 'PyGPage');

        // Validate company access
        const { data: accessData, error: accessError } = await supabase
          .rpc('has_company_access', { _company_id: companyId });

        if (accessError) {
          logError(accessError, 'PyGPage:AccessValidation');
          throw new Error('Error validando acceso');
        }

        if (!accessData) {
          setError('No tienes acceso a esta empresa');
          return;
        }

        setHasAccess(true);

        // Load available years
        const { data: yearsData, error: yearsError } = await supabase
          .from('vw_pyg_anual')
          .select('anio')
          .eq('company_id', companyId)
          .order('anio', { ascending: false });

        if (yearsError) {
          logError(yearsError, 'PyGPage:YearsLoad');
          throw new Error('Error cargando años disponibles');
        }

        const years = [...new Set(yearsData?.map(item => item.anio) || [])];
        setAvailableYears(years);

        // Set default year to the most recent available
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }

      } catch (err) {
        logError(err, 'PyGPage:InitialLoad');
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    validateAccessAndLoadData();
  }, [companyId, selectedYear]);

  // Load P&G data when year changes
  useEffect(() => {
    if (!companyId || !hasAccess || !selectedYear) return;

    const loadPyGData = async () => {
      try {
        setLoading(true);
        const startTime = Date.now();

        logger.info(`Loading P&G data for year ${selectedYear}`, 'PyGPage');

        // Load current year data
        const { data: currentYearData, error: currentError } = await supabase
          .from('vw_pyg_anual')
          .select('*')
          .eq('company_id', companyId)
          .eq('anio', selectedYear)
          .single();

        if (currentError && currentError.code !== 'PGRST116') {
          logError(currentError, 'PyGPage:CurrentYearLoad');
          throw new Error('Error cargando datos del año actual');
        }

        setCurrentData(currentYearData);

        // Load previous year data for comparison
        const previousYear = (parseInt(selectedYear) - 1).toString();
        const { data: previousYearData, error: previousError } = await supabase
          .from('vw_pyg_anual')
          .select('*')
          .eq('company_id', companyId)
          .eq('anio', previousYear)
          .single();

        if (previousError && previousError.code !== 'PGRST116') {
          logger.warn('No data found for previous year', 'PyGPage');
        }

        setPreviousData(previousYearData);

        const duration = Date.now() - startTime;
        logPerformance('P&G data load', duration);

      } catch (err) {
        logError(err, 'PyGPage:DataLoad');
        setError(err instanceof Error ? err.message : 'Error cargando datos P&G');
      } finally {
        setLoading(false);
      }
    };

    loadPyGData();
  }, [companyId, hasAccess, selectedYear]);

  // Memoized table data generation
  const tableData = useMemo(() => {
    if (!currentData) return [];

    const startTime = Date.now();
    logger.debug('Generating table data', 'PyGPage');

    const concepts = [
      { key: 'ingresos', label: 'Ingresos' },
      { key: 'coste_ventas', label: 'Coste de Ventas' },
      { key: 'margen_bruto', label: 'Margen Bruto' },
      { key: 'opex', label: 'Gastos Operativos' },
      { key: 'otros_ing_op', label: 'Otros Ingresos Operativos' },
      { key: 'otros_gas_op', label: 'Otros Gastos Operativos' },
      { key: 'ebitda', label: 'EBITDA' },
      { key: 'dep', label: 'Depreciación' },
      { key: 'amort', label: 'Amortización' },
      { key: 'ebit', label: 'EBIT' },
      { key: 'ing_fin', label: 'Ingresos Financieros' },
      { key: 'gas_fin', label: 'Gastos Financieros' },
      { key: 'extra', label: 'Resultado Extraordinario' },
      { key: 'bai', label: 'BAI (Beneficio Antes Impuestos)' },
      { key: 'impuestos', label: 'Impuestos' },
      { key: 'beneficio_neto', label: 'Beneficio Neto' }
    ];

    const result = concepts.map(concept => {
      const currentValue = currentData[concept.key as keyof PyGAnnualData] as number;
      const previousValue = previousData?.[concept.key as keyof PyGAnnualData] as number | undefined;
      const delta = previousValue !== undefined ? currentValue - previousValue : null;
      const deltaPct = previousValue !== undefined && previousValue !== 0 
        ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 
        : null;

      return {
        concepto: concept.label,
        actual: currentValue,
        porcentaje_ventas: currentData.ingresos !== 0 ? (currentValue / currentData.ingresos) * 100 : 0,
        año_anterior: previousValue || null,
        delta,
        delta_pct: deltaPct
      };
    });

    const duration = Date.now() - startTime;
    logPerformance('Table data generation', duration);

    return result;
  }, [currentData, previousData]);

  // Memoized waterfall chart data generation
  const waterfallData = useMemo(() => {
    if (!currentData) return [];

    const startTime = Date.now();
    logger.debug('Generating waterfall data', 'PyGPage');

    const points: WaterfallDataPoint[] = [];
    let cumulative = 0;

    // Ingresos (starting point)
    cumulative = currentData.ingresos;
    points.push({
      name: 'Ingresos',
      value: currentData.ingresos,
      cumulative: cumulative,
      type: 'positive',
      color: '#22c55e'
    });

    // Coste de ventas (negative)
    cumulative += currentData.coste_ventas;
    points.push({
      name: 'Coste Ventas',
      value: currentData.coste_ventas,
      cumulative: cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // Margen Bruto (subtotal)
    points.push({
      name: 'Margen Bruto',
      value: currentData.margen_bruto,
      cumulative: cumulative,
      type: 'subtotal',
      color: '#3b82f6'
    });

    // OPEX (negative)
    cumulative += currentData.opex;
    points.push({
      name: 'OPEX',
      value: currentData.opex,
      cumulative: cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // EBITDA (subtotal)
    points.push({
      name: 'EBITDA',
      value: currentData.ebitda,
      cumulative: cumulative,
      type: 'subtotal',
      color: '#3b82f6'
    });

    // Final result
    points.push({
      name: 'Beneficio Neto',
      value: currentData.beneficio_neto,
      cumulative: currentData.beneficio_neto,
      type: 'total',
      color: currentData.beneficio_neto >= 0 ? '#22c55e' : '#ef4444'
    });

    const duration = Date.now() - startTime;
    logPerformance('Waterfall data generation', duration);

    return points;
  }, [currentData]);

  // Format number for display
  const formatNumber = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toFixed(0);
  };

  // Export CSV functionality
  const exportToCSV = () => {
    if (!currentData) {
      toast.error('No hay datos para exportar');
      return;
    }

    const tableRows = tableData;
    const csvContent = [
      ['Concepto', 'Actual (€)', '% Ventas', 'Año Anterior (€)', 'Δ (€)', 'Δ (%)'],
      ...tableRows.map(row => [
        row.concepto,
        row.actual.toFixed(2),
        row.porcentaje_ventas.toFixed(1) + '%',
        row.año_anterior ? row.año_anterior.toFixed(2) : '-',
        row.delta ? row.delta.toFixed(2) : '-',
        row.delta_pct ? row.delta_pct.toFixed(1) + '%' : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pyg_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Archivo CSV descargado');
  };

  // Chart configuration for waterfall
  const chartConfig = {
    value: {
      label: "Valor",
    },
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Empresa no seleccionada</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando análisis P&G...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta empresa
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentData && availableYears.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No hay datos P&G disponibles para esta empresa
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Análisis P&G</h1>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No hay datos para el año {selectedYear}
          </AlertDescription>
        </Alert>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análisis P&G</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
          <TabsTrigger 
            value="table" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-medium transition-all"
          >
            Tabla P&G
          </TabsTrigger>
          <TabsTrigger 
            value="waterfall" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-medium transition-all"
          >
            Gráfico Waterfall
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Cuenta de Resultados - {selectedYear}</CardTitle>
              <CardDescription>
                Análisis comparativo con variaciones interanuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">% Ventas</TableHead>
                    <TableHead className="text-right">Año Ant.</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.concepto}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.actual.toLocaleString('es-ES', { 
                          style: 'currency', 
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.porcentaje_ventas.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.año_anterior 
                          ? row.año_anterior.toLocaleString('es-ES', { 
                              style: 'currency', 
                              currency: 'EUR',
                              maximumFractionDigits: 0
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {row.delta_pct !== null ? (
                          <div className={`inline-flex items-center gap-1 ${
                            row.delta_pct > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {row.delta_pct > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(row.delta_pct).toFixed(1)}%
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Waterfall - {selectedYear}</CardTitle>
              <CardDescription>
                Cascada de valor desde ingresos hasta beneficio neto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={waterfallData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [
                        value.toLocaleString('es-ES', { 
                          style: 'currency', 
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        }),
                        'Valor'
                      ]}
                    />
                    <Bar dataKey="value">
                      {waterfallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}