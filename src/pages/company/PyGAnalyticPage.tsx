import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PyGAnalyticData {
  periodo: string;
  concepto_codigo: string;
  concepto_nombre: string;
  valor: number;
  segmento?: string;
  centro_coste?: string;
  grupo: string;
}

export function PyGAnalyticPage() {
  const { companyId } = useParams();
  const [data, setData] = useState<PyGAnalyticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentos, setSegmentos] = useState<string[]>([]);
  const [centrosCoste, setCentrosCoste] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch P&G analytic data
      const { data: pygData, error } = await supabase
        .from('vw_pyg_analytic_detail')
        .select('*')
        .eq('company_id', companyId)
        .order('periodo', { ascending: false });

      if (error) throw error;

      setData(pygData || []);

      // Extract unique segments and cost centers
      const uniqueSegmentos = [...new Set(pygData?.map(d => d.segmento).filter(Boolean))];
      const uniqueCentros = [...new Set(pygData?.map(d => d.centro_coste).filter(Boolean))];
      
      setSegmentos(uniqueSegmentos);
      setCentrosCoste(uniqueCentros);

    } catch (error: any) {
      console.error('Error fetching P&G analytic data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos analíticos de P&G",
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
          <p className="text-muted-foreground">Cargando datos analíticos...</p>
        </div>
      </div>
    );
  }

  const groupedByPeriod = data.reduce((acc, item) => {
    if (!acc[item.periodo]) {
      acc[item.periodo] = [];
    }
    acc[item.periodo].push(item);
    return acc;
  }, {} as Record<string, PyGAnalyticData[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">P&G Analítico</h1>
        <p className="text-muted-foreground">
          Análisis detallado de ingresos y gastos por centros de coste y segmentos
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">
              Registros analíticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentos.length}</div>
            <p className="text-xs text-muted-foreground">
              Segmentos únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centros de Coste</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{centrosCoste.length}</div>
            <p className="text-xs text-muted-foreground">
              Centros únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data by Period */}
      {Object.entries(groupedByPeriod).map(([periodo, periodData]) => (
        <Card key={periodo}>
          <CardHeader>
            <CardTitle>Período {periodo}</CardTitle>
            <CardDescription>
              {periodData.length} registros analíticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {periodData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.concepto_nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.concepto_codigo}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {item.segmento && (
                        <Badge variant="secondary">
                          Segmento: {item.segmento}
                        </Badge>
                      )}
                      {item.centro_coste && (
                        <Badge variant="outline">
                          Centro: {item.centro_coste}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${item.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.valor.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.grupo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay datos analíticos</h3>
            <p className="text-muted-foreground text-center">
              No se encontraron datos de P&G analítico para esta empresa.
              <br />
              Sube un archivo CSV desde el panel de administrador para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}