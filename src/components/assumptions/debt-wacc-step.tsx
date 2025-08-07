import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface DebtWaccStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function DebtWaccStep({ assumptions, onUpdate }: DebtWaccStepProps) {
  const wacc = (assumptions.cost_of_equity * (1 - assumptions.debt_equity_ratio / (1 + assumptions.debt_equity_ratio))) + 
              (assumptions.cost_of_debt * (assumptions.debt_equity_ratio / (1 + assumptions.debt_equity_ratio)));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Ratio Deuda/Patrimonio</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.debt_equity_ratio]}
                onValueChange={(value) => onUpdate({ debt_equity_ratio: value[0] })}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0x</span>
                <span className="text-foreground font-medium">{assumptions.debt_equity_ratio.toFixed(1)}x</span>
                <span>5x</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Nivel de apalancamiento financiero objetivo
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Coste de la Deuda (%)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.cost_of_debt]}
                onValueChange={(value) => onUpdate({ cost_of_debt: value[0] })}
                max={15}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">{assumptions.cost_of_debt.toFixed(1)}%</span>
                <span>15%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tipo de interés promedio de la deuda
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">Coste del Capital (%)</Label>
          <div className="space-y-3">
            <Slider
              value={[assumptions.cost_of_equity]}
              onValueChange={(value) => onUpdate({ cost_of_equity: value[0] })}
              max={25}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span className="text-foreground font-medium">{assumptions.cost_of_equity.toFixed(1)}%</span>
              <span>25%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Rentabilidad exigida por los accionistas
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-accent/50">
        <div className="text-center space-y-2">
          <h4 className="text-lg font-semibold text-foreground">WACC Calculado</h4>
          <div className="text-3xl font-bold text-primary">
            {wacc.toFixed(2)}%
          </div>
          <p className="text-sm text-muted-foreground">
            Coste Medio Ponderado del Capital
          </p>
        </div>
      </Card>
    </div>
  );
}