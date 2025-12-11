import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyUploadRequest {
  clientId: string;
  documentName: string;
  documentCategory: string;
  clientName: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId, documentName, documentCategory, clientName }: NotifyUploadRequest = await req.json();

    console.log("Notifying advisor of document upload:", documentName, "from client:", clientName);

    // Get the advisor's email from the client record
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      console.error("Error fetching client:", clientError);
      throw new Error("Failed to fetch client data");
    }

    // Get advisor's email from profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", clientData.user_id)
      .single();

    if (profileError || !profileData?.email) {
      console.error("Error fetching advisor profile:", profileError);
      throw new Error("Failed to fetch advisor email");
    }

    const advisorEmail = profileData.email;
    const advisorName = profileData.full_name || "Advisor";

    console.log("Sending notification to advisor:", advisorEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #2D3748; background-color: #FAF8F5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(30, 58, 95, 0.08);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%); padding: 32px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: #C9A227; margin-bottom: 12px;">
              Eiduk Tax & Wealth
            </div>
            <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: white; margin: 0;">
              📄 New Document Uploaded
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${advisorName},
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your client <strong>${clientName}</strong> has uploaded a new document to their portal.
            </p>
            
            <!-- Document Details -->
            <div style="background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Document Name:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${documentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Category:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${documentCategory}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Uploaded:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
              Log in to your advisor portal to review the document.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #FAF8F5; padding: 20px; text-align: center;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: #C9A227; margin: 0;">
              Pay Less. Keep More. Build Wealth.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Eiduk Tax & Wealth <onboarding@resend.dev>",
        to: [advisorEmail],
        subject: `New Document from ${clientName} - ${documentCategory}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-document-upload function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});