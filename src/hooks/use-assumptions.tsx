import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FinancialAssumptions {
  // Revenue Assumptions
  salesGrowth: number;
  averagePrice: number;
  productMix: string;
  
  // Operating Costs
  cogs: number;
  opexGrowth: number;
  staffCosts: number;
  
  // Working Capital
  daysReceivable: number;
  daysPayable: number;
  daysInventory: number;
  
  // Debt & WACC
  debtEquityRatio: number;
  costOfDebt: number;
  costOfEquity: number;
  
  // CAPEX & Amortization
  capexAsPercentage: number;
  depreciationRate: number;
  
  // Tax & Others
  taxRate: number;
  otherAssumptions: string;
}

const DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  salesGrowth: 0,
  averagePrice: 0,
  productMix: '',
  cogs: 0,
  opexGrowth: 0,
  staffCosts: 0,
  daysReceivable: 30,
  daysPayable: 30,
  daysInventory: 30,
  debtEquityRatio: 0,
  costOfDebt: 0,
  costOfEquity: 0,
  capexAsPercentage: 0,
  depreciationRate: 0,
  taxRate: 25,
  otherAssumptions: '',
};

export function useAssumptions(companyId: string) {
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_ASSUMPTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      loadAssumptions();
    }
  }, [companyId]);

  const loadAssumptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('financial_assumptions')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setAssumptions(data);
      }
    } catch (err: any) {
      console.error('Error loading assumptions:', err);
      setError(err.message || 'Error cargando supuestos');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssumptions = (updates: Partial<FinancialAssumptions>) => {
    setAssumptions(prev => ({ ...prev, ...updates }));
  };

  const saveAssumptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: saveError } = await supabase
        .from('financial_assumptions')
        .upsert({
          company_id: companyId,
          ...assumptions,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        throw saveError;
      }

      toast({
        title: 'Supuestos guardados',
        description: 'Los supuestos financieros se han guardado correctamente.',
      });
    } catch (err: any) {
      console.error('Error saving assumptions:', err);
      setError(err.message || 'Error guardando supuestos');
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los supuestos financieros.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assumptions,
    updateAssumptions,
    saveAssumptions,
    isLoading,
    error,
    reload: loadAssumptions,
  };
}