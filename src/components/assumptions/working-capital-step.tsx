import React from 'react';
import { FinancialAssumptions } from '@/hooks/use-assumptions';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface WorkingCapitalStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function WorkingCapitalStep({ assumptions, onUpdate }: WorkingCapitalStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="days-receivable" className="text-base font-medium">
              Días de Cobro
            </Label>
            <Input
              id="days-receivable"
              type="number"
              value={assumptions.days_receivable}
              onChange={(e) => onUpdate({ days_receivable: parseInt(e.target.value) || 0 })}
              placeholder="30"
              min="0"
              max="365"
              className="text-center text-lg"
            />
            <p className="text-sm text-muted-foreground text-center">
              Tiempo promedio de cobro a clientes
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="days-payable" className="text-base font-medium">
              Días de Pago
            </Label>
            <Input
              id="days-payable"
              type="number"
              value={assumptions.days_payable}
              onChange={(e) => onUpdate({ days_payable: parseInt(e.target.value) || 0 })}
              placeholder="30"
              min="0"
              max="365"
              className="text-center text-lg"
            />
            <p className="text-sm text-muted-foreground text-center">
              Tiempo promedio de pago a proveedores
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="days-inventory" className="text-base font-medium">
              Días de Inventario
            </Label>
            <Input
              id="days-inventory"
              type="number"
              value={assumptions.days_inventory}
              onChange={(e) => onUpdate({ days_inventory: parseInt(e.target.value) || 0 })}
              placeholder="30"
              min="0"
              max="365"
              className="text-center text-lg"
            />
            <p className="text-sm text-muted-foreground text-center">
              Tiempo promedio de rotación del stock
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-accent/50">
        <div className="text-center space-y-2">
          <h4 className="text-lg font-semibold text-foreground">Ciclo de Conversión de Efectivo</h4>
          <div className="text-3xl font-bold text-primary">
            {assumptions.days_receivable + assumptions.days_inventory - assumptions.days_payable} días
          </div>
          <p className="text-sm text-muted-foreground">
            Tiempo entre la inversión inicial y el cobro final
          </p>
        </div>
      </Card>
    </div>
  );
}