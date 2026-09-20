export async function onRequest(context) {
  const { env } = context;
  const clientId = env.GITHUB_CLIENT_ID;
  const origin = new URL(context.request.url).origin;
  const redirectUri = `${origin}/api/callback`;

  return Response.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&redirect_uri=${redirectUri}`,
    302
  );
}
