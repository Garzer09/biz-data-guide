import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PieChartCardProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; }>;
  height?: number;
  colors?: string[];
  formatValue?: (value: number) => string;
  showLegend?: boolean;
}

export function PieChartCard({
  title,
  description,
  data,
  height = 400,
  colors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--muted))",
    "hsl(220, 70%, 50%)",
    "hsl(280, 70%, 50%)",
    "hsl(340, 70%, 50%)",
    "hsl(40, 70%, 50%)"
  ],
  formatValue = (value) => value.toLocaleString(),
  showLegend = true
}: PieChartCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: colors[index % colors.length]
    };
    return config;
  }, {} as any);

  const formattedData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
    color: colors[index % colors.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">
                            {data.name}
                          </span>
                          <span className="font-bold">
                            {formatValue(data.value)} ({data.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}