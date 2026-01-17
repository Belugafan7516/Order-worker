export default {
  async fetch(request, env) {
    // --- 1. ROBUST CORS HEADERS ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Allows access from any domain
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // --- 2. HANDLE PREFLIGHT (OPTIONS) ---
    // Browsers send this first to check if they are allowed to connect.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- 3. VALIDATE REQUEST ---
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { to, subject, html } = await request.json();

      // Check for missing data
      if (!to || !subject || !html) {
        return new Response(JSON.stringify({ error: "Missing to, subject, or html" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // --- 4. SEND TO RESEND ---
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Order.Now <noreply@auto.eugeneevons.com>", // MUST BE VERIFIED IN RESEND DASHBOARD
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await resendRes.json();

      // If Resend returns an error (like "Domain not verified"), pass it to the frontend
      if (!resendRes.ok) {
        return new Response(JSON.stringify(data), {
          status: resendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Success
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      // Catch System Errors (like code crashes)
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};


