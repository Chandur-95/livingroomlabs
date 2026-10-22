/* sitemap.xml, built fresh from content.json on every request: the home page, What We Capture,
   and one address per category (with that category's photos), so Google always knows about new
   photos and new categories without anyone editing a file. If anything goes wrong, the plain
   sitemap.xml file in the repo is served instead. */

const SITE = "https://livingroomlabs.in";
const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function imageUrl(src) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return SITE + encodeURI(s.charAt(0) === "/" ? s : "/" + s);
}

function urlBlock(loc, srcs) {
  const seen = {};
  const images = srcs.map(imageUrl).filter((u) => u && !seen[u] && (seen[u] = true)).slice(0, 1000);
  return "  <url>\n    <loc>" + xmlEsc(loc) + "</loc>\n" +
    images.map((u) => "    <image:image><image:loc>" + xmlEsc(u) + "</image:loc></image:image>\n").join("") +
    "  </url>\n";
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const res = await context.env.ASSETS.fetch(new URL("/content.json", url));
    if (!res.ok) throw new Error("content.json " + res.status);
    const d = await res.json();
    const photos = (d.photos || []).filter((p) => p && p.src);
    const featured = photos.filter((p) => p.featured !== false && String(p.featured).toLowerCase() !== "false");
    const banner = (d.bandSlides || []).map((s) => s && s.src);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    xml += urlBlock(SITE + "/", banner.concat(featured.map((p) => p.src)));
    xml += urlBlock(SITE + "/capture", []);
    (d.niches || []).forEach((n) => {
      const name = String((n && n.name) || "").trim();
      if (!name) return;
      const inCat = photos.filter((p) => String(p.category || "").trim().toLowerCase() === name.toLowerCase());
      xml += urlBlock(SITE + "/capture?category=" + encodeURIComponent(name), inCat.map((p) => p.src));
    });
    xml += "</urlset>\n";
    return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
  } catch (e) {
    return context.next();
  }
}
