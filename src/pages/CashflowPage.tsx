import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, DollarSign, Building2 } from "lucide-react";

export function CashflowPage() {
  const { companyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Check access and load initial data
  useEffect(() => {
    if (companyId && user) {
      checkAccess();
    }
  }, [companyId, user]);

  const checkAccess = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase.rpc('has_company_access', {
        _company_id: companyId
      });

      if (error) throw error;
      
      setHasAccess(data);
      
      if (data) {
        await fetchAvailableYears();
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase.rpc('get_cashflow_years', {
        _company_id: companyId
      });

      if (error) throw error;
      
      const years = data?.map((item: any) => item.anio) || [];
      setAvailableYears(years);
      
      if (years.length > 0) {
        setSelectedYear(years[0]); // Select most recent year
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const handleExport = () => {
    toast({
      title: "Exportar datos",
      description: "Funcionalidad de exportación en desarrollo",
    });
  };

  const handleAddPeriod = () => {
    toast({
      title: "Añadir período",
      description: "Funcionalidad para añadir período en desarrollo",
    });
  };

  if (loading) {
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

  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sin acceso</h3>
          <p className="text-muted-foreground">No tienes permisos para ver los datos de esta empresa</p>
        </div>
      </div>
    );
  }

  if (availableYears.length === 0) {
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" aria-label="Seleccionar año">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Content - Placeholder for now */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo Operativo
            </CardTitle>
            <CardDescription>Actividades principales del negocio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center py-8">
              {selectedYear ? `Datos para ${selectedYear}` : "Seleccione un año"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo de Inversión
            </CardTitle>
            <CardDescription>Adquisiciones y ventas de activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center py-8">
              {selectedYear ? `Datos para ${selectedYear}` : "Seleccione un año"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo de Financiación
            </CardTitle>
            <CardDescription>Operaciones con accionistas y acreedores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center py-8">
              {selectedYear ? `Datos para ${selectedYear}` : "Seleccione un año"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}