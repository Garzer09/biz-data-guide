import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && selectedYear) {
      fetchPyGData();
    }
  }, [companyId, selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_pyg_anual')
        .select('anio')
        .eq('company_id', companyId)
        .order('anio', { ascending: false });

      if (error) throw error;

      const years = [...new Set(data?.map(item => item.anio) || [])];
      setAvailableYears(years);
      
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      toast.error('Error al cargar los años disponibles');
    }
  };

  const fetchPyGData = async () => {
    try {
      setLoading(true);
      
      // Fetch current year data
      const { data: currentYearData, error: currentError } = await supabase
        .from('vw_pyg_anual')
        .select('*')
        .eq('company_id', companyId)
        .eq('anio', selectedYear)
        .single();

      if (currentError && currentError.code !== 'PGRST116') throw currentError;
      setCurrentData(currentYearData);

      // Fetch previous year data if available
      const previousYear = (parseInt(selectedYear) - 1).toString();
      const { data: previousYearData } = await supabase
        .from('vw_pyg_anual')
        .select('*')
        .eq('company_id', companyId)
        .eq('anio', previousYear)
        .single();

      setPreviousData(previousYearData);

    } catch (error) {
      console.error('Error fetching P&G data:', error);
      toast.error('Error al cargar los datos de P&G');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const calculateVariation = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const getTableData = () => {
    if (!currentData) return [];

    const concepts = [
      { key: 'ingresos', label: 'Ingresos por Ventas', value: currentData.ingresos },
      { key: 'coste_ventas', label: 'Coste de Ventas', value: currentData.coste_ventas },
      { key: 'margen_bruto', label: 'Margen Bruto', value: currentData.margen_bruto, isSubtotal: true },
      { key: 'opex', label: 'Gastos de Personal (OPEX)', value: currentData.opex },
      { key: 'otros_ing_op', label: 'Otros Ingresos Operativos', value: currentData.otros_ing_op },
      { key: 'otros_gas_op', label: 'Otros Gastos Operativos', value: currentData.otros_gas_op },
      { key: 'ebitda', label: 'EBITDA', value: currentData.ebitda, isSubtotal: true },
      { key: 'dep', label: 'Depreciación', value: currentData.dep },
      { key: 'amort', label: 'Amortización', value: currentData.amort },
      { key: 'ebit', label: 'EBIT', value: currentData.ebit, isSubtotal: true },
      { key: 'ing_fin', label: 'Ingresos Financieros', value: currentData.ing_fin },
      { key: 'gas_fin', label: 'Gastos Financieros', value: currentData.gas_fin },
      { key: 'extra', label: 'Resultados Extraordinarios', value: currentData.extra },
      { key: 'bai', label: 'BAI (Beneficio Antes Impuestos)', value: currentData.bai, isSubtotal: true },
      { key: 'impuestos', label: 'Impuestos', value: currentData.impuestos },
      { key: 'beneficio_neto', label: 'Beneficio Neto', value: currentData.beneficio_neto, isSubtotal: true }
    ];

    return concepts.map(concept => {
      const previousValue = previousData ? (previousData as any)[concept.key] : null;
      const variation = previousValue !== null ? calculateVariation(concept.value, previousValue) : null;
      const percentageOverSales = currentData.ingresos !== 0 ? (concept.value / currentData.ingresos) * 100 : 0;

      return {
        ...concept,
        previousValue,
        variation,
        percentageOverSales
      };
    });
  };

  const getWaterfallData = (): WaterfallDataPoint[] => {
    if (!currentData) return [];

    const data: WaterfallDataPoint[] = [];
    let cumulative = 0;

    // Ingresos (starting point)
    cumulative = currentData.ingresos;
    data.push({
      name: 'Ingresos',
      value: currentData.ingresos,
      cumulative,
      type: 'positive',
      color: '#22c55e'
    });

    // Coste de ventas (negative)
    cumulative += currentData.coste_ventas;
    data.push({
      name: 'Coste Ventas',
      value: currentData.coste_ventas,
      cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // OPEX (negative)
    cumulative += currentData.opex;
    data.push({
      name: 'OPEX',
      value: currentData.opex,
      cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // Otros Ingresos/Gastos Operativos
    const otrosOp = currentData.otros_ing_op + currentData.otros_gas_op;
    cumulative += otrosOp;
    data.push({
      name: 'Otros Op.',
      value: otrosOp,
      cumulative,
      type: otrosOp >= 0 ? 'positive' : 'negative',
      color: otrosOp >= 0 ? '#22c55e' : '#ef4444'
    });

    // EBITDA (subtotal)
    data.push({
      name: 'EBITDA',
      value: currentData.ebitda,
      cumulative: currentData.ebitda,
      type: 'subtotal',
      color: '#3b82f6'
    });

    // Depreciación y Amortización
    const depAmort = currentData.dep + currentData.amort;
    cumulative = currentData.ebitda + depAmort;
    data.push({
      name: 'Dep/Amort',
      value: depAmort,
      cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // EBIT (subtotal)
    data.push({
      name: 'EBIT',
      value: currentData.ebit,
      cumulative: currentData.ebit,
      type: 'subtotal',
      color: '#3b82f6'
    });

    // Financieros
    const financieros = currentData.ing_fin + currentData.gas_fin + currentData.extra;
    cumulative = currentData.ebit + financieros;
    data.push({
      name: 'Financieros',
      value: financieros,
      cumulative,
      type: financieros >= 0 ? 'positive' : 'negative',
      color: financieros >= 0 ? '#22c55e' : '#ef4444'
    });

    // Impuestos
    cumulative += currentData.impuestos;
    data.push({
      name: 'Impuestos',
      value: currentData.impuestos,
      cumulative,
      type: 'negative',
      color: '#ef4444'
    });

    // Resultado Neto (final)
    data.push({
      name: 'Resultado Neto',
      value: currentData.beneficio_neto,
      cumulative: currentData.beneficio_neto,
      type: 'subtotal',
      color: currentData.beneficio_neto >= 0 ? '#22c55e' : '#ef4444'
    });

    return data;
  };

  const exportToCSV = () => {
    const tableData = getTableData();
    const headers = previousData 
      ? ['Concepto', 'Actual', '% sobre ventas', 'Año anterior', 'Δ']
      : ['Concepto', 'Actual', '% sobre ventas'];

    const csvContent = [
      headers.join(','),
      ...tableData.map(row => {
        const values = [
          `"${row.label}"`,
          row.value,
          row.percentageOverSales.toFixed(1) + '%'
        ];
        
        if (previousData) {
          values.push(
            row.previousValue !== null ? row.previousValue : '',
            row.variation !== null ? row.variation.toFixed(1) + '%' : ''
          );
        }
        
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pyg-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos P&G...</p>
        </div>
      </div>
    );
  }

  const tableData = getTableData();
  const waterfallData = getWaterfallData();
  const hasPreviousYearData = !!previousData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuenta de Pérdidas y Ganancias</h1>
          <p className="text-muted-foreground">Análisis detallado de ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" disabled={!currentData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table" className="space-y-6">
        <TabsList>
          <TabsTrigger value="table">Tabla Anual</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>P&G Anual - {selectedYear}</CardTitle>
              <CardDescription>
                Datos anuales {hasPreviousYearData ? 'con comparativa año anterior' : 'sin comparativa'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentData ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">% sobre ventas</TableHead>
                      {hasPreviousYearData && (
                        <>
                          <TableHead className="text-right">Año anterior</TableHead>
                          <TableHead className="text-right">Δ</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index} className={row.isSubtotal ? 'bg-muted/50 font-medium' : ''}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.value)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.percentageOverSales.toFixed(1)}%
                        </TableCell>
                        {hasPreviousYearData && (
                          <>
                            <TableCell className="text-right text-muted-foreground">
                              {row.previousValue !== null ? formatCurrency(row.previousValue) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.variation !== null ? (
                                <div className="flex items-center justify-end gap-2">
                                  {row.variation > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : row.variation < 0 ? (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  ) : null}
                                  <span className={
                                    row.variation > 0 ? 'text-green-600' : 
                                    row.variation < 0 ? 'text-red-600' : ''
                                  }>
                                    {row.variation.toFixed(1)}%
                                  </span>
                                </div>
                              ) : '-'}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para el año {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Waterfall Chart - {selectedYear}
              </CardTitle>
              <CardDescription>
                Análisis del flujo desde ingresos hasta resultado neto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentData ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {waterfallData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para el año {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}