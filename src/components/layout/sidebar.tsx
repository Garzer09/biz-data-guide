import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Building2, 
  FileText, 
  PieChart, 
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Calculator,
  AlertTriangle,
  DollarSign,
  Activity
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  {
    id: "admin-panel",
    label: "Panel de administrador",
    icon: Settings
  },
  {
    id: "dashboard",
    label: "Dashboard Principal",
    icon: BarChart3,
    active: true
  },
  {
    id: "company-description",
    label: "Descripción de la Empresa", 
    icon: Building2
  },
  {
    id: "current-analysis",
    label: "Análisis Situación Actual",
    icon: TrendingUp,
    submenu: [
      { id: "account-pg", label: "Cuenta P&G", icon: Calculator },
      { id: "balance", label: "Balance Situación", icon: PieChart },
      { id: "financial-ratios", label: "Ratios Financieros", icon: Activity },
      { id: "cash-flow", label: "Estado Flujos Caja", icon: DollarSign },
      { id: "nof-analysis", label: "Análisis NOF", icon: FileText },
      { id: "dead-point", label: "Punto Muerto", icon: AlertTriangle },
      { id: "debt", label: "Endeudamiento", icon: TrendingUp },
      { id: "current-analytics", label: "P&G Analítico Actual", icon: BarChart3 },
      { id: "segment-sales", label: "Ventas por Segmentos", icon: PieChart }
    ]
  }
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["current-analysis"]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

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
        {menuItems.map((item) => (
          <div key={item.id}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent",
                currentPage === item.id && "bg-primary text-primary-foreground hover:bg-primary/90",
                item.submenu && "rounded-b-none"
              )}
              onClick={() => {
                if (item.submenu) {
                  toggleExpanded(item.id);
                } else {
                  onPageChange(item.id);
                }
              }}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
              {item.submenu && (
                <ChevronLeft className={cn(
                  "h-4 w-4 ml-auto transition-transform",
                  expandedItems.includes(item.id) && "rotate-90"
                )} />
              )}
            </Button>

            {/* Submenu */}
            {item.submenu && expandedItems.includes(item.id) && (
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                {item.submenu.map((subItem) => (
                  <Button
                    key={subItem.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 h-auto p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent text-xs",
                      currentPage === subItem.id && "bg-primary/10 text-primary"
                    )}
                    onClick={() => onPageChange(subItem.id)}
                  >
                    <subItem.icon className="h-3 w-3" />
                    {subItem.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Users className="h-4 w-4" />
          <span className="text-sm">Gestión Usuarios</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}