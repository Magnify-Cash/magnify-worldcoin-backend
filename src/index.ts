export default {
    async fetch(request, env, ctx) {
      return new Response("Hello from GitHub Integration!");
    },
  };

  // To copy paste code from legacyIndexV2.ts
  // To fix package-lock.json to allow cloudflare build