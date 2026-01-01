import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, filePath } = await req.json();

    if (!token || !filePath) {
      console.error('Missing required parameters:', { token: !!token, filePath: !!filePath });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client to validate token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Validate the token and get the associated client_id
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('validate_client_token', { p_token: token });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedToken = tokenData[0];
    
    if (!validatedToken.is_valid) {
      console.error('Token is expired');
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = validatedToken.client_id;

    // CRITICAL SECURITY CHECK: Verify that the file path belongs to the token's client
    // File paths are structured as: {client_id}/{filename}
    const pathParts = filePath.split('/');
    const fileClientId = pathParts[0];

    if (fileClientId !== clientId) {
      console.error('Access denied: Token client_id does not match file path client_id', {
        tokenClientId: clientId,
        fileClientId: fileClientId,
      });
      return new Response(
        JSON.stringify({ error: 'Access denied: You do not have permission to access this file' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed URL with short expiration (5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('client-documents')
      .createSignedUrl(filePath, 300); // 5 minute expiration

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to create signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL generated successfully for client:', clientId);

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-signed-document-url:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
