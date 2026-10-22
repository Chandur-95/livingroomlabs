/* Living Room Labs - bulk photo uploader.
   Lives inside the Content Editor (/admin/) as the "Bulk Upload" panel and uses the editor's own
   GitHub login. Everything is prepared locally; nothing reaches the live site until you press
   "Commit all photos", and then every photo + the updated photo list go up as ONE commit.
   "Already Uploaded" works the same way: edits, replaced images and deletes wait in a queue
   and go live together as ONE commit when you press "Commit all changes". */
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
  /* Changes to already-uploaded photos wait here until "Commit all changes". Keyed by the photo's
     current src. { action:"edit", changes:{only the fields you changed}, replace:{file,url,ratio}|null }
     or { action:"delete" }. */
  var pendingEdits = {};
  var committingEdits = false;
  var selected = {};            /* photos ticked for a change-them-all-at-once action, keyed by src */
  var shownList = [];           /* the photos the grid shows right now (after filter + search) */
  /* never deleted, whatever happens: the fallback banner photo */
  var PROTECTED_FILES = ["dsc05175.jpg"];

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
    renderPendingBar();
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
        state.paths = {};
        (tree.tree || []).forEach(function(t){
          if (t.path === "content.json") contentEntry = t;
          if (t.type === "blob" && t.path.indexOf("images/") === 0) state.paths[t.path] = true;
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
    shownList = list;
    $("#existingCountLabel").textContent = list.length + " of " + existingPhotos.length + " photos live";
    renderPendingBar();
    renderSelectBar();
    if (!list.length) {
      grid.innerHTML = '<div class="existing-empty">' + (existingPhotos.length ? "No photos match." : "No photos yet.") + '</div>';
      return;
    }
    grid.innerHTML = list.map(function(p){
      var q = pendingEdits[p.src];
      var v = q && q.action === "edit" ? Object.assign({}, p, q.changes) : p;
      /* just-committed photos show from the local copy until the site finishes building them */
      var src = (q && q.replace && q.replace.url) || p.__preview || thumbFor(p.src);
      var badge = !q ? "" : q.action === "delete" ? '<span class="ec-badge del">Will delete</span>'
        : '<span class="ec-badge">' + (q.replace ? "New image" : "Edited") + '</span>';
      var isSel = !!selected[p.src], del = q && q.action === "delete";
      return '<div class="existing-card' + (q ? " is-queued" : "") + (del ? " is-deleting" : "") + (isSel ? " is-selected" : "") +
          '" data-edit-src="'+esc(p.src)+'">' +
        badge +
        '<label class="ec-check" title="Select for changing several at once"><input type="checkbox" data-sel-src="'+esc(p.src)+'"' + (isSel ? " checked" : "") +
          ' aria-label="Select '+esc(v.title || "photo")+'"><span></span></label>' +
        '<img src="'+esc(src)+'" data-full="'+esc(p.src)+'" alt="" loading="lazy">' +
        '<div class="ec-body">' +
          '<div class="ec-title">' + (p.__justAdded ? '<span class="ec-new">NEW</span> ' : '') + esc(v.title || "Untitled") + '</div>' +
          '<div class="ec-meta">' + esc(v.category || "") + ((v.eventTypes && v.eventTypes.length) ? " · " + esc(v.eventTypes.join(", ")) : "") + '</div>' +
          (v.client ? '<div class="ec-meta">' + esc(v.client) + '</div>' : '') +
          (del
            ? '<div class="ec-actions"><button type="button" class="ec-btn" data-restore-src="'+esc(p.src)+'">Restore</button></div>'
            : '<div class="ec-actions">' +
                '<button type="button" class="ec-btn" data-act="edit" data-src="'+esc(p.src)+'">Edit</button>' +
                '<button type="button" class="ec-btn" data-act="replace" data-src="'+esc(p.src)+'">Replace</button>' +
                '<button type="button" class="ec-btn danger" data-act="delete" data-src="'+esc(p.src)+'">Delete</button>' +
              '</div>') +
        '</div>' +
      '</div>';
    }).join("");
    $all("[data-edit-src]", grid).forEach(function(card){
      var img = card.querySelector("img");
      if (img) img.addEventListener("click", function(){ openEdit(card.getAttribute("data-edit-src")); });
    });
    $all("[data-sel-src]", grid).forEach(function(box){
      box.addEventListener("change", function(){
        var src = box.getAttribute("data-sel-src");
        if (box.checked) selected[src] = true; else delete selected[src];
        box.closest(".existing-card").classList.toggle("is-selected", box.checked);
        renderSelectBar();
      });
    });
    $all("[data-act]", grid).forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.stopPropagation();
        var src = btn.getAttribute("data-src"), act = btn.getAttribute("data-act");
        if (act === "edit") openEdit(src);
        else if (act === "replace") pickReplacement(src);
        else if (act === "delete") queueDelete([src]);
      });
    });
    $all("[data-restore-src]", grid).forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.stopPropagation();
        delete pendingEdits[btn.getAttribute("data-restore-src")];
        renderExistingGrid();
      });
    });
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
    var files = Array.prototype.filter.call(fileList || [], looksLikeImage);
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
    if (!files.length) return;
    setProgress(10, "Checking " + files.length + " photo(s)…");
    Promise.all(files.map(function(f){
      return prepareImage(f).then(function(ok){ return { file: ok }; }, function(err){ return { bad: f.name, why: err.message }; });
    })).then(function(results){
      hideProgress();
      var bad = results.filter(function(r){ return r.bad; });
      addPreparedFiles(results.filter(function(r){ return r.file; }).map(function(r){ return r.file; }));
      if (bad.length) {
        showResult(false, bad.length + " file(s) couldn't be read and were left out: " +
          bad.map(function(b){ return b.bad; }).join(", ") + ". Export them as JPEG and add them again.");
      }
    });
  }

  function addPreparedFiles(files){
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
    syncBulkEventVisibility();
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
          if (key === "category") {
            card.classList.toggle("is-events", p.category === "Events");
            syncBulkEventVisibility();
          }
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

  /* ================= "Apply to all" ================= */
  /* Event Type shows when you pick Events here, or when any photo in the batch is already Events */
  function syncBulkEventVisibility(){
    var show = $("#bulkCategory").value === "Events" || photos.some(function(p){ return p.category === "Events"; });
    $("#bulkEventWrap").style.display = show ? "" : "none";
  }
  $("#bulkCategory").addEventListener("change", syncBulkEventVisibility);

  $("#btnApplyBulk").addEventListener("click", function(){
    if (uploading || !photos.length) return;
    var cat = $("#bulkCategory").value;
    var client = $("#bulkClient").value.trim();
    var events = splitList($("#bulkEventType").value);
    var position = $("#bulkPosition").value;
    var showInAll = $("#bulkShowInAll").value;
    var featured = $("#bulkFeatured").value;
    if (!cat && !client && !events.length && !position && !showInAll && !featured) {
      alert("Pick at least one thing to apply (category, event type, client, position or a toggle).");
      return;
    }
    var skippedEvents = 0;
    photos.forEach(function(p){
      if (cat) p.category = cat;
      if (client) p.client = client;
      if (position) p.imagePosition = position;
      if (showInAll) p.showInAll = showInAll === "yes";
      if (featured) p.featured = featured === "yes";
      if (events.length) {
        /* event types only mean something on Events photos (the site ignores them elsewhere) */
        if (p.category === "Events") p.eventTypes = events.slice();
        else skippedEvents++;
      }
    });
    renderGrid();
    if (events.length && skippedEvents) {
      showResult(true, "Applied. Event type was added to the Events photos only - " + skippedEvents + " photo(s) in other categories were left without one.");
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

  /* ================= preparing image files ================= */
  /* Phones and cameras hand over HEIC / TIFF / BMP files that most browsers (and the website)
     can't show. Anything that isn't JPEG / PNG / WebP / GIF is turned into a JPEG here, in the
     browser; anything that can't be opened at all is rejected so nothing broken goes live. */
  var WEB_TYPES = /^image\/(jpeg|png|webp|gif)$/;
  var IMG_EXT = /\.(jpe?g|png|webp|gif|heic|heif|tiff?|bmp|avif)$/i;
  var HEIC2ANY_URL = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
  var heicLib = null;

  function looksLikeImage(f){ return /^image\//.test(f.type || "") || IMG_EXT.test(f.name || ""); }

  function decodeTest(blob){
    return new Promise(function(resolve, reject){
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function(){ resolve({ img: img, url: url }); };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error("unreadable")); };
      img.src = url;
    });
  }
  function toJpeg(img, name){
    return new Promise(function(resolve, reject){
      var c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      c.toBlob(function(b){
        if (!b) { reject(new Error("could not convert")); return; }
        resolve(new File([b], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    });
  }
  function loadHeicLib(){
    if (window.heic2any) return Promise.resolve(window.heic2any);
    if (heicLib) return heicLib;
    heicLib = new Promise(function(resolve, reject){
      var s = document.createElement("script");
      s.src = HEIC2ANY_URL;
      s.onload = function(){ window.heic2any ? resolve(window.heic2any) : reject(new Error("HEIC converter missing")); };
      s.onerror = function(){ heicLib = null; reject(new Error("HEIC converter could not load")); };
      document.head.appendChild(s);
    });
    return heicLib;
  }
  function prepareImage(file){
    var isHeic = /hei[cf]/i.test(file.type || "") || /\.hei[cf]$/i.test(file.name || "");
    return decodeTest(file).then(function(r){
      if (WEB_TYPES.test(file.type || "") && !isHeic) { URL.revokeObjectURL(r.url); return file; }
      return toJpeg(r.img, file.name).then(function(j){ URL.revokeObjectURL(r.url); return j; });
    }, function(){
      if (!isHeic) throw new Error("This file can't be opened");
      /* Chrome/Edge/Firefox can't open HEIC themselves - use a converter, loaded only when needed */
      return loadHeicLib()
        .then(function(lib){ return lib({ blob: file, toType: "image/jpeg", quality: 0.92 }); })
        .then(function(out){
          var b = Array.isArray(out) ? out[0] : out;
          return new File([b], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        })
        .then(function(j){ return decodeTest(j).then(function(r){ URL.revokeObjectURL(r.url); return j; }); })
        .catch(function(){ throw new Error("This HEIC file can't be converted here"); });
    });
  }

  /* ================= editing already-uploaded photos ================= */
  var editSrc = null, editOriginal = null, editReplace = null, altFollowsTitle = false;

  function photoBySrc(src){
    for (var i = 0; i < existingPhotos.length; i++) if (existingPhotos[i].src === src) return existingPhotos[i];
    return null;
  }
  function pendingCount(){ return Object.keys(pendingEdits).length; }
  window.__bulkPendingCount = pendingCount;

  function buildEditPanel(){
    if (document.getElementById("bulkEdit")) return document.getElementById("bulkEdit");
    var el = document.createElement("div");
    el.id = "bulkEdit";
    el.className = "be-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "beHeading");
    el.innerHTML =
      '<div class="be-card">' +
        '<div class="be-media">' +
          '<div class="be-img-wrap"><img id="beImg" alt=""><span class="be-img-tag" id="beImgTag" hidden>New image</span></div>' +
          '<div class="be-media-actions">' +
            '<button type="button" class="btn small" id="beReplaceBtn">Replace image…</button>' +
            '<button type="button" class="btn small" id="beUndoReplace" hidden>Keep the original</button>' +
            '<input type="file" id="beReplaceInput" accept="image/*,.heic,.heif,.tif,.tiff" hidden>' +
          '</div>' +
          '<p class="be-note" id="beReplaceNote">Replacing gives the photo a new file name, so nobody sees the old one from their browser cache.</p>' +
        '</div>' +
        '<div class="be-fields card-body">' +
          '<h2 id="beHeading">Edit photo</h2>' +
          '<div><label for="beTitle">Title</label><input type="text" id="beTitle"></div>' +
          '<div class="card-row">' +
            '<div><label for="beCategory">Category</label><select id="beCategory"></select></div>' +
            '<div><label for="beClient">Shoot / Client</label><input type="text" id="beClient"></div>' +
          '</div>' +
          '<div class="event-field"><label for="beEvents">Event Type <span class="opt">(optional - several? separate with commas)</span></label>' +
            '<input type="text" id="beEvents" list="eventTypeSuggestions"></div>' +
          '<div><label for="beCaption">Caption</label><textarea id="beCaption"></textarea></div>' +
          '<div><label for="beAlt">Alt text <span class="opt">(describe what is in the photo)</span></label><input type="text" id="beAlt"></div>' +
          '<div class="card-row">' +
            '<div><label for="bePos">Image Position</label><select id="bePos"></select></div>' +
            '<div><label for="beRatio">Aspect Ratio</label><select id="beRatio"></select></div>' +
          '</div>' +
          '<div class="card-toggles">' +
            '<label><input type="checkbox" id="beShowAll"> Show in All</label>' +
            '<label><input type="checkbox" id="beFeatured"> Featured</label>' +
          '</div>' +
          '<div class="be-msg" id="beMsg" role="status"></div>' +
          '<div class="be-actions">' +
            '<button type="button" class="btn danger small" id="beDelete">Delete photo</button>' +
            '<span class="be-fill"></span>' +
            '<button type="button" class="btn" id="beCancel">Cancel</button>' +
            '<button type="button" class="btn primary" id="beSave">Save change</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    ($("#bulkOverlay") || document.body).appendChild(el);

    $("#beCategory", el).addEventListener("change", function(){
      $(".be-card", el).classList.toggle("is-events", this.value === "Events");
    });
    $("#beTitle", el).addEventListener("input", function(){ if (altFollowsTitle) $("#beAlt", el).value = this.value; });
    $("#beAlt", el).addEventListener("input", function(){ altFollowsTitle = false; });
    $("#beReplaceBtn", el).addEventListener("click", function(){ $("#beReplaceInput", el).click(); });
    $("#beReplaceInput", el).addEventListener("change", function(){
      var f = this.files && this.files[0];
      this.value = "";
      if (f) chooseReplacement(f);
    });
    $("#beUndoReplace", el).addEventListener("click", function(){
      if (editReplace && editReplace.url && !isQueuedReplaceUrl(editReplace.url)) URL.revokeObjectURL(editReplace.url);
      editReplace = null;
      showEditImage();
    });
    $("#beCancel", el).addEventListener("click", closeEdit);
    $("#beSave", el).addEventListener("click", saveEdit);
    $("#beDelete", el).addEventListener("click", toggleDelete);
    el.addEventListener("click", function(e){ if (e.target === el) closeEdit(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && el.classList.contains("on")) closeEdit(); });
    return el;
  }

  function isQueuedReplaceUrl(url){
    return Object.keys(pendingEdits).some(function(k){ var q = pendingEdits[k]; return q.replace && q.replace.url === url; });
  }
  function setEditMsg(text, isErr){
    var m = $("#beMsg");
    m.textContent = text || "";
    m.className = "be-msg" + (isErr ? " err" : "");
  }
  function showEditImage(){
    var el = $("#bulkEdit"), p = editOriginal;
    var img = $("#beImg", el);
    img.onerror = function(){ img.onerror = null; img.src = p.src; };
    img.src = editReplace ? editReplace.url : (p.__preview || thumbFor(p.src));
    $("#beImgTag", el).hidden = !editReplace;
    $("#beUndoReplace", el).hidden = !editReplace;
    $("#beReplaceBtn", el).textContent = editReplace ? "Choose a different image…" : "Replace image…";
  }

  function openEdit(src){
    var p = photoBySrc(src);
    if (!p) return;
    if (committingEdits) return;
    var el = buildEditPanel();
    var q = pendingEdits[src];
    editSrc = src;
    editOriginal = p;
    editReplace = q && q.replace ? q.replace : null;
    var v = q && q.action === "edit" ? Object.assign({}, p, q.changes) : p;
    var cats = CATEGORIES.indexOf(v.category) === -1 && v.category ? CATEGORIES.concat([v.category]) : CATEGORIES;
    $("#beCategory", el).innerHTML = optionList(cats, v.category || CATEGORIES[0]);
    $("#bePos", el).innerHTML = optionList(POSITIONS, v.imagePosition || "Center");
    var ratios = RATIOS.indexOf(v.ratio) === -1 && v.ratio ? RATIOS.concat([v.ratio]) : RATIOS;
    $("#beRatio", el).innerHTML = optionList(ratios, v.ratio || "4/5");
    $("#beTitle", el).value = v.title || "";
    $("#beClient", el).value = v.client || "";
    $("#beEvents", el).value = (v.eventTypes || []).join(", ");
    $("#beCaption", el).value = v.caption || "";
    $("#beAlt", el).value = v.alt || "";
    altFollowsTitle = !!(v.alt && v.alt === v.title);
    $("#beShowAll", el).checked = v.showInAll !== false;
    $("#beFeatured", el).checked = !!v.featured;
    $(".be-card", el).classList.toggle("is-events", (v.category || "") === "Events");
    var deleting = q && q.action === "delete";
    $(".be-card", el).classList.toggle("is-deleting", !!deleting);
    $("#beDelete", el).textContent = deleting ? "Restore photo" : "Delete photo";
    $("#beSave", el).disabled = !!deleting;
    $("#beHeading", el).textContent = deleting ? "Will be deleted when you commit" : "Edit photo";
    setEditMsg(deleting ? "This photo is queued for deletion. Restore it to edit it again." :
      (q ? "This photo already has a change waiting - saving here updates it." : ""), false);
    showEditImage();
    el.classList.add("on");
    setTimeout(function(){ try { $("#beTitle", el).focus({ preventScroll: true }); } catch(e){} }, 30);
  }

  function closeEdit(){
    var el = $("#bulkEdit");
    if (!el) return;
    if (editReplace && editReplace.url && !isQueuedReplaceUrl(editReplace.url)) URL.revokeObjectURL(editReplace.url);
    el.classList.remove("on");
    editSrc = null; editOriginal = null; editReplace = null;
  }

  function chooseReplacement(file){
    setEditMsg("Checking the new image…", false);
    prepareImage(file).then(function(ready){
      var url = URL.createObjectURL(ready);
      var probe = new Image();
      probe.onload = function(){
        if (editReplace && editReplace.url && !isQueuedReplaceUrl(editReplace.url)) URL.revokeObjectURL(editReplace.url);
        var ratio = closestPresetRatio(probe.naturalWidth, probe.naturalHeight);
        editReplace = { file: ready, url: url, ratio: ratio };
        $("#beRatio").innerHTML = optionList(RATIOS, ratio);
        showEditImage();
        setEditMsg("New image ready (" + ratio + "). Press Save change to add it to the list.", false);
      };
      probe.onerror = function(){ URL.revokeObjectURL(url); setEditMsg("That image couldn't be opened.", true); };
      probe.src = url;
    }, function(err){
      setEditMsg(err.message + ". Export it as JPEG and try again.", true);
    });
  }

  var EDIT_FIELDS = ["title", "client", "category", "eventTypes", "caption", "alt", "imagePosition", "ratio", "featured", "showInAll"];
  function sameValue(a, b){ return JSON.stringify(a == null ? "" : a) === JSON.stringify(b == null ? "" : b); }

  function saveEdit(){
    if (!editSrc) return;
    var el = $("#bulkEdit");
    var title = $("#beTitle", el).value.trim();
    if (!title) { setEditMsg("Please give the photo a title.", true); $("#beTitle", el).focus(); return; }
    var category = $("#beCategory", el).value;
    var form = {
      title: title,
      client: $("#beClient", el).value.trim() || "Studio",
      category: category,
      eventTypes: category === "Events" ? uniq(splitList($("#beEvents", el).value)) : [],
      caption: $("#beCaption", el).value.trim(),
      alt: $("#beAlt", el).value.trim(),
      imagePosition: $("#bePos", el).value || "Center",
      ratio: $("#beRatio", el).value || "4/5",
      featured: $("#beFeatured", el).checked,
      showInAll: $("#beShowAll", el).checked
    };
    /* only the fields you actually changed are sent, so a change someone else made to another
       field in the Content Editor in the meantime is never overwritten */
    var changes = {}, p = editOriginal;
    EDIT_FIELDS.forEach(function(k){
      var before = p[k];
      if (k === "showInAll") before = p.showInAll !== false;
      if (k === "featured") before = !!p.featured;
      if (k === "eventTypes") before = p.eventTypes || [];
      if (k === "client") before = p.client || "Studio";
      if (!sameValue(before, form[k])) changes[k] = form[k];
    });
    if (!Object.keys(changes).length && !editReplace) {
      delete pendingEdits[editSrc];
      closeEdit();
      renderExistingGrid();
      return;
    }
    pendingEdits[editSrc] = { action: "edit", changes: changes, replace: editReplace };
    editReplace = null; /* now owned by the queue (keeps its preview) */
    closeEdit();
    renderExistingGrid();
  }

  function toggleDelete(){
    if (!editSrc) return;
    var src = editSrc, q = pendingEdits[src];
    if (q && q.action === "delete") { delete pendingEdits[src]; openEdit(src); renderExistingGrid(); return; }
    var label = (editOriginal && editOriginal.title) || uploadName(src) || "this photo";
    if (!confirm('Delete "' + label + '"?\n\nNothing is removed yet - it happens when you press "Commit all changes". You can Restore it until then.')) return;
    if (q && q.replace && q.replace.url) URL.revokeObjectURL(q.replace.url);
    pendingEdits[src] = { action: "delete" };
    closeEdit();
    renderExistingGrid();
  }

  /* ================= quick actions + change many photos at once ================= */
  /* Every change made here (one photo or fifty) goes into the same waiting list as the edit panel,
     and they all go live together in ONE commit when you press "Commit all changes". */
  function baseValue(p, k){
    if (k === "showInAll") return p.showInAll !== false;
    if (k === "featured") return !!p.featured;
    if (k === "eventTypes") return p.eventTypes || [];
    if (k === "client") return p.client || "Studio";
    if (k === "imagePosition") return p.imagePosition || "Center";
    return p[k];
  }
  function effectiveOf(p){
    var q = pendingEdits[p.src];
    return q && q.action === "edit" ? Object.assign({}, p, q.changes) : p;
  }
  /* queue one field change for one photo; a change back to the live value simply drops out */
  function setField(src, k, val){
    var p = photoBySrc(src);
    if (!p) return false;
    var q = pendingEdits[src];
    if (q && q.action === "delete") return false;
    if (!q) q = { action: "edit", changes: {}, replace: null };
    if (sameValue(baseValue(p, k), val)) delete q.changes[k]; else q.changes[k] = val;
    if (!Object.keys(q.changes).length && !q.replace) delete pendingEdits[src]; else pendingEdits[src] = q;
    return true;
  }
  function selectedSrcs(){ return Object.keys(selected).filter(function(s){ return !!photoBySrc(s); }); }

  function queueDelete(srcs){
    srcs = srcs.filter(function(s){ var q = pendingEdits[s]; return photoBySrc(s) && !(q && q.action === "delete"); });
    if (!srcs.length) return;
    var label = srcs.length === 1 ? '"' + (photoBySrc(srcs[0]).title || "this photo") + '"' : srcs.length + " photos";
    if (!confirm("Delete " + label + "?\n\nNothing is removed yet - it happens when you press \"Commit all changes\". You can Restore until then.")) return;
    srcs.forEach(function(s){
      var q = pendingEdits[s];
      if (q && q.replace && q.replace.url) URL.revokeObjectURL(q.replace.url);
      pendingEdits[s] = { action: "delete" };
      delete selected[s];
    });
    renderExistingGrid();
  }

  var quickInput = null, quickFor = null;
  function pickReplacement(src){
    if (!quickInput) {
      quickInput = document.createElement("input");
      quickInput.type = "file";
      quickInput.accept = "image/*,.heic,.heif,.tif,.tiff";
      quickInput.hidden = true;
      document.body.appendChild(quickInput);
      quickInput.addEventListener("change", function(){
        var f = this.files && this.files[0];
        this.value = "";
        if (f && quickFor) quickReplace(quickFor, f);
      });
    }
    quickFor = src;
    quickInput.click();
  }
  function quickReplace(src, file){
    var p = photoBySrc(src);
    if (!p) return;
    showExistingResult(true, "Checking the new image…");
    prepareImage(file).then(function(ready){
      var url = URL.createObjectURL(ready), probe = new Image();
      probe.onload = function(){
        var q = pendingEdits[src];
        if (!q || q.action !== "edit") q = { action: "edit", changes: {}, replace: null };
        if (q.replace && q.replace.url) URL.revokeObjectURL(q.replace.url);
        q.replace = { file: ready, url: url, ratio: closestPresetRatio(probe.naturalWidth, probe.naturalHeight) };
        pendingEdits[src] = q;
        showExistingResult(true, "New image ready for \"" + (p.title || "photo") + "\". It goes live when you press Commit all changes.");
        renderExistingGrid();
      };
      probe.onerror = function(){ URL.revokeObjectURL(url); showExistingResult(false, "That image couldn't be opened."); };
      probe.src = url;
    }, function(err){ showExistingResult(false, err.message + ". Export it as JPEG and try again."); });
  }

  function buildSelectBar(){
    var bar = $("#selectBar");
    if (bar) return bar;
    var grid = $("#existingGrid");
    if (!grid) return null;
    bar = document.createElement("div");
    bar.id = "selectBar";
    bar.className = "select-bar";
    bar.innerHTML =
      '<div class="sb-row">' +
        '<b id="selCount">Change several photos at once</b>' +
        '<span class="sb-help" id="selHelp">Tick the box on each photo you want to change, or</span>' +
        '<button type="button" class="btn small" id="selAll">Select all shown</button>' +
        '<button type="button" class="btn small" id="selNone" hidden>Clear selection</button>' +
      '</div>' +
      '<div class="sb-actions" id="selActions" hidden>' +
        '<div class="sb-group"><label for="bkCategory">Category</label><select id="bkCategory"></select><button type="button" class="btn small" data-bulk="category">Apply</button></div>' +
        '<div class="sb-group"><label for="bkClient">Shoot / Client</label><input type="text" id="bkClient" placeholder="e.g. Vikings PC"><button type="button" class="btn small" data-bulk="client">Apply</button></div>' +
        '<div class="sb-group"><label for="bkEvents">Event type <span class="opt">(Events only)</span></label><input type="text" id="bkEvents" list="eventTypeSuggestions" placeholder="e.g. Birthday"><button type="button" class="btn small" data-bulk="events">Apply</button></div>' +
        '<div class="sb-group"><label for="bkPos">Image position</label><select id="bkPos"></select><button type="button" class="btn small" data-bulk="pos">Apply</button></div>' +
        '<div class="sb-group"><span class="sb-lab">Featured</span><button type="button" class="btn small" data-bulk="feat-on">On</button><button type="button" class="btn small" data-bulk="feat-off">Off</button></div>' +
        '<div class="sb-group"><span class="sb-lab">Show in All</span><button type="button" class="btn small" data-bulk="all-on">On</button><button type="button" class="btn small" data-bulk="all-off">Off</button></div>' +
        '<div class="sb-group"><button type="button" class="btn danger small" data-bulk="delete">Delete selected</button></div>' +
      '</div>' +
      '<p class="sb-note" id="selNote" role="status"></p>';
    grid.parentNode.insertBefore(bar, grid);
    $("#bkCategory", bar).innerHTML = optionList(CATEGORIES, CATEGORIES[0]);
    $("#bkPos", bar).innerHTML = optionList(POSITIONS, "Center");
    $("#selAll", bar).addEventListener("click", function(){
      shownList.forEach(function(p){ var q = pendingEdits[p.src]; if (!(q && q.action === "delete")) selected[p.src] = true; });
      setNote(""); renderExistingGrid();
    });
    $("#selNone", bar).addEventListener("click", function(){ selected = {}; setNote(""); renderExistingGrid(); });
    $all("[data-bulk]", bar).forEach(function(b){ b.addEventListener("click", function(){ bulkApply(b.getAttribute("data-bulk")); }); });
    return bar;
  }
  function setNote(t, bad){ var n = $("#selNote"); if (n) { n.textContent = t || ""; n.className = "sb-note" + (bad ? " err" : ""); } }
  function renderSelectBar(){
    var bar = buildSelectBar();
    if (!bar) return;
    var n = selectedSrcs().length;
    $("#selCount").textContent = n ? n + (n === 1 ? " photo selected" : " photos selected") : "Change several photos at once";
    $("#selHelp").hidden = !!n;
    $("#selNone").hidden = !n;
    $("#selActions").hidden = !n;
    bar.classList.toggle("has-sel", !!n);
  }

  function bulkApply(kind){
    var srcs = selectedSrcs();
    if (!srcs.length || committingEdits) return;
    if (kind === "delete") { queueDelete(srcs); setNote(""); return; }
    var done = 0, skipped = 0, what = "";
    function each(fn){ srcs.forEach(function(s){ if (fn(s)) done++; else skipped++; }); }
    if (kind === "category") {
      var c = $("#bkCategory").value; what = "Category set to " + c;
      each(function(s){
        if (!setField(s, "category", c)) return false;
        if (c !== "Events") setField(s, "eventTypes", []);
        return true;
      });
    } else if (kind === "client") {
      var cl = $("#bkClient").value.trim();
      if (!cl) { setNote("Type the shoot / client name first.", true); $("#bkClient").focus(); return; }
      what = "Shoot / Client set to \"" + cl + "\""; each(function(s){ return setField(s, "client", cl); });
    } else if (kind === "events") {
      var ev = uniq(splitList($("#bkEvents").value));
      what = ev.length ? "Event type set to " + ev.join(", ") : "Event type cleared";
      each(function(s){ var p = photoBySrc(s); return effectiveOf(p).category === "Events" && setField(s, "eventTypes", ev); });
    } else if (kind === "pos") {
      var pos = $("#bkPos").value; what = "Image position set to " + pos; each(function(s){ return setField(s, "imagePosition", pos); });
    } else if (kind === "feat-on" || kind === "feat-off") {
      var f = kind === "feat-on"; what = "Featured turned " + (f ? "on" : "off"); each(function(s){ return setField(s, "featured", f); });
    } else if (kind === "all-on" || kind === "all-off") {
      var a = kind === "all-on"; what = "Show in All turned " + (a ? "on" : "off"); each(function(s){ return setField(s, "showInAll", a); });
    }
    setNote(what + " for " + done + (done === 1 ? " photo" : " photos") +
      (skipped ? " (" + skipped + " skipped" + (kind === "events" ? ": not in Events" : ": waiting to be deleted") + ")" : "") +
      ". It goes live when you press Commit all changes.", false);
    renderExistingGrid();
  }

  /* ================= the waiting list + one commit ================= */
  function renderPendingBar(){
    var bar = $("#pendingBar");
    if (!bar) return;
    var keys = Object.keys(pendingEdits), n = keys.length;
    var tab = document.querySelector('.tab-btn[data-tab="existing"]');
    if (tab) tab.textContent = "Already Uploaded" + (n ? " (" + n + " waiting)" : "");
    bar.hidden = !n;
    if (!n) return;
    var del = 0, rep = 0, ed = 0;
    keys.forEach(function(k){ var q = pendingEdits[k]; if (q.action === "delete") del++; else if (q.replace) rep++; else ed++; });
    var parts = [];
    if (ed) parts.push(ed + " edited");
    if (rep) parts.push(rep + " new image" + (rep > 1 ? "s" : ""));
    if (del) parts.push(del + " to delete");
    $("#pendingText").textContent = n + (n === 1 ? " change" : " changes") + " waiting (" + parts.join(", ") + ") - not live yet.";
    $("#btnCommitPending").disabled = committingEdits || !token;
    $("#btnDiscardPending").disabled = committingEdits;
  }

  function showExistingResult(ok, message){
    var el = $("#existingResult");
    if (!el) return;
    el.className = "result-banner " + (ok ? "ok" : "err");
    el.textContent = message;
  }

  var discardBtn = $("#btnDiscardPending");
  if (discardBtn) discardBtn.addEventListener("click", function(){
    var n = pendingCount();
    if (!n || committingEdits) return;
    if (!confirm("Throw away all " + n + " waiting change(s)? Nothing has gone live, so the site stays exactly as it is.")) return;
    Object.keys(pendingEdits).forEach(function(k){ var q = pendingEdits[k]; if (q.replace && q.replace.url) URL.revokeObjectURL(q.replace.url); });
    pendingEdits = {};
    renderExistingGrid();
  });
  var commitBtn = $("#btnCommitPending");
  if (commitBtn) commitBtn.addEventListener("click", function(){
    var n = pendingCount();
    if (!n || committingEdits || !token) return;
    if (!confirm("Publish all " + n + " change(s) to livingroomlabs.in in one go? They go live in about a minute.")) return;
    commitPending();
  });

  /* every place a file in images/uploads can be in use */
  function filesInUse(content){
    var used = {};
    function add(src){ var n = uploadName(src); if (n) used[n.toLowerCase()] = true; }
    (content.photos || []).forEach(function(p){ if (p) add(p.src); });
    (content.bandSlides || []).forEach(function(s){ if (s) add(s.src); });
    add(content.bandImg); add(content.teamHeroImg); add(content.logo);
    (content.team || []).forEach(function(m){ if (m) { add(m.photo); add(m.photo2); } });
    PROTECTED_FILES.forEach(function(n){ used[n.toLowerCase()] = true; });
    return used;
  }
  /* the original + every small copy the photo robot made of it */
  function copiesOf(name){
    return ["images/uploads/" + name, "images/thumbs/" + name + ".webp", "images/thumbs/" + name + ".jpg",
      "images/full/" + name + ".webp"].concat([800, 1280, 1920, 2400].map(function(w){ return "images/hero/" + name + "-" + w + ".webp"; }));
  }

  function commitPending(){
    var queue = pendingEdits, keys = Object.keys(queue), total = keys.length;
    var base, treeEntries = [], newSrcFor = {};
    committingEdits = true;
    renderPendingBar();
    setProgress(4, "Reading the latest version of the site…");
    readRepoState()
      .then(function(state){
        base = state;
        state.uploadNames.forEach(function(n){ knownUploadNames[n.toLowerCase()] = true; });
        var list = state.content.photos;
        var gone = keys.filter(function(src){ return !list.some(function(p){ return p && p.src === src; }); });
        if (gone.length) {
          throw new Error(gone.length + " of these photos are no longer on the site (removed in the Content Editor?): " +
            gone.map(function(s){ return uploadName(s) || s; }).join(", ") + ". Restore or discard those, then try again.");
        }
        var reserved = {};
        var chain = Promise.resolve(), done = 0;
        keys.forEach(function(src){
          var q = queue[src];
          if (q.action !== "edit" || !q.replace) return;
          chain = chain.then(function(){
            done++;
            setProgress(8 + Math.round((done / total) * 60), "Uploading new image " + done + "…");
            /* new file name (never the old one) so browsers and Cloudflare can't keep showing the old image */
            var name = uniqueFilename(q.replace.file.name, null), n = 2, parts = slugParts(q.replace.file.name);
            while (reserved[name.toLowerCase()] || name.toLowerCase() === (uploadName(src) || "").toLowerCase()) {
              name = parts.slug + "-" + n + parts.ext; n++;
              while (knownUploadNames[name.toLowerCase()]) { name = parts.slug + "-" + n + parts.ext; n++; }
            }
            reserved[name.toLowerCase()] = true;
            return fileToBase64(q.replace.file)
              .then(function(b64){ return ghFetch("/repos/" + REPO + "/git/blobs", { method: "POST", body: JSON.stringify({ content: b64, encoding: "base64" }) }); })
              .then(function(blob){
                treeEntries.push({ path: "images/uploads/" + name, mode: "100644", type: "blob", sha: blob.sha });
                newSrcFor[src] = "/images/uploads/" + name;
              });
          });
        });
        return chain;
      })
      .then(function(){
        setProgress(74, "Updating the photo list…");
        var content = base.content, removedNames = [];
        keys.forEach(function(src){
          var q = queue[src];
          var idx = -1;
          content.photos.forEach(function(p, i){ if (idx === -1 && p && p.src === src) idx = i; });
          if (q.action === "delete") {
            content.photos.splice(idx, 1);
            if (uploadName(src)) removedNames.push(uploadName(src));
            return;
          }
          var photo = content.photos[idx];
          Object.keys(q.changes).forEach(function(k){ photo[k] = q.changes[k]; });
          if (newSrcFor[src]) {
            photo.src = newSrcFor[src];
            if (!("ratio" in q.changes) && q.replace.ratio) photo.ratio = q.replace.ratio;
            if (uploadName(src)) removedNames.push(uploadName(src));
          }
        });
        /* remove old files only when nothing else (banner, team photo, another photo) still uses them */
        var used = filesInUse(content);
        removedNames.forEach(function(name){
          if (used[name.toLowerCase()]) return;
          copiesOf(name).forEach(function(path){
            if (base.paths[path]) treeEntries.push({ path: path, mode: "100644", type: "blob", sha: null });
          });
        });
        return ghFetch("/repos/" + REPO + "/git/blobs", {
          method: "POST",
          body: JSON.stringify({ content: utf8ToBase64(JSON.stringify(content, null, 2) + "\n"), encoding: "base64" })
        });
      })
      .then(function(blob){
        treeEntries.push({ path: "content.json", mode: "100644", type: "blob", sha: blob.sha });
        setProgress(84, "Building the commit…");
        return ghFetch("/repos/" + REPO + "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.treeSha, tree: treeEntries }) });
      })
      .then(function(tree){
        var del = keys.filter(function(k){ return queue[k].action === "delete"; }).length;
        var msg = "Edit " + total + " photo(s) via bulk uploader" + (del ? " (" + del + " deleted)" : "");
        return ghFetch("/repos/" + REPO + "/git/commits", { method: "POST", body: JSON.stringify({ message: msg, tree: tree.sha, parents: [base.commitSha] }) });
      })
      .then(function(commit){
        setProgress(94, "Publishing to livingroomlabs.in…");
        return ghFetch("/repos/" + REPO + "/git/refs/heads/" + BRANCH, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) })
          .then(function(){ return commit; });
      })
      .then(function(commit){
        setProgress(100, "Done!");
        /* show the new images from the local copy until the site has made its small copies */
        var previews = {};
        keys.forEach(function(src){ var q = queue[src]; if (newSrcFor[src] && q.replace) previews[newSrcFor[src]] = q.replace.url; });
        var oldNew = {};
        existingPhotos.forEach(function(p){ if (p.__justAdded) oldNew[p.src] = p.__preview || true; });
        applyContent(base.content);
        existingPhotos.forEach(function(p){
          if (previews[p.src]) p.__preview = previews[p.src];
          else if (oldNew[p.src]) { p.__justAdded = true; if (oldNew[p.src] !== true) p.__preview = oldNew[p.src]; }
        });
        Object.keys(newSrcFor).forEach(function(k){ knownUploadNames[(uploadName(newSrcFor[k]) || "").toLowerCase()] = true; });
        pendingEdits = {};
        selected = {};
        committingEdits = false;
        window.__bulkCommitted = true;
        renderExistingGrid();
        showExistingResult(true, "✓ " + total + " change(s) published (" + commit.sha.slice(0, 7) + "). The site updates in about a minute; new images get their small copies a minute or two after that.");
        setTimeout(hideProgress, 1500);
      })
      .catch(function(err){
        committingEdits = false;
        hideProgress();
        renderPendingBar();
        var msg = String(err && err.message || err);
        if (/GitHub 422/.test(msg) && /fast.?forward/i.test(msg)) {
          msg = "Someone saved a change on the site at the same moment. Nothing was published - just press \"Commit all changes\" again.";
        }
        showExistingResult(false, "Nothing went live - the site is unchanged and your changes are still waiting. " + msg);
        console.error(err);
      });
  }

  window.addEventListener("beforeunload", function(e){
    if (pendingCount() || committingEdits) { e.preventDefault(); e.returnValue = ""; }
  });

  /* first check happens now; the Content Editor page calls __bulkRecheck() each time the panel opens */
  tryAutoLogin();
})();
