/* Living Room Labs - pieces shared by every page (home page + What We Capture).
   Keep ONE copy of these here so the pages can never drift apart again.

   1. Logo trim  - the logo files have a band of empty, see-through space above and below the
                   artwork (about 18% of the image each side). That empty band is why the logo never
                   lined up with the text next to it. Any logo placed inside an element with the
                   class "lg-crop" is measured once and shown with that empty space cut away, so the
                   visible artwork lines up exactly. Works for any logo uploaded in future too.
   2. Enquiry    - the one enquiry window used everywhere. Pages open it with
                   LRL.enquiry.open({ category: "Events", eventType: "Birthday" }). */
(function () {
  "use strict";
  var LRL = window.LRL = window.LRL || {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function assign(a, b) { var o = {}, k; for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) o[k] = a[k]; for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) o[k] = b[k]; return o; }

  /* =====================================================================================
     1. LOGO TRIM
     ===================================================================================== */
  var TRIM_KEY = "lrl-logo-trim-v1:";
  var trimMemo = {};

  function readTrim(src) {
    if (trimMemo[src]) return trimMemo[src];
    try { var s = sessionStorage.getItem(TRIM_KEY + src); if (s) return (trimMemo[src] = JSON.parse(s)); } catch (e) {}
    return null;
  }
  function saveTrim(src, t) {
    trimMemo[src] = t;
    try { sessionStorage.setItem(TRIM_KEY + src, JSON.stringify(t)); } catch (e) {}
  }
  function applyTrim(box, t) {
    box.style.setProperty("--lg-ar", String(t.ar));
    box.style.setProperty("--lg-w", t.w + "%");
    box.style.setProperty("--lg-l", t.l + "%");
    box.style.setProperty("--lg-t", t.t + "%");
    box.classList.add("lg-ready");
  }
  function noTrim(img) {
    var w = img.naturalWidth || 1, h = img.naturalHeight || 1;
    return { ar: +(w / h).toFixed(4), w: 100, l: 0, t: 0 };
  }
  /* finds the smallest box around everything that isn't empty space */
  function measure(img) {
    var W = img.naturalWidth, H = img.naturalHeight;
    if (!W || !H) return null;
    var scale = Math.min(1, 480 / Math.max(W, H));
    var cw = Math.max(1, Math.round(W * scale)), ch = Math.max(1, Math.round(H * scale));
    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, cw, ch);
    var d = ctx.getImageData(0, 0, cw, ch).data;      /* throws for a logo on another website - handled below */
    /* see-through background -> ignore transparent pixels; solid white background -> ignore near-white ones */
    var cornerA = Math.min(d[3], d[(cw - 1) * 4 + 3], d[((ch - 1) * cw) * 4 + 3], d[((ch - 1) * cw + cw - 1) * 4 + 3]);
    var solidBg = cornerA > 200;
    var minX = cw, minY = ch, maxX = -1, maxY = -1;
    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++) {
        var i = (y * cw + x) * 4, ink;
        if (solidBg) ink = d[i + 3] > 8 && (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235);
        else ink = d[i + 3] > 8;
        if (ink) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
    }
    if (maxX < 0) return noTrim(img);
    /* back to the photo's real pixels, with 1px of breathing room so nothing is shaved off */
    var x0 = Math.max(0, minX / scale - 1), y0 = Math.max(0, minY / scale - 1);
    var x1 = Math.min(W, (maxX + 1) / scale + 1), y1 = Math.min(H, (maxY + 1) / scale + 1);
    var bw = x1 - x0, bh = y1 - y0;
    if (bw < W * 0.2 || bh < H * 0.2) return noTrim(img);  /* something odd - show the whole file */
    return {
      ar: +(bw / bh).toFixed(4),
      w: +(W / bw * 100).toFixed(3),
      l: +(-x0 / bw * 100).toFixed(3),
      t: +(-y0 / bw * 100).toFixed(3)      /* margins in % are measured against the box WIDTH, so bw is right here */
    };
  }
  function trimOne(img) {
    var box = img.parentElement;
    if (!box) return;
    var src = img.currentSrc || img.src;
    if (!src) return;
    var cached = readTrim(src);
    if (cached) { applyTrim(box, cached); return; }
    if (!img.complete || !img.naturalWidth) return;       /* the load listener below comes back for it */
    var t;
    try { t = measure(img); } catch (e) { t = noTrim(img); }
    if (!t) return;
    saveTrim(src, t);
    applyTrim(box, t);
  }
  LRL.trimLogos = function (root) {
    var imgs = (root || document).querySelectorAll(".lg-crop > img");
    Array.prototype.forEach.call(imgs, function (img) {
      if (!img.__lgBound) {
        img.__lgBound = true;
        /* stays attached: the home page swaps in the logo from the Content Editor after loading */
        img.addEventListener("load", function () { trimOne(img); });
      }
      trimOne(img);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { LRL.trimLogos(); });
  else LRL.trimLogos();

  /* =====================================================================================
     2. ENQUIRY WINDOW
     ===================================================================================== */
  var DEFAULT_CATS = ["Food", "Pets", "Real Estate", "Products", "Events", "Portraits", "Travel"];
  var DEFAULT_EVENTS = ["Birthday", "Wedding", "Baby Shower", "Housewarming", "Couple Shoot", "Performing Arts", "Miss Universe"];
  var cfg = { formspreeId: "xjykvnoz", email: "hello@livingroomlabs.in", categories: DEFAULT_CATS.slice(), eventTypes: [] };

  var CSS = [
    "html.lrl-enq-open,html.lrl-enq-open body{overflow:hidden}",
    "#lrlEnq{--e-paper:#FFFFFF;--e-ink:#000000;--e-line:rgba(0,0,0,.14);",
    "  position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;",
    "  background:rgba(0,0,0,.6);padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(16px + env(safe-area-inset-bottom,0px));",
    "  overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;",
    "  font-family:'Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;text-align:left}",
    "html[data-theme=\"dark\"] #lrlEnq{--e-paper:#080808;--e-ink:#FFFFFF;--e-line:rgba(255,255,255,.16)}",
    "#lrlEnq *{box-sizing:border-box}",
    "#lrlEnq.on{display:flex}",
    "#lrlEnq .lrl-enq-card{width:100%;max-width:520px;margin:auto;background:var(--e-paper);color:var(--e-ink);",
    "  border:1px solid var(--e-line);border-radius:10px;padding:26px 26px 22px;box-shadow:0 30px 80px rgba(0,0,0,.45)}",
    "#lrlEnq.on .lrl-enq-card{animation:lrlEnqIn .22s cubic-bezier(.2,.8,.2,1)}",
    "@keyframes lrlEnqIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}",
    "@media (prefers-reduced-motion:reduce){#lrlEnq.on .lrl-enq-card{animation:none}}",
    "#lrlEnq .lrl-enq-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:0 0 18px}",
    "#lrlEnq .lrl-enq-head h2{margin:0;font:600 1.25rem/1.25 'Inter',system-ui,sans-serif;letter-spacing:0;text-transform:none;color:var(--e-ink)}",
    "#lrlEnq .lrl-enq-head p{margin:3px 0 0;font:400 .72rem/1.4 'JetBrains Mono',monospace;opacity:.6;letter-spacing:0;text-transform:none}",
    "#lrlEnq .lrl-enq-close{background:none;border:none;color:var(--e-ink);opacity:.65;cursor:pointer;",
    "  font:400 .74rem/1 'JetBrains Mono',monospace;letter-spacing:.04em;padding:6px 0;white-space:nowrap;margin:0}",
    "#lrlEnq .lrl-enq-close:hover,#lrlEnq .lrl-enq-close:focus-visible{opacity:1}",
    "@media (hover:none){#lrlEnq .lrl-enq-esc{display:none}}",
    "#lrlEnq .lrl-enq-field{margin:0 0 14px}",
    "#lrlEnq .lrl-enq-field label{display:block;font:500 .66rem/1.2 'Inter',system-ui,sans-serif;letter-spacing:.12em;",
    "  text-transform:uppercase;opacity:.6;margin:0 0 6px;color:var(--e-ink)}",
    "#lrlEnq .lrl-enq-field input,#lrlEnq .lrl-enq-field select,#lrlEnq .lrl-enq-field textarea{",
    "  display:block;width:100%;margin:0;background:transparent;color:var(--e-ink);border:1px solid var(--e-line);border-radius:6px;",
    "  padding:10px 12px;font:400 16px/1.35 'Inter',system-ui,sans-serif;letter-spacing:0;text-transform:none;box-shadow:none;outline:none;",
    "  -webkit-appearance:none;appearance:none}",
    /* 16px text stops iPhones zooming the page when a field is tapped; scaled back visually on larger screens */
    "@media (min-width:641px){#lrlEnq .lrl-enq-field input,#lrlEnq .lrl-enq-field select,#lrlEnq .lrl-enq-field textarea{font-size:.92rem}}",
    "#lrlEnq .lrl-enq-field select{padding-right:34px;cursor:pointer;",
    "  background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);",
    "  background-position:calc(100% - 17px) 50%,calc(100% - 12px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat}",
    "#lrlEnq .lrl-enq-field select option{color:#000;background:#fff}",
    "#lrlEnq .lrl-enq-field textarea{min-height:110px;resize:vertical}",
    "#lrlEnq .lrl-enq-field input::placeholder,#lrlEnq .lrl-enq-field textarea::placeholder{color:var(--e-ink);opacity:.4}",
    "#lrlEnq .lrl-enq-field input:focus,#lrlEnq .lrl-enq-field select:focus,#lrlEnq .lrl-enq-field textarea:focus{border-color:var(--e-ink)}",
    "#lrlEnq .lrl-enq-count{font:400 .64rem/1 'JetBrains Mono',monospace;opacity:.5;text-align:right;margin-top:5px}",
    "#lrlEnq .lrl-enq-hp{position:absolute !important;left:-9999px;width:1px;height:1px;overflow:hidden}",
    "#lrlEnq .lrl-enq-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:6px}",
    "#lrlEnq .lrl-enq-status{font:400 .68rem/1.4 'JetBrains Mono',monospace;letter-spacing:.08em;opacity:.7}",
    "#lrlEnq .lrl-enq-send{background:var(--e-ink);color:var(--e-paper);border:1px solid var(--e-ink);border-radius:999px;",
    "  padding:11px 24px;margin:0;font:600 .76rem/1 'Inter',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}",
    "#lrlEnq .lrl-enq-send:disabled{opacity:.45;cursor:not-allowed}",
    "#lrlEnq :focus-visible{outline:2px solid var(--e-ink);outline-offset:2px}",
    "#lrlEnq .lrl-enq-field :focus-visible{outline:none}",
    "@media (max-width:640px){#lrlEnq .lrl-enq-card{padding:22px 18px 18px}}"
  ].join("\n");

  var MARKUP =
    '<div class="lrl-enq-card" role="document">' +
      '<div class="lrl-enq-head">' +
        '<div>' +
          '<h2 id="lrlEnqTitle">Enquiry</h2>' +
          '<p>Every frame begins with a conversation.</p>' +
        '</div>' +
        '<button type="button" class="lrl-enq-close" id="lrlEnqClose" aria-label="Close enquiry">[ <span class="lrl-enq-esc">ESC / </span>CLOSE ]</button>' +
      '</div>' +
      '<form id="lrlEnqForm" novalidate>' +
        '<div class="lrl-enq-field">' +
          '<label for="lrlEnqName">Your Name</label>' +
          '<input type="text" id="lrlEnqName" name="name" required maxlength="100" placeholder="Jane Doe" autocomplete="name">' +
        '</div>' +
        '<div class="lrl-enq-field">' +
          '<label for="lrlEnqEmail">Your Email</label>' +
          '<input type="email" id="lrlEnqEmail" name="email" required maxlength="254" placeholder="name@domain.com" autocomplete="email" inputmode="email">' +
        '</div>' +
        '<div class="lrl-enq-field">' +
          '<label for="lrlEnqCat">Shoot Category</label>' +
          '<select id="lrlEnqCat" name="category"><option value="General Enquiry">General Enquiry</option></select>' +
        '</div>' +
        '<div class="lrl-enq-field" id="lrlEnqEventWrap" hidden>' +
          '<label for="lrlEnqEvent">Event Type <span style="text-transform:none;letter-spacing:0">(optional)</span></label>' +
          '<input type="text" id="lrlEnqEvent" name="eventType" maxlength="80" list="lrlEnqEventList" placeholder="e.g. Birthday, Wedding, Performing Arts" autocomplete="off">' +
          '<datalist id="lrlEnqEventList"></datalist>' +
        '</div>' +
        '<div class="lrl-enq-field">' +
          '<label for="lrlEnqMsg">Shoot Details &amp; Timeline</label>' +
          '<textarea id="lrlEnqMsg" name="message" required maxlength="500" placeholder="Tell us what you\'re shooting, roughly when, and the location."></textarea>' +
          '<div class="lrl-enq-count"><span id="lrlEnqCount">0</span> / 500</div>' +
        '</div>' +
        '<div class="lrl-enq-hp" aria-hidden="true">' +
          '<label for="lrlEnqWebsite">Leave this field empty</label>' +
          '<input type="text" id="lrlEnqWebsite" name="_gotcha" tabindex="-1" autocomplete="off">' +
        '</div>' +
        '<div class="lrl-enq-foot">' +
          '<span class="lrl-enq-status" id="lrlEnqStatus" role="status" aria-live="polite">READY</span>' +
          '<button type="submit" class="lrl-enq-send" id="lrlEnqSend">Send Enquiry &rarr;</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  var root = null, isOpen = false, pushed = false, opener = null;
  var openedAt = 0, warned = false, sentAt = 0, busy = false, downOnBackdrop = false, doneTimer = null;

  function q(id) { return document.getElementById(id); }

  function build() {
    if (root) return root;
    if (!document.getElementById("lrlEnqStyle")) {
      var st = document.createElement("style");
      st.id = "lrlEnqStyle";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    root = document.createElement("div");
    root.id = "lrlEnq";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "lrlEnqTitle");
    root.innerHTML = MARKUP;
    document.body.appendChild(root);

    q("lrlEnqClose").addEventListener("click", function () { close(); });
    q("lrlEnqCat").addEventListener("change", syncEvent);
    q("lrlEnqMsg").addEventListener("input", function () { q("lrlEnqCount").textContent = String(this.value.length); });
    /* only a click that STARTS and ends on the dark backdrop closes it - dragging to select text
       inside a field and letting go outside the card won't throw away what was typed */
    root.addEventListener("mousedown", function (e) { downOnBackdrop = (e.target === root); });
    root.addEventListener("click", function (e) {
      if (e.target === root && downOnBackdrop) close();
      downOnBackdrop = false;
    });
    q("lrlEnqForm").addEventListener("submit", submit);
    fillEventList();
    return root;
  }

  function fillCategories(want) {
    var sel = q("lrlEnqCat");
    var cats = ["General Enquiry"];
    (cfg.categories && cfg.categories.length ? cfg.categories : DEFAULT_CATS).forEach(function (c) {
      var nm = String((c && c.name) || c || "").trim();
      if (nm && cats.indexOf(nm) === -1) cats.push(nm);
    });
    var target = String(want || "General Enquiry").trim();
    var match = null;
    cats.forEach(function (c) { if (!match && c.toLowerCase() === target.toLowerCase()) match = c; });
    if (!match) { cats.push(target); match = target; }   /* e.g. a category added later - still selectable */
    sel.innerHTML = cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join("");
    sel.value = match;
  }
  function fillEventList() {
    var dl = q("lrlEnqEventList");
    if (!dl) return;
    var seen = [], all = (cfg.eventTypes || []).concat(DEFAULT_EVENTS);
    all.forEach(function (e) { e = String(e || "").trim(); if (e && seen.indexOf(e) === -1) seen.push(e); });
    dl.innerHTML = seen.map(function (e) { return '<option value="' + esc(e) + '"></option>'; }).join("");
  }
  function syncEvent() {
    q("lrlEnqEventWrap").hidden = q("lrlEnqCat").value !== "Events";
  }

  function focusables() {
    return Array.prototype.filter.call(
      root.querySelectorAll('button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled]),a[href]'),
      function (el) { return el.getClientRects().length && !el.closest("[hidden]") && !el.closest(".lrl-enq-hp"); }
    );
  }

  function show() {
    isOpen = true;
    root.classList.add("on");
    document.documentElement.classList.add("lrl-enq-open");
  }
  function hide() {
    if (!isOpen) return;
    isOpen = false; pushed = false;
    root.classList.remove("on");
    document.documentElement.classList.remove("lrl-enq-open");
    var el = opener; opener = null;
    if (el && document.contains(el) && typeof el.focus === "function") {
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }
    if (typeof LRL.enquiry.onClose === "function") { try { LRL.enquiry.onClose(); } catch (e) {} }
  }

  function open(opts) {
    opts = opts || {};
    build();
    fillEventList();
    fillCategories(opts.category);
    if (opts.eventType) q("lrlEnqEvent").value = opts.eventType;
    syncEvent();
    openedAt = Date.now(); warned = false;
    if (!busy) q("lrlEnqStatus").textContent = "READY";
    if (!isOpen) {
      var a = document.activeElement;
      opener = (a && a !== document.body && a !== document.documentElement) ? a : null;
      show();
      /* one Back-button step: pressing Back on a phone closes the form instead of leaving the page */
      try {
        window.history.pushState(assign(window.history.state || {}, { lrlEnq: 1 }), "", window.location.href);
        pushed = true;
      } catch (e) { pushed = false; }
      if (typeof LRL.enquiry.onOpen === "function") { try { LRL.enquiry.onOpen(); } catch (e) {} }
    }
    setTimeout(function () { var n = q("lrlEnqName"); if (n && isOpen) n.focus(); }, 80);
  }

  function close() {
    if (!isOpen) return;
    var st = window.history.state;
    if (pushed && st && st.lrlEnq) {
      pushed = false;
      window.history.back();          /* the popstate below does the actual hiding */
      /* safety net: if the browser ignores Back for any reason, still close */
      setTimeout(function () { if (isOpen && !(window.history.state && window.history.state.lrlEnq)) hide(); }, 400);
    } else {
      hide();
    }
  }

  window.addEventListener("popstate", function () {
    var st = window.history.state;
    if (isOpen && !(st && st.lrlEnq)) { hide(); return; }
    /* Forward button onto an old "form open" step: nothing to show there, step straight off it */
    if (!isOpen && st && st.lrlEnq) window.history.back();
  });

  /* capture phase: runs before the pages' own key handlers, so Escape / Tab never reach them twice */
  window.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      close();
      return;
    }
    if (e.key === "Tab") {
      var items = focusables();
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1], act = document.activeElement;
      if (!root.contains(act)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
      e.stopPropagation();
      return;
    }
    /* arrow keys etc. belong to the form fields while it's open - don't let the page flip photos */
    e.stopPropagation();
  }, true);

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    var form = q("lrlEnqForm"), status = q("lrlEnqStatus"), send = q("lrlEnqSend");
    if (form.reportValidity && !form.reportValidity()) return;    /* the browser's own "please fill this in" hints */

    /* quiet spam checks - people never notice these */
    if (q("lrlEnqWebsite").value) { status.textContent = "ENQUIRY SENT // WE REPLY WITHIN 24H"; return; }
    var now = Date.now();
    if (now - openedAt < 4000 && !warned) {
      warned = true;
      status.textContent = "PLEASE DOUBLE-CHECK, THEN PRESS SEND AGAIN";
      return;
    }
    if (sentAt && now - sentAt < 30000) { status.textContent = "ALREADY SENT // PLEASE WAIT A MOMENT"; return; }

    var cat = q("lrlEnqCat").value;
    var ev = cat === "Events" ? q("lrlEnqEvent").value.trim() : "";
    var payload = {
      name: q("lrlEnqName").value.trim(),
      email: q("lrlEnqEmail").value.trim(),
      category: cat,
      message: q("lrlEnqMsg").value.trim(),
      _gotcha: ""
    };
    if (ev) payload.eventType = ev;

    busy = true; send.disabled = true;
    status.textContent = "TRANSMITTING...";

    fetch("https://formspree.io/f/" + (cfg.formspreeId || "xjykvnoz"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("Submission failed (" + res.status + ")");
      sentAt = Date.now();
      status.textContent = "ENQUIRY SENT // WE REPLY WITHIN 24H";
      clearTimeout(doneTimer);
      doneTimer = setTimeout(function () {
        form.reset();
        q("lrlEnqCount").textContent = "0";
        syncEvent();
        busy = false; send.disabled = false;
        status.textContent = "READY";
        close();
      }, 1800);
    }).catch(function () {
      /* keep the form open with everything typed, and hand over to the mail app as a backup */
      status.textContent = "OPENING YOUR MAIL APP...";
      busy = false; send.disabled = false;
      var to = cfg.email || "hello@livingroomlabs.in";
      window.location.href = "mailto:" + to +
        "?subject=" + encodeURIComponent("Enquiry: " + payload.category + (ev ? " (" + ev + ")" : "") + " — " + payload.name) +
        "&body=" + encodeURIComponent("Name: " + payload.name + "\nEmail: " + payload.email + "\nCategory: " + payload.category +
          (ev ? "\nEvent type: " + ev : "") + "\n\nMessage:\n" + payload.message);
    });
  }

  LRL.enquiry = {
    /* pages pass the live site settings once content.json has loaded */
    configure: function (o) {
      o = o || {};
      if (o.formspreeId) cfg.formspreeId = o.formspreeId;
      if (o.email) cfg.email = o.email;
      if (o.categories && o.categories.length) cfg.categories = o.categories.slice();
      if (o.eventTypes) cfg.eventTypes = o.eventTypes.slice();
      if (root) fillEventList();
    },
    open: open,
    close: close,
    isOpen: function () { return isOpen; },
    el: function () { return build(); },
    onOpen: null,
    onClose: null
  };
})();
