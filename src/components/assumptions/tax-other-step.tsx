import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface TaxOtherStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function TaxOtherStep({ assumptions, onUpdate }: TaxOtherStepProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">Tasa Impositiva (%)</Label>
          <div className="space-y-3">
            <Slider
              value={[assumptions.tax_rate]}
              onValueChange={(value) => onUpdate({ tax_rate: value[0] })}
              max={50}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span className="text-foreground font-medium">{assumptions.tax_rate.toFixed(1)}%</span>
              <span>50%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Tipo impositivo efectivo sobre beneficios
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <Label htmlFor="other-assumptions" className="text-base font-medium">
            Otros Supuestos y Consideraciones
          </Label>
          <Textarea
            id="other-assumptions"
            value={assumptions.other_assumptions}
            onChange={(e) => onUpdate({ other_assumptions: e.target.value })}
            placeholder="Incluya aquí cualquier otro supuesto relevante: estacionalidad, regulaciones, factores macroeconómicos, etc."
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            Describe cualquier consideración adicional que pueda afectar las proyecciones financieras
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-accent/50">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground text-center">Resumen de Supuestos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Crecimiento</p>
              <p className="text-lg font-bold text-primary">{assumptions.sales_growth.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margen Bruto</p>
              <p className="text-lg font-bold text-primary">{(100 - assumptions.cogs).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ciclo Efectivo</p>
              <p className="text-lg font-bold text-primary">
                {assumptions.days_receivable + assumptions.days_inventory - assumptions.days_payable}d
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impuestos</p>
              <p className="text-lg font-bold text-primary">{assumptions.tax_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}