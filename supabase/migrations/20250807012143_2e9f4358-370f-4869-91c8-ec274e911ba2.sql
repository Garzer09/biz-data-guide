-- Enable Row-Level Security on pyg_annual
ALTER TABLE public.pyg_annual ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy: users can view data they have access to
CREATE POLICY "Users can view pyg_annual for accessible companies" 
ON public.pyg_annual 
FOR SELECT 
USING (
  public.is_current_user_admin() OR 
  public.has_company_access(pyg_annual.company_id)
);

-- Create INSERT policy: only admins can insert
CREATE POLICY "Only admins can insert pyg_annual" 
ON public.pyg_annual 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

-- Create UPDATE policy: only admins can update
CREATE POLICY "Only admins can update pyg_annual" 
ON public.pyg_annual 
FOR UPDATE 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Create DELETE policy: only admins can delete
CREATE POLICY "Only admins can delete pyg_annual" 
ON public.pyg_annual 
FOR DELETE 
USING (public.is_current_user_admin());