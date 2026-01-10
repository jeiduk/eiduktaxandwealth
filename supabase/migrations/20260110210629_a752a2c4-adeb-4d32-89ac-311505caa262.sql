-- Remove the overly permissive storage policies that allow any authenticated user to access all files
-- This leaves the secure advisor-based policies in place:
-- - "Advisors can upload client documents" 
-- - "Advisors can view their own documents"
-- - "Advisors can delete their own documents"
DROP POLICY IF EXISTS "Token holders can upload to client-documents" ON storage.objects;
DROP POLICY IF EXISTS "Token holders can view their documents in storage" ON storage.objects;