-- Create financial_assumptions table
CREATE TABLE public.financial_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  
  -- Revenue Assumptions
  sales_growth NUMERIC DEFAULT 0,
  average_price NUMERIC DEFAULT 0,
  product_mix TEXT DEFAULT '',
  
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
  other_assumptions TEXT DEFAULT '',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_assumptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage financial_assumptions" 
ON public.financial_assumptions 
FOR ALL 
USING (get_current_user_role() = 'admin') 
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view financial_assumptions for assigned companies" 
ON public.financial_assumptions 
FOR SELECT 
USING (
  get_current_user_role() = 'admin' OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_id = auth.uid() AND company_id = financial_assumptions.company_id
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_assumptions_updated_at
BEFORE UPDATE ON public.financial_assumptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();