import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface BreakEvenChartProps {
  data: {
    costesFijos: number;
    precioUnitario: number;
    costesVariablesPct: number;
    ventasActuales: number;
  };
}

export function BreakEvenChart({ data }: BreakEvenChartProps) {
  const maxUnidades = data.ventasActuales * 2;
  const step = maxUnidades / 20;

  // Generate chart data
  const chartData = [];
  for (let unidades = 0; unidades <= maxUnidades; unidades += step) {
    const costesVariablesUnitario = data.precioUnitario * data.costesVariablesPct / 100;
    const ingresos = unidades * data.precioUnitario;
    const costesTotales = data.costesFijos + (unidades * costesVariablesUnitario);
    
    chartData.push({
      unidades: Math.round(unidades),
      ingresos: ingresos,
      costesTotales: costesTotales,
      costesFijos: data.costesFijos
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value > 1000000 ? 'compact' : 'standard'
    }).format(value);
  };

  const formatUnits = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      notation: value > 1000 ? 'compact' : 'standard'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`Unidades: ${formatUnits(label)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Gráfico de Punto de Equilibrio</CardTitle>
            <CardDescription>
              Análisis visual de costes, ingresos y punto de equilibrio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="unidades" 
                tickFormatter={formatUnits}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Line 
                type="monotone" 
                dataKey="costesFijos" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Costes Fijos"
                strokeDasharray="5 5"
              />
              
              <Line 
                type="monotone" 
                dataKey="costesTotales" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                name="Costes Totales"
              />
              
              <Line 
                type="monotone" 
                dataKey="ingresos" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Ingresos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-destructive opacity-60"></div>
            <span>Costes Fijos: Constantes independientemente del volumen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-warning"></div>
            <span>Costes Totales: Fijos + Variables por unidad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-success"></div>
            <span>Ingresos: Precio por unidad × Volumen</span>
          </div>
          <p className="text-xs mt-2">
            El punto de equilibrio se encuentra donde se cruzan las líneas de Ingresos y Costes Totales
          </p>
        </div>
      </CardContent>
    </Card>
  );
}