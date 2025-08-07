import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface RevenueAssumptionsStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function RevenueAssumptionsStep({ assumptions, onUpdate }: RevenueAssumptionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Crecimiento de Ventas (%)</Label>
            <div className="space-y-3">
              <Slider
                value={[assumptions.sales_growth]}
                onValueChange={(value) => onUpdate({ sales_growth: value[0] })}
                max={100}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">{assumptions.sales_growth.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="average-price" className="text-base font-medium">
              Precio Medio por Unidad (€)
            </Label>
            <Input
              id="average-price"
              type="number"
              value={assumptions.average_price}
              onChange={(e) => onUpdate({ average_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="text-right"
            />
            <p className="text-sm text-muted-foreground">
              Precio promedio de venta por producto/servicio
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Label htmlFor="product-mix" className="text-base font-medium">
            Mix de Productos (Opcional)
          </Label>
          <Textarea
            id="product-mix"
            value={assumptions.product_mix}
            onChange={(e) => onUpdate({ product_mix: e.target.value })}
            placeholder="Describe la composición de productos y su peso en las ventas..."
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            Descripción detallada de los productos/servicios principales y su contribución a las ventas
          </p>
        </div>
      </Card>
    </div>
  );
}