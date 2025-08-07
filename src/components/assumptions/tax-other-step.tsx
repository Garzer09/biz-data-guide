import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface TaxOtherStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function TaxOtherStep({ assumptions, onUpdate }: TaxOtherStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div>
            <Label>Tasa Impositiva (%)</Label>
            <div className="mt-2">
              <Slider
                value={[assumptions.tax_rate]}
                onValueChange={(value) => onUpdate({ tax_rate: value[0] })}
                max={35}
                min={15}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>15%</span>
                <span className="font-medium">{assumptions.tax_rate.toFixed(1)}%</span>
                <span>35%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Tipo efectivo del Impuesto sobre Sociedades
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Tipos de Referencia</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>España (general):</span>
                <span className="font-medium">25%</span>
              </div>
              <div className="flex justify-between">
                <span>España (PYME):</span>
                <span className="font-medium">23%</span>
              </div>
              <div className="flex justify-between">
                <span>Startups (2 años):</span>
                <span className="font-medium">15%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div>
          <Label htmlFor="other-assumptions">Otros Supuestos</Label>
          <Textarea
            id="other-assumptions"
            value={assumptions.other_assumptions}
            onChange={(e) => onUpdate({ other_assumptions: e.target.value })}
            placeholder="Incluya otros supuestos relevantes para las proyecciones: inflación, tipos de cambio, regulaciones específicas, etc."
            className="mt-2 min-h-[120px]"
          />
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones Adicionales</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• El tipo efectivo puede diferir del nominal por deducciones</li>
          <li>• Considerar beneficios fiscales aplicables (I+D, inversiones, etc.)</li>
          <li>• Incluir supuestos macroeconómicos relevantes</li>
          <li>• Documentar cualquier estacionalidad o ciclos específicos</li>
        </ul>
      </Card>
    </div>
  );
}