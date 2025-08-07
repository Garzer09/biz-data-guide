-- Create financial_assumptions table
CREATE TABLE IF NOT EXISTS public.financial_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Revenue Assumptions
  sales_growth NUMERIC DEFAULT 0,
  average_price NUMERIC DEFAULT 0,
  product_mix TEXT,
  
  -- Operating Costs
  cogs NUMERIC DEFAULT 0,
  opex_growth NUMERIC DEFAULT 0,
  staff_costs NUMERIC DEFAULT 0,
  
  -- Working Capital
  days_receivable INTEGER DEFAULT 30,
  days_payable INTEGER DEFAULT 30,
  days_inventory INTEGER DEFAULT 30,
  
  -- Debt & WACC
  debt_equity_ratio NUMERIC DEFAULT 0,
  cost_of_debt NUMERIC DEFAULT 0,
  cost_of_equity NUMERIC DEFAULT 0,
  
  -- CAPEX & Amortization
  capex_as_percentage NUMERIC DEFAULT 0,
  depreciation_rate NUMERIC DEFAULT 0,
  
  -- Tax & Others
  tax_rate NUMERIC DEFAULT 25,
  other_assumptions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_financial_assumptions_per_company UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.financial_assumptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company assumptions" 
ON public.financial_assumptions 
FOR SELECT 
USING (has_company_access(company_id));

CREATE POLICY "Users can create their company assumptions" 
ON public.financial_assumptions 
FOR INSERT 
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Users can update their company assumptions" 
ON public.financial_assumptions 
FOR UPDATE 
USING (has_company_access(company_id));

CREATE POLICY "Users can delete their company assumptions" 
ON public.financial_assumptions 
FOR DELETE 
USING (has_company_access(company_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_assumptions_updated_at
BEFORE UPDATE ON public.financial_assumptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();