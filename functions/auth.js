export async function onRequest(context) {
  const { request, env } = context;
  const client_id = env.GITHUB_CLIENT_ID;

  try {
    const url = new URL(request.url);
    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.set('client_id', client_id);
    redirectUrl.searchParams.set('redirect_uri', url.origin + '/callback');
    redirectUrl.searchParams.set('scope', 'repo user');
    redirectUrl.searchParams.set('state', crypto.getRandomValues(new Uint8Array(12)).join(''));
    return Response.redirect(redirectUrl.href, 302);
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
