import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { YearSelector } from "@/components/dashboard/year-selector";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet } from "lucide-react";

interface SalesSegmentData {
  segmento: string;
  ventas: number;
  costes_variables: number;
  costes_fijos: number;
  margen_contribucion: number;
}

export function SalesSegmentsPage() {
  const { companyId } = useParams();
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [data, setData] = useState<SalesSegmentData[]>([]);
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

      const { data: salesData, error } = await supabase
        .from('vw_sales_segments')
        .select('segmento, ventas, costes_variables, costes_fijos, margen_contribucion')
        .eq('company_id', companyId)
        .like('periodo', `${selectedYear}-%`);

      if (error) throw error;

      // Group data by segment and sum values
      const groupedData = salesData.reduce((acc: Record<string, SalesSegmentData>, row) => {
        const segment = row.segmento;
        if (!acc[segment]) {
          acc[segment] = {
            segmento: segment,
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

      setData(Object.values(groupedData));
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

  const getTotalVentas = () => data.reduce((sum, item) => sum + item.ventas, 0);

  const exportToCSV = () => {
    const csvContent = [
      'Segmento,Ventas,Costes Variables,Costes Fijos,Margen Contribución,% Margen',
      ...data.map(row => [
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
    link.download = `ventas_segmentos_${selectedYear}.csv`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventas por Segmentos</h1>
          <p className="text-muted-foreground">
            Análisis de rendimiento por segmento de negocio
          </p>
        </div>
        <div className="flex items-center gap-4">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={years}
          />
          <Button variant="outline" onClick={exportToCSV} disabled={data.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar Gráfico
          </Button>
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
            No se encontraron datos de segmentos para el año {selectedYear}
          </AlertDescription>
        </Alert>
      )}

      {data.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Segmentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(getTotalVentas())}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mejor Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.reduce((best, current) => 
                    current.margen_contribucion > best.margen_contribucion ? current : best
                  ).segmento}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Segmento</CardTitle>
              <CardDescription>
                Desglose completo de ventas, costes y márgenes por segmento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segmento</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Costes Variables</TableHead>
                    <TableHead className="text-right">Costes Fijos</TableHead>
                    <TableHead className="text-right">Margen Contribución</TableHead>
                    <TableHead className="text-right">% Margen</TableHead>
                    <TableHead className="text-right">Participación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.segmento}>
                      <TableCell className="font-medium">{row.segmento}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.ventas)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.costes_variables)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.costes_fijos)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.margen_contribucion)}</TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(row.margen_contribucion, row.ventas)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(row.ventas, getTotalVentas())}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <BarChartCard
              title="Comparativa por Segmento"
              description="Ventas, costes variables y costes fijos por segmento"
              data={data}
              dataKeys={['ventas', 'costes_variables', 'costes_fijos']}
              xAxisKey="segmento"
              colors={["hsl(142, 76%, 36%)", "hsl(346, 87%, 43%)", "hsl(262, 83%, 58%)"]}
              formatValue={formatCurrency}
            />

            {/* Pie Chart */}
            <PieChartCard
              title="Distribución del Margen de Contribución"
              description="Participación de cada segmento en el margen total"
              data={data.map(item => ({
                name: item.segmento,
                value: item.margen_contribucion
              }))}
              formatValue={formatCurrency}
            />
          </div>
        </>
      )}
    </div>
  );
}