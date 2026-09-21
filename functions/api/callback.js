// Step 2 of the CMS login: GitHub sends the visitor back here with a one-time code.
// We check the "state" code, swap the code for a token, and hand the token to the editor window
// using the exact message format Decap CMS expects.
const TEXT = { "Content-Type": "text/plain;charset=UTF-8", "Cache-Control": "no-store" };
const fail = (message, status) => new Response(message, { status, headers: TEXT });

function readCookie(header, name) {
  for (const part of (header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

// Makes a string safe to place inside an inline <script>.
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.searchParams.get("error")) return fail("GitHub login was cancelled. You can close this window.", 400);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = readCookie(request.headers.get("Cookie"), "lrl_oauth_state");
  if (!code || !state || !saved || state !== saved) {
    return fail("Login check failed. Please close this window and try logging in again.", 400);
  }

  let data;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "livingroomlabs-cms-login" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/api/callback`,
      }),
    });
    data = await res.json();
  } catch (e) {
    return fail("Could not reach GitHub. Please try again.", 502);
  }
  if (!data || !data.access_token) return fail("GitHub did not give a login token. Please try again.", 400);

  const message = "authorization:github:success:" + JSON.stringify({ token: data.access_token, provider: "github" });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Logging in…</title></head><body>
<p>Logging you in… this window closes by itself.</p>
<script>
(function () {
  var message = ${safeJson(message)};
  var ownOrigin = window.location.origin;
  function onMessage(e) {
    if (e.origin !== ownOrigin) return;            // only ever reply to our own website
    window.opener.postMessage(message, e.origin);
    window.removeEventListener("message", onMessage, false);
  }
  window.addEventListener("message", onMessage, false);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Set-Cookie": "lrl_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
