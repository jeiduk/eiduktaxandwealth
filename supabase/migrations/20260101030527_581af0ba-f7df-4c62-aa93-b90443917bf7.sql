-- Add a column to track who uploaded the document (advisor vs client)
ALTER TABLE public.client_documents 
ADD COLUMN uploaded_by_client boolean NOT NULL DEFAULT false;

-- Update the RLS policy for token holders to also set user_id to client_id
-- The existing policy "Token holders can upload documents" already validates the token
-- We just need to ensure the client_id is also stored in user_id for audit purposes

-- Add a comment explaining the user_id usage
COMMENT ON COLUMN public.client_documents.user_id IS 'For advisor uploads: the advisor user_id. For client uploads via token: the client_id (not a real auth user).';
COMMENT ON COLUMN public.client_documents.uploaded_by_client IS 'True if uploaded by client via access token, false if uploaded by advisor.';