import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface CapexAmortizationStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function CapexAmortizationStep({ assumptions, onUpdate }: CapexAmortizationStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">CAPEX (% sobre ventas)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.capex_as_percentage]}
                onValueChange={(value) => onUpdate({ capex_as_percentage: value[0] })}
                max={20}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">{assumptions.capex_as_percentage.toFixed(1)}%</span>
                <span>20%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Inversión anual en activos fijos como % de ventas
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Tasa de Depreciación (%)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.depreciation_rate]}
                onValueChange={(value) => onUpdate({ depreciation_rate: value[0] })}
                max={25}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">{assumptions.depreciation_rate.toFixed(1)}%</span>
                <span>25%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Depreciación anual sobre el valor de activos fijos
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-accent/50">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground text-center">Impacto en Flujo de Caja</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">CAPEX Anual</p>
              <p className="text-xl font-bold text-destructive">-{assumptions.capex_as_percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Depreciación</p>
              <p className="text-xl font-bold text-success">+{assumptions.depreciation_rate.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Sobre la base de ventas anuales
          </p>
        </div>
      </Card>
    </div>
  );
}