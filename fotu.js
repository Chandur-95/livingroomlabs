/* Fotu — the walking instant-camera mascot for Living Room Labs.
   Self-contained: injects its own CSS and HTML. Include on any page with
   <script src="/fotu.js" defer></script> just before </body>. */
(function () {
  "use strict";
  if (window.__fotuLoaded) return;
  window.__fotuLoaded = true;

  /* ================= SCRIPT (edit the words here) ================= */
  var WELCOME = [
    "Hi! I'm Fotu. I walk around and print the best photos. Click me to chat!",
    "Oh, a visitor! Hold still... perfect. Printing your welcome."
  ];
  var CLICK_HELLO = ["You clicked me! Most people just admire my stripe.", "Ask a question or book a shoot."];
  var FAQ = [
    ["What do you shoot?", "Food, pets, events, portraits, travel, products, real estate. If it holds still, it's ours. Pets excepted."],
    ["How much?", "Less than a wedding caterer, more than a selfie. Send an enquiry and the humans will quote you."],
    ["How fast are photos?", "I'm instant. The humans take about a week, because they edit properly."],
    ["Do you travel?", "The photographers do. I take 4,000 steps per metre, so I'm slower."]
  ];
  var CATEGORIES = ["Food", "Pets", "Events", "Portraits", "Travel", "Products", "Real Estate"];
  var PHOTO_LINES = {
    "Food": ["Hold still, biryani. Printing... delicious.", "No dishes harmed. Several eaten afterwards."],
    "Pets": ["This good boy held still for 0.4 seconds. Printed!", "Model fee: two treats and a belly rub."],
    "Events": ["Everyone's dancing. I'm printing as fast as I can.", "An uncle just told me my settings are wrong."],
    "Portraits": ["Natural smile, take 23. Printing take 24.", "Don't shake me, I'm developing."],
    "Travel": ["I walked here for this view. On these legs.", "Postcard material. Literally, I print postcards."],
    "Products": ["That bottle has better lighting than my career.", "Is that dust? Crisis. Reprint."],
    "Real Estate": ["Wide-angle magic: 1BHK, palace energy.", "All lights on. Even the fridge one."]
  };
  var QUIPS = [
    "Shake it like a Polaroid picture? Please don't. It ruins the print.",
    "Bokeh is blur that went to art school.",
    "I'm instant. Your photos are not. The humans edit properly.",
    "Say cheese. Or paneer. I'm flexible.",
    "Golden hour is just the sun showing off.",
    "Fun fact: my rainbow stripe is load-bearing."
  ];
  var SLEEP_LINE = "Out of film... zzz";
  var PERSONAL_SPACE = "Personal space! Instant film is delicate.";
  var CLOSE_LINE = "Back to work. These photos won't print themselves.";
  var EMPTY_LINE = "Fotu needs actual words here.";

  /* ================= setup ================= */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var HIDE_KEY = "lrl_fotu_hidden", SENT_KEY = "lrl_fotu_sent";
  var SITE = {}, catBySrc = {};
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function base(src) {
    if (!src) return "";
    var f = String(src).split("?")[0].split("#")[0].split("/").pop() || "";
    return decodeURIComponent(f).replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  }

  /* map every photo file name to its category, so Fotu knows what it's looking at */
  fetch("/content.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    SITE = d || {};
    (d.photos || []).forEach(function (p) { if (p && p.src && p.category) catBySrc[base(p.src)] = p.category; });
  }).catch(function () {});

  /* ================= styles ================= */
  var css = [
    "#fotu-root{--f-paper:#ffffff;--f-ink:#111;--f-mute:#6b6b6b;--f-line:#e2e2e2;--f-soft:#f3f2ee;font-family:inherit}",
    "html[data-theme='dark'] #fotu-root{--f-paper:#161616;--f-ink:#f2f2f2;--f-mute:#9a9a9a;--f-line:#2e2e2e;--f-soft:#222}",
    "#fotu-bot{position:fixed;left:0;top:0;width:72px;height:72px;z-index:65;cursor:pointer;background:none;border:0;padding:0;-webkit-tap-highlight-color:transparent;transition:opacity .3s}",
    "#fotu-bot:focus-visible{outline:2px solid #378ADD;outline-offset:4px;border-radius:12px}",
    "#fotu-bot .fb{width:100%;height:100%;transform-origin:50% 100%}",
    "#fotu-bot.walk .fb{animation:fotuBob .3s ease-in-out infinite alternate}",
    "@keyframes fotuBob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-4px) rotate(3deg)}}",
    "#fotu-bot .l1,#fotu-bot .l2{transform-box:fill-box;transform-origin:50% 0}",
    "#fotu-bot.walk .l1{animation:fotuLeg .3s infinite alternate}#fotu-bot.walk .l2{animation:fotuLeg .3s infinite alternate-reverse}",
    "@keyframes fotuLeg{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}",
    "#fotu-bot.hop .fb{animation:fotuHop .5s ease-out}",
    "@keyframes fotuHop{40%{transform:translateY(-22px) rotate(-6deg)}100%{transform:none}}",
    "#fotu-bot .ey{transform-box:fill-box;transform-origin:50% 50%;transition:transform .08s}#fotu-bot .ey.cl{transform:scaleY(.1)}",
    "#fotu-bot .pr{transform:translateY(-22px);transition:transform .6s cubic-bezier(.3,1.4,.6,1)}#fotu-bot .pr.out{transform:translateY(14px)}",
    "#fotu-bot .zz{position:absolute;right:-6px;top:-14px;font-size:13px;color:var(--f-mute);display:none;pointer-events:none}",
    "#fotu-bot.sleep .zz{display:block;animation:fotuZz 1.6s infinite}",
    "@keyframes fotuZz{0%{opacity:0;transform:translateY(4px)}50%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}",
    "#fotu-bub{position:fixed;z-index:66;max-width:230px;background:var(--f-paper);color:var(--f-ink);border:1px solid var(--f-line);border-radius:14px;padding:9px 12px;font-size:13.5px;line-height:1.45;box-shadow:0 6px 24px rgba(0,0,0,.12);display:none;pointer-events:none}",
    "#fotu-bub.on{display:block;animation:fotuPop .2s ease-out}",
    "@keyframes fotuPop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}",
    ".fotu-flash{position:fixed;z-index:64;background:#fff;border-radius:6px;pointer-events:none;animation:fotuFlash .5s ease-out forwards}",
    "@keyframes fotuFlash{0%{opacity:.9}100%{opacity:0}}",
    "#fotu-panel{position:fixed;z-index:67;width:310px;height:420px;max-height:calc(100vh - 24px);background:var(--f-paper);color:var(--f-ink);border:1px solid var(--f-line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden;font-size:14px}",
    "#fotu-panel.on{display:flex;animation:fotuPop .2s ease-out}",
    "#fotu-panel .fh{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--f-line)}",
    "#fotu-panel .fh b{display:block;font-size:14px}#fotu-panel .fh span{font-size:11.5px;color:var(--f-mute)}",
    "#fotu-panel .fx{margin-left:auto;display:flex;gap:4px}",
    "#fotu-panel .fx button{background:none;border:0;color:var(--f-mute);cursor:pointer;font-size:12px;padding:6px;border-radius:8px;font-family:inherit}",
    "#fotu-panel .fx button:hover{background:var(--f-soft);color:var(--f-ink)}",
    "#fotu-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}",
    ".fotu-m{max-width:86%;padding:8px 12px;border-radius:14px;line-height:1.45;font-size:13.5px;white-space:pre-wrap;word-wrap:break-word}",
    ".fotu-m.b{background:var(--f-soft);align-self:flex-start;border-bottom-left-radius:4px}",
    ".fotu-m.u{background:var(--f-ink);color:var(--f-paper);align-self:flex-end;border-bottom-right-radius:4px}",
    "#fotu-chips{padding:10px 12px;border-top:1px solid var(--f-line);display:flex;flex-wrap:wrap;gap:6px}",
    "#fotu-chips button{font:inherit;font-size:12.5px;padding:6px 11px;border-radius:999px;border:1px solid var(--f-line);background:var(--f-paper);color:var(--f-ink);cursor:pointer}",
    "#fotu-chips button:hover{border-color:var(--f-ink)}",
    "#fotu-in{display:none;padding:10px 12px;border-top:1px solid var(--f-line);gap:6px}",
    "#fotu-in input{flex:1;min-width:0;font:inherit;font-size:16px;padding:8px 10px;border-radius:10px;border:1px solid var(--f-line);background:var(--f-paper);color:var(--f-ink)}",
    "#fotu-in button{font:inherit;font-size:13px;padding:8px 14px;border-radius:10px;border:0;background:var(--f-ink);color:var(--f-paper);cursor:pointer}",
    "#fotu-err{display:none;color:#c0392b;font-size:12px;padding:0 14px 10px}",
    "#fotu-back{position:fixed;left:14px;bottom:14px;z-index:65;width:34px;height:34px;border-radius:50%;border:1px solid var(--f-line);background:var(--f-paper);cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.12)}",
    "#fotu-root.paused #fotu-bot,#fotu-root.paused #fotu-bub,#fotu-root.paused #fotu-back{opacity:0;pointer-events:none}",
    "@media (max-width:640px){#fotu-bot{width:56px;height:56px}#fotu-panel{left:8px!important;right:8px;width:auto!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px));height:min(440px,70vh)}#fotu-bub{max-width:200px;font-size:13px}}"
  ].join("\n");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ================= markup ================= */
  var SVG =
    '<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible" aria-hidden="true">' +
    '<g class="pr"><rect x="30" y="64" width="40" height="28" rx="2" fill="#fff" stroke="#B4B2A9"/><rect class="pimg" x="34" y="67" width="32" height="17" fill="#FAC775"/></g>' +
    '<line class="l1" x1="32" y1="78" x2="32" y2="96" stroke="#5F5E5A" stroke-width="5" stroke-linecap="round"/>' +
    '<line class="l2" x1="68" y1="78" x2="68" y2="96" stroke="#5F5E5A" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="12" y="26" width="76" height="54" rx="14" fill="#FFFFFF" stroke="#B4B2A9" stroke-width="1.5"/>' +
    '<rect x="46" y="26" width="3" height="54" fill="#E24B4A"/><rect x="49" y="26" width="3" height="54" fill="#EF9F27"/>' +
    '<rect x="52" y="26" width="3" height="54" fill="#639922"/><rect x="55" y="26" width="3" height="54" fill="#378ADD"/>' +
    '<rect class="fbulb" x="66" y="32" width="14" height="9" rx="2" fill="#444441"/>' +
    '<g class="ey"><circle cx="30" cy="52" r="10" fill="#2C2C2A"/><circle class="p1" cx="33" cy="49" r="3" fill="#fff"/></g>' +
    '<g class="ey"><circle cx="70" cy="56" r="7" fill="#2C2C2A"/><circle class="p2" cx="72" cy="54" r="2" fill="#fff"/></g>' +
    '<path d="M40 70 Q50 76 60 70" stroke="#444441" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var root = document.createElement("div");
  root.id = "fotu-root";
  root.innerHTML =
    '<div id="fotu-bub" role="status" aria-live="polite"></div>' +
    '<button id="fotu-bot" type="button" aria-label="Chat with Fotu"><div class="fb"><span class="zz">z z</span>' + SVG + '</div></button>' +
    '<button id="fotu-back" type="button" aria-label="Bring Fotu back" title="Bring Fotu back">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--f-ink)"><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/></svg></button>' +
    '<div id="fotu-panel" role="dialog" aria-label="Chat with Fotu">' +
      '<div class="fh"><div style="width:30px;height:30px">' + SVG.replace('class="pr"', 'class="pr" style="display:none"') + '</div>' +
        '<div><b>Fotu</b><span>Instant camera. Instant opinions.</span></div>' +
        '<div class="fx"><button type="button" id="fotu-hide" title="Hide Fotu">Hide</button>' +
        '<button type="button" id="fotu-close" aria-label="Close chat">&#10005;</button></div></div>' +
      '<div id="fotu-log" aria-live="polite"></div>' +
      '<div id="fotu-chips"></div>' +
      '<form id="fotu-in" autocomplete="on"><input id="fotu-inp" type="text" aria-label="Your answer"><button type="submit">Send</button></form>' +
      '<div id="fotu-err">' + EMPTY_LINE + '</div>' +
    '</div>';
  document.body.appendChild(root);

  function $(id) { return document.getElementById(id); }
  var bot = $("fotu-bot"), bub = $("fotu-bub"), panel = $("fotu-panel"), logEl = $("fotu-log"),
      chipsEl = $("fotu-chips"), inForm = $("fotu-in"), inp = $("fotu-inp"), errEl = $("fotu-err"), back = $("fotu-back");
  var printEl = bot.querySelector(".pr"), printImg = bot.querySelector(".pimg"), fbulb = bot.querySelector(".fbulb"),
      p1 = bot.querySelector(".p1"), p2 = bot.querySelector(".p2");

  /* ================= position & movement ================= */
  function size() { return bot.offsetWidth || 72; }
  function cssPx(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    var n = parseFloat(v); return isNaN(n) ? 0 : n;
  }
  function bounds() {
    var s = size();
    var top = Math.max(cssPx("--header-h"), cssPx("--nav-h"), 70) + 8;
    var bottom = window.innerHeight - cssPx("--foot-h") - s - 10;
    if (bottom < top) bottom = top;
    return { minX: 6, maxX: window.innerWidth - s - 6, minY: top, maxY: bottom };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var pos = { x: 0, y: 0 }, dir = 1, walking = false, walkTimer = null, isOpen = false, hidden = read(HIDE_KEY) === "1";
  var paused = false, idle = 0, bubTimer = null, printTimer = null;

  function place() {
    bot.style.transform = "translate(" + Math.round(pos.x) + "px," + Math.round(pos.y) + "px)";
    bot.querySelector(".fb").style.scale = dir < 0 ? "-1 1" : "";
  }
  function startPos() {
    var b = bounds();
    pos.x = b.maxX - 10; pos.y = b.maxY; place();
  }
  function look(dx, dy) {
    dx = clamp(dx, -4, 4); dy = clamp(dy, -3, 3);
    p1.setAttribute("cx", 30 + dx); p1.setAttribute("cy", 52 + dy);
    p2.setAttribute("cx", 70 + dx * 0.7); p2.setAttribute("cy", 56 + dy * 0.7);
  }
  function stopWalk() {
    clearTimeout(walkTimer); walking = false;
    var r = bot.getBoundingClientRect(); pos.x = r.left; pos.y = r.top;
    bot.style.transition = "none"; bot.classList.remove("walk"); place();
  }
  function walkTo(x, y, cb) {
    if (reduceMotion) { cb && cb(); return; }
    var b = bounds();
    x = clamp(x, b.minX, b.maxX); y = clamp(y, b.minY, b.maxY);
    var d = Math.hypot(x - pos.x, y - pos.y), ms = Math.max(400, d * 8);
    dir = x < pos.x ? -1 : 1;
    bot.classList.remove("sleep"); bot.classList.add("walk");
    hideBubble(); printEl.classList.remove("out");
    bot.style.transition = "transform " + ms + "ms linear";
    pos.x = x; pos.y = y; walking = true; place(); look(3, 0);
    clearTimeout(walkTimer);
    walkTimer = setTimeout(function () {
      walking = false; bot.classList.remove("walk"); bot.style.transition = "none"; look(0, 0); cb && cb();
    }, ms);
  }
  function hop() { if (reduceMotion) return; bot.classList.add("hop"); setTimeout(function () { bot.classList.remove("hop"); }, 500); }
  function blink() {
    var eyes = bot.querySelectorAll(".ey");
    eyes.forEach(function (e) { e.classList.add("cl"); });
    setTimeout(function () { eyes.forEach(function (e) { e.classList.remove("cl"); }); }, 130);
  }

  /* ================= speech bubble ================= */
  function bubble(text, ms) {
    if (isOpen || hidden || paused) return;
    clearTimeout(bubTimer);
    bub.textContent = text; bub.classList.remove("on"); void bub.offsetWidth; bub.classList.add("on");
    var bw = bub.offsetWidth, bh = bub.offsetHeight, s = size();
    var left = clamp(pos.x + s / 2 - bw / 2, 8, window.innerWidth - bw - 8);
    var top = pos.y - bh - 8; if (top < 8) top = pos.y + s + 8;
    bub.style.left = left + "px"; bub.style.top = top + "px";
    bubTimer = setTimeout(hideBubble, ms || 4000);
  }
  function hideBubble() { clearTimeout(bubTimer); bub.classList.remove("on"); }

  /* ================= photos ================= */
  function visiblePhotos() {
    var out = [], b = bounds();
    document.querySelectorAll("img").forEach(function (img) {
      if (root.contains(img)) return;
      var src = img.currentSrc || img.src || "";
      if (!src || /logo/i.test(src)) return;
      var r = img.getBoundingClientRect();
      if (r.width < 90 || r.height < 70) return;
      if (r.bottom < b.minY + 20 || r.top > b.maxY + size() - 20 || r.right < 20 || r.left > window.innerWidth - 20) return;
      var cs = getComputedStyle(img);
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.2) return;
      out.push(img);
    });
    return out;
  }
  function categoryOf(img) {
    var c = catBySrc[base(img.currentSrc || img.src)];
    if (c) return c;
    var card = img.closest("[data-cat],[data-category]");
    if (card) return card.getAttribute("data-cat") || card.getAttribute("data-category");
    return null;
  }
  function lineFor(cat) {
    if (cat && PHOTO_LINES[cat]) return pick(PHOTO_LINES[cat]);
    for (var k in PHOTO_LINES) if (cat && k.toLowerCase() === String(cat).toLowerCase()) return pick(PHOTO_LINES[k]);
    return pick(QUIPS);
  }
  var PRINT_COLORS = { "Food": "#F0997B", "Pets": "#FAC775", "Events": "#ED93B1", "Portraits": "#AFA9EC", "Travel": "#85B7EB", "Products": "#5DCAA5", "Real Estate": "#B4B2A9" };

  function shoot(img) {
    var r = img.getBoundingClientRect();
    if (r.width < 10) return;
    look(0, -3);
    setTimeout(function () {
      if (isOpen || paused) return;
      fbulb.setAttribute("fill", "#FFF8D6");
      setTimeout(function () { fbulb.setAttribute("fill", "#444441"); }, 200);
      var rr = img.getBoundingClientRect();
      var f = document.createElement("div");
      f.className = "fotu-flash";
      f.style.cssText = "left:" + rr.left + "px;top:" + rr.top + "px;width:" + rr.width + "px;height:" + rr.height + "px";
      document.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 600);
      var cat = categoryOf(img);
      printImg.setAttribute("fill", PRINT_COLORS[cat] || "#FAC775");
      setTimeout(function () { printEl.classList.add("out"); }, 250);
      clearTimeout(printTimer);
      printTimer = setTimeout(function () { printEl.classList.remove("out"); }, 3600);
      bubble(lineFor(cat));
    }, 350);
  }
  function visit(img) {
    var list = img ? [img] : visiblePhotos();
    if (!list.length) { wanderQuip(); return; }
    var t = img || pick(list), r = t.getBoundingClientRect(), s = size();
    var tx = r.left + r.width / 2 - s / 2;
    var ty = r.bottom - s * 0.6;
    walkTo(tx, ty, function () { shoot(t); });
  }
  function wanderQuip() {
    var b = bounds();
    walkTo(b.minX + Math.random() * (b.maxX - b.minX), b.minY + Math.random() * (b.maxY - b.minY), function () { hop(); bubble(pick(QUIPS)); });
  }

  /* ================= behaviour loop ================= */
  function tick() {
    if (isOpen || hidden || paused || walking || document.hidden) return;
    idle++;
    var r = Math.random();
    if (idle > 6 && r < 0.3) { bot.classList.add("sleep"); bubble(SLEEP_LINE, 2600); idle = 0; return; }
    if (bot.classList.contains("sleep") && r < 0.5) return; /* let it nap a little */
    if (r < 0.55) visit();
    else if (r < 0.75) wanderQuip();
    else { blink(); hop(); }
  }
  setInterval(function () { if (Math.random() < 0.5 && !hidden) blink(); }, 2200);

  /* pause and hide while the site's photo viewer or enquiry form is open */
  function overlayOpen() {
    return !!document.querySelector("#capLb.on, #capEnq.on, #lb.on, #lb[open], .lb.on, .enquiry-modal.open, body.bulk-open");
  }
  setInterval(function () {
    var o = overlayOpen();
    if (o !== paused) {
      paused = o;
      root.classList.toggle("paused", paused);
      if (paused) { hideBubble(); if (walking) stopWalk(); if (isOpen) closeChat(true); }
    }
  }, 400);

  /* the eye follows the mouse; get too close and Fotu scurries away */
  var lastScurry = 0;
  if (finePointer) {
    document.addEventListener("mousemove", function (e) {
      if (hidden || paused || isOpen) return;
      var s = size(), cx = pos.x + s / 2, cy = pos.y + s / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      if (!walking) look(dx / 30 * dir, dy / 30);
      var d = Math.hypot(dx, dy);
      if (d < 60 && !walking && Date.now() - lastScurry > 8000 && Math.random() < 0.05) {
        lastScurry = Date.now();
        bubble(PERSONAL_SPACE, 2000);
        setTimeout(function () { walkTo(pos.x - Math.sign(dx || 1) * 150, pos.y - Math.sign(dy || 1) * 60); }, 300);
      }
    }, { passive: true });

    /* hover on a photo for a moment and Fotu comes over to shoot it */
    var hoverTimer = null, lastHoverShot = 0;
    document.addEventListener("mouseover", function (e) {
      var img = e.target && e.target.tagName === "IMG" ? e.target : null;
      clearTimeout(hoverTimer);
      if (!img || root.contains(img) || hidden || paused || isOpen) return;
      hoverTimer = setTimeout(function () {
        if (Date.now() - lastHoverShot < 9000 || walking) return;
        if (visiblePhotos().indexOf(img) === -1) return;
        lastHoverShot = Date.now(); idle = 0; visit(img);
      }, 1200);
    }, { passive: true });
  }

  window.addEventListener("resize", function () {
    var b = bounds();
    pos.x = clamp(pos.x, b.minX, b.maxX); pos.y = clamp(pos.y, b.minY, b.maxY);
    if (!walking) place();
    if (isOpen) placePanel();
  });

  /* ================= chat ================= */
  function say(text, who) {
    var m = document.createElement("div");
    m.className = "fotu-m " + (who || "b");
    m.textContent = text;
    logEl.appendChild(m);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function chips(list, fn) {
    chipsEl.innerHTML = ""; chipsEl.style.display = "flex"; inForm.style.display = "none";
    list.forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.addEventListener("click", function () { fn(label); });
      chipsEl.appendChild(b);
    });
  }
  var step = null, enq = {}, chatOpenedAt = 0, sending = false;

  function home() {
    step = null;
    chips(FAQ.map(function (f) { return f[0]; }).concat(["Book a shoot"]), function (label) {
      say(label, "u");
      if (label === "Book a shoot") { enq = {}; ask("Business! What's your name?", "name", "text", "name"); return; }
      var f = FAQ.filter(function (x) { return x[0] === label; })[0];
      setTimeout(function () { say(f[1]); }, 350);
    });
  }
  function ask(text, s, type, autoc) {
    step = s;
    chipsEl.style.display = "none"; inForm.style.display = "flex"; errEl.style.display = "none";
    inp.type = type || "text"; inp.value = "";
    inp.setAttribute("autocomplete", autoc || "off");
    inp.setAttribute("maxlength", s === "msg" ? "500" : "120");
    setTimeout(function () { say(text); inp.focus(); }, 350);
  }
  inp.addEventListener("input", function () { errEl.style.display = "none"; });
  inForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    var v = inp.value.trim();
    if (!v) { errEl.style.display = "block"; return; }
    inp.value = "";
    say(v, "u");
    if (step === "name") {
      enq.name = v;
      inForm.style.display = "none";
      setTimeout(function () { say("Lovely name, " + v + ". Very photogenic. What are we shooting?"); }, 350);
      chips(CATEGORIES, function (c) {
        say(c, "u"); enq.cat = c;
        ask(c === "Pets" ? "Is the model well-behaved? Asking for me. Your email?" : "Great taste. Your email, so the humans can reply?", "email", "email", "email");
      });
    } else if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setTimeout(function () { say("That email came out blurry. Try again?"); }, 300); return; }
      enq.email = v;
      ask("Tell me about the shoot: dates, ideas, wild dreams.", "msg", "text", "off");
    } else if (step === "msg") {
      enq.msg = v;
      send();
    }
  });

  function send() {
    inForm.style.display = "none";
    var last = parseInt(read(SENT_KEY) || "0", 10);
    if (Date.now() - last < 30000) { say("Easy, I'm still printing the last one. Try again in a few seconds."); home(); return; }
    if (Date.now() - chatOpenedAt < 4000) { say("That was fast. Suspiciously fast. Try once more?"); home(); return; }
    sending = true;
    say("Printing...");
    var formId = SITE.formspreeId || "xjykvnoz";
    var payload = {
      name: enq.name, email: enq.email, category: enq.cat, message: enq.msg,
      _replyto: enq.email,
      _subject: "New enquiry via Fotu: " + enq.cat + " shoot (" + enq.name + ")",
      source: "Fotu chatbot (" + location.pathname + ")",
      _gotcha: ""
    };
    fetch("https://formspree.io/f/" + formId, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("bad status");
      store(SENT_KEY, String(Date.now()));
      sending = false;
      say("Printed and sent! " + enq.cat + " shoot for " + enq.name + ". Reply coming to " + enq.email + ".");
      home();
    }).catch(function () {
      sending = false;
      say("My printer jammed. Opening your email app so nothing gets lost.");
      var to = SITE.email || "hello@livingroomlabs.in";
      window.location.href = "mailto:" + to +
        "?subject=" + encodeURIComponent("Enquiry: " + enq.cat + " — " + enq.name) +
        "&body=" + encodeURIComponent("Name: " + enq.name + "\nEmail: " + enq.email + "\nCategory: " + enq.cat + "\n\nMessage:\n" + enq.msg);
      home();
    });
  }

  function placePanel() {
    if (window.innerWidth <= 640) { panel.style.left = ""; panel.style.top = ""; return; }
    var s = size(), w = 310, h = Math.min(420, window.innerHeight - 24);
    var left = pos.x + s + 10; if (left + w > window.innerWidth - 12) left = pos.x - w - 10;
    left = clamp(left, 12, window.innerWidth - w - 12);
    var top = clamp(pos.y + s - h, 12, window.innerHeight - h - 12);
    panel.style.left = left + "px"; panel.style.top = top + "px";
  }
  function openChat() {
    if (walking) stopWalk();
    isOpen = true; hideBubble();
    bot.classList.remove("sleep"); idle = 0;
    placePanel(); panel.classList.add("on");
    chatOpenedAt = Date.now();
    hop();
    if (!logEl.children.length) {
      say(CLICK_HELLO[0]);
      setTimeout(function () { say(CLICK_HELLO[1]); }, 500);
      home();
    }
    setTimeout(function () { var f = chipsEl.querySelector("button"); if (inForm.style.display === "flex") inp.focus(); else if (f) f.focus(); }, 60);
  }
  function closeChat(silent) {
    if (!isOpen) return;
    isOpen = false; panel.classList.remove("on");
    if (!silent) { bot.focus(); setTimeout(function () { bubble(CLOSE_LINE, 2600); }, 150); }
  }
  bot.addEventListener("click", function () { isOpen ? closeChat() : openChat(); });
  $("fotu-close").addEventListener("click", function () { closeChat(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) { e.stopPropagation(); closeChat(); }
  }, true);
  document.addEventListener("mousedown", function (e) {
    if (isOpen && !panel.contains(e.target) && !bot.contains(e.target)) closeChat(true);
  });

  /* ================= hide / bring back ================= */
  function applyHidden() {
    bot.style.display = hidden ? "none" : "";
    back.style.display = hidden ? "flex" : "none";
    if (hidden) { hideBubble(); closeChat(true); if (walking) stopWalk(); }
  }
  $("fotu-hide").addEventListener("click", function () { hidden = true; store(HIDE_KEY, "1"); applyHidden(); });
  back.addEventListener("click", function () {
    hidden = false; store(HIDE_KEY, null); applyHidden();
    startPos(); hop(); bubble("I'm back! Did you miss me? Don't answer that.", 3000);
  });

  /* ================= start ================= */
  startPos();
  applyHidden();
  setTimeout(function () {
    if (hidden || paused) return;
    var b = bounds();
    walkTo(b.maxX - 120, b.maxY, function () {
      hop();
      printImg.setAttribute("fill", "#85B7EB");
      printEl.classList.add("out");
      bubble(pick(WELCOME), 5000);
      setTimeout(function () { printEl.classList.remove("out"); }, 4200);
    });
  }, 1200);
  setInterval(tick, 5500);
})();
