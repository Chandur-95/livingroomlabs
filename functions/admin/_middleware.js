/* Adds the "Fotu stats" button to the CMS admin page automatically, so admin/index.html
   never needs editing. It only touches the admin page itself (/admin/ and /admin/index.html);
   everything else, including the CMS's own files and your public site, passes through untouched.
   If anything goes wrong it simply serves the admin page exactly as it is. */

const TAG = '<script src="/admin/fotu-stats-widget.js" defer></script>';

export async function onRequest(context) {
  const response = await context.next();
  try {
    const path = new URL(context.request.url).pathname;
    const isAdminPage = path === "/admin" || path === "/admin/" || path === "/admin/index.html";
    const type = response.headers.get("content-type") || "";
    if (!isAdminPage || response.status !== 200 || type.indexOf("text/html") === -1) return response;

    const original = response.clone();
    try {
      let html = await response.text();
      if (html.indexOf("fotu-stats-widget.js") !== -1) return original; // already added by hand
      const i = html.lastIndexOf("</body>");
      html = i === -1 ? html + "\n" + TAG : html.slice(0, i) + TAG + "\n" + html.slice(i);
      const headers = new Headers(original.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      headers.delete("etag");
      return new Response(html, { status: original.status, statusText: original.statusText, headers });
    } catch (e) {
      return original;
    }
  } catch (e) {
    return response;
  }
}
