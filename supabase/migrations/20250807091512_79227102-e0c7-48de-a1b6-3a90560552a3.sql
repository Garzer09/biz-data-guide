-- Drop existing policies and create new ones with the specified permissions

-- Drop existing policies for cashflows_operativo
DROP POLICY IF EXISTS "Only admins can manage cashflows_operativo" ON public.cashflows_operativo;
DROP POLICY IF EXISTS "Users can view cashflows_operativo for assigned companies" ON public.cashflows_operativo;

-- Drop existing policies for cashflows_inversion
DROP POLICY IF EXISTS "Only admins can manage cashflows_inversion" ON public.cashflows_inversion;
DROP POLICY IF EXISTS "Users can view cashflows_inversion for assigned companies" ON public.cashflows_inversion;

-- Drop existing policies for cashflows_financiacion
DROP POLICY IF EXISTS "Only admins can manage cashflows_financiacion" ON public.cashflows_financiacion;
DROP POLICY IF EXISTS "Users can view cashflows_financiacion for assigned companies" ON public.cashflows_financiacion;

-- Create new policies for cashflows_operativo
CREATE POLICY cf_op_select ON public.cashflows_operativo 
FOR SELECT
USING (is_current_user_admin() OR has_company_access(company_id));

CREATE POLICY cf_op_write ON public.cashflows_operativo 
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create new policies for cashflows_inversion
CREATE POLICY cf_inv_select ON public.cashflows_inversion 
FOR SELECT
USING (is_current_user_admin() OR has_company_access(company_id));

CREATE POLICY cf_inv_write ON public.cashflows_inversion 
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create new policies for cashflows_financiacion
CREATE POLICY cf_fin_select ON public.cashflows_financiacion 
FOR SELECT
USING (is_current_user_admin() OR has_company_access(company_id));

CREATE POLICY cf_fin_write ON public.cashflows_financiacion 
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());