import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface CapexAmortizationStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function CapexAmortizationStep({ assumptions, onUpdate }: CapexAmortizationStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div>
            <Label>CAPEX (% sobre ingresos)</Label>
            <div className="mt-2">
              <Slider
                value={[assumptions.capex_as_percentage]}
                onValueChange={(value) => onUpdate({ capex_as_percentage: value[0] })}
                max={20}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium">{assumptions.capex_as_percentage.toFixed(1)}%</span>
                <span>20%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Inversión en activos fijos como porcentaje de las ventas
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label>Tasa de Depreciación (%)</Label>
            <div className="mt-2">
              <Slider
                value={[assumptions.depreciation_rate]}
                onValueChange={(value) => onUpdate({ depreciation_rate: value[0] })}
                max={25}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium">{assumptions.depreciation_rate.toFixed(1)}%</span>
                <span>25%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Depreciación anual sobre el valor de los activos fijos
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-medium mb-4">Análisis de Inversión</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-primary">
              {(100 / assumptions.depreciation_rate || 0).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Vida Útil (años)</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-secondary">
              {assumptions.capex_as_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Intensidad CAPEX</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-lg font-bold text-accent">
              {(assumptions.capex_as_percentage / assumptions.depreciation_rate || 0).toFixed(1)}x
            </div>
            <div className="text-sm text-muted-foreground">Ratio CAPEX/Depreciación</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones para CAPEX y Amortización</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Un ratio CAPEX/Depreciación &gt; 1 indica crecimiento de activos</li>
          <li>• La intensidad CAPEX varía según el sector (industrial vs servicios)</li>
          <li>• La vida útil debe reflejar la realidad tecnológica del sector</li>
          <li>• CAPEX de mantenimiento vs CAPEX de crecimiento</li>
        </ul>
      </Card>
    </div>
  );
}