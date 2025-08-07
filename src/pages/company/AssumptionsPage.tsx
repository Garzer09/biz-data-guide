import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAssumptions } from '@/hooks/use-assumptions';
import { RevenueAssumptionsStep } from '@/components/assumptions/revenue-assumptions-step';
import { OperatingCostsStep } from '@/components/assumptions/operating-costs-step';
import { WorkingCapitalStep } from '@/components/assumptions/working-capital-step';
import { DebtWaccStep } from '@/components/assumptions/debt-wacc-step';
import { CapexAmortizationStep } from '@/components/assumptions/capex-amortization-step';
import { TaxOtherStep } from '@/components/assumptions/tax-other-step';

const STEPS = [
  { id: 1, title: 'Premisas de Ingresos', component: RevenueAssumptionsStep },
  { id: 2, title: 'Costes Operativos', component: OperatingCostsStep },
  { id: 3, title: 'Capital de Trabajo', component: WorkingCapitalStep },
  { id: 4, title: 'Endeudamiento y WACC', component: DebtWaccStep },
  { id: 5, title: 'CAPEX & Amortización', component: CapexAmortizationStep },
  { id: 6, title: 'Tasa Impositiva y Otros', component: TaxOtherStep },
];

export function AssumptionsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const { assumptions, updateAssumptions, saveAssumptions, isLoading, error } = useAssumptions(companyId!);

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progressPercentage = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    await saveAssumptions();
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando supuestos financieros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Supuestos Financieros Clave</h1>
        <p className="text-muted-foreground">Configure los parámetros fundamentales para las proyecciones financieras</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="text-center text-sm text-muted-foreground">
          Paso {currentStep} de {STEPS.length}
        </div>
      </div>

      {/* Step Breadcrumb */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
              step.id === currentStep
                ? 'bg-primary text-primary-foreground'
                : step.id < currentStep
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step.id === currentStep
                ? 'bg-primary-foreground text-primary'
                : 'bg-current text-background'
            }`}>
              {step.id}
            </span>
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Current Step Content */}
      <Card className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">{STEPS[currentStep - 1].title}</h2>
            <p className="text-muted-foreground mt-2">
              Configure los parámetros para las proyecciones financieras
            </p>
          </div>

          <CurrentStepComponent
            assumptions={assumptions}
            onUpdate={updateAssumptions}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isLoading}
          >
            Guardar
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}