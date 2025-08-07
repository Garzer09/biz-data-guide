import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SegmentData {
  segmento: string;
  periodo: string;
  concepto_nombre: string;
  grupo: string;
  valor_total: number;
  total_valor: number;
  company_id: string;
}

export function SalesSegmentsPage() {
  const { companyId } = useParams();
  const [data, setData] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: segmentData, error } = await supabase
        .from('pyg_analytic')
        .select(`
          segmento,
          periodo,
          concepto_codigo,
          valor,
          catalog_pyg_concepts (
            concepto_nombre,
            grupo
          )
        `)
        .eq('company_id', companyId)
        .not('segmento', 'is', null)
        .order('periodo', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected structure
      const transformedData = segmentData?.map(item => ({
        company_id: companyId,
        periodo: item.periodo,
        anio: item.periodo.substring(0, 4),
        segmento: item.segmento,
        concepto_codigo: item.concepto_codigo,
        concepto_nombre: item.catalog_pyg_concepts?.concepto_nombre || '',
        grupo: item.catalog_pyg_concepts?.grupo || '',
        valor_total: item.valor,
        total_valor: item.valor,
        num_registros: 1
      })) || [];

      setData(transformedData);

    } catch (error: any) {
      console.error('Error fetching segment data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de segmentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de segmentos...</p>
        </div>
      </div>
    );
  }

  // Group data by segment and period
  const groupedBySegment = data.reduce((acc, item) => {
    if (!acc[item.segmento]) {
      acc[item.segmento] = {};
    }
    if (!acc[item.segmento][item.periodo]) {
      acc[item.segmento][item.periodo] = [];
    }
    acc[item.segmento][item.periodo].push(item);
    return acc;
  }, {} as Record<string, Record<string, SegmentData[]>>);

  // Calculate totals by segment
  const segmentTotals = Object.entries(groupedBySegment).map(([segmento, periods]) => {
    const totalIngresos = Object.values(periods)
      .flat()
      .filter(item => item.concepto_nombre.toLowerCase().includes('ingreso'))
      .reduce((sum, item) => sum + item.total_valor, 0);
    
    const totalGastos = Object.values(periods)
      .flat()
      .filter(item => !item.concepto_nombre.toLowerCase().includes('ingreso'))
      .reduce((sum, item) => sum + Math.abs(item.total_valor), 0);
    
    return {
      segmento,
      ingresos: totalIngresos,
      gastos: totalGastos,
      margen: totalIngresos - totalGastos,
      periodos: Object.keys(periods)
    };
  });

  const totalIngresos = segmentTotals.reduce((sum, seg) => sum + seg.ingresos, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ventas por Segmentos</h1>
        <p className="text-muted-foreground">
          Análisis de ingresos y rentabilidad por segmento de negocio
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Segmentos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentTotals.length}</div>
            <p className="text-xs text-muted-foreground">
              Segmentos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalIngresos.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los segmentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Segmento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segmentTotals.length > 0 ? 
                segmentTotals.reduce((best, current) => 
                  current.margen > best.margen ? current : best
                ).segmento : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Mayor margen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segment Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {segmentTotals.map((segment) => (
          <Card key={segment.segmento}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {segment.segmento}
                <Badge variant={segment.margen > 0 ? "default" : "destructive"}>
                  {segment.margen > 0 ? "Rentable" : "Pérdidas"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {segment.periodos.length} período(s) de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium text-green-600">
                    {segment.ingresos.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gastos</span>
                  <span className="font-medium text-red-600">
                    {segment.gastos.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Margen</span>
                  <span className={`font-bold ${segment.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {segment.margen.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Participación</span>
                  <span className="text-sm font-medium">
                    {totalIngresos > 0 ? ((segment.ingresos / totalIngresos) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {segmentTotals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay datos de segmentos</h3>
            <p className="text-muted-foreground text-center">
              No se encontraron datos de segmentos para esta empresa.
              <br />
              Sube un archivo CSV de P&G Analítico con segmentos desde el panel de administrador.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}