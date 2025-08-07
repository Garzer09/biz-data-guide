-- Fix Critical Security Issues (Fixed Version)

-- 1. Remove overly permissive company access policy
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

-- 2. Strengthen profile RLS policies - prevent users from updating their own role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile except role" ON public.profiles;

-- Create new profile policies with role protection
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (profiles.role = (SELECT role FROM profiles WHERE user_id = auth.uid()) OR get_current_user_role() = 'admin')
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 3. Create audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security audit
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Only admins can view security_audit" 
ON public.security_audit 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert security_audit" 
ON public.security_audit 
FOR INSERT 
WITH CHECK (true);

-- 4. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), _action, _resource_type, _resource_id, _details
  );
END;
$$;

-- 5. Strengthen company access - ensure only assigned companies are accessible
DROP POLICY IF EXISTS "Users can only view assigned companies" ON public.companies;
CREATE POLICY "Users can only view assigned companies" 
ON public.companies 
FOR SELECT 
USING (
  get_current_user_role() = 'admin' OR 
  EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_id = auth.uid() AND company_id = companies.id
  )
);

-- 6. Add file upload validation function
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  _file_size bigint,
  _content_type text,
  _max_size_mb integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check file size (convert MB to bytes)
  IF _file_size > (_max_size_mb * 1024 * 1024) THEN
    RAISE EXCEPTION 'File size exceeds maximum allowed size of % MB', _max_size_mb;
  END IF;
  
  -- Check content type for CSV files
  IF _content_type NOT IN ('text/csv', 'application/csv', 'text/plain') THEN
    RAISE EXCEPTION 'Invalid file type. Only CSV files are allowed.';
  END IF;
  
  RETURN true;
END;
$$;