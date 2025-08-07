import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface OperatingCostsStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function OperatingCostsStep({ assumptions, onUpdate }: OperatingCostsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Coste de Ventas (% sobre ventas)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.cogs]}
                onValueChange={(value) => onUpdate({ cogs: value[0] })}
                max={100}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">{assumptions.cogs.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Costes directos relacionados con la producción
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Crecimiento OPEX (%)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.opex_growth]}
                onValueChange={(value) => onUpdate({ opex_growth: value[0] })}
                max={50}
                min={-20}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>-20%</span>
                <span className="text-foreground font-medium">{assumptions.opex_growth.toFixed(1)}%</span>
                <span>50%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Crecimiento anual de gastos operativos
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Label htmlFor="staff-costs" className="text-base font-medium">
            Costes de Personal (% sobre ventas)
          </Label>
          <div className="space-y-3">
            <Slider
              value={[assumptions.staff_costs]}
              onValueChange={(value) => onUpdate({ staff_costs: value[0] })}
              max={80}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span className="text-foreground font-medium">{assumptions.staff_costs.toFixed(1)}%</span>
              <span>80%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Porcentaje de ventas destinado a salarios y cargas sociales
          </p>
        </div>
      </Card>
    </div>
  );
}