-- Drop all existing policies to recreate them with the new pattern
DROP POLICY IF EXISTS "Users can view periods for assigned companies" ON public.periods;
DROP POLICY IF EXISTS "Admins can manage periods" ON public.periods;
DROP POLICY IF EXISTS "Users can view fs_income for assigned companies" ON public.fs_income;
DROP POLICY IF EXISTS "Admins can manage fs_income" ON public.fs_income;
DROP POLICY IF EXISTS "Users can view fs_balance for assigned companies" ON public.fs_balance;
DROP POLICY IF EXISTS "Admins can manage fs_balance" ON public.fs_balance;
DROP POLICY IF EXISTS "Users can view fs_cashflow for assigned companies" ON public.fs_cashflow;
DROP POLICY IF EXISTS "Admins can manage fs_cashflow" ON public.fs_cashflow;
DROP POLICY IF EXISTS "Users can view ratios_calc for assigned companies" ON public.ratios_calc;
DROP POLICY IF EXISTS "Admins can manage ratios_calc" ON public.ratios_calc;
DROP POLICY IF EXISTS "Users can view company_pages for assigned companies" ON public.company_pages;
DROP POLICY IF EXISTS "Admins can manage company_pages" ON public.company_pages;
DROP POLICY IF EXISTS "Users can view import_jobs for assigned companies" ON public.import_jobs;
DROP POLICY IF EXISTS "Admins can manage import_jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can view import_files for their jobs" ON public.import_files;
DROP POLICY IF EXISTS "Admins can manage import_files" ON public.import_files;
DROP POLICY IF EXISTS "Users can view assigned companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratios_calc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES FOR COMPANIES TABLE
-- SELECT: All authenticated users can view companies
CREATE POLICY "Authenticated users can view companies" ON public.companies
FOR SELECT TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage companies" ON public.companies
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR COMPANY_PAGES TABLE
-- SELECT: All authenticated users can view company_pages
CREATE POLICY "Authenticated users can view company_pages" ON public.company_pages
FOR SELECT TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage company_pages" ON public.company_pages
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR PERIODS TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view periods for assigned companies" ON public.periods
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = periods.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage periods" ON public.periods
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR FS_INCOME TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view fs_income for assigned companies" ON public.fs_income
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_income.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage fs_income" ON public.fs_income
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR FS_BALANCE TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view fs_balance for assigned companies" ON public.fs_balance
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_balance.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage fs_balance" ON public.fs_balance
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR FS_CASHFLOW TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view fs_cashflow for assigned companies" ON public.fs_cashflow
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = fs_cashflow.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage fs_cashflow" ON public.fs_cashflow
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR RATIOS_CALC TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view ratios_calc for assigned companies" ON public.ratios_calc
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = ratios_calc.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage ratios_calc" ON public.ratios_calc
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR IMPORT_JOBS TABLE
-- SELECT: Admin or user assigned to company
CREATE POLICY "Users can view import_jobs for assigned companies" ON public.import_jobs
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() 
    AND user_companies.company_id = import_jobs.company_id
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage import_jobs" ON public.import_jobs
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CREATE POLICIES FOR IMPORT_FILES TABLE
-- SELECT: Admin or user assigned to company through import_jobs
CREATE POLICY "Users can view import_files for assigned companies" ON public.import_files
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.import_jobs ij
    JOIN public.user_companies uc ON uc.company_id = ij.company_id
    WHERE ij.id = import_files.job_id 
    AND uc.user_id = auth.uid()
  )
);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "Only admins can manage import_files" ON public.import_files
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- AUDIT_LOG policies remain the same (users can view their own actions, admins can view all)
CREATE POLICY "Users can view relevant audit_log" ON public.audit_log
FOR SELECT TO authenticated
USING (
  actor_user_id = auth.uid() OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "System can insert audit_log" ON public.audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- Only admins can manage audit_log except for inserts
CREATE POLICY "Only admins can manage audit_log" ON public.audit_log
FOR UPDATE TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Only admins can delete audit_log" ON public.audit_log
FOR DELETE TO authenticated
USING (public.get_current_user_role() = 'admin');