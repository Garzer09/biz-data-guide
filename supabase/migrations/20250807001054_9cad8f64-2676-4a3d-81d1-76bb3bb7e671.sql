-- Create storage bucket for import files
INSERT INTO storage.buckets (id, name, public) VALUES ('import-files', 'import-files', false);

-- Create RLS policies for import files bucket
CREATE POLICY "Admins can upload import files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'import-files' AND get_current_user_role() = 'admin');

CREATE POLICY "Admins can view import files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'import-files' AND get_current_user_role() = 'admin');

CREATE POLICY "Admins can update import files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'import-files' AND get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete import files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'import-files' AND get_current_user_role() = 'admin');