interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const ALLOWED_ORIGINS = [
  "https://dev-magnify-cash.netlify.app/",
  "https://staging-magnify-cash.netlify.app/",
  "https://miniappv2.magnify.cash/"
];

export async function saveWallet(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  const headers = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const { wallet } = (await request.json()) as { wallet: string };

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Missing wallet" }), { status: 400, headers });
    }

    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/user_wallets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ wallet, notification: true }),
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
