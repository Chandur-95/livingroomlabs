/* Fotu stats panel for the admin page (admin/fotu-stats-widget.js).
   Added to /admin/ automatically by functions/admin/_middleware.js, so admin/index.html needs no edits.
   Uses the Content Editor's own GitHub login, so there is no extra password. */
(function () {
  "use strict";
  if (window.__fotuStatsWidget) return;
  window.__fotuStatsWidget = true;

  var TOPIC_NAMES = {
    book: "Booking", price: "Prices", discount: "Discounts", delivery: "Delivery time", travel: "Travel", services: "What we shoot",
    location: "Location", studio: "Studio / venue", availability: "Dates & availability", contact: "Contact details", instagram: "Instagram",
    team: "The team", portfolio: "Portfolio", experience: "Experience / reviews", hours: "Working hours", payment: "Payment & cancellation",
    raw: "Number of photos", prints: "Prints & albums", usage: "Usage rights", edit: "Editing", video: "Video", jobs: "Jobs & collabs",
    model: "Modelling", prepare: "What to wear / posing", group: "Group shoots", wedding: "Weddings", birthday: "Birthdays",
    babyshower: "Baby showers", housewarming: "Housewarmings", couple: "Couple shoots", corporate: "Corporate", events: "Events",
    food: "Food", pets: "Pets", portraits: "Portraits", products: "Products", realestate: "Real estate", travelshoot: "Travel shoots",
    family: "Family / kids", fashion: "Fashion", greeting: "Hello", howareyou: "How are you", whoareyou: "Who is Fotu",
    joke: "Jokes", fact: "Fun facts", compliment: "Compliments", insult: "Rude messages", thanks: "Thanks", bye: "Goodbye",
    selfie: "Selfie / say cheese", name: "Told their name", send_question: "Sent question to team", long_message: "Long messages",
    book_cancelled: "Booking cancelled", hidden: "Hid Fotu", email_shared: "Typed an email"
  };

  var css = [
    "#fsBtn{position:fixed;right:18px;bottom:64px;z-index:99998;border:1px solid #0a0a0a;background:#fff;color:#0a0a0a;border-radius:999px;padding:9px 18px;font:600 .74rem/1 'Inter',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.12)}",
    "#fsBtn:hover{background:#0a0a0a;color:#fff}",
    "#fsOv{display:none;position:fixed;inset:0;z-index:100000;background:#fafafa;overflow-y:auto;font-family:'Inter',system-ui,sans-serif;color:#0a0a0a}",
    "#fsOv.on{display:block}",
    "#fsOv .top{position:sticky;top:0;background:#fff;border-bottom:1px solid #e2e2e2;padding:14px 20px;display:flex;align-items:center;gap:12px;z-index:2}",
    "#fsOv .top b{font-size:15px}#fsOv .top select{margin-left:auto;font:inherit;font-size:13px;padding:7px 10px;border:1px solid #e2e2e2;border-radius:8px;background:#fff}",
    "#fsOv .top button{font:inherit;font-size:13px;padding:7px 14px;border:1px solid #0a0a0a;border-radius:8px;background:#fff;cursor:pointer}",
    "#fsOv main{max-width:960px;margin:0 auto;padding:24px 20px 60px}",
    "#fsOv .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}",
    "#fsOv .card{background:#fff;border:1px solid #e2e2e2;border-radius:12px;padding:14px}",
    "#fsOv .card b{display:block;font-size:26px;font-variant-numeric:tabular-nums}#fsOv .card span{font-size:12px;color:#6b6b6b}",
    "#fsOv h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b;margin:28px 0 10px}",
    "#fsOv .box{background:#fff;border:1px solid #e2e2e2;border-radius:12px;padding:16px}",
    "#fsOv .chart{display:flex;align-items:flex-end;gap:3px;height:150px}",
    "#fsOv .chart .d{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;height:100%;position:relative}",
    "#fsOv .chart .d i{display:block;border-radius:2px 2px 0 0}#fsOv .chart .d i.a{background:#378ADD}#fsOv .chart .d i.b{background:#EF9F27}",
    "#fsOv .chart .d:hover::after{content:attr(data-t);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:#0a0a0a;color:#fff;font-size:11px;padding:4px 7px;border-radius:6px;white-space:nowrap;z-index:3}",
    "#fsOv .legend{display:flex;gap:16px;font-size:12px;color:#6b6b6b;margin-top:10px}#fsOv .legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}",
    "#fsOv .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
    "#fsOv .row{display:flex;align-items:center;gap:10px;font-size:13px;padding:5px 0}",
    "#fsOv .row .n{width:150px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#fsOv .row .bar{flex:1;height:8px;background:#f0f0ee;border-radius:4px;overflow:hidden}",
    "#fsOv .row .bar i{display:block;height:100%;background:#0a0a0a;border-radius:4px}#fsOv .row .v{width:40px;text-align:right;font-variant-numeric:tabular-nums;color:#6b6b6b}",
    "#fsOv .q{font-size:13.5px;padding:9px 0;border-bottom:1px solid #f0f0ee;display:flex;gap:12px}#fsOv .q:last-child{border:0}#fsOv .q span{color:#9a9a9a;font-size:12px;white-space:nowrap}",
    "#fsOv .msg{background:#fff;border:1px solid #e2e2e2;border-radius:12px;padding:20px;font-size:14px;line-height:1.6}#fsOv .msg ol{padding-left:20px}",
    "#fsOv .note{font-size:12px;color:#9a9a9a;margin-top:28px}",
    "@media (max-width:760px){#fsOv .cards{grid-template-columns:repeat(2,1fr)}#fsOv .two{grid-template-columns:1fr}#fsOv .row .n{width:110px}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement("button");
  btn.id = "fsBtn"; btn.type = "button"; btn.textContent = "Fotu stats";
  var ov = document.createElement("div");
  ov.id = "fsOv";
  ov.innerHTML = '<div class="top"><b>Fotu stats</b><select id="fsMonth" aria-label="Month"></select><button type="button" id="fsRefresh">Refresh</button><button type="button" id="fsClose">Close</button></div><main id="fsMain"></main>';
  document.body.appendChild(btn); document.body.appendChild(ov);
  var main = ov.querySelector("#fsMain"), sel = ov.querySelector("#fsMonth"), data = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n(o, k) { return (o && o[k]) || 0; }
  function pct(a, b) { return b ? Math.round(a / b * 100) + "%" : "–"; }
  function token() {
    var keys = ["decap-cms-user", "netlify-cms-user"];
    for (var i = 0; i < keys.length; i++) {
      try { var u = JSON.parse(localStorage.getItem(keys[i]) || "null"); var t = u && (u.token || u.access_token || (u.backend && u.backend.token)); if (t) return t; } catch (e) {}
    }
    return null;
  }
  function monthName(m) {
    if (m === "all") return "All time";
    var p = m.split("-"); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  function msg(html) { main.innerHTML = '<div class="msg">' + html + "</div>"; }

  var SETUP = "<b>Fotu's stats storage isn't connected yet.</b> One-time setup in Cloudflare (about 2 minutes):" +
    "<ol><li>Cloudflare dashboard → <b>Storage &amp; Databases</b> → <b>KV</b> → <b>Create</b>. Name it <code>fotu-stats</code>.</li>" +
    "<li><b>Workers &amp; Pages</b> → your site → <b>Settings</b> → <b>Bindings</b> → <b>Add</b> → <b>KV namespace</b>.</li>" +
    "<li>Variable name: <code>FOTU_STATS</code> (exactly like that). Namespace: <code>fotu-stats</code>. Save.</li>" +
    "<li>Go to <b>Deployments</b> and press <b>Retry deployment</b> on the latest one (or just push any change to GitHub).</li></ol>" +
    "After that, numbers start counting from the next visitor.";

  function load() {
    var t = token();
    if (!t) { msg("Log in to the Content Editor first, then open Fotu stats again."); return; }
    msg("Loading...");
    fetch("/api/fotu-stats", { headers: { "Authorization": "Bearer " + t }, cache: "no-store" })
      .then(function (r) {
        if (r.status === 404 || r.status === 405) throw { setup404: true };
        return r.json().then(function (d) { return { status: r.status, d: d }; });
      })
      .then(function (res) {
        if (res.status === 503) { msg(SETUP); return; }
        if (res.status === 401) { msg("Your login doesn't have permission to see these stats. Log out of the Content Editor and log back in, then try again."); return; }
        if (res.status !== 200) { msg("Couldn't load the numbers (error " + res.status + "). Try Refresh."); return; }
        data = res.d; fillMonths(); render();
      })
      .catch(function (e) {
        if (e && e.setup404) msg("The stats service isn't deployed. Check that <code>functions/api/fotu-stats.js</code> is in the repo (inside the <code>functions/api</code> folder), then wait for Cloudflare to redeploy.");
        else msg("Couldn't reach the stats service. Check your connection and press Refresh.");
      });
  }
  function fillMonths() {
    var months = Object.keys(data.months || {}).sort().reverse(), cur = sel.value;
    sel.innerHTML = months.map(function (m) { return '<option value="' + m + '">' + esc(monthName(m)) + "</option>"; }).join("") + '<option value="all">All time</option>';
    if (cur && (cur === "all" || months.indexOf(cur) !== -1)) sel.value = cur;
  }
  function combined() {
    if (sel.value !== "all") return (data.months || {})[sel.value] || {};
    var out = { topics: {} };
    Object.keys(data.months || {}).forEach(function (k) {
      var m = data.months[k];
      Object.keys(m).forEach(function (f) {
        if (f === "topics") Object.keys(m.topics || {}).forEach(function (t) { out.topics[t] = (out.topics[t] || 0) + m.topics[t]; });
        else out[f] = (out[f] || 0) + m[f];
      });
    });
    return out;
  }
  function bars(rows, total) {
    if (!rows.length) return '<div style="font-size:13px;color:#9a9a9a">Nothing yet.</div>';
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; })) || 1;
    return rows.map(function (r) {
      return '<div class="row"><span class="n" title="' + esc(r[0]) + '">' + esc(r[0]) + '</span><span class="bar"><i style="width:' + Math.max(2, r[1] / max * 100) + '%"></i></span><span class="v">' + r[1] + "</span></div>";
    }).join("");
  }
  function render() {
    var m = combined();
    if (!Object.keys(data.months || {}).length) { main.innerHTML = '<div class="msg">No visits yet. Fotu is napping and waiting for its first visitor.</div>'; return; }
    var html = '<div class="cards">' +
      '<div class="card"><b>' + n(m, "woke") + '</b><span>Times Fotu was woken up</span></div>' +
      '<div class="card"><b>' + n(m, "opened") + '</b><span>Chats opened</span></div>' +
      '<div class="card"><b>' + n(m, "msgs") + '</b><span>Messages sent to Fotu</span></div>' +
      '<div class="card"><b>' + n(m, "sent") + '</b><span>Enquiries sent</span></div>' +
      '<div class="card"><b>' + pct(n(m, "sent"), n(m, "opened")) + '</b><span>Chats that became enquiries</span></div></div>';

    /* last 30 days */
    var days = [], max = 1;
    for (var i = 29; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), v = (data.days || {})[d] || {};
      days.push([d, n(v, "opened"), n(v, "msgs"), n(v, "sent")]);
      max = Math.max(max, n(v, "opened") + n(v, "msgs"));
    }
    html += "<h3>Last 30 days</h3><div class=\"box\"><div class=\"chart\">" + days.map(function (x) {
      var label = new Date(x[0] + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return '<div class="d" data-t="' + esc(label + ": " + x[1] + " chats, " + x[2] + " messages, " + x[3] + " enquiries") + '">' +
        '<i class="b" style="height:' + (x[2] / max * 100) + '%"></i><i class="a" style="height:' + (x[1] / max * 100) + '%"></i></div>';
    }).join("") + '</div><div class="legend"><span><i style="background:#378ADD"></i>Chats opened</span><span><i style="background:#EF9F27"></i>Messages</span><span>Hover a bar for details</span></div></div>';

    /* topics */
    var tp = Object.keys(m.topics || {}).map(function (k) { return [TOPIC_NAMES[k] || k.replace(/_/g, " "), m.topics[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15);
    html += '<div class="two"><div><h3>What people ask about most</h3><div class="box">' + bars(tp) + "</div></div>";

    /* where and on what */
    var where = [["Home page", n(m, "opened:home")], ["What We Capture", n(m, "opened:capture")], ["Other pages", n(m, "opened:other")]];
    var dev = [["Phone", n(m, "opened:phone")], ["Desktop", n(m, "opened:desktop")]];
    html += '<div><h3>Chats opened, by page</h3><div class="box">' + bars(where.filter(function (r) { return r[1]; })) + "</div>" +
      '<h3>Chats opened, by device</h3><div class="box">' + bars(dev.filter(function (r) { return r[1]; })) + "</div></div></div>";

    /* unanswered questions */
    var qs = [];
    Object.keys(data.unknown || {}).sort().reverse().forEach(function (k) {
      if (sel.value !== "all" && k !== sel.value) return;
      qs = qs.concat(data.unknown[k] || []);
    });
    html += "<h3>Questions Fotu couldn't answer</h3><div class=\"box\">" + (qs.length ? qs.slice(0, 60).map(function (q) {
      var when = new Date(q.t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return '<div class="q"><span>' + esc(when) + "</span>" + esc(q.q) + "</div>";
    }).join("") : '<div style="font-size:13px;color:#9a9a9a">None yet. Fotu is either very clever or very lonely.</div>') + "</div>";
    html += '<p class="note">Totals only. Emails and phone numbers are removed from unanswered questions before they are saved. Common questions here are good candidates for new answers in fotu.js.</p>';
    main.innerHTML = html;
  }

  btn.addEventListener("click", function () { ov.classList.add("on"); load(); });
  ov.querySelector("#fsClose").addEventListener("click", function () { ov.classList.remove("on"); });
  ov.querySelector("#fsRefresh").addEventListener("click", load);
  sel.addEventListener("change", function () { if (data) render(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("on")) ov.classList.remove("on"); });
})();
