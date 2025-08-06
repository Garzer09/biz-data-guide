import { DashboardHeader } from "./dashboard-header";
import { AIAnalysis } from "./ai-analysis";

export function MainDashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="¡Bienvenido/a, Usuario!"
        subtitle="Resumen Ejecutivo - Dashboard FinSight Pro"
      />

      <AIAnalysis />
    </div>
  );
}