import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  FileText, 
  Target,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

interface ActionItem {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
  timeline: string;
  icon: any;
  category: "cobros" | "inventario" | "pagos" | "general";
}

interface AccionesRecomendadasProps {
  nofTotal: number;
  diasCiclo: number;
  onActionSelect: (action: ActionItem) => void;
}

export function AccionesRecomendadas({ nofTotal, diasCiclo, onActionSelect }: AccionesRecomendadasProps) {
  const getRecommendations = (): ActionItem[] => {
    const recommendations: ActionItem[] = [];

    // High NOF recommendations
    if (nofTotal > 0) {
      recommendations.push({
        title: "Acelerar Proceso de Cobros",
        description: "Implementar automatización en facturación y seguimiento de pagos",
        impact: "high",
        effort: "medium",
        timeline: "2-3 meses",
        icon: Clock,
        category: "cobros"
      });

      recommendations.push({
        title: "Optimizar Gestión de Inventarios",
        description: "Implementar sistema de reposición automática basado en demanda",
        impact: "high",
        effort: "hard",
        timeline: "3-6 meses",
        icon: Target,
        category: "inventario"
      });
    }

    // Long cycle recommendations
    if (diasCiclo > 60) {
      recommendations.push({
        title: "Negociar Términos de Pago",
        description: "Renegociar plazos con proveedores principales",
        impact: "medium",
        effort: "easy",
        timeline: "1-2 meses",
        icon: Users,
        category: "pagos"
      });

      recommendations.push({
        title: "Implementar Descuentos por Pronto Pago",
        description: "Ofrecer incentivos para acelerar cobros",
        impact: "medium",
        effort: "easy",
        timeline: "1 mes",
        icon: TrendingUp,
        category: "cobros"
      });
    }

    // General recommendations
    recommendations.push(
      {
        title: "Dashboard de Seguimiento NOF",
        description: "Crear KPIs automáticos para monitoreo diario",
        impact: "medium",
        effort: "medium",
        timeline: "1-2 meses",
        icon: FileText,
        category: "general"
      },
      {
        title: "Capacitación del Equipo",
        description: "Formar al equipo en gestión de capital de trabajo",
        impact: "medium",
        effort: "easy",
        timeline: "2-4 semanas",
        icon: Users,
        category: "general"
      }
    );

    return recommendations;
  };

  const recommendations = getRecommendations();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-destructive text-white";
      case "medium": return "bg-warning text-white";
      case "low": return "bg-success text-white";
      default: return "bg-muted";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy": return "bg-success/10 text-success";
      case "medium": return "bg-warning/10 text-warning";
      case "hard": return "bg-destructive/10 text-destructive";
      default: return "bg-muted";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cobros": return Clock;
      case "inventario": return Target;
      case "pagos": return Users;
      case "general": return FileText;
      default: return CheckCircle;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Acciones Recomendadas
        </CardTitle>
        <CardDescription>
          Plan de mejora personalizado basado en tu análisis NOF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((action, index) => {
            const IconComponent = action.icon;
            const CategoryIcon = getCategoryIcon(action.category);
            
            return (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onActionSelect(action)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{action.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getImpactColor(action.impact)}>
                          {action.impact === "high" ? "Alto" : 
                           action.impact === "medium" ? "Medio" : "Bajo"} impacto
                        </Badge>
                        <Badge variant="outline" className={getEffortColor(action.effort)}>
                          {action.effort === "easy" ? "Fácil" : 
                           action.effort === "medium" ? "Medio" : "Difícil"}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CategoryIcon className="h-3 w-3" />
                        <span className="capitalize">{action.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{action.timeline}</span>
                      </div>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
          
          {/* Priority callout */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-primary">Prioridad Recomendada</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {nofTotal > 0 && diasCiclo > 60 
                ? "Enfócate primero en acelerar cobros y optimizar inventarios para liberar caja rápidamente."
                : nofTotal > 0 
                ? "Tu NOF es positiva. Prioriza la gestión de cobros e inventarios."
                : "Tu NOF es negativa (favorable). Mantén este equilibrio mientras optimizas procesos."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}