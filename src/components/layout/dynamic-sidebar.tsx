import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Building2, 
  FileText, 
  PieChart, 
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  Calculator,
  AlertTriangle,
  DollarSign,
  Activity,
  Target,
  LineChart,
  Users,
  Upload,
  Scale,
  Crosshair,
  CreditCard,
  Landmark,
  CheckCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  onPageChange: (page: string) => void;
}

const pageIconMap: Record<string, any> = {
  dashboard: BarChart3,
  company_profile: Building2,
  pyg: FileText,
  balance: Scale,
  ratios: Calculator,
  cashflow: TrendingUp,
  nof: Target,
  breakeven: Crosshair,
  debts: CreditCard,
  debt_service: Landmark,
  pyg_analytic: TrendingUp,
  sales_segments: PieChart,
  assumptions: Settings,
  projections: LineChart,
  sensitivity: AlertTriangle,
  eva: DollarSign,
  conclusions: CheckCircle,
};

const sidebarStructure = [
  {
    title: "1. Resumen Ejecutivo",
    items: [
      { key: "dashboard", label: "Dashboard Principal" }
    ]
  },
  {
    title: "2. Descripción Empresa", 
    items: [
      { key: "company_profile", label: "Descripción de la Empresa" }
    ]
  },
  {
    title: "3. Análisis Situación Actual",
    items: [
      { key: "pyg", label: "Cuenta P&G" },
      { key: "balance", label: "Balance Situación" },
      { key: "ratios", label: "Ratios Financieros" },
      { key: "cashflow", label: "Estado Flujos Caja" },
      { key: "nof", label: "Análisis NOF" },
      { key: "breakeven", label: "Punto Muerto" },
      { key: "debts", label: "Endeudamiento" },
      { key: "debt_service", label: "Servicio Deuda" },
      { key: "pyg_analytic", label: "P&G Analítico Actual" },
      { key: "sales_segments", label: "Ventas por Segmentos" }
    ]
  },
  {
    title: "4. Supuestos y Plan Inversiones",
    items: [
      { key: "assumptions", label: "Supuestos y Plan Inversiones" }
    ]
  },
  {
    title: "5. Proyecciones (Año 1-3)",
    items: [
      { key: "projections", label: "Proyecciones" }
    ]
  },
  {
    title: "6. Análisis de Sensibilidad",
    items: [
      { key: "sensitivity", label: "Análisis de Sensibilidad" }
    ]
  },
  {
    title: "7. Valoración EVA",
    items: [
      { key: "eva", label: "Valoración EVA" }
    ]
  },
  {
    title: "8. Conclusiones",
    items: [
      { key: "conclusions", label: "Conclusiones y Recomendaciones" }
    ]
  }
];

export function DynamicSidebar({ onPageChange }: SidebarProps) {
  const [enabledPages, setEnabledPages] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { companyId } = useParams();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current page from URL and map it back to the sidebar key
  const currentRoute = location.pathname.split('/').pop() || 'dashboard';
  const currentPage = (() => {
    if (currentRoute === 'debt-service') return 'debt_service';
    if (currentRoute === 'sales-segments') return 'sales_segments';
    if (currentRoute === 'pyg_analytic') return 'pyg_analytic';
    return currentRoute;
  })();

  useEffect(() => {
    // Only fetch company pages if we're on a company route (not admin)
    if (companyId && !location.pathname.startsWith('/admin')) {
      fetchEnabledPages();
    } else {
      setEnabledPages(['dashboard']); // Default for non-company routes
      setLoading(false);
    }
  }, [companyId, location.pathname]);

  const fetchEnabledPages = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('company_pages')
        .select('enabled_pages')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      setEnabledPages(data?.enabled_pages || ['dashboard']);
    } catch (error) {
      console.error('Error fetching enabled pages:', error);
      setEnabledPages(['dashboard']); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const handleNavigation = (page: string) => {
    if (companyId) {
      // Map specific page IDs to routes
      let route = page;
      if (page === 'company_profile') {
        route = 'profile';
      } else if (page === 'debt_service') {
        route = 'debt-service';
      } else if (page === 'debts') {
        route = 'debt';
      } else if (page === 'breakeven') {
        route = 'breakeven';
      } else if (page === 'sales_segments') {
        route = 'sales-segments';
      } else if (page === 'assumptions') {
        route = 'assumptions';
      } else if (page === 'projections') {
        route = 'projections';
      } else if (page === 'sensitivity') {
        route = 'sensitivity';
      } else if (page === 'conclusions') {
        route = 'conclusions';
      }
      
      navigate(`/c/${companyId}/${route}`);
      onPageChange(page);
    }
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex items-center justify-center">
        <span className="text-sidebar-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">FinSight Pro</h2>
            <p className="text-xs text-sidebar-foreground/60">Análisis Financiero Integral</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Admin Panel - Only for admins */}
        {isAdmin && (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent",
              location.pathname.startsWith('/admin') && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleAdminPanel}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Panel de Administrador</span>
          </Button>
        )}

        {/* Company Pages - Hierarchical Structure */}
        {companyId && sidebarStructure.map((section) => {
          const hasEnabledItems = section.items.some(item => enabledPages.includes(item.key));
          if (!hasEnabledItems) return null;

          const isExpanded = expandedSections[section.title] !== false; // Default to expanded
          
          return (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <Button
                variant="ghost"
                className="w-full justify-between h-auto p-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent"
                onClick={() => toggleSection(section.title)}
              >
                <span>{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>

              {/* Section Items */}
              {isExpanded && section.items.map((item) => {
                if (!enabledPages.includes(item.key)) return null;
                
                const Icon = pageIconMap[item.key] || FileText;
                
                return (
                  <Button
                    key={item.key}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-auto p-3 pl-6 text-sidebar-foreground hover:bg-sidebar-accent",
                      currentPage === item.key && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleNavigation(item.key)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          );
        })}

        {/* Message when no company selected */}
        {!companyId && (
          <div className="p-4 text-center text-sidebar-foreground/60">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Selecciona una empresa para ver las opciones</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}