-- Add RLS policy for clients to upload documents via token
CREATE POLICY "Token holders can upload documents"
ON public.client_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_access_tokens
    WHERE client_access_tokens.client_id = client_documents.client_id
    AND client_access_tokens.expires_at > now()
  )
);

-- Add RLS policy for clients to view their uploaded documents via token
CREATE POLICY "Token holders can view their documents"
ON public.client_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_access_tokens
    WHERE client_access_tokens.client_id = client_documents.client_id
    AND client_access_tokens.expires_at > now()
  )
);

-- Add storage policies for client uploads
CREATE POLICY "Token holders can upload to client-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
);

CREATE POLICY "Token holders can view their documents in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-documents'
);