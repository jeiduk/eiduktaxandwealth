-- Drop the overly permissive policy that allows anyone to read all tokens
DROP POLICY IF EXISTS "Anyone can validate tokens" ON public.client_access_tokens;

-- Create a secure function to validate tokens without exposing the table
CREATE OR REPLACE FUNCTION public.validate_client_token(p_token text)
RETURNS TABLE(roadmap_id uuid, client_id uuid, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.roadmap_id, t.client_id, (t.expires_at > now()) as is_valid
  FROM client_access_tokens t
  WHERE t.token = p_token
  LIMIT 1;
END;
$$;