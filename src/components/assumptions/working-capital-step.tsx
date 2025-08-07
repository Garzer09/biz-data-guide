import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FinancialAssumptions } from '@/hooks/use-assumptions';

interface WorkingCapitalStepProps {
  assumptions: FinancialAssumptions;
  onUpdate: (updates: Partial<FinancialAssumptions>) => void;
}

export function WorkingCapitalStep({ assumptions, onUpdate }: WorkingCapitalStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div>
            <Label htmlFor="days-receivable">Días de Cobro</Label>
            <Input
              id="days-receivable"
              type="number"
              value={assumptions.days_receivable}
              onChange={(e) => onUpdate({ days_receivable: parseInt(e.target.value) || 0 })}
              placeholder="30"
              className="mt-2"
              min="0"
              max="365"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tiempo promedio para cobrar a clientes
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label htmlFor="days-payable">Días de Pago</Label>
            <Input
              id="days-payable"
              type="number"
              value={assumptions.days_payable}
              onChange={(e) => onUpdate({ days_payable: parseInt(e.target.value) || 0 })}
              placeholder="30"
              className="mt-2"
              min="0"
              max="365"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tiempo promedio para pagar a proveedores
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label htmlFor="days-inventory">Días de Inventario</Label>
            <Input
              id="days-inventory"
              type="number"
              value={assumptions.days_inventory}
              onChange={(e) => onUpdate({ days_inventory: parseInt(e.target.value) || 0 })}
              placeholder="30"
              className="mt-2"
              min="0"
              max="365"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Rotación de inventario en días
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-medium mb-4">Ciclo de Capital de Trabajo</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {assumptions.days_receivable + assumptions.days_inventory}
            </div>
            <div className="text-sm text-muted-foreground">Días Activos</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-secondary">
              {assumptions.days_payable}
            </div>
            <div className="text-sm text-muted-foreground">Días Pasivos</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-accent">
              {assumptions.days_receivable + assumptions.days_inventory - assumptions.days_payable}
            </div>
            <div className="text-sm text-muted-foreground">Ciclo Neto (días)</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3">Consideraciones para Capital de Trabajo</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Un ciclo más corto mejora la liquidez y reduce necesidades de financiación</li>
          <li>• Los días de cobro dependen del sector y política comercial</li>
          <li>• Optimizar el pago a proveedores sin dañar las relaciones</li>
        </ul>
      </Card>
    </div>
  );
}