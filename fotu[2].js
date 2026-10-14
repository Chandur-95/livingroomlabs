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
    "Fun fact: the very first photograph needed hours of exposure. I need a blink.",
    "Fun fact: 'camera' is Latin for 'room'. So I'm a room inside Living Room Labs.",
    "Say cheese. Or paneer. I'm flexible.",
    "Golden hour is just the sun showing off.",
    "Fun fact: my rainbow stripe is load-bearing."
  ];
  var SLEEP_LINE = "Out of film... zzz";

  /* Lamp rope (theme switch) */
  var LIGHTS_OFF = "Who turned off the lights? Good thing I brought my own flash.";
  var LIGHTS_ON = "Too bright! My aperture can't take this.";
  /* Fast scrolling */
  var FAST_SCROLL = ["Whoa, motion blur!", "Slow down! My shutter speed can't keep up.", "Panning shot! Very artistic."];

  /* Time of day greetings (visitor's own clock) */
  var TIME_GREETINGS = [
    [5, 11, ["Good morning! Best light of the day, and you're here for it.", "Morning! I've had my coffee. Well, my film."]],
    [11, 16, ["Good afternoon! Harsh light outside. Perfect light in here."]],
    [16, 19, ["Golden hour! Everyone looks good right now. Including you."]],
    [19, 24, ["Good evening! Blue hour is the photographer's secret. Now it's yours too."]],
    [0, 5, ["Up late? Shooting the night sky too?", "It's past midnight. Long exposure time."]]
  ];

  /* Festivals. "md" = same date every year (MM-DD). "from"/"to" = that year's dates (YYYY-MM-DD).
     Most Indian festivals follow the lunar calendar, so add next year's dates here (or in
     content.json as "fotuFestivals", same format) before they run out. Dates marked * depend on moon sighting. */
  var FESTIVALS = [
    { md: "01-01", line: "Happy New Year! New year, new memories, same great lighting." },
    { md: "01-13", line: "Happy Lohri! Bonfire glow is basically free golden hour." },
    { md: "01-14", to_md: "01-15", line: "Happy Sankranti! Kites in the sky, me on the ground. Fair trade." },
    { md: "01-26", line: "Happy Republic Day! Saluting in 4K." },
    { md: "04-14", line: "Happy Baisakhi, Vishu and Puthandu! Many new years, many new photos." },
    { md: "06-02", line: "Happy Telangana Formation Day! Proud Hyderabadi camera here." },
    { md: "08-15", line: "Happy Independence Day! Tiranga colours look great on every sensor." },
    { md: "10-02", line: "Happy Gandhi Jayanti! Simple living, simple framing." },
    { md: "12-25", line: "Merry Christmas! I asked Santa for a new lens cap." },
    { md: "12-31", line: "Last day of the year! Time for the year's best shots." },
    /* 2026 */
    { from: "2026-11-06", to: "2026-11-09", line: "Happy Diwali! Finally, lighting I don't have to provide." },
    { from: "2026-11-15", to: "2026-11-15", line: "Happy Chhath Puja! Sunrise and sunset by the water. Photographer's dream." },
    { from: "2026-11-24", to: "2026-11-24", line: "Happy Guru Nanak Jayanti! Lights everywhere today." },
    /* 2027 */
    { from: "2027-03-06", to: "2027-03-06", line: "Happy Maha Shivaratri! An all-night shoot. I respect that." },
    { from: "2027-03-10", to: "2027-03-10", line: "Eid Mubarak! Biryani, sheer khurma and great photos. Hyderabad does it best. *" },
    { from: "2027-03-21", to: "2027-03-22", line: "Happy Holi! Please don't throw colours at me. I'm not waterproof." },
    { from: "2027-04-07", to: "2027-04-07", line: "Ugadi Subhakankshalu! Sweet, sour, spicy... like my reviews." },
    { from: "2027-04-15", to: "2027-04-15", line: "Happy Sri Rama Navami! Wishing you a blessed day." },
    { from: "2027-04-18", to: "2027-04-19", line: "Happy Mahavir Jayanti! Peace, kindness and soft lighting." },
    { from: "2027-05-17", to: "2027-05-17", line: "Bakrid Mubarak! Wishing you a feast full of family. *" },
    { from: "2027-05-20", to: "2027-05-20", line: "Happy Buddha Purnima! Full moon tonight. Tripods out." },
    /* Bonalu: Sundays of Ashada month. Approximate, check the official dates each year. */
    { from: "2027-07-11", to: "2027-08-01", sundays: true, line: "Happy Bonalu! Pothurajus, drums and colour. Hyderabad's best photo day." },
    { from: "2027-08-17", to: "2027-08-17", line: "Happy Raksha Bandhan! Siblings: the hardest group photo." },
    { from: "2027-08-25", to: "2027-08-25", line: "Happy Krishna Janmashtami! Butter not included." },
    { from: "2027-09-12", to: "2027-09-12", line: "Happy Onam! A pookalam is the most photogenic floor in the world." },
    { from: "2027-09-04", to: "2027-09-14", line: "Ganpati Bappa Morya! Pandal-hopping with a camera is the best kind of cardio." },
    { from: "2027-09-29", to: "2027-10-07", line: "Happy Bathukamma! Towers of flowers. My favourite still life." },
    { from: "2027-10-08", to: "2027-10-09", line: "Happy Dussehra! Good wins over evil, and over bad lighting." },
    { from: "2027-10-27", to: "2027-10-30", line: "Happy Diwali! Finally, lighting I don't have to provide." },
    { from: "2027-11-04", to: "2027-11-04", line: "Happy Chhath Puja! Sunrise and sunset by the water. Photographer's dream." },
    { from: "2027-11-14", to: "2027-11-14", line: "Happy Guru Nanak Jayanti! Lights everywhere today." }
  ];
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

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayFestival() {
    var d = new Date(), ymd = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), md = ymd.slice(5);
    var list = (SITE.fotuFestivals || []).concat(FESTIVALS);
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (!f || !f.line) continue;
      if (f.sundays && d.getDay() !== 0) continue;
      if (f.md && md >= f.md && md <= (f.to_md || f.md)) return f.line.replace(/ \*$/, "");
      if (f.from && ymd >= f.from && ymd <= (f.to || f.from)) return f.line.replace(/ \*$/, "");
    }
    return null;
  }
  function timeGreeting() {
    var h = new Date().getHours();
    for (var i = 0; i < TIME_GREETINGS.length; i++) if (h >= TIME_GREETINGS[i][0] && h < TIME_GREETINGS[i][1]) return pick(TIME_GREETINGS[i][2]);
    return null;
  }
  function welcomeLine() {
    return todayFestival() || (Math.random() < 0.6 ? timeGreeting() : null) || pick(WELCOME);
  }

  /* "Know what works": count chats opened and enquiries sent (totals only, nothing personal) */
  function track(event) {
    try {
      var body = JSON.stringify({ event: event, page: location.pathname });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/fotu-stats", new Blob([body], { type: "application/json" }));
      else fetch("/api/fotu-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    } catch (e) {}
  }

  /* ================= styles ================= */
  var css = [
    "#fotu-root{--f-paper:#ffffff;--f-ink:#111;--f-mute:#6b6b6b;--f-line:#e2e2e2;--f-soft:#f3f2ee;font-family:inherit}",
    "html[data-theme='dark'] #fotu-root{--f-paper:#161616;--f-ink:#f2f2f2;--f-mute:#9a9a9a;--f-line:#2e2e2e;--f-soft:#222}",
    "#fotu-bot{position:fixed;left:0;top:0;width:72px;height:72px;z-index:65;cursor:pointer;background:none;border:0;padding:0;-webkit-tap-highlight-color:transparent;transition:opacity .3s}",
    "#fotu-bot:focus-visible{outline:2px solid #378ADD;outline-offset:4px;border-radius:12px}",
    "#fotu-bot .fb{width:100%;height:100%;transform-origin:50% 100%}",
    "#fotu-bot .fb{animation:fotuIdle 2.2s ease-in-out infinite}",
    "@keyframes fotuIdle{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-3px) rotate(-2deg)}75%{transform:translateY(-1px) rotate(2deg)}}",
    "#fotu-bot.sleep .fb{animation:fotuSnore 2.4s ease-in-out infinite}",
    "@keyframes fotuSnore{0%,100%{transform:scale(1,1) rotate(-4deg)}45%{transform:scale(1.06,.94) translateY(2px) rotate(-4deg)}}",
    "#fotu-bot.walk .fb{animation:fotuBob .3s ease-in-out infinite alternate}",
    "@keyframes fotuBob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-4px) rotate(3deg)}}",
    "#fotu-bot .l1,#fotu-bot .l2{transform-box:fill-box;transform-origin:50% 0}",
    "#fotu-bot.walk .l1{animation:fotuLeg .3s infinite alternate}#fotu-bot.walk .l2{animation:fotuLeg .3s infinite alternate-reverse}",
    "@keyframes fotuLeg{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}",
    "#fotu-bot.hop .fb{animation:fotuHop .5s ease-out}",
    "@keyframes fotuHop{40%{transform:translateY(-12px) rotate(-6deg)}100%{transform:none}}",
    "#fotu-bot .ey{transform-box:fill-box;transform-origin:50% 50%;transition:transform .08s}#fotu-bot .ey.cl{transform:scaleY(.1)}",
    "#fotu-bot .pr{transform:translateY(-22px);transition:transform .6s cubic-bezier(.3,1.4,.6,1)}#fotu-bot .pr.out{transform:translateY(14px)}",
    "#fotu-bot .zz{position:absolute;z-index:2;right:-4px;top:-6px;width:36px;height:30px;display:none;pointer-events:none;font-weight:800;color:#378ADD;text-shadow:0 0 2px #fff}",
    "#fotu-bot .zz i{position:absolute;left:0;bottom:0;font-style:normal;opacity:0;animation:fotuZz 2.4s ease-out infinite}",
    "#fotu-bot .zz i:nth-child(1){font-size:10px}#fotu-bot .zz i:nth-child(2){font-size:13px;animation-delay:.8s}#fotu-bot .zz i:nth-child(3){font-size:16px;animation-delay:1.6s}",
    "#fotu-bot.sleep .zz{display:block}",
    "@keyframes fotuZz{0%{opacity:0;transform:translate(0,4px) rotate(-10deg)}20%{opacity:1}100%{opacity:0;transform:translate(14px,-16px) rotate(12deg)}}",
    "#fotu-bot .snore{display:none;transform-box:fill-box;transform-origin:50% 50%}",
    "#fotu-bot.sleep .snore{display:block;animation:fotuMouth 2.4s ease-in-out infinite}",
    "#fotu-bot.sleep .smile{display:none}",
    "@keyframes fotuMouth{0%,100%{transform:scale(.5)}45%{transform:scale(1.25)}}",
    "#fotu-bot.sleep .ey{transform:scaleY(.08)!important}",
    "#fotu-bot .lid{display:none}#fotu-bot.sleep .lid{display:block}",
    "#fotu-bot.squint .ey{transform:scaleY(.35)}",
    "#fotu-bot.wobble .fb{animation:fotuWobble .6s ease-in-out 2}",
    "@keyframes fotuWobble{0%,100%{transform:none}20%{transform:rotate(-14deg) translateX(-4px)}50%{transform:rotate(12deg) translateX(4px)}80%{transform:rotate(-6deg)}}",
    "#fotu-bub{position:fixed;z-index:66;max-width:230px;background:var(--f-paper);color:var(--f-ink);border:1px solid var(--f-line);border-radius:14px;padding:9px 12px;font-size:13.5px;line-height:1.45;box-shadow:0 6px 24px rgba(0,0,0,.12);display:none;pointer-events:none}",
    "#fotu-bub.on{display:block;animation:fotuPop .2s ease-out}",
    "@keyframes fotuPop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}",
    "#fotu-bub.measure{display:block;visibility:hidden;left:0;top:0}",
    "#fotu-bot .burst{opacity:0;transform-box:fill-box;transform-origin:50% 50%}",
    "#fotu-bot.flash .burst{animation:fotuBurst .55s ease-out}",
    "@keyframes fotuBurst{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(3.4)}}",
    "#fotu-root.gone #fotu-bot,#fotu-root.gone #fotu-bub,#fotu-root.gone #fotu-back{opacity:0;pointer-events:none}",
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
    "#fotu-back{position:fixed;left:14px;top:0;z-index:65;width:34px;height:34px;border-radius:50%;border:1px solid var(--f-line);background:var(--f-paper);cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.12)}",
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
    '<circle class="burst" cx="73" cy="36" r="5" fill="#FFF8D6"/>' +
    '<g class="ey"><circle cx="30" cy="52" r="10" fill="#2C2C2A"/><circle class="p1" cx="33" cy="49" r="3" fill="#fff"/></g>' +
    '<g class="ey"><circle cx="70" cy="56" r="7" fill="#2C2C2A"/><circle class="p2" cx="72" cy="54" r="2" fill="#fff"/></g>' +
    '<path class="smile" d="M40 70 Q50 76 60 70" stroke="#444441" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="snore" cx="50" cy="71" rx="4" ry="3.5" fill="#444441"/>' +
    '<path class="lid" d="M21 52 Q30 57 39 52" stroke="#2C2C2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<path class="lid" d="M64 56 Q70 60 76 56" stroke="#2C2C2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var root = document.createElement("div");
  root.id = "fotu-root";
  root.innerHTML =
    '<div id="fotu-safe" aria-hidden="true" style="position:fixed;left:0;bottom:0;width:1px;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none"></div>' +
    '<div id="fotu-bub" role="status" aria-live="polite"></div>' +
    '<button id="fotu-bot" type="button" aria-label="Chat with Fotu"><div class="fb"><span class="zz"><i>z</i><i>z</i><i>Z</i></span>' + SVG + '</div></button>' +
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
      safeEl = $("fotu-safe"), chipsEl = $("fotu-chips"), inForm = $("fotu-in"), inp = $("fotu-inp"), errEl = $("fotu-err"), back = $("fotu-back");
  var printEl = bot.querySelector(".pr"), printImg = bot.querySelector(".pimg"), fbulb = bot.querySelector(".fbulb"),
      p1 = bot.querySelector(".p1"), p2 = bot.querySelector(".p2");

  /* ================= position & movement ================= */
  /* Fotu lives on the bottom edge of the screen and only walks left and right along it.
     Before it stands anywhere it checks that no text, photo, button or link is underneath,
     and it only walks inside clear gaps. If a gap closes (you scroll, the page changes) it
     slides to the nearest clear gap, or waits out of sight until one opens up. */
  var HEAD = 18; /* clear room kept above Fotu for hops and snore Zs */
  function size() { return bot.offsetWidth || 72; }
  function cssPx(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    var n = parseFloat(v); return isNaN(n) ? 0 : n;
  }
  function safeBottom() { return safeEl.offsetHeight || 0; }
  function laneY(sz) { return window.innerHeight - cssPx("--foot-h") - safeBottom() - sz - 10; }
  function bounds() {
    var s = size();
    var top = Math.max(cssPx("--header-h"), cssPx("--nav-h"), 70) + 8;
    var bottom = laneY(s);
    if (bottom < top) bottom = top;
    return { minX: 6, maxX: window.innerWidth - s - 6, minY: top, maxY: bottom };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var pos = { x: 0, y: 0 }, dir = 1, walking = false, walkTimer = null, isOpen = false, hidden = read(HIDE_KEY) === "1";
  var paused = false, idle = 0, bubTimer = null, printTimer = null;
  var shy = false, away = true, poofing = false, shyTimer = null, pendingFast = false;
  var welcomed = false, quietUntil = 0;
  var NOMOVE = "transform 0s, opacity .3s";
  function refreshVis() { root.classList.toggle("gone", shy || away || poofing); }

  function place() {
    bot.style.transform = "translate(" + Math.round(pos.x) + "px," + Math.round(pos.y) + "px)";
    bot.querySelector(".fb").style.scale = dir < 0 ? "-1 1" : "";
  }

  /* ---- clear-space finder ---- */
  var CONTENT_SEL = "img,video,canvas,picture,svg,iframe,object,embed,a,button,input,select,textarea,label,summary,[role='button'],[role='link']";
  var BACKDROP = { CANVAS: 1, SVG: 1, IFRAME: 1, OBJECT: 1, EMBED: 1 };
  var TEXT_MARGIN = 8;
  var stackAt = document.elementsFromPoint
    ? function (x, y) { return document.elementsFromPoint(x, y); }
    : function (x, y) { var e = document.elementFromPoint(x, y); return e ? [e] : []; };

  /* true = this element is itself something to keep clear (photo, button, link...);
     false = nothing to avoid; array = the rectangles of its own text */
  function analyse(el) {
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
    var tag = String(el.tagName).toUpperCase(), vw = window.innerWidth, vh = window.innerHeight, r;
    if (el.matches(CONTENT_SEL)) {
      if (BACKDROP[tag]) { r = el.getBoundingClientRect(); if (r.width * r.height > 0.7 * vw * vh) return false; }
      return true;
    }
    var bg = cs.backgroundImage;
    if (bg && bg.indexOf("url(") !== -1) { r = el.getBoundingClientRect(); if (r.width * r.height < 0.5 * vw * vh) return true; }
    var rects = [], kids = el.childNodes, i, j;
    for (i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3 && /\S/.test(n.nodeValue)) {
        var range = document.createRange(); range.selectNodeContents(n);
        var cr = range.getClientRects();
        for (j = 0; j < cr.length; j++) rects.push(cr[j]);
      }
    }
    return rects.length ? rects : false;
  }
  function blockedAt(x, y, cache) {
    var stack = stackAt(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el === document.documentElement || el === document.body) continue;
      var info = cache.get(el);
      if (info === undefined) { info = analyse(el); cache.set(el, info); }
      if (info === false) continue;
      if (info === true) return true;
      for (var j = 0; j < info.length; j++) {
        var r = info[j];
        if (x >= r.left - TEXT_MARGIN && x <= r.right + TEXT_MARGIN && y >= r.top - TEXT_MARGIN && y <= r.bottom + TEXT_MARGIN) return true;
      }
    }
    return false;
  }
  /* run a check with Fotu's own elements out of the way, so it never mistakes itself for content */
  function withProbe(fn) {
    var prev = root.style.visibility;
    root.style.visibility = "hidden";
    try { return fn(new Map()); } finally { root.style.visibility = prev; }
  }
  function rectFreeIn(l, t, w, h, step, cache) {
    for (var y = t; ; y += step) {
      var yy = Math.min(y, t + h);
      for (var x = l; ; x += step) {
        var xx = Math.min(x, l + w);
        if (blockedAt(xx, yy, cache)) return false;
        if (xx >= l + w) break;
      }
      if (yy >= t + h) break;
    }
    return true;
  }
  function rowsFor(top, h) {
    var n = Math.max(2, Math.ceil(h / 16)), out = [];
    for (var i = 0; i <= n; i++) out.push(top + 2 + (h - 4) * i / n);
    return out;
  }
  /* every clear stretch along the bottom edge, as ranges of left-edge positions Fotu may stand at */
  function scanSegments(sz) {
    sz = sz || size();
    var W = window.innerWidth, top = laneY(sz) - HEAD, h = sz + HEAD, step = W <= 800 ? 10 : 12;
    var rows = rowsFor(top, h);
    return withProbe(function (cache) {
      var runs = [], start = null, last = null, x, k, free;
      for (x = 3; x <= W - 3; x += step) {
        free = true;
        for (k = 0; k < rows.length; k++) if (blockedAt(x, rows[k], cache)) { free = false; break; }
        if (free) { if (start === null) start = x; last = x; }
        else if (start !== null) { runs.push([start, last]); start = null; }
      }
      if (start !== null) runs.push([start, last]);
      var out = [];
      runs.forEach(function (g) {
        var lo = Math.max(6, g[0] + 4), hi = Math.min(W - sz - 6, g[1] - sz - 4);
        if (hi >= lo) out.push({ lo: lo, hi: hi });
      });
      return out;
    });
  }
  function footprintFree() {
    var s = size();
    return withProbe(function (cache) { return rectFreeIn(pos.x - 4, pos.y - HEAD, s + 8, s + HEAD, 10, cache); });
  }
  function segmentFor(x, segs) {
    for (var i = 0; i < segs.length; i++) if (x >= segs[i].lo - 1 && x <= segs[i].hi + 1) return segs[i];
    return null;
  }
  function nearestSegment(x, segs) {
    var best = null, bd = 1e9;
    segs.forEach(function (g) { var d = x < g.lo ? g.lo - x : x > g.hi ? x - g.hi : 0; if (d < bd) { bd = d; best = g; } });
    return best;
  }

  function look(dx, dy) {
    dx = clamp(dx, -4, 4); dy = clamp(dy, -3, 3);
    p1.setAttribute("cx", 30 + dx); p1.setAttribute("cy", 52 + dy);
    p2.setAttribute("cx", 70 + dx * 0.7); p2.setAttribute("cy", 56 + dy * 0.7);
  }
  function stopWalk() {
    clearTimeout(walkTimer); walking = false;
    var r = bot.getBoundingClientRect(); pos.x = r.left; pos.y = r.top;
    bot.style.transition = NOMOVE; bot.classList.remove("walk"); place();
  }
  function walkTo(x, cb) {
    if (reduceMotion) { cb && cb(); return; }
    var b = bounds(); x = clamp(x, b.minX, b.maxX);
    var d = Math.abs(x - pos.x), ms = Math.max(500, d * 9);
    dir = x < pos.x ? -1 : 1;
    bot.classList.remove("sleep"); bot.classList.add("walk");
    hideBubble(); printEl.classList.remove("out");
    bot.style.transition = "transform " + ms + "ms linear, opacity .3s";
    pos.x = x; pos.y = b.maxY; walking = true; place(); look(3, 0);
    clearTimeout(walkTimer);
    walkTimer = setTimeout(function () {
      walking = false; bot.classList.remove("walk"); bot.style.transition = NOMOVE; look(0, 0); cb && cb();
    }, ms);
  }
  /* walk along the clear stretch Fotu is standing in: left to right, right to left */
  function pace(cb, awayFromX) {
    var segs = scanSegments(), cur = segmentFor(pos.x, segs);
    if (!cur) { settle(); return; }
    var tx;
    if (awayFromX != null) tx = awayFromX > pos.x + size() / 2 ? cur.lo : cur.hi;
    else if (Math.random() < 0.3) tx = cur.lo + Math.random() * (cur.hi - cur.lo);
    else tx = pos.x - cur.lo > cur.hi - pos.x ? cur.lo : cur.hi;
    if (Math.abs(tx - pos.x) < 24) { cb && cb(); return; }
    walkTo(tx, cb);
  }
  /* fade out, reappear in a clear spot */
  function jumpTo(x) {
    if (poofing) return;
    poofing = true; refreshVis(); hideBubble();
    if (walking) stopWalk();
    setTimeout(function () {
      pos.x = x; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      poofing = false; refreshVis();
    }, 260);
  }
  /* make sure Fotu is standing somewhere clear (or out of sight if nowhere is) */
  function settle() {
    if (hidden) { placeBack(); return; }
    var segs = scanSegments();
    if (!segs.length) {
      if (!away) { away = true; refreshVis(); hideBubble(); if (walking) stopWalk(); }
      return;
    }
    var cur = segmentFor(pos.x, segs);
    if (cur && !away) return;
    var seg = cur || nearestSegment(pos.x, segs), x = clamp(pos.x, seg.lo, seg.hi);
    if (away) {
      if (walking) stopWalk();
      pos.x = x; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      away = false; refreshVis();
    } else jumpTo(x);
  }
  function hop() { if (reduceMotion) return; bot.classList.add("hop"); setTimeout(function () { bot.classList.remove("hop"); }, 500); }
  function blink() {
    var eyes = bot.querySelectorAll(".ey");
    eyes.forEach(function (e) { e.classList.add("cl"); });
    setTimeout(function () { eyes.forEach(function (e) { e.classList.remove("cl"); }); }, 130);
  }
  function flash() {
    bot.classList.remove("flash"); void bot.offsetWidth; bot.classList.add("flash");
    fbulb.setAttribute("fill", "#FFF8D6");
    setTimeout(function () { bot.classList.remove("flash"); fbulb.setAttribute("fill", "#444441"); }, 600);
  }

  /* ================= speech bubble ================= */
  /* A bubble only appears where there is clear space for it (above Fotu, or beside it).
     On a crowded screen Fotu stays quiet rather than cover anything. */
  function placeBubble(text) {
    var s = size(), W = window.innerWidth, H = window.innerHeight, cx = pos.x + s / 2;
    bub.textContent = text; bub.classList.remove("on"); bub.classList.add("measure");
    var cands = [];
    [230, 170, 130].forEach(function (mw) {
      mw = Math.min(mw, W - 16);
      bub.style.maxWidth = mw + "px";
      var bw = bub.offsetWidth, bh = bub.offsetHeight;
      cands.push({ l: clamp(cx - bw / 2, 8, W - bw - 8), t: pos.y - bh - 6, w: bw, h: bh, mw: mw });
      cands.push({ l: pos.x + s + 8, t: pos.y + s - bh, w: bw, h: bh, mw: mw });
      cands.push({ l: pos.x - bw - 8, t: pos.y + s - bh, w: bw, h: bh, mw: mw });
    });
    bub.classList.remove("measure");
    var c = withProbe(function (cache) {
      for (var i = 0; i < cands.length; i++) {
        var k = cands[i];
        if (k.t < 8 || k.l < 8 || k.l + k.w > W - 8 || k.t + k.h > H - 4) continue;
        if (rectFreeIn(k.l - 4, k.t - 4, k.w + 8, k.h + 8, 20, cache)) return k;
      }
      return null;
    });
    if (!c) return false;
    bub.style.maxWidth = c.mw + "px"; bub.style.left = Math.round(c.l) + "px"; bub.style.top = Math.round(c.t) + "px";
    return true;
  }
  function bubble(text, ms, tries) {
    if (isOpen || hidden || paused || shy || away || poofing) return false;
    clearTimeout(bubTimer);
    if (!placeBubble(text)) {
      if (tries > 0) bubTimer = setTimeout(function () { bubble(text, ms, tries - 1); }, 1800);
      return false;
    }
    bub.classList.remove("on"); void bub.offsetWidth; bub.classList.add("on");
    bubTimer = setTimeout(hideBubble, ms || 4000);
    return true;
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
    setTimeout(function () {
      if (isOpen || paused || shy || away || poofing) return;
      flash();
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
    var dx = (r.left + r.width / 2) - (pos.x + s / 2), dy = (r.top + r.height / 2) - (pos.y + s / 2);
    dir = dx < 0 ? -1 : 1; place(); hop();
    look(dx / 40 * dir, dy / 40);
    shoot(t);
  }
  function wanderQuip() {
    pace(function () { hop(); bubble(pick(QUIPS)); });
  }

  /* ================= behaviour loop ================= */
  function tick() {
    if (!welcomed || Date.now() < quietUntil || isOpen || hidden || paused || walking || shy || away || poofing || document.hidden) return;
    idle++;
    var r = Math.random();
    if (idle > 6 && r < 0.3) { bot.classList.add("sleep"); bubble(SLEEP_LINE, 2600); idle = 0; return; }
    if (bot.classList.contains("sleep") && r < 0.6) return; /* let it nap a little */
    if (bot.classList.contains("sleep")) { bot.classList.remove("sleep"); hop(); bubble("Huh? I wasn't sleeping. I was... long exposure.", 2600); return; }
    if (r < 0.35) visit();
    else if (r < 0.5) wanderQuip();
    else if (r < 0.85) pace(function () { if (Math.random() < 0.4) hop(); });
    else { blink(); hop(); }
  }
  setInterval(function () { if (Math.random() < 0.5 && !hidden && !away) blink(); }, 2200);

  /* pause and hide while the site's photo viewer or enquiry form is open */
  function overlayOpen() {
    var cover = document.getElementById("cover-overlay");
    if (cover && !cover.hidden && !cover.classList.contains("cover-hide") &&
        !document.documentElement.classList.contains("cover-seen") && getComputedStyle(cover).display !== "none") return true;
    try { if (window.LRL && window.LRL.enquiry && window.LRL.enquiry.isOpen && window.LRL.enquiry.isOpen()) return true; } catch (e) {}
    return !!document.querySelector("#capLb.on, #capEnq.on, #lb.on, #lb[open], .lb.on, .enquiry-modal.open, body.bulk-open");
  }
  setInterval(function () {
    var o = overlayOpen();
    if (o !== paused) {
      paused = o;
      root.classList.toggle("paused", paused);
      if (paused) { hideBubble(); if (walking) stopWalk(); if (isOpen) closeChat(true); }
      else if (window.__fotuWelcome) setTimeout(window.__fotuWelcome, 700);
    }
  }, 400);

  /* keep checking that Fotu is still standing on clear ground (content can move without a scroll) */
  function backFree() {
    var x = parseFloat(back.style.left), y = parseFloat(back.style.top);
    if (isNaN(x) || isNaN(y) || back.style.visibility === "hidden") return false;
    if (Math.abs(y - laneY(34)) > 1) return false;
    return withProbe(function (cache) { return rectFreeIn(x - 2, y - 2, 38, 38, 10, cache); });
  }
  setInterval(function () {
    if (document.hidden || shy || paused) return;
    if (hidden) { if (!backFree()) placeBack(); return; }
    if (!welcomed) { welcome(); return; }
    if (isOpen || walking || poofing) return;
    if (away) { settle(); return; }
    var lane = bounds().maxY;
    if (Math.abs(pos.y - lane) > 1) { pos.y = lane; bot.style.transition = NOMOVE; place(); }
    if (!footprintFree()) settle();
  }, 700);

  /* the eye follows the mouse; get too close and Fotu scurries away along the edge */
  var lastScurry = 0;
  if (finePointer) {
    document.addEventListener("mousemove", function (e) {
      if (hidden || paused || isOpen || away || shy) return;
      var s = size(), cx = pos.x + s / 2, cy = pos.y + s / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      if (!walking) look(dx / 30 * dir, dy / 30);
      var d = Math.hypot(dx, dy);
      if (d < 60 && !walking && Date.now() - lastScurry > 8000 && Math.random() < 0.05) {
        lastScurry = Date.now();
        var cursorX = e.clientX;
        if (!bubble(PERSONAL_SPACE, 2000)) hop();
        setTimeout(function () { if (!walking && !isOpen) pace(null, cursorX); }, 300);
      }
    }, { passive: true });

    /* hover on a photo for a moment and Fotu turns to take a shot of it */
    var hoverTimer = null, lastHoverShot = 0;
    document.addEventListener("mouseover", function (e) {
      var img = e.target && e.target.tagName === "IMG" ? e.target : null;
      clearTimeout(hoverTimer);
      if (!img || root.contains(img) || hidden || paused || isOpen || away || shy) return;
      hoverTimer = setTimeout(function () {
        if (Date.now() - lastHoverShot < 9000 || walking) return;
        if (visiblePhotos().indexOf(img) === -1) return;
        lastHoverShot = Date.now(); idle = 0; visit(img);
      }, 1200);
    }, { passive: true });
  }

  /* scrolling or resizing: step out of sight, then come back to a clear spot */
  function onMove() {
    if (isOpen) { placePanel(); return; }
    if (!shy) {
      shy = true; refreshVis();
      if (walking) stopWalk();
      hideBubble();
      if (hidden) back.style.visibility = "hidden";
    }
    clearTimeout(shyTimer);
    shyTimer = setTimeout(function () {
      settle();
      shy = false; refreshVis();
      consumeFast();
    }, 280);
  }
  window.addEventListener("scroll", onMove, { passive: true });
  window.addEventListener("resize", onMove);

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

  function chatHome() {
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
    if (Date.now() - last < 30000) { say("Easy, I'm still printing the last one. Try again in a few seconds."); chatHome(); return; }
    if (Date.now() - chatOpenedAt < 4000) { say("That was fast. Suspiciously fast. Try once more?"); chatHome(); return; }
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
      track("sent");
      sending = false;
      say("Printed and sent! " + enq.cat + " shoot for " + enq.name + ". Reply coming to " + enq.email + ".");
      chatHome();
    }).catch(function () {
      sending = false;
      say("My printer jammed. Opening your email app so nothing gets lost.");
      var to = SITE.email || "hello@livingroomlabs.in";
      window.location.href = "mailto:" + to +
        "?subject=" + encodeURIComponent("Enquiry: " + enq.cat + " — " + enq.name) +
        "&body=" + encodeURIComponent("Name: " + enq.name + "\nEmail: " + enq.email + "\nCategory: " + enq.cat + "\n\nMessage:\n" + enq.msg);
      chatHome();
    });
  }

  function placePanel() {
    if (window.innerWidth <= 640) { panel.style.left = ""; panel.style.top = ""; return; }
    var s = size(), w = 310, h = Math.min(420, window.innerHeight - 24), W = window.innerWidth;
    var left = pos.x + s / 2 > W / 2 ? pos.x + s - w : pos.x;
    left = clamp(left, 12, W - w - 12);
    var top = clamp(pos.y - h - 10, 12, window.innerHeight - h - 12);
    panel.style.left = left + "px"; panel.style.top = top + "px";
  }
  function openChat() {
    if (walking) stopWalk();
    isOpen = true; hideBubble();
    bot.classList.remove("sleep"); idle = 0;
    placePanel(); panel.classList.add("on");
    chatOpenedAt = Date.now();
    track("open");
    hop();
    if (!logEl.children.length) {
      say(CLICK_HELLO[0]);
      setTimeout(function () { say(CLICK_HELLO[1]); }, 500);
      chatHome();
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
  /* the little "bring Fotu back" button also sits on the bottom edge, in a clear gap */
  function placeBack() {
    var segs = scanSegments(34);
    if (!segs.length) { back.style.visibility = "hidden"; return; }
    var curX = parseFloat(back.style.left), cur = isNaN(curX) ? null : segmentFor(curX, segs);
    var x = cur ? curX : segs[0].lo;
    back.style.left = Math.round(x) + "px"; back.style.top = Math.round(laneY(34)) + "px";
    back.style.visibility = "visible";
  }
  function applyHidden() {
    bot.style.display = hidden ? "none" : "";
    back.style.display = hidden ? "flex" : "none";
    if (hidden) { hideBubble(); closeChat(true); if (walking) stopWalk(); placeBack(); }
  }
  $("fotu-hide").addEventListener("click", function () { hidden = true; store(HIDE_KEY, "1"); applyHidden(); });
  back.addEventListener("click", function () {
    hidden = false; store(HIDE_KEY, null); applyHidden();
    welcomed = true; quietUntil = Date.now() + 4000;
    away = true; refreshVis(); settle();
    hop(); bubble("I'm back! Did you miss me? Don't answer that.", 3000, 3);
  });

  /* ================= lamp rope (theme switch) ================= */
  var lastTheme = document.documentElement.getAttribute("data-theme");
  new MutationObserver(function () {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === lastTheme) return;
    lastTheme = t;
    if (hidden || paused) return;
    if (walking) stopWalk();
    bot.classList.remove("sleep"); idle = 0;
    if (t === "dark") {
      flash(); hop(); bubble(LIGHTS_OFF, 3200);
    } else {
      bot.classList.add("squint");
      setTimeout(function () { bot.classList.remove("squint"); }, 1800);
      bubble(LIGHTS_ON, 3000);
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ================= fast scrolling ================= */
  var wheelSum = 0, wheelStart = 0, lastFast = 0, touchY = null, touchT = 0;
  function fastScroll() {
    if (hidden || paused || isOpen || Date.now() - lastFast < 20000) return;
    lastFast = Date.now(); pendingFast = true;
    setTimeout(consumeFast, 700);
  }
  function consumeFast() {
    if (!pendingFast || shy || away || poofing || walking || hidden || paused || isOpen) return;
    pendingFast = false;
    bot.classList.remove("sleep"); idle = 0;
    bot.classList.add("wobble");
    setTimeout(function () { bot.classList.remove("wobble"); }, 1250);
    bubble(pick(FAST_SCROLL), 2600);
  }
  window.addEventListener("wheel", function (e) {
    var now = Date.now();
    if (now - wheelStart > 400) { wheelStart = now; wheelSum = 0; }
    wheelSum += Math.abs(e.deltaY) + Math.abs(e.deltaX);
    if (wheelSum > 2400) { wheelSum = 0; fastScroll(); }
  }, { passive: true });
  window.addEventListener("touchstart", function (e) { var t = e.touches[0]; touchY = t ? t.clientY + t.clientX : null; touchT = Date.now(); }, { passive: true });
  window.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0]; if (touchY === null || !t) return;
    var dist = Math.abs(t.clientY + t.clientX - touchY), dt = Date.now() - touchT;
    if (dt > 0 && dt < 250 && dist / dt > 2.2) fastScroll();
    touchY = null;
  }, { passive: true });

  /* ================= start ================= */
  function welcome() {
    if (welcomed || hidden || paused) return;
    var segs = scanSegments();
    if (!segs.length) return; /* nowhere clear yet: the 0.7s check below tries again */
    welcomed = true; quietUntil = Date.now() + 9000;
    var seg = segs[segs.length - 1];
    pos.x = seg.hi; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
    away = false; refreshVis();
    var greet = function () {
      hop();
      printImg.setAttribute("fill", "#85B7EB");
      printEl.classList.add("out");
      bubble(welcomeLine(), 5000, 3);
      setTimeout(function () { printEl.classList.remove("out"); }, 4200);
    };
    if (seg.hi - seg.lo > 80) walkTo(seg.hi - 60, greet); else greet();
  }
  window.__fotuWelcome = welcome;
  refreshVis();
  applyHidden();
  setTimeout(welcome, 1200);
  setInterval(tick, 4500);
})();
