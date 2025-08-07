import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Cell } from 'recharts';
import { Upload } from "lucide-react";
import { DebtServiceUploadModal } from "@/components/debt/debt-service-upload-modal";

interface DebtServiceDetail {
  periodo: string;
  servicio_total: number;
  principal: number;
  intereses: number;
  flujo_operativo: number;
}

interface DebtServiceKPIs {
  dscr_promedio: number;
  dscr_minimo: number;
  meses_en_riesgo: number;
  servicio_anual: number;
}

interface StressTestData {
  ebitda_adjustment: number;
  interest_adjustment: number;
}

export function DebtServicePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [periods, setPeriods] = useState<string[]>([]);
  const [debtServiceData, setDebtServiceData] = useState<DebtServiceDetail[]>([]);
  const [kpis, setKPIs] = useState<DebtServiceKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [stressTest, setStressTest] = useState<StressTestData>({
    ebitda_adjustment: 0,
    interest_adjustment: 0
  });

  useEffect(() => {
    if (companyId) {
      initializeData();
    }
  }, [companyId]);

  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPeriods(),
        fetchKPIs()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId && selectedPeriod) {
      fetchDebtServiceData();
    }
  }, [companyId, selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      console.log('Fetching debt service periods for company:', companyId);
      const { data, error } = await supabase.rpc('get_debt_service_periods', {
        _company_id: companyId
      });

      if (error) throw error;
      console.log('Debt service periods data:', data);
      const periodsList = (data || []).map((item: any) => item.periodo);
      setPeriods(periodsList);
      
      // Set initial period if we have data
      if (periodsList.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periodsList[0]?.substring(0, 4) || "");
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      toast({
        title: "Error",
        description: "Error al cargar períodos disponibles",
        variant: "destructive",
      });
    }
  };

  const fetchKPIs = async () => {
    try {
      console.log('Fetching debt service KPIs for company:', companyId);
      const { data, error } = await supabase
        .from('vw_debt_service_kpis')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      console.log('Debt service KPIs data:', data);
      setKPIs(data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: "Error",
        description: "Error al cargar KPIs de servicio de deuda",
        variant: "destructive",
      });
    }
  };

  const fetchDebtServiceData = async () => {
    if (!selectedPeriod) return;
    
    try {
      console.log('Fetching debt service data for period:', selectedPeriod);
      const { data, error } = await supabase
        .from('vw_debt_service_detail')
        .select('*')
        .eq('company_id', companyId)
        .like('periodo', `${selectedPeriod}%`)
        .order('periodo');

      if (error) throw error;
      console.log('Debt service detail data:', data);
      setDebtServiceData(data || []);
    } catch (error) {
      console.error('Error fetching debt service data:', error);
      toast({
        title: "Error",
        description: "Error al cargar datos de servicio de deuda",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    toast({
      title: "Éxito",
      description: "Datos de servicio de deuda importados correctamente",
    });
    // Reinitialize all data
    initializeData();
    if (selectedPeriod) {
      fetchDebtServiceData();
    }
  };

  const calculateStressedData = () => {
    return debtServiceData.map(item => {
      const adjustedFlow = item.flujo_operativo * (1 + stressTest.ebitda_adjustment / 100);
      const adjustedInterest = item.intereses * (1 + stressTest.interest_adjustment / 100);
      const adjustedService = item.principal + adjustedInterest;
      const dscr = adjustedFlow > 0 ? adjustedService / adjustedFlow : 0;
      
      return {
        ...item,
        servicio_total: adjustedService,
        flujo_operativo: adjustedFlow,
        dscr: dscr,
        risk_level: dscr >= 1.2 ? 'safe' : dscr >= 1 ? 'warning' : 'danger'
      };
    });
  };

  const stressedData = calculateStressedData();

  const calculateStressedKPIs = () => {
    if (stressedData.length === 0) return null;

    const dscrs = stressedData.map(d => d.dscr).filter(d => d > 0);
    const avgDscr = dscrs.reduce((a, b) => a + b, 0) / dscrs.length;
    const minDscr = Math.min(...dscrs);
    const monthsAtRisk = stressedData.filter(d => d.dscr < 1).length;
    const annualService = stressedData.reduce((sum, d) => sum + d.servicio_total, 0);

    return {
      dscr_promedio: avgDscr,
      dscr_minimo: minDscr,
      meses_en_riesgo: monthsAtRisk,
      servicio_anual: annualService
    };
  };

  const stressedKPIs = calculateStressedKPIs();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDSCR = (value: number) => {
    return value?.toFixed(2) || '0.00';
  };

  const getDSCRColor = (dscr: number) => {
    if (dscr >= 1.2) return '#22c55e'; // green
    if (dscr >= 1) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  if (loading && debtServiceData.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Servicio de Deuda</h1>
            <p className="text-muted-foreground">Análisis del servicio de deuda y cobertura</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servicio de Deuda</h1>
          <p className="text-muted-foreground">Análisis del servicio de deuda y cobertura</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(periods.map(p => p.substring(0, 4)))).map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Cargar Servicio Deuda
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Servicio Deuda Anual"
          value={formatCurrency(stressedKPIs?.servicio_anual || kpis?.servicio_anual || 0)}
          unit=""
          description="Total anual del servicio de deuda"
        />
        <MetricCard
          title="DSCR Promedio"
          value={formatDSCR(stressedKPIs?.dscr_promedio || kpis?.dscr_promedio || 0)}
          unit="x"
          description="Ratio de cobertura promedio"
        />
        <MetricCard
          title="DSCR Mínimo"
          value={formatDSCR(stressedKPIs?.dscr_minimo || kpis?.dscr_minimo || 0)}
          unit="x"
          description="Ratio de cobertura más bajo"
        />
        <MetricCard
          title="Meses en Riesgo"
          value={(stressedKPIs?.meses_en_riesgo || kpis?.meses_en_riesgo || 0).toString()}
          unit="meses"
          description="Períodos con DSCR < 1.0"
        />
      </div>

      {/* Stress Test Simulator */}
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Análisis de Estrés</CardTitle>
          <CardDescription>
            Ajusta los parámetros para ver el impacto en los KPIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Ajuste EBITDA: {stressTest.ebitda_adjustment}%</Label>
              <Slider
                value={[stressTest.ebitda_adjustment]}
                onValueChange={([value]) => setStressTest(prev => ({ ...prev, ebitda_adjustment: value }))}
                min={-50}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Ajuste Intereses: {stressTest.interest_adjustment}%</Label>
              <Slider
                value={[stressTest.interest_adjustment]}
                onValueChange={([value]) => setStressTest(prev => ({ ...prev, interest_adjustment: value }))}
                min={-50}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="space-y-6">
        {/* Service vs Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Servicio de Deuda vs Flujo Disponible</CardTitle>
            <CardDescription>Comparación mensual del servicio de deuda y flujo disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={stressedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const month = value.split('-')[1];
                    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    return months[parseInt(month) - 1] || month;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend />
                
                {/* Area shading where servicio_total > flujo_operativo */}
                <defs>
                  <pattern id="riskPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="hsl(var(--destructive))" fillOpacity="0.1"/>
                  </pattern>
                </defs>
                
                <Area
                  dataKey={(data) => data.servicio_total > data.flujo_operativo ? data.servicio_total : null}
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.2}
                  stroke="none"
                  connectNulls={false}
                />
                
                <Line
                  type="monotone"
                  dataKey="servicio_total"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Servicio de Deuda"
                />
                <Line
                  type="monotone"
                  dataKey="flujo_operativo"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Flujo Disponible"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* DSCR Chart */}
        <Card>
          <CardHeader>
            <CardTitle>DSCR Mensual</CardTitle>
            <CardDescription>Ratio de cobertura del servicio de deuda por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={stressedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const month = value.split('-')[1];
                    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    return months[parseInt(month) - 1] || month;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatDSCR(Number(value)) + '×', 'DSCR']}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend 
                  content={() => (
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Seguro (≥1.2)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span>Precaución (1.0-1.2)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Riesgo (&lt;1.0)</span>
                      </div>
                    </div>
                  )}
                />
                
                <Bar
                  dataKey="dscr"
                  name="DSCR"
                >
                  {stressedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDSCRColor(entry.dscr)} />
                  ))}
                </Bar>
                
                {/* Reference line at 1.2 */}
                <Line
                  type="monotone"
                  dataKey={() => 1.2}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Umbral Recomendado (1.2)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {debtServiceData.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay datos de servicio de deuda disponibles para este período.
            </p>
            <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Cargar Datos de Servicio de Deuda
            </Button>
          </CardContent>
        </Card>
      )}

      <DebtServiceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default DebtServicePage;