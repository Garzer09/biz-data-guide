import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface BarChartCardProps {
  title: string;
  description?: string;
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  colors?: string[];
  height?: number;
  formatValue?: (value: number) => string;
}

export function BarChartCard({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"],
  height = 400,
  formatValue = (value) => value.toLocaleString()
}: BarChartCardProps) {
  const chartConfig = dataKeys.reduce((config, key, index) => {
    config[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      color: colors[index % colors.length]
    };
    return config;
  }, {} as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis tickFormatter={formatValue} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}