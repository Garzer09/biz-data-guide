import { useParams } from "react-router-dom";
import { PyGPage } from "./PyGPage";
import { CompanyProfilePage } from "./CompanyProfilePage";
import { CompanyProfileFormPage } from "./CompanyProfileFormPage";

export function CompanyPage() {
  const { companyId, page } = useParams();

  const renderPageContent = () => {
    switch (page) {
      case 'pyg':
        return <PyGPage />;
      case 'empresa':
        return <CompanyProfilePage />;
      case 'profile':
        return <CompanyProfileFormPage />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Página en construcción: {page}</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard Principal';
      case 'pyg':
        return 'Cuenta P&G';
      case 'empresa':
        return 'Perfil de Empresa';
      case 'profile':
        return 'Perfil de Empresa';
      case 'balance':
        return 'Balance';
      case 'cashflow':
        return 'Flujos de Caja';
      case 'ratios':
        return 'Ratios Financieros';
      case 'sensibilidad':
        return 'Análisis de Sensibilidad';
      case 'proyecciones':
        return 'Proyecciones';
      case 'eva':
        return 'Análisis EVA';
      case 'conclusiones':
        return 'Conclusiones';
      default:
        return 'Página';
    }
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Empresa no seleccionada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        <p className="text-muted-foreground">
          Contenido de la página {page} para la empresa {companyId}
        </p>
      </div>

      {renderPageContent()}
    </div>
  );
}