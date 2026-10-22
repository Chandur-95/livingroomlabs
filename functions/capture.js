/* What We Capture: gives every category its own page title, description, address and Google
   details BEFORE the page is sent, so search results and link previews (WhatsApp, Instagram)
   show "Food Photography in Hyderabad | Living Room Labs" instead of one title for everything.
   Categories come from content.json, so a new category added in the Content Editor gets this
   automatically. Discover (no category) and unknown categories get the page exactly as it is.
   If anything goes wrong it simply serves the page unchanged. */

const SITE = "https://livingroomlabs.in";
const LABEL = { Events: "Event", Pets: "Pet", Products: "Product", Portraits: "Portrait" };
const label = (name) => LABEL[name] || name;

function priceText(v) {
  let t = String(v || "").trim();
  if (!t) return "";
  if (/^[0-9][0-9,]*$/.test(t)) t = "₹" + Number(t.replace(/,/g, "")).toLocaleString("en-IN");
  return t;
}
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function swapAttr(html, tagPattern, attr, value) {
  return html.replace(tagPattern, (tag) => tag.replace(new RegExp(attr + '="[^"]*"'), attr + '="' + escAttr(value) + '"'));
}

export async function onRequestGet(context) {
  const response = await context.next();
  try {
    const type = response.headers.get("content-type") || "";
    if (response.status !== 200 || type.indexOf("text/html") === -1) return response;
    const url = new URL(context.request.url);
    const asked = (url.searchParams.get("category") || "").trim().toLowerCase();
    if (!asked) return response;

    const original = response.clone();
    try {
      const data = await (await context.env.ASSETS.fetch(new URL("/content.json", url))).json();
      const niche = (data.niches || []).find((n) => String((n && n.name) || "").trim().toLowerCase() === asked);
      if (!niche) return original;

      const name = String(niche.name).trim();
      const price = priceText(niche.startingFrom);
      const title = label(name) + " Photography in Hyderabad | Living Room Labs";
      const desc = (label(name) + " photography in Hyderabad by Living Room Labs. " + (niche.line || "") +
        (price ? " Starting from " + price + "." : "")).replace(/\s+/g, " ").trim();
      const canonical = SITE + "/capture?category=" + encodeURIComponent(name);

      const service = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: label(name) + " photography",
        serviceType: label(name) + " photography",
        url: canonical,
        provider: { "@id": SITE + "/#business", "@type": "ProfessionalService", name: data.name || "Living Room Labs" },
        areaServed: { "@type": "City", name: "Hyderabad" }
      };
      if (niche.line) service.description = niche.line;
      const amount = Number(String(niche.startingFrom || "").replace(/[^0-9.]/g, ""));
      if (amount > 0) {
        service.offers = { "@type": "Offer", priceCurrency: "INR", price: amount, description: "Starting price" };
      }
      const ld = '<script type="application/ld+json">' + JSON.stringify(service).replace(/</g, "\\u003c") + "</script>";

      let html = await response.text();
      html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + escText(title) + "</title>");
      html = swapAttr(html, /<meta name="description"[^>]*>/, "content", desc);
      html = swapAttr(html, /<link rel="canonical"[^>]*>/, "href", canonical);
      html = swapAttr(html, /<meta property="og:title"[^>]*>/, "content", title);
      html = swapAttr(html, /<meta property="og:description"[^>]*>/, "content", desc);
      html = swapAttr(html, /<meta property="og:url"[^>]*>/, "content", canonical);
      html = html.replace("</head>", ld + "\n</head>");

      const headers = new Headers(original.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      headers.delete("etag");
      return new Response(html, { status: 200, headers });
    } catch (e) {
      return original;
    }
  } catch (e) {
    return response;
  }
}
