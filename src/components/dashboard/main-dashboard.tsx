import { useParams } from "react-router-dom";
import { KPIDashboard } from "./kpi-dashboard";
import { MetricCard } from "@/components/ui/metric-card";
import { DashboardHeader } from "./dashboard-header";
import { AIDiagnosis } from "./ai-diagnosis";

export function MainDashboard() {
  const { companyId } = useParams();

  // If we're in a company context, show the KPI dashboard
  if (companyId) {
    return <KPIDashboard />;
  }

  // Otherwise show the original static dashboard
  return <StaticDashboard />;
}

function StaticDashboard() {
  const currentYearMetrics = [
    {
      title: "Facturación Total",
      value: "2.8",
      unit: "M€",
      description: "Ingresos totales del período",
      trend: { value: "+15.9%", isPositive: true, label: "↗ 15.9% vs anterior" }
    },
    {
      title: "Margen EBITDA", 
      value: "26.1",
      unit: "%",
      description: "Margen de beneficio operativo",
      trend: { value: "+2.4%", isPositive: true, label: "↗ 2.4% vs anterior" }
    },
    {
      title: "Beneficio Neto",
      value: "520",
      unit: "K€", 
      description: "Rentabilidad final del período",
      trend: { value: "+23.8%", isPositive: true, label: "↗ 23.8% vs anterior" }
    }
  ];

  const secondRowMetrics = [
    {
      title: "Ratio Liquidez General",
      value: "1.92",
      unit: "x",
      description: "Capacidad de pago a corto plazo"
    },
    {
      title: "Ratio Endeudamiento",
      value: "52.5", 
      unit: "%",
      description: "Deuda Neta / EBITDA"
    },
    {
      title: "Fondo de Maniobra",
      value: "600",
      unit: "K€",
      description: "Working Capital disponible",
      trend: { value: "+1.8%", isPositive: true, label: "↗ 1.8% vs anterior" }
    }
  ];

  const projectedMetrics = [
    {
      title: "Facturación Total (Proy.)",
      value: "2.9",
      unit: "M€", 
      description: "Ingresos totales del período",
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    },
    {
      title: "Margen EBITDA (Proy.)",
      value: "27.4",
      unit: "%",
      description: "Margen de beneficio operativo", 
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    },
    {
      title: "Beneficio Neto (Proy.)",
      value: "546.0",
      unit: "K€",
      description: "Rentabilidad final del período",
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    }
  ];

  const projectedSecondRow = [
    {
      title: "Ratio Liquidez General (Proy.)",
      value: "2.0",
      unit: "x",
      description: "Capacidad de pago a corto plazo",
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    },
    {
      title: "Ratio Endeudamiento (Proy.)",
      value: "55.1",
      unit: "%", 
      description: "Deuda Neta / EBITDA",
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    },
    {
      title: "Fondo de Maniobra (Proy.)",
      value: "630.0", 
      unit: "K€",
      description: "Working Capital disponible",
      trend: { value: "+5.0%", isPositive: true, label: "↗ Proyección basada en supuestos" }
    }
  ];

  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="¡Bienvenido/a, Usuario!"
        subtitle="Resumen Ejecutivo - Dashboard FinSight Pro"
      />

      {/* Current Year Indicators */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Indicadores Clave de Rendimiento - Año Actual
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {currentYearMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondRowMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </section>

      {/* AI Diagnosis */}
      <AIDiagnosis metrics={[...currentYearMetrics, ...secondRowMetrics]} />
    </div>
  );
}