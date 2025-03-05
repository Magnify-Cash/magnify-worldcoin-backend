interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
  
  export async function checkWallet(request: Request, env: Env): Promise<Response> {
  
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
  
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
  
    try {
      // Get wallet from query parameter instead of request body
      const url = new URL(request.url);
      const wallet = url.searchParams.get('wallet');
  
      if (!wallet) {
        return new Response(JSON.stringify({ error: "Missing wallet parameter" }), { status: 400, headers });
      }
  
      const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/user_wallets?wallet=eq.${wallet}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
  
      const supabaseData: any = await supabaseResponse.json();
  
      if (!supabaseResponse.ok) {
        throw new Error(`Supabase Error: ${JSON.stringify(supabaseData)}`);
      }
  
      // If the wallet exists, return { exists: true }
      if (supabaseData.length > 0) {
        return new Response(JSON.stringify({ exists: true }), { status: 200, headers });
      }
  
      // If the wallet does not exist, return { exists: false }
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers });
  
    } catch (error) {
      console.error("Supabase Error:", error);
      return new Response(JSON.stringify({ error: "Failed to check wallet" }), { status: 500, headers });
    }
  }
  