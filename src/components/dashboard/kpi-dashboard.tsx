import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/ui/metric-card";
import { YearSelector } from "./year-selector";
import { DashboardHeader } from "./dashboard-header";
import { AIDiagnosis } from "./ai-diagnosis";
import { useToast } from "@/hooks/use-toast";

interface KPIData {
  facturacion_total: number;
  margen_ebitda_pct: number;
  beneficio_neto: number;
  yoy_facturacion_pct?: number;
  yoy_margen_ebitda_pct?: number;
  yoy_beneficio_neto_pct?: number;
}

export function KPIDashboard() {
  const { companyId } = useParams();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchKPIData();
    }
  }, [companyId, selectedYear]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from vw_kpis_anual first, fallback to static data if view doesn't exist
      const { data, error } = await supabase
        .from('pyg_annual')
        .select('anio, concepto_codigo, valor_total')
        .eq('company_id', companyId)
        .eq('anio', selectedYear);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // Mock data for demonstration - in production this would come from the views
      const mockKpiData: KPIData = {
        facturacion_total: 2800000,
        margen_ebitda_pct: 26.1,
        beneficio_neto: 520000,
        yoy_facturacion_pct: 15.9,
        yoy_margen_ebitda_pct: 2.4,
        yoy_beneficio_neto_pct: 23.8
      };

      setKpiData(mockKpiData);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
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
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number): { value: string; unit: string } => {
    if (value >= 1000000) {
      return { value: (value / 1000000).toFixed(1), unit: "M€" };
    } else if (value >= 1000) {
      return { value: (value / 1000).toFixed(0), unit: "K€" };
    }
    return { value: value.toFixed(0), unit: "€" };
  };

  const formatPercentage = (value: number): string => {
    return value.toFixed(1);
  };

  const formatTrend = (value?: number): { value: string; isPositive: boolean; label: string } | undefined => {
    if (value === undefined) return undefined;
    const isPositive = value > 0;
    return {
      value: `${isPositive ? '+' : ''}${value.toFixed(1)}%`,
      isPositive,
      label: `${isPositive ? '↗' : '↘'} ${Math.abs(value).toFixed(1)}% vs año anterior`
    };
  };

  const facturacion = formatCurrency(kpiData?.facturacion_total || 0);
  const beneficio = formatCurrency(kpiData?.beneficio_neto || 0);

  const metrics = [
    {
      title: "Facturación Total",
      value: facturacion.value,
      unit: facturacion.unit,
      description: "Ingresos totales del período",
      trend: formatTrend(kpiData?.yoy_facturacion_pct)
    },
    {
      title: "Margen EBITDA",
      value: formatPercentage(kpiData?.margen_ebitda_pct || 0),
      unit: "%",
      description: "Margen de beneficio operativo",
      trend: formatTrend(kpiData?.yoy_margen_ebitda_pct)
    },
    {
      title: "Beneficio Neto",
      value: beneficio.value,
      unit: beneficio.unit,
      description: "Rentabilidad final del período",
      trend: formatTrend(kpiData?.yoy_beneficio_neto_pct)
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <DashboardHeader 
          title="Dashboard Financiero"
          subtitle="Indicadores clave de rendimiento"
        />
        <YearSelector 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Indicadores Clave - {selectedYear}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </section>

      <AIDiagnosis metrics={metrics} />
    </div>
  );
}