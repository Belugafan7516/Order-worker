export default {
  async fetch(request, env) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    // This is crucial to allow your browser app to talk to this worker.
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://orderapp-jet.vercel.app", // In production, change '*' to your specific domain
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests (Browser checking if it's allowed to connect)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      // 2. Parse Data from the Frontend
      const { to, subject, html } = await request.json();

      if (!to || !subject || !html) {
        return new Response("Missing required fields", { status: 400, headers: corsHeaders });
      }

      // 3. Call Resend API Securely
      // We use the API Key stored in the environment variables (env.RESEND_API_KEY)
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Order.Now <noreply@auto.eugeneevons.com>",
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await resendResponse.json();

      // 4. Return success to the frontend
      return new Response(JSON.stringify(data), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

