function renderBody(status, content) {
  return `<!doctype html><html><body><script>
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          e.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })()
  </script></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const client_id = env.GITHUB_CLIENT_ID;
  const client_secret = env.GITHUB_CLIENT_SECRET;

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'cloudflare-pages-decap-cms',
        'accept': 'application/json',
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const result = await response.json();
    if (result.error) {
      return new Response(renderBody('error', result), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
        status: 401
      });
    }

    const token = result.access_token;
    return new Response(renderBody('success', { token, provider: 'github' }), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
      status: 200
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
