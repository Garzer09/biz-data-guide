import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  description: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  description,
  trend,
  className
}: MetricCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg p-6 shadow-card border border-border",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend.isPositive 
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-success font-medium">{trend.label}</p>
        )}
      </div>
    </div>
  );
}