import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const shareRequestSchema = z.object({
  recipientEmail: z.string().email().max(255),
  sequenceName: z.string().min(1).max(200),
  shareToken: z.string().uuid(),
  senderEmail: z.string().email().max(255),
  appUrl: z.string().url().optional()
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // SECURITY: Validate input data
    const validationResult = shareRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: validationResult.error.issues }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { recipientEmail, sequenceName, shareToken, senderEmail, appUrl } = validationResult.data;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Use the provided app URL or fall back to Supabase URL
    let shareUrl: string;
    if (appUrl) {
      shareUrl = `${appUrl}/shared/${shareToken}`;
    } else {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "";
      shareUrl = `https://${projectRef}.lovableproject.com/shared/${shareToken}`;
    }

    console.log("Sending email to:", recipientEmail, "Share URL:", shareUrl);

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sequence Sharing <share@kilosayaw.com>",
        to: [recipientEmail],
        subject: `${senderEmail} shared a sequence with you: ${sequenceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">You've been invited to view a sequence!</h2>
            <p><strong>${senderEmail}</strong> has shared a sequence with you:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #1f2937;">${sequenceName}</h3>
            </div>
            <p>Click the button below to view and save this sequence:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Sequence
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If you don't have an account yet, you'll be able to sign up and access this sequence.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${emailResponse.status} ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in share-sequence function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
