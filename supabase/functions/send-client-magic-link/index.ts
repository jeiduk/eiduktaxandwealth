import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMagicLinkRequest {
  clientId: string;
  roadmapId: string;
  clientEmail: string;
  clientName: string;
  baseUrl: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId, roadmapId, clientEmail, clientName, baseUrl }: SendMagicLinkRequest = await req.json();

    console.log("Sending magic link to:", clientEmail, "for roadmap:", roadmapId);

    // Generate a secure token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store the token in the database
    const { error: tokenError } = await supabase
      .from("client_access_tokens")
      .insert({
        client_id: clientId,
        roadmap_id: roadmapId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      throw new Error("Failed to create access token");
    }

    // Build the magic link URL
    const magicLink = `${baseUrl}/client-portal?token=${token}`;

    console.log("Magic link generated:", magicLink);

    // Send email via Resend API directly
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
          <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2C5AA0 100%); padding: 40px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: #C9A227; margin-bottom: 16px;">
              Eiduk Tax & Wealth
            </div>
            <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">
              Your 90-Day Roadmap
            </h1>
            <p style="font-size: 16px; color: white; margin: 0;">
              is ready for you, ${clientName}!
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${clientName},
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We're excited to begin working together! Your personalized 90-Day Roadmap is ready to view. 
              This roadmap outlines what we'll accomplish together and includes tasks for you to complete along the way.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #2C5AA0 0%, #1E3A5F 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Your Roadmap
              </a>
            </div>

            <p style="font-size: 14px; color: #64748B; margin-top: 30px;">
              This link is valid for 30 days. If you have any questions, don't hesitate to reach out!
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
              <p style="font-size: 14px; margin: 0;">
                <strong>John Eiduk, CPA, CFP®, MSCTA</strong><br>
                847-917-8981 | john@eiduktaxandwealth.com
              </p>
            </div>
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
        to: [clientEmail],
        subject: "Your 90-Day Roadmap - Eiduk Tax & Wealth",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Magic link sent successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-magic-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
