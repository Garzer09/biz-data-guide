import { useParams } from "react-router-dom";

export function CompanyPage() {
  const { companyId, page } = useParams();

  const getPageTitle = () => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard Principal';
      case 'pyg':
        return 'Cuenta P&G';
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

      <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Página en desarrollo</h3>
          <p className="text-muted-foreground">
            Esta funcionalidad estará disponible próximamente
          </p>
        </div>
      </div>
    </div>
  );
}