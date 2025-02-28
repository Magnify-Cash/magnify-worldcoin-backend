interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    WORLDCOIN_API_KEY: string;
  }
  
  export async function sendNotification(request: Request, env: Env): Promise<Response> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };
  
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
  
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }
  
    try {
      const requestBody: { app_id: string; wallet_addresses: string[]; title: string; message: string; mini_app_path: string } = await request.json();
  
      const { app_id, wallet_addresses, title, message, mini_app_path } = requestBody;
  
      if (!app_id || !wallet_addresses || !Array.isArray(wallet_addresses) || wallet_addresses.length === 0 || !title || !message || !mini_app_path) {
        return new Response(JSON.stringify({ error: "Missing or invalid required fields" }), {
          status: 400,
          headers,
        });
      }
  
      const worldcoinResponse = await fetch("https://developer.worldcoin.org/api/v2/minikit/send-notification", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.WORLDCOIN_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id,
          wallet_addresses,
          title,
          message,
          mini_app_path,
        }),
      });
  
      const worldcoinData = await worldcoinResponse.json();
  
      if (!worldcoinResponse.ok) {
        throw new Error(`Worldcoin API Error: ${JSON.stringify(worldcoinData)}`);
      }
  
      return new Response(JSON.stringify({ success: true, data: worldcoinData }), {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("Notification Error:", error);
      return new Response(JSON.stringify({ error: "Failed to send notification" }), {
        status: 500,
        headers,
      });
    }
  }
  