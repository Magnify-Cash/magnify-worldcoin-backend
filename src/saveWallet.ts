interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function saveWallet(request: Request, env: Env): Promise<Response> {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const { wallet, notification } = (await request.json()) as { wallet: string; notification: boolean };

    if (!wallet || typeof notification !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid wallet/notification fields" }),
        { status: 400, headers }
      );
    }

    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/user_wallets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ wallet, notification }),
    });

    const supabaseData = await supabaseResponse.json();

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase Error: ${JSON.stringify(supabaseData)}`);
    }

    return new Response(JSON.stringify({ success: true, data: supabaseData }), { status: 200, headers });
  } catch (error) {
    console.error("Supabase Error:", error);
    return new Response(JSON.stringify({ error: "Failed to save wallet" }), { status: 500, headers });
  }
}