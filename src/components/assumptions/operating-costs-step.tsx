import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface OperatingCostsStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function OperatingCostsStep({ assumptions, onUpdate }: OperatingCostsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label>Coste de Ventas (% sobre ingresos)</Label>
              <div className="mt-2">
                <Slider
                  value={[assumptions.cogs]}
                  onValueChange={(value) => onUpdate({ cogs: value[0] })}
                  max={80}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{assumptions.cogs.toFixed(1)}%</span>
                  <span>80%</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Crecimiento OPEX (%)</Label>
              <div className="mt-2">
                <Slider
                  value={[assumptions.opex_growth]}
                  onValueChange={(value) => onUpdate({ opex_growth: value[0] })}
                  max={30}
                  min={-10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>-10%</span>
                  <span className="font-medium">{assumptions.opex_growth.toFixed(1)}%</span>
                  <span>30%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label>Costes de Personal (% sobre ingresos)</Label>
            <div className="mt-2">
              <Slider
                value={[assumptions.staff_costs]}
                onValueChange={(value) => onUpdate({ staff_costs: value[0] })}
                max={50}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium">{assumptions.staff_costs.toFixed(1)}%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones para Costes Operativos</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Los costes de ventas incluyen materias primas y costes directos de producción</li>
          <li>• El crecimiento OPEX debe considerar inflación y expansión del negocio</li>
          <li>• Los costes de personal incluyen salarios, seguros sociales y beneficios</li>
        </ul>
      </Card>
    </div>
  );
}