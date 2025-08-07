import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, DollarSign, Building2, AlertCircle } from "lucide-react";

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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [cashflowOperativo, setCashflowOperativo] = useState<CashflowData[]>([]);
  const [cashflowInversion, setCashflowInversion] = useState<CashflowData[]>([]);
  const [cashflowFinanciacion, setCashflowFinanciacion] = useState<CashflowData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check access and load initial data
  useEffect(() => {
    if (companyId && user) {
      checkAccess();
    }
  }, [companyId, user]);

  // Load cashflow data when year changes
  useEffect(() => {
    if (selectedYear && hasAccess) {
      fetchCashflowData();
    }
  }, [selectedYear, hasAccess]);

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

  const fetchCashflowData = async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all cashflow data in parallel
      const [operativoResult, inversionResult, financiacionResult] = await Promise.all([
        supabase.rpc('get_cashflow_operativo', {
          _company_id: companyId,
          _anio: selectedYear
        }),
        supabase.rpc('get_cashflow_inversion', {
          _company_id: companyId,
          _anio: selectedYear
        }),
        supabase.rpc('get_cashflow_financiacion', {
          _company_id: companyId,
          _anio: selectedYear
        })
      ]);

      // Check for errors
      if (operativoResult.error || inversionResult.error || financiacionResult.error) {
        throw new Error('Error cargando flujos de caja');
      }

      setCashflowOperativo(operativoResult.data || []);
      setCashflowInversion(inversionResult.data || []);
      setCashflowFinanciacion(financiacionResult.data || []);

    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      setError('Error cargando flujos de caja');
      setCashflowOperativo([]);
      setCashflowInversion([]);
      setCashflowFinanciacion([]);
    } finally {
      setIsLoading(false);
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                {cashflowOperativo.length > 0 ? (
                  cashflowOperativo.map((item) => (
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
                {cashflowInversion.length > 0 ? (
                  cashflowInversion.map((item) => (
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
                {cashflowFinanciacion.length > 0 ? (
                  cashflowFinanciacion.map((item) => (
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