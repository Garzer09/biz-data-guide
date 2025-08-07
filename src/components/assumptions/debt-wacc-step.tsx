import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface DebtWaccStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function DebtWaccStep({ assumptions, onUpdate }: DebtWaccStepProps) {
  const wacc = (
    (assumptions.debt_equity_ratio / (1 + assumptions.debt_equity_ratio)) * assumptions.cost_of_debt * (1 - 0.25) +
    (1 / (1 + assumptions.debt_equity_ratio)) * assumptions.cost_of_equity
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label>Ratio Deuda/Patrimonio</Label>
              <div className="mt-2">
                <Slider
                  value={[assumptions.debt_equity_ratio]}
                  onValueChange={(value) => onUpdate({ debt_equity_ratio: value[0] })}
                  max={3}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0</span>
                  <span className="font-medium">{assumptions.debt_equity_ratio.toFixed(1)}</span>
                  <span>3.0</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Coste de la Deuda (%)</Label>
              <div className="mt-2">
                <Slider
                  value={[assumptions.cost_of_debt]}
                  onValueChange={(value) => onUpdate({ cost_of_debt: value[0] })}
                  max={15}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{assumptions.cost_of_debt.toFixed(1)}%</span>
                  <span>15%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label>Coste del Capital (%)</Label>
            <div className="mt-2">
              <Slider
                value={[assumptions.cost_of_equity]}
                onValueChange={(value) => onUpdate({ cost_of_equity: value[0] })}
                max={25}
                min={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>5%</span>
                <span className="font-medium">{assumptions.cost_of_equity.toFixed(1)}%</span>
                <span>25%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-medium mb-4">Coste Medio Ponderado del Capital (WACC)</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-primary">
              {((assumptions.debt_equity_ratio / (1 + assumptions.debt_equity_ratio)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Peso Deuda</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-secondary">
              {((1 / (1 + assumptions.debt_equity_ratio)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Peso Capital</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-accent">
              {(assumptions.cost_of_debt * 0.75).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Coste Deuda (after tax)</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {wacc.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">WACC</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones para Endeudamiento y WACC</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• El ratio deuda/patrimonio debe ser sostenible según el sector</li>
          <li>• El coste de la deuda incluye spread de riesgo sobre tipo libre de riesgo</li>
          <li>• El coste del capital refleja la rentabilidad exigida por los accionistas</li>
          <li>• El WACC se usa para descontar flujos de caja futuros</li>
        </ul>
      </Card>
    </div>
  );
}