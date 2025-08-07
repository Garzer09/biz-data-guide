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
  Upload
} from "lucide-react";

interface SidebarProps {
  onPageChange: (page: string) => void;
}

const pageIconMap: Record<string, any> = {
  dashboard: BarChart3,
  empresa: Building2,
  pyg: Calculator,
  balance: PieChart,
  cashflow: DollarSign,
  ratios: Activity,
  sensibilidad: AlertTriangle,
  proyecciones: LineChart,
  eva: Target,
  conclusiones: FileText
};

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard Principal",
  empresa: "Perfil de Empresa",
  pyg: "Cuenta P&G",
  balance: "Balance",
  cashflow: "Flujos de Caja", 
  ratios: "Ratios Financieros",
  sensibilidad: "Análisis Sensibilidad",
  proyecciones: "Proyecciones",
  eva: "Análisis EVA",
  conclusiones: "Conclusiones"
};

export function DynamicSidebar({ onPageChange }: SidebarProps) {
  const [enabledPages, setEnabledPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useParams();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current page from URL
  const currentPage = location.pathname.split('/').pop() || 'dashboard';

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

  const handleNavigation = (page: string) => {
    if (companyId) {
      navigate(`/c/${companyId}/${page}`);
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

        {/* Company Pages - Based on enabled_pages */}
        {companyId && enabledPages.map((page) => {
          const Icon = pageIconMap[page] || FileText;
          const label = pageLabels[page] || page;
          
          return (
            <Button
              key={page}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent",
                currentPage === page && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => handleNavigation(page)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </Button>
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