import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FinancialAssumptions {
  // Revenue Assumptions
  sales_growth: number;
  average_price: number;
  product_mix: string;
  
  // Operating Costs
  cogs: number;
  opex_growth: number;
  staff_costs: number;
  
  // Working Capital
  days_receivable: number;
  days_payable: number;
  days_inventory: number;
  
  // Debt & WACC
  debt_equity_ratio: number;
  cost_of_debt: number;
  cost_of_equity: number;
  
  // CAPEX & Amortization
  capex_as_percentage: number;
  depreciation_rate: number;
  
  // Tax & Others
  tax_rate: number;
  other_assumptions: string;
}

const DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  sales_growth: 0,
  average_price: 0,
  product_mix: '',
  cogs: 0,
  opex_growth: 0,
  staff_costs: 0,
  days_receivable: 30,
  days_payable: 30,
  days_inventory: 30,
  debt_equity_ratio: 0,
  cost_of_debt: 0,
  cost_of_equity: 0,
  capex_as_percentage: 0,
  depreciation_rate: 0,
  tax_rate: 25,
  other_assumptions: '',
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
        .select('sales_growth, average_price, product_mix, cogs, opex_growth, staff_costs, days_receivable, days_payable, days_inventory, debt_equity_ratio, cost_of_debt, cost_of_equity, capex_as_percentage, depreciation_rate, tax_rate, other_assumptions')
        .eq('company_id', companyId)
        .maybeSingle();

      if (fetchError) {
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