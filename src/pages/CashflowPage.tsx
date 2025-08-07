import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetricCard } from "@/components/ui/metric-card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
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
    const operativoSum = cashflowOperativo.reduce((sum, item) => sum + (item.flujo_operativo || 0), 0);
    const inversionSum = cashflowInversion.reduce((sum, item) => sum + (item.flujo_inversion || 0), 0);
    const financiacionSum = cashflowFinanciacion.reduce((sum, item) => sum + (item.flujo_financiacion || 0), 0);
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

  const sums = calculateSums();

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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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