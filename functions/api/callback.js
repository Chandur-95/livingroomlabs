export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const data = await response.json();
  const token = data.access_token;

  const postMsgContent = JSON.stringify({
    token: token,
    provider: "github"
  });

  const html = `<!doctype html><html><body><script>
    (function() {
      function recieveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:${postMsgContent}',
          e.origin
        );
      }
      window.addEventListener("message", recieveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })()
  </script></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
