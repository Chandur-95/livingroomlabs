/* Living Room Labs - bulk photo uploader.
   Lives inside the Content Editor (/admin/) as the "Bulk Upload" panel and uses the editor's own
   GitHub login. Everything is prepared locally; nothing reaches the live site until you press
   "Commit all photos", and then every photo + the updated photo list go up as ONE commit. */
(function(){
  "use strict";
  var REPO = "Chandur-95/livingroomlabs";
  var BRANCH = "main";
  var API = window.__GH_API_BASE__ || "https://api.github.com";
  var MAX_BATCH = 80;
  /* same list as the Category field in the Content Editor (admin/config.yml) */
  var DEFAULT_CATEGORIES = ["Food", "Pets", "Real Estate", "Products", "Events", "Portraits", "Travel"];
  var POSITIONS = ["Center", "Top", "Bottom", "Left", "Right"];
  var RATIOS = ["1/1", "4/5", "5/4", "3/4", "4/3", "16/9", "16/10"];

  var token = null;
  var CATEGORIES = DEFAULT_CATEGORIES.slice();
  var existingPhotos = [];      /* photo list for the "Already Uploaded" tab, newest first */
  var knownEventTypes = [];     /* suggestions for the Event Type fields */
  var knownUploadNames = {};    /* lower-case file names already in images/uploads (best knowledge so far) */
  var photos = [];              /* the batch being prepared */
  var seq = 0;
  var uploading = false;

  function $(s, r){ return (r || document).querySelector(s); }
  function $all(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function splitList(str){ return String(str || "").split(",").map(function(s){ return s.trim(); }).filter(Boolean); }
  function uniq(arr){ var out = []; arr.forEach(function(x){ if (x && out.indexOf(x) === -1) out.push(x); }); return out; }

  /* ================= login: the Content Editor's own session ================= */
  function readEditorSession(){
    var keys = ["decap-cms-user", "netlify-cms-user"];
    for (var i = 0; i < keys.length; i++) {
      try {
        var raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        var u = JSON.parse(raw);
        var t = u && (u.token || u.access_token || (u.backend && u.backend.token));
        if (t) return t;
      } catch (e) { /* unreadable entry - try the next key */ }
    }
    return null;
  }

  function showLoggedOut(){
    token = null;
    $("#authStatus").textContent = "Not logged in";
    $("#authStatus").classList.remove("ok");
    $("#btnRecheck").style.display = "inline-block";
    $("#gate").style.display = "block";
    $("#app").style.display = "none";
  }

  function tryAutoLogin(){
    var found = readEditorSession();
    if (!found) { showLoggedOut(); return false; }
    var changed = found !== token;
    token = found;
    onLoggedIn(changed);
    return true;
  }

  /* Fallback only (normally the editor's session is picked up automatically). The login popup
     (functions/api/callback.js) first announces "authorizing:github" and waits for THIS page to
     answer before it hands over the token - without that reply the popup would sit on
     "Logging you in..." forever. */
  function login(){
    var popup = window.open("/api/auth", "lrl_login", "width=520,height=640");
    if (!popup) { alert("Your browser blocked the login window - allow pop-ups for this site and try again."); return; }
    function onMsg(e){
      if (e.origin !== window.location.origin) return;
      var data = e.data;
      if (data === "authorizing:github") {
        if (e.source && e.source.postMessage) e.source.postMessage("authorizing:github", e.origin);
        return;
      }
      if (typeof data === "string" && data.indexOf("authorization:github:success:") === 0) {
        window.removeEventListener("message", onMsg);
        try {
          token = JSON.parse(data.slice("authorization:github:success:".length)).token;
          onLoggedIn(true);
        } catch (err) { showLoggedOut(); }
      }
    }
    window.addEventListener("message", onMsg);
  }

  function onLoggedIn(refresh){
    $("#authStatus").textContent = "Logged in";
    $("#authStatus").classList.add("ok");
    $("#btnRecheck").style.display = "none";
    $("#gate").style.display = "none";
    $("#app").style.display = "block";
    updateUploadButton();
    if (refresh) loadFromRepo();
  }

  $("#btnRecheck").addEventListener("click", tryAutoLogin);
  $("#btnLoginFallback").addEventListener("click", login);
  window.__bulkRecheck = tryAutoLogin;

  /* ================= tabs ================= */
  $all(".tab-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      var tab = btn.getAttribute("data-tab");
      $all(".tab-btn").forEach(function(b){ b.classList.toggle("active", b === btn); });
      $all(".tab-panel").forEach(function(p){ p.classList.toggle("active", p.id === "tab-" + tab); });
      if (tab === "existing") renderExistingGrid();
    });
  });

  /* ================= site data ================= */
  function uploadName(src){
    var m = /^\/?images\/uploads\/([^\/?#]+)$/.exec(src || "");
    return m ? m[1] : null;
  }

  function applyContent(d){
    if (!d || typeof d !== "object") return;
    var niches = (d.niches || []).map(function(n){ return (n && n.name) || n; });
    var catsBefore = CATEGORIES.join("|");
    CATEGORIES = uniq(DEFAULT_CATEGORIES.concat(niches.filter(function(n){ return typeof n === "string"; })));
    existingPhotos = (d.photos || []).filter(function(p){ return p && p.src; }).slice().reverse();
    var ets = [];
    (d.photos || []).forEach(function(p){
      (p && p.eventTypes || []).forEach(function(et){ ets.push(et); });
      var n = p && uploadName(p.src);
      if (n) knownUploadNames[n.toLowerCase()] = true;
    });
    knownEventTypes = uniq(knownEventTypes.concat(ets));
    fillCategorySelects();
    fillEventSuggestions();
    renderExistingGrid();
    /* only redraw the batch if the category list really changed (redrawing would drop the cursor
       out of whatever field you're typing in) */
    if (photos.length && catsBefore !== CATEGORIES.join("|")) renderGrid();
  }

  function fillCategorySelects(){
    var bulk = $("#bulkCategory"), keepBulk = bulk.value;
    bulk.innerHTML = '<option value="">Category…</option>' +
      CATEGORIES.map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+'</option>'; }).join("");
    bulk.value = keepBulk;
    var filter = $("#existingCategoryFilter"), keepFilter = filter.value;
    filter.innerHTML = '<option value="">All categories</option>' +
      CATEGORIES.map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+'</option>'; }).join("");
    filter.value = keepFilter;
  }

  function fillEventSuggestions(){
    var dl = document.getElementById("eventTypeSuggestions");
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = "eventTypeSuggestions";
      document.body.appendChild(dl);
    }
    var all = uniq(knownEventTypes.concat(["Birthday", "Wedding", "Baby Shower", "Housewarming", "Couple Shoot", "Performing Arts", "Miss Universe"]));
    dl.innerHTML = all.map(function(et){ return '<option value="'+esc(et)+'"></option>'; }).join("");
  }

  /* quick first paint from the published site... */
  fetch("/content.json", { cache: "no-store" })
    .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(applyContent)
    .catch(function(err){ console.warn("Could not load /content.json", err); fillCategorySelects(); fillEventSuggestions(); });

  /* ...then, once logged in, the CURRENT version straight from the repo (the published copy can
     lag a minute behind a save, and this is also where just-committed photos show up) */
  function loadFromRepo(){
    return readRepoState().then(function(state){
      state.uploadNames.forEach(function(n){ knownUploadNames[n.toLowerCase()] = true; });
      applyContent(state.content);
    }).catch(function(err){ console.warn("Could not read the repo yet:", err); });
  }

  /* ================= GitHub API ================= */
  function ghFetch(path, opts){
    opts = opts || {};
    var headers = Object.assign({
      "Authorization": "token " + token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    }, opts.headers || {});
    return fetch(API + path, Object.assign({ cache: "no-store" }, opts, { headers: headers })).then(function(res){
      if (res.status === 401) {
        showLoggedOut();
        throw new Error("Your login has expired - log in to the Content Editor again, then press Recheck login.");
      }
      if (!res.ok) {
        return res.text().then(function(t){ throw new Error("GitHub " + res.status + ": " + t.slice(0, 240)); });
      }
      return res.json();
    });
  }

  function decodeBase64Utf8(b64){
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function utf8ToBase64(str){
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  /* Reads content.json and the list of files in images/uploads from ONE exact commit - by blob
     SHA, not the "contents" endpoint - so what we edit is exactly the latest saved version,
     never a cached copy (which could otherwise undo a change you just saved in the editor). */
  function readRepoState(){
    var state = {};
    return ghFetch("/repos/" + REPO + "/git/ref/heads/" + BRANCH)
      .then(function(ref){
        state.commitSha = ref.object.sha;
        return ghFetch("/repos/" + REPO + "/git/commits/" + state.commitSha);
      })
      .then(function(commit){
        state.treeSha = commit.tree.sha;
        return ghFetch("/repos/" + REPO + "/git/trees/" + state.treeSha + "?recursive=1");
      })
      .then(function(tree){
        var contentEntry = null;
        state.uploadNames = [];
        (tree.tree || []).forEach(function(t){
          if (t.path === "content.json") contentEntry = t;
          var m = /^images\/uploads\/([^\/]+)$/.exec(t.path);
          if (m && t.type === "blob") state.uploadNames.push(m[1]);
        });
        if (!contentEntry) throw new Error("content.json was not found in the repository.");
        return ghFetch("/repos/" + REPO + "/git/blobs/" + contentEntry.sha);
      })
      .then(function(blob){
        state.content = JSON.parse(decodeBase64Utf8(blob.content));
        if (!Array.isArray(state.content.photos)) state.content.photos = [];
        return state;
      });
  }

  /* ================= "Already Uploaded" ================= */
  function thumbFor(src){
    var n = uploadName(src);
    return n ? "/images/thumbs/" + n + ".webp" : src;
  }

  function renderExistingGrid(){
    var grid = $("#existingGrid");
    if (!grid) return;
    var catFilter = $("#existingCategoryFilter").value;
    var search = $("#existingSearch").value.trim().toLowerCase();
    var list = existingPhotos.filter(function(p){
      if (catFilter && p.category !== catFilter) return false;
      if (search) {
        var hay = ((p.title || "") + " " + (p.client || "") + " " + (p.eventTypes || []).join(" ")).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    });
    $("#existingCountLabel").textContent = list.length + " of " + existingPhotos.length + " photos live";
    if (!list.length) {
      grid.innerHTML = '<div class="existing-empty">' + (existingPhotos.length ? "No photos match." : "No photos yet.") + '</div>';
      return;
    }
    grid.innerHTML = list.map(function(p){
      /* just-committed photos show from the local copy until the site finishes building them */
      var src = p.__preview || thumbFor(p.src);
      return '<div class="existing-card">' +
        '<img src="'+esc(src)+'" data-full="'+esc(p.src)+'" alt="" loading="lazy">' +
        '<div class="ec-body">' +
          '<div class="ec-title">' + (p.__justAdded ? '<span class="ec-new">NEW</span> ' : '') + esc(p.title || "Untitled") + '</div>' +
          '<div class="ec-meta">' + esc(p.category || "") + ((p.eventTypes && p.eventTypes.length) ? " · " + esc(p.eventTypes.join(", ")) : "") + '</div>' +
          (p.client ? '<div class="ec-meta">' + esc(p.client) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join("");
    /* no thumbnail yet (new or unprocessed photo)? fall back to the original file */
    $all("img[data-full]", grid).forEach(function(img){
      img.addEventListener("error", function onErr(){
        img.removeEventListener("error", onErr);
        if (img.getAttribute("src") !== img.dataset.full) img.src = img.dataset.full;
      });
    });
  }
  $("#existingCategoryFilter").addEventListener("change", renderExistingGrid);
  $("#existingSearch").addEventListener("input", renderExistingGrid);

  /* ================= choosing photos ================= */
  var picker = $("#picker"), fileInput = $("#fileInput");
  $("#btnChoose").addEventListener("click", function(){ fileInput.click(); });
  fileInput.addEventListener("change", function(){ addFiles(fileInput.files); fileInput.value = ""; });
  picker.addEventListener("dragover", function(e){ e.preventDefault(); picker.classList.add("drag"); });
  picker.addEventListener("dragleave", function(){ picker.classList.remove("drag"); });
  picker.addEventListener("drop", function(e){
    e.preventDefault(); picker.classList.remove("drag");
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  function slugParts(name){
    var ext = ((name.match(/\.[^.]+$/) || [".jpg"])[0]).toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
    var slug = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
    return { slug: slug, ext: ext };
  }
  function nameTaken(candidate, selfId){
    var lc = candidate.toLowerCase();
    return !!knownUploadNames[lc] || photos.some(function(p){ return p.id !== selfId && p.filename.toLowerCase() === lc; });
  }
  function uniqueFilename(original, selfId){
    var parts = slugParts(original);
    var candidate = parts.slug + parts.ext, n = 2;
    while (nameTaken(candidate, selfId)) { candidate = parts.slug + "-" + n + parts.ext; n++; }
    return candidate;
  }

  function simplifyRatio(w, h){
    function gcd(a, b){ return b ? gcd(b, a % b) : a; }
    var g = gcd(w, h) || 1;
    return (w / g) + "/" + (h / g);
  }
  /* the Content Editor only offers these ratios - snap the measured one to the closest */
  function closestPresetRatio(w, h){
    var target = w / h, best = "4/5", bestD = Infinity;
    RATIOS.forEach(function(r){
      var p = r.split("/"), d = Math.abs(p[0] / p[1] - target);
      if (d < bestD) { bestD = d; best = r; }
    });
    return best;
  }

  function addFiles(fileList){
    if (uploading) return;
    var files = Array.prototype.filter.call(fileList || [], function(f){ return /^image\//.test(f.type); });
    var room = MAX_BATCH - photos.length;
    if (room <= 0) {
      alert("This batch already has " + MAX_BATCH + " photos. Commit these first, then add the rest in a new batch.");
      return;
    }
    if (files.length > room) {
      alert("Only " + room + " more photo(s) fit in this batch (max " + MAX_BATCH + "). Added the first " + room + " - commit these, then add the rest in a new batch.");
      files = files.slice(0, room);
    }
    clearResult();
    files.forEach(function(file){
      var id = "p" + (seq++);
      var previewUrl = URL.createObjectURL(file);
      var entry = {
        id: id, file: file, previewUrl: previewUrl,
        filename: "",
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim(),
        category: CATEGORIES[0] || "Food", eventTypes: [],
        client: "", caption: "", alt: "", showInAll: true, featured: true,
        ratio: "4/5", imagePosition: "Center", status: "pending"
      };
      photos.push(entry);
      entry.filename = uniqueFilename(file.name, id);
      /* measure the real image so the ratio is right on the site (no surprise crops) */
      var probe = new Image();
      probe.onload = function(){
        if (!probe.naturalWidth || !probe.naturalHeight) return;
        entry.ratio = closestPresetRatio(probe.naturalWidth, probe.naturalHeight);
        var tag = document.querySelector('[data-ratio-tag="' + id + '"]');
        if (tag) tag.textContent = simplifyRatio(probe.naturalWidth, probe.naturalHeight) === entry.ratio ? entry.ratio : entry.ratio + " (closest)";
        var sel = document.querySelector('.card[data-id="' + id + '"] [data-f="ratio"]');
        if (sel) sel.value = entry.ratio;
      };
      probe.src = previewUrl;
    });
    renderGrid();
  }

  /* ================= batch cards ================= */
  function optionList(values, selected){
    return values.map(function(v){ return '<option value="'+esc(v)+'"'+(v === selected ? ' selected' : '')+'>'+esc(v)+'</option>'; }).join("");
  }

  function renderGrid(){
    var grid = $("#grid");
    grid.innerHTML = "";
    photos.forEach(function(p, idx){
      var cats = CATEGORIES.indexOf(p.category) === -1 ? CATEGORIES.concat([p.category]) : CATEGORIES;
      var card = document.createElement("div");
      card.className = "card" + (p.category === "Events" ? " is-events" : "") + (p.status === "error" ? " error" : "");
      card.dataset.id = p.id;
      card.innerHTML =
        '<button type="button" class="card-remove" data-remove="'+p.id+'" aria-label="Remove this photo">✕</button>' +
        '<span class="card-ratio-tag mono" data-ratio-tag="'+p.id+'">'+esc(p.ratio)+'</span>' +
        '<img class="card-img" src="'+p.previewUrl+'" alt="">' +
        '<div class="card-body">' +
          '<div><label>Title</label><input type="text" data-f="title" value="'+esc(p.title)+'"></div>' +
          '<div class="card-row">' +
            '<div><label>Category</label><select data-f="category">'+optionList(cats, p.category)+'</select></div>' +
            '<div><label>Shoot / Client</label><input type="text" data-f="client" value="'+esc(p.client)+'" placeholder="e.g. Swetha\'s Birthday"></div>' +
          '</div>' +
          '<div class="event-field"><label>Event Type <span class="opt">(optional - several? separate with commas)</span></label>' +
            '<input type="text" data-f="eventTypes" list="eventTypeSuggestions" value="'+esc(p.eventTypes.join(", "))+'" placeholder="e.g. Birthday, Performing Arts"></div>' +
          '<div><label>Caption</label><textarea data-f="caption">'+esc(p.caption)+'</textarea></div>' +
          '<div><label>Alt text <span class="opt">(for Google &amp; screen readers - blank = use the title)</span></label><input type="text" data-f="alt" value="'+esc(p.alt)+'"></div>' +
          '<div class="card-row">' +
            '<div><label>Image Position</label><select data-f="imagePosition">'+optionList(POSITIONS, p.imagePosition)+'</select></div>' +
            '<div><label>Aspect Ratio</label><select data-f="ratio">'+optionList(RATIOS, p.ratio)+'</select></div>' +
          '</div>' +
          '<div class="card-toggles">' +
            '<label><input type="checkbox" data-f="showInAll"'+(p.showInAll ? ' checked' : '')+'> Show in All</label>' +
            '<label><input type="checkbox" data-f="featured"'+(p.featured ? ' checked' : '')+'> Featured</label>' +
          '</div>' +
          (idx > 0 ? '<button type="button" class="btn small" data-copy-prev="'+p.id+'" title="Copy category, client, event type, position and toggles from the photo before">↑ Same as previous photo</button>' : '') +
        '</div>' +
        '<div class="card-status err mono" data-err="'+p.id+'"></div>';
      grid.appendChild(card);
    });
    $("#countLabel").textContent = photos.length + (photos.length === 1 ? " photo" : " photos") + " (max " + MAX_BATCH + ")";
    $("#toolbar").style.display = photos.length ? "flex" : "none";
    bindCardEvents();
    updateUploadButton();
  }

  function bindCardEvents(){
    $all("#grid .card").forEach(function(card){
      var p = photos.find(function(x){ return x.id === card.dataset.id; });
      if (!p) return;
      $all("[data-f]", card).forEach(function(field){
        var key = field.getAttribute("data-f");
        var handler = function(){
          if (key === "eventTypes") p.eventTypes = splitList(field.value);
          else if (field.type === "checkbox") p[key] = field.checked;
          else p[key] = field.value;
          if (key === "category") card.classList.toggle("is-events", p.category === "Events");
        };
        field.addEventListener("input", handler);
        field.addEventListener("change", handler);
      });
    });
    $all("#grid [data-remove]").forEach(function(btn){
      btn.addEventListener("click", function(){
        if (uploading) return;
        var id = btn.getAttribute("data-remove");
        var p = photos.find(function(x){ return x.id === id; });
        if (p) URL.revokeObjectURL(p.previewUrl);
        photos = photos.filter(function(x){ return x.id !== id; });
        renderGrid();
      });
    });
    $all("#grid [data-copy-prev]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var idx = photos.findIndex(function(x){ return x.id === btn.getAttribute("data-copy-prev"); });
        if (idx <= 0) return;
        var prev = photos[idx - 1], p = photos[idx];
        p.category = prev.category;
        p.client = prev.client;
        p.eventTypes = prev.eventTypes.slice();
        p.showInAll = prev.showInAll;
        p.featured = prev.featured;
        p.imagePosition = prev.imagePosition;
        renderGrid();
      });
    });
  }

  /* ================= "Apply to all" =================
     Category, Event type (optional), Shoot / client, Image position, Show in All.
     (Featured is set per photo on each card.) Event type only means something on photos in the Events
     category - pick Events here in the same Apply, or on the photos themselves. */
  $("#btnApplyBulk").addEventListener("click", function(){
    if (uploading || !photos.length) return;
    var cat = $("#bulkCategory").value;
    var client = $("#bulkClient").value.trim();
    var events = splitList($("#bulkEventType").value);
    var position = $("#bulkPosition").value;
    var showInAll = $("#bulkShowInAll").value;
    if (!cat && !client && !events.length && !position && !showInAll) {
      alert("Pick at least one thing to apply (category, event type, client, position or Show in All).");
      return;
    }
    /* an event type on its own, with no Events photos in the batch: say so plainly instead of silently doing nothing */
    var willBeEvents = photos.filter(function(p){ return (cat || p.category) === "Events"; }).length;
    if (events.length && !willBeEvents && !client && !position && !showInAll && !cat) {
      showResult(false, "Event type is only used on photos in the Events category. Choose \"Events\" in Category (next to it) and press Apply again.");
      return;
    }
    var skippedEvents = 0;
    photos.forEach(function(p){
      if (cat) p.category = cat;
      if (client) p.client = client;
      if (position) p.imagePosition = position;
      if (showInAll) p.showInAll = showInAll === "yes";
      if (events.length) {
        /* event types only mean something on Events photos (the site ignores them elsewhere) */
        if (p.category === "Events") p.eventTypes = events.slice();
        else skippedEvents++;
      }
    });
    renderGrid();
    if (events.length && skippedEvents) {
      showResult(true, "Applied. Event type was added to the " + (photos.length - skippedEvents) + " Events photo(s) only - " + skippedEvents + " photo(s) in other categories were left without one.");
    } else {
      showResult(true, "Applied to all " + photos.length + " photo(s). You can still change any single photo below.");
    }
  });

  $("#btnClearAll").addEventListener("click", function(){
    if (uploading || !photos.length) return;
    if (!confirm("Remove all " + photos.length + " photos from this batch? Nothing has been uploaded yet, so this is safe.")) return;
    photos.forEach(function(p){ URL.revokeObjectURL(p.previewUrl); });
    photos = [];
    clearResult();
    renderGrid();
  });

  function updateUploadButton(){
    $("#btnUploadAll").disabled = !(token && photos.length > 0 && !uploading);
  }

  /* ================= progress + messages ================= */
  function setProgress(pct, label){
    $("#progressBar").classList.add("on");
    $("#progressFill").style.width = pct + "%";
    $("#progressLabel").textContent = label;
  }
  function hideProgress(){ $("#progressBar").classList.remove("on"); }
  function showResult(ok, message){
    var el = $("#resultBanner");
    el.className = "result-banner " + (ok ? "ok" : "err");
    el.textContent = message;
  }
  function clearResult(){ var el = $("#resultBanner"); el.className = "result-banner"; el.textContent = ""; }

  /* leaving mid-upload would silently abandon it */
  window.addEventListener("beforeunload", function(e){
    if (uploading) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ================= commit ================= */
  function fileToBase64(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(String(reader.result).split(",")[1]); };
      reader.onerror = function(){ reject(new Error("Could not read " + file.name)); };
      reader.readAsDataURL(file);
    });
  }

  $("#btnUploadAll").addEventListener("click", function(){
    if (!token || !photos.length || uploading) return;
    var missing = photos.filter(function(p){ return !String(p.title || "").trim(); }).length;
    if (missing) { alert(missing + " photo(s) have no title - add one to each before committing."); return; }
    if (!confirm("Commit " + photos.length + " photo(s) to livingroomlabs.in now? They go live on the site in about a minute.")) return;
    uploadAll();
  });

  function uploadAll(){
    uploading = true;
    updateUploadButton();
    clearResult();
    photos.forEach(function(p){ p.status = "pending"; });
    $all("#grid .card").forEach(function(c){ c.classList.remove("error"); });
    var batch = photos.slice();
    var total = batch.length;
    var base, treeEntries = [], newEntries = [];
    setProgress(2, "Reading the latest version of the site…");

    readRepoState()
      .then(function(state){
        base = state;
        /* final safety check against the REAL files in images/uploads (team photos, banners and
           anything else live there too) - a clash gets a -2, -3... name instead of overwriting */
        state.uploadNames.forEach(function(n){ knownUploadNames[n.toLowerCase()] = true; });
        batch.forEach(function(p){
          if (knownUploadNames[p.filename.toLowerCase()]) p.filename = uniqueFilename(p.filename, p.id);
        });
        var chain = Promise.resolve();
        batch.forEach(function(p, i){
          chain = chain.then(function(){
            setProgress(5 + Math.round((i / total) * 70), "Uploading photo " + (i + 1) + " of " + total + " (" + p.filename + ")…");
            return fileToBase64(p.file)
              .then(function(b64){
                return ghFetch("/repos/" + REPO + "/git/blobs", { method: "POST", body: JSON.stringify({ content: b64, encoding: "base64" }) });
              })
              .then(function(blob){
                treeEntries.push({ path: "images/uploads/" + p.filename, mode: "100644", type: "blob", sha: blob.sha });
                var isEvents = p.category === "Events";
                newEntries.push({
                  title: String(p.title).trim(),
                  client: String(p.client || "").trim() || "Studio",
                  category: p.category,
                  eventTypes: isEvents ? uniq(p.eventTypes) : [],
                  showInAll: !!p.showInAll,
                  caption: p.caption || "",
                  alt: String(p.alt || "").trim() || String(p.title).trim(),
                  ratio: p.ratio || "4/5",
                  src: "/images/uploads/" + p.filename,
                  imagePosition: p.imagePosition || "Center",
                  featured: !!p.featured
                });
              })
              .catch(function(err){
                p.status = "error";
                var errEl = document.querySelector('[data-err="' + p.id + '"]');
                var card = document.querySelector('#grid .card[data-id="' + p.id + '"]');
                if (errEl) errEl.textContent = "Failed: " + err.message;
                if (card) card.classList.add("error");
                throw err; /* stop - nothing has been committed yet, so the live site is untouched */
              });
          });
        });
        return chain;
      })
      .then(function(){
        setProgress(78, "Saving the updated photo list…");
        base.content.photos = base.content.photos.concat(newEntries);
        return ghFetch("/repos/" + REPO + "/git/blobs", {
          method: "POST",
          body: JSON.stringify({ content: utf8ToBase64(JSON.stringify(base.content, null, 2) + "\n"), encoding: "base64" })
        });
      })
      .then(function(blob){
        treeEntries.push({ path: "content.json", mode: "100644", type: "blob", sha: blob.sha });
        setProgress(85, "Building the commit…");
        return ghFetch("/repos/" + REPO + "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.treeSha, tree: treeEntries }) });
      })
      .then(function(tree){
        return ghFetch("/repos/" + REPO + "/git/commits", {
          method: "POST",
          body: JSON.stringify({ message: "Bulk upload: " + total + " photo(s) via bulk uploader", tree: tree.sha, parents: [base.commitSha] })
        });
      })
      .then(function(commit){
        setProgress(95, "Publishing to livingroomlabs.in…");
        /* force:false - if someone saved in the editor during this upload, GitHub refuses instead
           of us overwriting their save; just press Commit again and it rebuilds on top of it */
        return ghFetch("/repos/" + REPO + "/git/refs/heads/" + BRANCH, {
          method: "PATCH",
          body: JSON.stringify({ sha: commit.sha, force: false })
        }).then(function(){ return commit; });
      })
      .then(function(commit){
        setProgress(100, "Done!");
        /* move the committed photos out of the batch and into "Already Uploaded" */
        batch.forEach(function(p, i){
          var entry = newEntries[i];
          entry.__justAdded = true;
          entry.__preview = p.previewUrl; /* kept (not revoked) so it can show until the site rebuilds */
          existingPhotos.unshift(entry);
          knownUploadNames[p.filename.toLowerCase()] = true;
          newEntries[i].eventTypes.forEach(function(et){ if (knownEventTypes.indexOf(et) === -1) knownEventTypes.push(et); });
        });
        photos = photos.filter(function(p){ return batch.indexOf(p) === -1; });
        uploading = false;
        window.__bulkCommitted = true;
        fillEventSuggestions();
        renderGrid();
        renderExistingGrid();
        showResult(true, "✓ " + total + " photo(s) committed (" + commit.sha.slice(0, 7) + "). The site updates in about a minute. " +
          "They're listed under \"Already Uploaded\". The Content Editor will reload when you go back to it, so it shows these photos too.");
        setTimeout(hideProgress, 1500);
      })
      .catch(function(err){
        uploading = false;
        hideProgress();
        updateUploadButton();
        var msg = String(err && err.message || err);
        if (/GitHub 422/.test(msg) && /fast.?forward/i.test(msg)) {
          msg = "Someone saved a change on the site while this was uploading. Nothing was published - just press \"Commit all photos\" again.";
        }
        showResult(false, "Upload stopped before anything went live - the site is unchanged. " + msg);
        console.error(err);
      });
  }

  /* first check happens now; the Content Editor page calls __bulkRecheck() each time the panel opens */
  tryAutoLogin();
})();
