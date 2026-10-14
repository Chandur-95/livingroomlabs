/* Counts for Fotu: how many people open the chat and send an enquiry.
   Needs a KV namespace bound to this Pages project as FOTU_STATS,
   and an environment variable STATS_KEY (any password you choose) to read the numbers. */

const EVENTS = ["open", "sent"];

function monthKey(d) {
  return d.toISOString().slice(0, 7); // e.g. 2026-10
}

export async function onRequestPost({ request, env }) {
  if (!env.FOTU_STATS) return new Response("not configured", { status: 204 });
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const event = EVENTS.includes(body.event) ? body.event : null;
  if (!event) return new Response("bad event", { status: 400 });
  let page = String(body.page || "/").slice(0, 40).replace(/[^a-z0-9/._-]/gi, "");
  if (page === "/" || page === "/index.html") page = "home";
  else if (page.indexOf("capture") !== -1) page = "capture";
  else page = "other";

  const key = "m:" + monthKey(new Date());
  const current = JSON.parse((await env.FOTU_STATS.get(key)) || "{}");
  current[event] = (current[event] || 0) + 1;
  const pk = event + ":" + page;
  current[pk] = (current[pk] || 0) + 1;
  await env.FOTU_STATS.put(key, JSON.stringify(current));
  return new Response("ok", { status: 200 });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
    return new Response(JSON.stringify({ error: "wrong key" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  if (!env.FOTU_STATS) {
    return new Response(JSON.stringify({ error: "FOTU_STATS storage not connected" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const list = await env.FOTU_STATS.list({ prefix: "m:" });
  const months = {};
  for (const k of list.keys) months[k.name.slice(2)] = JSON.parse((await env.FOTU_STATS.get(k.name)) || "{}");
  return new Response(JSON.stringify({ months }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
