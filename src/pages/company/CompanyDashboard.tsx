import { useParams } from "react-router-dom";
import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/ui/metric-card";
import { YearSelector } from "@/components/dashboard/year-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { logger, logError } from "@/lib/logger";

interface KPIData {
  facturacion: number;
  margen_ebitda_pct: number;
  beneficio_neto: number;
}

interface YoYData {
  kpi: string;
  valor_actual: number;
  valor_anterior: number;
  delta_pct: number;
}

const CompanyDashboard = memo(function CompanyDashboard() {
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [yoyData, setYoyData] = useState<YoYData[]>([]);

  // Validate access and load data
  useEffect(() => {
    if (!companyId) return;

    const validateAccessAndLoadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate company access
        const { data: accessData, error: accessError } = await supabase
          .rpc('has_company_access', { _company_id: companyId });

        if (accessError) {
          throw new Error('Error validando acceso');
        }

        if (!accessData) {
          setError('No tienes acceso a esta empresa');
          return;
        }

        setHasAccess(true);

        // Load available years from vw_pyg_anual
        const { data: yearsData, error: yearsError } = await supabase
          .from('vw_pyg_anual')
          .select('anio')
          .eq('company_id', companyId)
          .order('anio', { ascending: false });

        if (yearsError) {
          throw new Error('Error cargando años disponibles');
        }

        const years = [...new Set(yearsData?.map(item => item.anio) || [])];
        setAvailableYears(years);

        // Set default year to the most recent available
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    validateAccessAndLoadData();
  }, [companyId]);

  // Load KPI data when year changes
  useEffect(() => {
    if (!companyId || !hasAccess || !selectedYear) return;

    const loadKPIData = async () => {
      try {
        setLoading(true);

        // Load current year KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from('vw_kpis_anual')
          .select('facturacion, margen_ebitda_pct, beneficio_neto')
          .eq('company_id', companyId)
          .eq('anio', selectedYear)
          .single();

        if (kpiError && kpiError.code !== 'PGRST116') {
          throw new Error('Error cargando KPIs');
        }

        setKpiData(kpiData);

        // Load YoY data
        const { data: yoyData, error: yoyError } = await supabase
          .from('vw_kpis_anual_yoy')
          .select('kpi, valor_actual, valor_anterior, delta_pct')
          .eq('company_id', companyId)
          .eq('anio', selectedYear);

        if (yoyError) {
          throw new Error('Error cargando datos YoY');
        }

        setYoyData(yoyData || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    loadKPIData();
  }, [companyId, hasAccess, selectedYear]);

  // Helper functions
  const formatNumber = (value: number, isPercentage = false): string => {
    if (isPercentage) {
      return (value * 100).toFixed(1);
    }
    
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1);
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0);
    }
    return value.toFixed(0);
  };

  const getUnit = (value: number, isPercentage = false): string => {
    if (isPercentage) return "%";
    if (value >= 1000000) return "M€";
    if (value >= 1000) return "K€";
    return "€";
  };

  const getTrendData = (kpi: string) => {
    const yoyItem = yoyData.find(item => item.kpi === kpi);
    if (!yoyItem || yoyItem.valor_anterior === null || yoyItem.delta_pct === null) {
      return undefined;
    }

    const isPositive = kpi === 'margen_ebitda_pct' 
      ? yoyItem.delta_pct > 0 
      : yoyItem.delta_pct > 0;

    const formattedDelta = kpi === 'margen_ebitda_pct'
      ? `${yoyItem.delta_pct > 0 ? '+' : ''}${(yoyItem.delta_pct * 100).toFixed(1)}%`
      : `${yoyItem.delta_pct > 0 ? '+' : ''}${(yoyItem.delta_pct * 100).toFixed(1)}%`;

    return {
      value: formattedDelta,
      isPositive,
      label: `${isPositive ? '↗' : '↘'} ${formattedDelta} vs año anterior`
    };
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Empresa no seleccionada</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta empresa
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!kpiData && availableYears.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No hay datos disponibles para esta empresa
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No hay datos para el año {selectedYear}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
        <YearSelector 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Facturación Total"
          value={formatNumber(kpiData.facturacion)}
          unit={getUnit(kpiData.facturacion)}
          description="Ingresos totales del período"
          trend={getTrendData('facturacion')}
        />
        
        <MetricCard
          title="Margen EBITDA"
          value={formatNumber(kpiData.margen_ebitda_pct, true)}
          unit="%"
          description="Margen de beneficio operativo"
          trend={getTrendData('margen_ebitda_pct')}
        />
        
        <MetricCard
          title="Beneficio Neto"
          value={formatNumber(kpiData.beneficio_neto)}
          unit={getUnit(kpiData.beneficio_neto)}
          description="Rentabilidad final del período"
          trend={getTrendData('beneficio_neto')}
        />
      </div>
    </div>
  );
});

export { CompanyDashboard };