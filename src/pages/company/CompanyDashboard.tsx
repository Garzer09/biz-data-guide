import { useParams } from "react-router-dom";
import { MainDashboard } from "@/components/dashboard/main-dashboard";

export function CompanyDashboard() {
  const { companyId } = useParams();

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Empresa no seleccionada</p>
      </div>
    );
  }

  return <MainDashboard />;
}