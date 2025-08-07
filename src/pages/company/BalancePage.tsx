import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, TrendingDown, Download, PieChart as PieChartIcon, BarChart3, Building2 } from "lucide-react";

interface BalanceOperativo {
  periodo: string;
  clientes: number;
  inventario: number;
  proveedores: number;
  otros_deudores_op: number;
  otros_acreedores_op: number;
  anticipos_clientes: number;
  trabajos_en_curso: number;
}

interface BalanceFinanciero {
  periodo: string;
  activo_corriente: number;
  activo_no_corriente: number;
  pasivo_corriente: number;
  pasivo_no_corriente: number;
  patrimonio_neto: number;
}

interface KPIData {
  beneficio_neto: number;
  facturacion: number;
  margen_ebitda_pct: number;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export function BalancePage() {
  const { companyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [balanceOperativo, setBalanceOperativo] = useState<BalanceOperativo[]>([]);
  const [balanceFinanciero, setBalanceFinanciero] = useState<BalanceFinanciero[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [previousKpiData, setPreviousKpiData] = useState<KPIData | null>(null);

  // Check access and load initial data
  useEffect(() => {
    if (companyId && user) {
      checkAccess();
    }
  }, [companyId, user]);

  // Load data when year changes
  useEffect(() => {
    if (selectedYear && hasAccess) {
      fetchBalanceData();
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
      const { data, error } = await supabase.rpc('get_balance_years', {
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

  const fetchBalanceData = async () => {
    if (!companyId || !selectedYear) return;

    setLoading(true);
    
    try {
      // Fetch balance data
      const [operativoResult, financieroResult, kpiResult, previousKpiResult] = await Promise.all([
        supabase.rpc('get_balance_operativo', {
          _company_id: companyId,
          _anio: selectedYear
        }),
        supabase.rpc('get_balance_financiero', {
          _company_id: companyId,
          _anio: selectedYear
        }),
        supabase
          .from('vw_kpis_anual')
          .select('beneficio_neto, facturacion, margen_ebitda_pct')
          .eq('company_id', companyId)
          .eq('anio', selectedYear)
          .single(),
        supabase
          .from('vw_kpis_anual')
          .select('beneficio_neto, facturacion, margen_ebitda_pct')
          .eq('company_id', companyId)
          .eq('anio', (parseInt(selectedYear) - 1).toString())
          .single()
      ]);

      if (operativoResult.error) throw operativoResult.error;
      if (financieroResult.error) throw financieroResult.error;

      setBalanceOperativo(operativoResult.data || []);
      setBalanceFinanciero(financieroResult.data || []);
      setKpiData(kpiResult.data);
      setPreviousKpiData(previousKpiResult.data);

    } catch (error) {
      console.error('Error fetching balance data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del balance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = () => {
    if (!balanceFinanciero.length) return null;

    const latestBalance = balanceFinanciero[balanceFinanciero.length - 1];
    const totalActivo = latestBalance.activo_corriente + latestBalance.activo_no_corriente;
    const totalPasivo = latestBalance.pasivo_corriente + latestBalance.pasivo_no_corriente;
    const fondoManiobra = latestBalance.activo_corriente - latestBalance.pasivo_corriente;
    
    const roa = kpiData && totalActivo > 0 ? (kpiData.beneficio_neto / totalActivo) * 100 : 0;
    const endeudamiento = totalActivo > 0 ? (totalPasivo / totalActivo) * 100 : 0;

    return {
      totalActivo,
      patrimonioNeto: latestBalance.patrimonio_neto,
      fondoManiobra,
      roa,
      endeudamiento
    };
  };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getActivoChartData = () => {
    if (!balanceFinanciero.length) return [];
    
    return balanceFinanciero.map(item => ({
      periodo: item.periodo.slice(-2), // Last 2 chars (month)
      'Activo Corriente': item.activo_corriente,
      'Activo No Corriente': item.activo_no_corriente
    }));
  };

  const getPasivoChartData = () => {
    if (!balanceFinanciero.length) return [];
    
    return balanceFinanciero.map(item => ({
      periodo: item.periodo.slice(-2),
      'Pasivo Corriente': item.pasivo_corriente,
      'Pasivo No Corriente': item.pasivo_no_corriente,
      'Patrimonio Neto': item.patrimonio_neto
    }));
  };

  const getActivoPieData = () => {
    if (!balanceFinanciero.length) return [];
    
    const latest = balanceFinanciero[balanceFinanciero.length - 1];
    return [
      { name: 'Activo Corriente', value: latest.activo_corriente },
      { name: 'Activo No Corriente', value: latest.activo_no_corriente }
    ];
  };

  const getPasivoPieData = () => {
    if (!balanceFinanciero.length) return [];
    
    const latest = balanceFinanciero[balanceFinanciero.length - 1];
    return [
      { name: 'Pasivo Corriente', value: latest.pasivo_corriente },
      { name: 'Pasivo No Corriente', value: latest.pasivo_no_corriente },
      { name: 'Patrimonio Neto', value: latest.patrimonio_neto }
    ];
  };

  const exportCSV = () => {
    if (!balanceOperativo.length && !balanceFinanciero.length) return;

    const csvData = balanceFinanciero.map(item => ({
      Periodo: item.periodo,
      'Activo Corriente': item.activo_corriente,
      'Activo No Corriente': item.activo_no_corriente,
      'Total Activo': item.activo_corriente + item.activo_no_corriente,
      'Pasivo Corriente': item.pasivo_corriente,
      'Pasivo No Corriente': item.pasivo_no_corriente,
      'Patrimonio Neto': item.patrimonio_neto
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance_${companyId}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
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
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sin datos de balance</h3>
          <p className="text-muted-foreground">No hay datos de balance disponibles para esta empresa</p>
        </div>
      </div>
    );
  }

  const kpis = calculateKPIs();

  return (
    <div className="space-y-6" role="main" aria-label="Balance de Situación">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance de Situación</h1>
          <p className="text-muted-foreground">Análisis patrimonial y financiero</p>
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
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{kpis.totalActivo.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrimonio Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{kpis.patrimonioNeto.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fondo de Maniobra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{kpis.fondoManiobra.toLocaleString()}
              </div>
              <Badge variant={kpis.fondoManiobra >= 0 ? "default" : "destructive"} className="mt-2">
                {kpis.fondoManiobra >= 0 ? "Positivo" : "Negativo"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.roa.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Endeudamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.endeudamiento.toFixed(2)}%
              </div>
              <Badge variant={kpis.endeudamiento <= 60 ? "default" : "destructive"} className="mt-2">
                {kpis.endeudamiento <= 60 ? "Saludable" : "Alto"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activo Waterfall */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Composición del Activo
            </CardTitle>
            <CardDescription>Evolución mensual del activo corriente vs no corriente</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getActivoChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Activo Corriente" stackId="a" fill={COLORS[0]} />
                <Bar dataKey="Activo No Corriente" stackId="a" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pasivo Waterfall */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Composición del Pasivo + Patrimonio
            </CardTitle>
            <CardDescription>Evolución mensual de la estructura financiera</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getPasivoChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Pasivo Corriente" stackId="b" fill={COLORS[2]} />
                <Bar dataKey="Pasivo No Corriente" stackId="b" fill={COLORS[3]} />
                <Bar dataKey="Patrimonio Neto" stackId="b" fill={COLORS[4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribución del Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getActivoPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getActivoPieData().map((entry, index) => (
                    <Cell key={`activo-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribución del Pasivo + Patrimonio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPasivoPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPasivoPieData().map((entry, index) => (
                    <Cell key={`pasivo-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Balance</CardTitle>
          <CardDescription>Datos mensuales detallados del balance de situación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Activo Corriente</TableHead>
                  <TableHead className="text-right">Activo No Corriente</TableHead>
                  <TableHead className="text-right">Total Activo</TableHead>
                  <TableHead className="text-right">Pasivo Corriente</TableHead>
                  <TableHead className="text-right">Pasivo No Corriente</TableHead>
                  <TableHead className="text-right">Patrimonio Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceFinanciero.map((item, index) => {
                  const totalActivo = item.activo_corriente + item.activo_no_corriente;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.periodo}</TableCell>
                      <TableCell className="text-right">€{item.activo_corriente.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{item.activo_no_corriente.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">€{totalActivo.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{item.pasivo_corriente.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{item.pasivo_no_corriente.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{item.patrimonio_neto.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}