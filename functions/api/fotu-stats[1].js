/* Fotu stats: functions/api/fotu-stats.js  ->  served at /api/fotu-stats

   POST (from fotu.js on the public site): adds one visit's totals. Nothing personal is stored:
        counts, topic names, and questions Fotu couldn't answer (emails and phone numbers removed).
   GET  (from the admin page): returns the numbers. Only works for someone logged in to the
        Content Editor with permission to edit the GitHub repo (or with ?key=STATS_KEY, optional).

   Needs ONE thing set up in Cloudflare: a KV namespace bound to this Pages project as FOTU_STATS. */

const REPO_DEFAULT = "Chandur-95/livingroomlabs";
const NUM_FIELDS = ["woke", "opened", "msgs", "sent", "pokes"];
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function ymd(d) { return d.toISOString().slice(0, 10); }
function clampInt(v, max) { v = Math.floor(Number(v) || 0); return v < 0 ? 0 : v > max ? max : v; }
function addTo(obj, key, n) { if (n) obj[key] = (obj[key] || 0) + n; }

async function readJSON(kv, key, fallback) {
  try { const v = await kv.get(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}

export async function onRequestPost({ request, env }) {
  if (!env.FOTU_STATS) return new Response(null, { status: 204 });
  const text = await request.text();
  if (text.length > 6000) return new Response("too big", { status: 413 });
  let body = {};
  try { body = JSON.parse(text); } catch (e) { return new Response("bad json", { status: 400 }); }

  /* old fotu.js format: { event: "open" | "sent" } */
  if (body.event && !body.s) body = { v: 2, page: "home", device: "unknown", s: { opened: body.event === "open" ? 1 : 0, sent: body.event === "sent" ? 1 : 0 } };
  const s = body.s || {};
  const page = ["home", "capture", "other"].includes(body.page) ? body.page : "other";
  const device = ["phone", "desktop"].includes(body.device) ? body.device : "unknown";

  const add = {};
  NUM_FIELDS.forEach((f) => { add[f] = clampInt(s[f], f === "msgs" || f === "pokes" ? 200 : 20); });
  const topics = {};
  if (s.topics && typeof s.topics === "object") {
    Object.keys(s.topics).slice(0, 40).forEach((k) => { if (/^[a-z_]{1,24}$/.test(k)) topics[k] = clampInt(s.topics[k], 50); });
  }
  const scrub = (q) => String(q).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]").replace(/\+?\d[\d\s-]{5,}\d/g, "[number]").slice(0, 120).trim();
  const unknown = Array.isArray(s.unknown) ? s.unknown.slice(0, 8).map(scrub).filter(Boolean) : [];
  const anything = NUM_FIELDS.some((f) => add[f]) || Object.keys(topics).length || unknown.length;
  if (!anything) return new Response("ok");

  const now = new Date(), day = ymd(now), month = day.slice(0, 7);

  /* month totals (with page, device and topic breakdowns) */
  const mKey = "m:" + month;
  const m = await readJSON(env.FOTU_STATS, mKey, {});
  NUM_FIELDS.forEach((f) => { addTo(m, f, add[f]); addTo(m, f + ":" + page, add[f]); addTo(m, f + ":" + device, add[f]); });
  addTo(m, "visits", 1); addTo(m, "visits:" + device, 1); addTo(m, "visits:" + page, 1);
  m.topics = m.topics || {};
  Object.keys(topics).forEach((k) => addTo(m.topics, k, topics[k]));
  await env.FOTU_STATS.put(mKey, JSON.stringify(m));

  /* daily totals, kept about 13 months */
  if (add.woke || add.opened || add.msgs || add.sent) {
    const dKey = "d:" + day;
    const d = await readJSON(env.FOTU_STATS, dKey, {});
    NUM_FIELDS.forEach((f) => addTo(d, f, add[f]));
    await env.FOTU_STATS.put(dKey, JSON.stringify(d), { expirationTtl: 60 * 60 * 24 * 400 });
  }

  /* questions Fotu couldn't answer: newest first, last 300 per month */
  if (unknown.length) {
    const uKey = "u:" + month;
    const list = await readJSON(env.FOTU_STATS, uKey, []);
    unknown.forEach((q) => list.unshift({ q, t: now.toISOString(), p: page }));
    await env.FOTU_STATS.put(uKey, JSON.stringify(list.slice(0, 300)));
  }
  return new Response("ok");
}

async function allowed(request, env) {
  const url = new URL(request.url);
  if (env.STATS_KEY && url.searchParams.get("key") === env.STATS_KEY) return true;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^(Bearer|token)\s+/i, "").trim();
  if (!token) return false;
  try {
    const r = await fetch("https://api.github.com/repos/" + (env.GITHUB_REPO || REPO_DEFAULT), {
      headers: { "Authorization": "token " + token, "User-Agent": "livingroomlabs-fotu-stats", "Accept": "application/vnd.github+json" }
    });
    if (!r.ok) return false;
    const repo = await r.json();
    return !!(repo.permissions && (repo.permissions.push || repo.permissions.admin));
  } catch (e) { return false; }
}

export async function onRequestGet({ request, env }) {
  if (!(await allowed(request, env))) return json({ error: "not_allowed" }, 401);
  if (!env.FOTU_STATS) return json({ error: "not_configured" }, 503);

  const months = {};
  const mList = await env.FOTU_STATS.list({ prefix: "m:" });
  for (const k of mList.keys) months[k.name.slice(2)] = await readJSON(env.FOTU_STATS, k.name, {});

  const days = {};
  const today = new Date();
  const wanted = [];
  for (let i = 0; i < 30; i++) wanted.push(ymd(new Date(today.getTime() - i * 86400000)));
  await Promise.all(wanted.map(async (d) => { const v = await readJSON(env.FOTU_STATS, "d:" + d, null); if (v) days[d] = v; }));

  const unknown = {};
  const uList = await env.FOTU_STATS.list({ prefix: "u:" });
  const recent = uList.keys.map((k) => k.name).sort().reverse().slice(0, 3);
  for (const k of recent) unknown[k.slice(2)] = await readJSON(env.FOTU_STATS, k, []);

  return json({ months, days, unknown });
}
