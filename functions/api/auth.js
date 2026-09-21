// Step 1 of the CMS login: send the visitor to GitHub.
// Hardening vs. the old version: asks GitHub for the smallest permission that still lets the
// editor save to a public repo (public_repo, not repo+user), and adds a one-time "state" code
// that callback.js checks, so a login can't be started by someone else's link.
export async function onRequest(context) {
  const { request, env } = context;
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("Login is not set up yet (GITHUB_CLIENT_ID is missing in Cloudflare).", {
      status: 500,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    });
  }

  const origin = new URL(request.url).origin;
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${origin}/api/callback`);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);

  // Note: Response.redirect() has read-only headers, so we build the redirect by hand to set the cookie.
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": `lrl_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
