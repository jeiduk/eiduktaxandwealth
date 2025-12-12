-- Drop the overly permissive storage policies
DROP POLICY IF EXISTS "Token holders can upload to client-documents" ON storage.objects;
DROP POLICY IF EXISTS "Token holders can view client-documents" ON storage.objects;

-- Create secure storage policies that validate token ownership of client folder

-- Token holders can only upload to their specific client's folder
CREATE POLICY "Token holders can upload to their client folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM public.client_access_tokens t
    WHERE t.client_id::text = (storage.foldername(name))[1]
    AND t.expires_at > now()
  )
);

-- Token holders can only view files in their specific client's folder
CREATE POLICY "Token holders can view their client folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM public.client_access_tokens t
    WHERE t.client_id::text = (storage.foldername(name))[1]
    AND t.expires_at > now()
  )
);

-- Advisors can upload documents to their clients' folders
CREATE POLICY "Advisors can upload to their client folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND c.user_id = auth.uid()
  )
);

-- Advisors can view documents in their clients' folders
CREATE POLICY "Advisors can view their client folders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND c.user_id = auth.uid()
  )
);

-- Advisors can delete documents in their clients' folders
CREATE POLICY "Advisors can delete from their client folders"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND c.user_id = auth.uid()
  )
);