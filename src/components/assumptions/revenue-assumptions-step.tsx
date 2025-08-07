import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface RevenueAssumptionsStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function RevenueAssumptionsStep({ assumptions, onUpdate }: RevenueAssumptionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sales-growth">Crecimiento de Ventas (%)</Label>
              <div className="mt-2">
                <Slider
                  value={[assumptions.sales_growth]}
                  onValueChange={(value) => onUpdate({ sales_growth: value[0] })}
                  max={50}
                  min={-20}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>-20%</span>
                  <span className="font-medium">{assumptions.sales_growth.toFixed(1)}%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="average-price">Precio Promedio (€)</Label>
              <Input
                id="average-price"
                type="number"
                value={assumptions.average_price}
                onChange={(e) => onUpdate({ average_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label htmlFor="product-mix">Mix de Productos</Label>
            <Textarea
              id="product-mix"
              value={assumptions.product_mix}
              onChange={(e) => onUpdate({ product_mix: e.target.value })}
              placeholder="Describa la distribución de productos y su evolución esperada..."
              className="mt-2 min-h-[120px]"
            />
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones para Premisas de Ingresos</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• El crecimiento de ventas debe reflejar tendencias del mercado y estrategia comercial</li>
          <li>• El precio promedio puede variar según inflación y posicionamiento competitivo</li>
          <li>• El mix de productos impacta directamente en los márgenes de contribución</li>
        </ul>
      </Card>
    </div>
  );
}