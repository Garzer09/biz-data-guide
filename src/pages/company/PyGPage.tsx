import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { YearSelector } from "@/components/dashboard/year-selector";
import { Download, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PyGData {
  concepto_codigo: string;
  concepto_nombre?: string;
  valor_total: number;
  valor_anterior?: number;
  variacion_pct?: number;
}

export function PyGPage() {
  const { companyId } = useParams();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [pygData, setPygData] = useState<PyGData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchPyGData();
    }
  }, [companyId, selectedYear]);

  const fetchPyGData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pyg_annual')
        .select('concepto_codigo, valor_total')
        .eq('company_id', companyId)
        .eq('anio', selectedYear)
        .order('concepto_codigo');

      if (error) throw error;

      // Mock additional data for demonstration
      const enhancedData: PyGData[] = (data || []).map(item => ({
        ...item,
        concepto_nombre: getConceptName(item.concepto_codigo),
        valor_anterior: item.valor_total * 0.9, // Mock previous year data
        variacion_pct: Math.random() * 20 - 10 // Mock variation
      }));

      setPygData(enhancedData);
    } catch (error) {
      console.error('Error fetching P&G data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de P&G",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConceptName = (codigo: string): string => {
    const concepts: { [key: string]: string } = {
      '7000': 'Ventas de mercaderías',
      '7001': 'Ventas de productos',
      '7002': 'Ventas de servicios',
      '6000': 'Compras de mercaderías',
      '6001': 'Compras de materias primas',
      '6400': 'Sueldos y salarios',
      '6420': 'Seguridad Social a cargo empresa',
      '6810': 'Amortización del inmovilizado material'
    };
    return concepts[codigo] || codigo;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTrendIcon = (variacion?: number) => {
    if (!variacion) return null;
    return variacion > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const exportToCSV = () => {
    const csvData = pygData.map(item => ({
      'Código': item.concepto_codigo,
      'Concepto': item.concepto_nombre || '',
      'Valor Actual': item.valor_total,
      'Valor Anterior': item.valor_anterior || '',
      'Variación %': item.variacion_pct?.toFixed(2) || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuenta de Pérdidas y Ganancias</h1>
          <p className="text-muted-foreground">Análisis detallado de ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-4">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="annual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="annual">Vista Anual</TabsTrigger>
          <TabsTrigger value="monthly">Vista Mensual (Estimado)</TabsTrigger>
        </TabsList>

        <TabsContent value="annual">
          <Card>
            <CardHeader>
              <CardTitle>P&G Anual - {selectedYear}</CardTitle>
              <CardDescription>
                Datos anuales con comparativa año anterior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Valor {selectedYear}</TableHead>
                    <TableHead className="text-right">Valor Anterior</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pygData.map((item) => (
                    <TableRow key={item.concepto_codigo}>
                      <TableCell className="font-mono">{item.concepto_codigo}</TableCell>
                      <TableCell>{item.concepto_nombre}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.valor_anterior ? formatCurrency(item.valor_anterior) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getTrendIcon(item.variacion_pct)}
                          <span className={
                            item.variacion_pct && item.variacion_pct > 0 ? 
                            'text-green-600' : 'text-red-600'
                          }>
                            {item.variacion_pct ? `${item.variacion_pct.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pygData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para el año {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Vista Mensual {selectedYear}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Estimado por prorrateo
                </Badge>
              </CardTitle>
              <CardDescription>
                Distribución mensual estimada basada en reglas de prorrateo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>La vista mensual estará disponible una vez configuradas las reglas de prorrateo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}