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
        state.paths = {};
        (tree.tree || []).forEach(function(t){
          if (t.type === "blob") state.paths[t.path] = true;
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
          (p.featured ? '<div class="ec-meta">★ Featured</div>' : '') +
          '<button type="button" class="btn small ec-edit" data-edit-src="' + esc(p.src) + '">Edit</button>' +
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

  /* ================= Editing an already-uploaded photo =================
     Changes the photo's details in content.json, and - only if you choose a new image - swaps the
     image file too. Delete removes the photo from the site along with its files.
     Saved with the same all-or-nothing commit as uploads: it re-reads the LATEST content.json
     first (so an edit made elsewhere in the meantime is kept), changes just this one photo, and
     publishes with force:false, so a simultaneous save is never overwritten. */
  (function injectEditStyles(){
    var css = [
      "#bulkOverlay .ec-edit{margin-top:8px;width:100%;min-height:36px}",
      "#bulkEdit{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}",
      "#bulkEdit.on{display:flex}",
      "#bulkEdit .be-card{background:#fff;color:#0a0a0a;border-radius:10px;width:100%;max-width:560px;margin:auto;display:flex;flex-direction:column;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);font-family:inherit}",
      "#bulkEdit .be-head{display:flex;gap:14px;align-items:center;padding:16px 18px;border-bottom:1px solid #e2e2e2}",
      "#bulkEdit .be-head img{width:64px;height:80px;object-fit:cover;border-radius:4px;background:#eee;flex:none}",
      "#bulkEdit .be-head b{display:block;font-size:.95rem}",
      "#bulkEdit .be-head span{font:.68rem 'JetBrains Mono',monospace;opacity:.55;word-break:break-all}",
      "#bulkEdit .be-body{padding:14px 18px;overflow-y:auto;display:grid;gap:12px}",
      "#bulkEdit label{font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;opacity:.6;display:block;margin-bottom:3px}",
      "#bulkEdit input[type=text],#bulkEdit textarea,#bulkEdit select{width:100%;box-sizing:border-box;border:1px solid #d6d6d6;border-radius:6px;padding:9px 10px;font-size:16px;font-family:inherit;background:#fff;color:#0a0a0a}",
      "#bulkEdit textarea{min-height:64px;resize:vertical}",
      "#bulkEdit .be-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      "#bulkEdit .be-toggles{display:flex;gap:18px;flex-wrap:wrap}",
      "#bulkEdit .be-toggles label{display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;opacity:1;font-size:.9rem;margin:0;min-height:36px}",
      "#bulkEdit .be-toggles input{width:20px;height:20px}",
      "#bulkEdit .be-foot{display:flex;gap:10px;justify-content:flex-end;align-items:center;padding:14px 18px;border-top:1px solid #e2e2e2;flex-wrap:wrap}",
      "#bulkEdit .be-msg{flex:1 1 100%;font-size:.8rem;min-height:1em}",
      "#bulkEdit .be-msg.err{color:#b02a2a}",
      "#bulkEdit .be-foot button{min-height:42px;padding:0 20px;border-radius:999px;border:1px solid #0a0a0a;font:600 .78rem/1 inherit;cursor:pointer;background:#fff;color:#0a0a0a}",
      "#bulkEdit .be-foot .be-save{background:#0a0a0a;color:#fff}",
      "#bulkEdit .be-foot button:disabled{opacity:.4;cursor:not-allowed}",
      "#bulkEdit .be-replace{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}",
      "#bulkEdit .be-replace button{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid #0a0a0a;background:#fff;color:#0a0a0a;font:600 .72rem/1 inherit;cursor:pointer}",
      "#bulkEdit .be-replace button:disabled{opacity:.4;cursor:not-allowed}",
      "#bulkEdit .be-head .be-note{display:block;margin-top:6px;font:600 .72rem/1.35 inherit;opacity:1;color:#1f6f3a;word-break:normal}",
      "#bulkEdit .be-foot .be-delete{margin-right:auto;border-color:#b02a2a;color:#b02a2a}",
      "#bulkEdit .be-foot .be-delete:hover:not(:disabled){background:#b02a2a;color:#fff}",
      "#bulkEdit .be-events{display:none}",
      "#bulkEdit.is-events .be-events{display:block}",
      "@media (max-width:560px){#bulkEdit{padding:0}#bulkEdit .be-card{max-width:none;min-height:100%;max-height:none;border-radius:0}#bulkEdit .be-row{grid-template-columns:1fr}}"
    ].join("\n");
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  })();

  var editSrc = null, editSaving = false;
  function editPanel(){
    var el = document.getElementById("bulkEdit");
    if (el) return el;
    el = document.createElement("div");
    el.id = "bulkEdit";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Edit photo");
    el.innerHTML =
      '<div class="be-card">' +
        '<div class="be-head"><img id="beImg" alt=""><div><b>Edit photo</b><span id="beFile"></span>' +
          '<div class="be-replace"><button type="button" id="beReplaceBtn">Replace image…</button>' +
          '<button type="button" id="beReplaceUndo" hidden>Keep the old image</button>' +
          '<input type="file" id="beReplaceInput" accept="image/*" hidden></div>' +
          '<span class="be-note" id="beReplaceNote"></span>' +
        '</div></div>' +
        '<div class="be-body">' +
          '<div><label for="beTitle">Title</label><input type="text" id="beTitle" maxlength="120"></div>' +
          '<div class="be-row">' +
            '<div><label for="beClient">Client</label><input type="text" id="beClient" maxlength="80"></div>' +
            '<div><label for="beCategory">Category</label><select id="beCategory"></select></div>' +
          '</div>' +
          '<div class="be-events"><label for="beEvents">Event types (comma separated)</label><input type="text" id="beEvents" list="eventTypeSuggestions"></div>' +
          '<div><label for="beCaption">Caption</label><textarea id="beCaption" maxlength="300"></textarea></div>' +
          '<div class="be-row">' +
            '<div><label for="beAlt">Description for screen readers</label><input type="text" id="beAlt" maxlength="200"></div>' +
            '<div><label for="bePos">Crop position</label><select id="bePos"></select></div>' +
          '</div>' +
          '<div class="be-toggles">' +
            '<label><input type="checkbox" id="beFeatured"> Featured</label>' +
            '<label><input type="checkbox" id="beShowAll"> Show in "All"</label>' +
          '</div>' +
        '</div>' +
        '<div class="be-foot">' +
          '<div class="be-msg" id="beMsg" aria-live="polite"></div>' +
          '<button type="button" class="be-delete" id="beDelete">Delete photo</button>' +
          '<button type="button" id="beCancel">Cancel</button>' +
          '<button type="button" class="be-save" id="beSave">Save changes</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    $("#beCategory", el).addEventListener("change", function(){ el.classList.toggle("is-events", this.value === "Events"); });
    $("#beCancel", el).addEventListener("click", closeEdit);
    $("#beSave", el).addEventListener("click", saveEdit);
    $("#beDelete", el).addEventListener("click", deletePhoto);
    $("#beReplaceBtn", el).addEventListener("click", function(){ $("#beReplaceInput", el).click(); });
    $("#beReplaceInput", el).addEventListener("change", function(){ var f = this.files && this.files[0]; this.value = ""; pickReplacement(f); });
    $("#beReplaceUndo", el).addEventListener("click", function(){ clearReplace(); setReplaceUI(); });
    el.addEventListener("click", function(e){ if (e.target === el) closeEdit(); });
    el.addEventListener("keydown", function(e){ if (e.key === "Escape") { e.stopPropagation(); closeEdit(); } });
    return el;
  }

  function openEdit(src){
    var p = null;
    existingPhotos.forEach(function(x){ if (x.src === src) p = x; });
    if (!p) return;
    var el = editPanel();
    editSrc = src;
    var cats = CATEGORIES.slice(); if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
    $("#beCategory", el).innerHTML = optionList(cats, p.category);
    $("#bePos", el).innerHTML = optionList(POSITIONS, p.imagePosition || "Center");
    clearReplace();
    setReplaceUI();
    $("#beFile", el).textContent = uploadName(p.src) || p.src;
    $("#beTitle", el).value = p.title || "";
    $("#beClient", el).value = p.client || "";
    $("#beEvents", el).value = (p.eventTypes || []).join(", ");
    $("#beCaption", el).value = p.caption || "";
    $("#beAlt", el).value = p.alt || "";
    $("#beFeatured", el).checked = !!p.featured;
    $("#beShowAll", el).checked = p.showInAll !== false;
    el.classList.toggle("is-events", p.category === "Events");
    setEditMsg("", false);
    setBusy(el, false);
    el.classList.add("on");
    setTimeout(function(){ try { $("#beTitle", el).focus({ preventScroll: true }); } catch(e){} }, 30);
  }
  function closeEdit(){
    if (editSaving) return;
    var el = document.getElementById("bulkEdit");
    if (el) el.classList.remove("on");
    clearReplace();
    editSrc = null;
  }
  function editingPhoto(){
    var p = null;
    existingPhotos.forEach(function(x){ if (x.src === editSrc) p = x; });
    return p;
  }
  function setBusy(el, busy){
    ["#beSave", "#beDelete", "#beReplaceBtn", "#beReplaceUndo"].forEach(function(id){ var b = $(id, el); if (b) b.disabled = !!busy; });
  }
  function friendlyError(err){
    var msg = String(err && err.message || err);
    if (/GitHub 422/.test(msg) && /fast.?forward/i.test(msg)) msg = "Someone saved a change on the site at the same moment. Nothing was changed - just press the button again.";
    return msg;
  }

  /* ---- replacing the image file: the new photo is only chosen here; it goes live with Save changes ---- */
  var editReplace = null;   /* { file, url, ratio } */
  function clearReplace(){
    if (editReplace && editReplace.url && !editReplace.kept) URL.revokeObjectURL(editReplace.url);
    editReplace = null;
  }
  function setReplaceUI(){
    var el = editPanel(), p = editingPhoto();
    $("#beReplaceUndo", el).hidden = !editReplace;
    $("#beReplaceBtn", el).textContent = editReplace ? "Choose a different image…" : "Replace image…";
    $("#beReplaceNote", el).textContent = editReplace ? "New image chosen - it replaces the old one when you press Save changes." : "";
    $("#beImg", el).src = editReplace ? editReplace.url : (p ? (p.__preview || thumbFor(p.src)) : "");
  }
  function pickReplacement(file){
    if (!file || editSaving) return;
    var forSrc = editSrc;
    var ready = (SUPPORTED_TYPE.test(file.type) || (!file.type && SUPPORTED_EXT.test(file.name))) ? Promise.resolve(file) : convertToJpeg(file);
    setEditMsg("Reading the new image…", false);
    ready.then(function(f){
      if (editSrc !== forSrc) return;
      if (!f) { setEditMsg("This browser couldn't open that file. Please export it as JPEG and choose it again.", true); return; }
      var url = URL.createObjectURL(f), probe = new Image();
      probe.onload = function(){
        if (editSrc !== forSrc || !probe.naturalWidth) { URL.revokeObjectURL(url); return; }
        clearReplace();
        editReplace = { file: f, url: url, ratio: closestPresetRatio(probe.naturalWidth, probe.naturalHeight) };
        setEditMsg("", false);
        setReplaceUI();
      };
      probe.onerror = function(){ URL.revokeObjectURL(url); setEditMsg("That file doesn't look like a photo - please choose a JPEG, PNG or WebP.", true); };
      probe.src = url;
    });
  }

  /* ---- shared by delete + replace ---- */
  /* the photo's own file plus the small copies the site made of it - but only if nothing else on the
     site still uses that file (a banner slide or team photo can share it), and never the built-in
     fallback banner. Only paths that really exist are listed, so GitHub never rejects the commit. */
  var NEVER_DELETE = { "dsc05175.jpg": true };
  function removalEntries(state, oldSrc){
    var n = uploadName(oldSrc);
    if (!n || NEVER_DELETE[n.toLowerCase()]) return [];
    var json = JSON.stringify(state.content);
    if (json.indexOf('"/images/uploads/' + n + '"') > -1 || json.indexOf('"images/uploads/' + n + '"') > -1) return [];
    var paths = ["images/uploads/" + n, "images/thumbs/" + n + ".webp", "images/thumbs/" + n + ".jpg", "images/full/" + n + ".webp"];
    [800, 1280, 1920, 2400].forEach(function(w){ paths.push("images/hero/" + n + "-" + w + ".webp"); });
    return paths.filter(function(path){ return state.paths && state.paths[path]; })
      .map(function(path){ return { path: path, mode: "100644", type: "blob", sha: null }; });
  }
  /* one all-or-nothing commit: the updated content.json plus any file changes; force:false, so a
     save made elsewhere at the same moment is never overwritten (GitHub refuses; press again) */
  function commitContent(base, entries, message){
    return ghFetch("/repos/" + REPO + "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: utf8ToBase64(JSON.stringify(base.content, null, 2) + "\n"), encoding: "base64" })
    })
      .then(function(blob){
        var tree = (entries || []).concat([{ path: "content.json", mode: "100644", type: "blob", sha: blob.sha }]);
        return ghFetch("/repos/" + REPO + "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.treeSha, tree: tree }) });
      })
      .then(function(tree){
        return ghFetch("/repos/" + REPO + "/git/commits", { method: "POST", body: JSON.stringify({ message: message, tree: tree.sha, parents: [base.commitSha] }) });
      })
      .then(function(commit){
        return ghFetch("/repos/" + REPO + "/git/refs/heads/" + BRANCH, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) })
          .then(function(){ return commit; });
      });
  }

  /* ---- deleting a photo ---- */
  function deletePhoto(){
    if (editSaving || !editSrc) return;
    var el = editPanel(), src = editSrc, p = editingPhoto();
    var label = (p && p.title) || uploadName(src) || "this photo";
    if (!confirm('Delete "' + label + '" from the website?\n\nIt disappears from every page in about a minute, and its image file is removed too. This can\'t be undone from here.')) return;
    editSaving = true;
    setBusy(el, true);
    setEditMsg("Deleting… reading the latest version of the site", false);
    readRepoState()
      .then(function(state){
        var before = state.content.photos.length;
        state.content.photos = state.content.photos.filter(function(x){ return !(x && x.src === src); });
        if (state.content.photos.length === before) throw new Error("This photo is already gone from the site. Close this and reopen the uploader to refresh the list.");
        setEditMsg("Deleting… publishing", false);
        return commitContent(state, removalEntries(state, src), "Delete photo: " + (uploadName(src) || src) + " via bulk uploader");
      })
      .then(function(){
        existingPhotos = existingPhotos.filter(function(x){ return x.src !== src; });
        window.__bulkCommitted = true;   /* the Content Editor reloads when you return to it */
        editSaving = false;
        renderExistingGrid();
        setEditMsg("✓ Deleted. It disappears from the live site in about a minute.", false);
        setTimeout(function(){ if (editSrc === src) closeEdit(); }, 1400);
      })
      .catch(function(err){
        editSaving = false;
        setBusy(el, false);
        setEditMsg("Not deleted - the site is unchanged. " + friendlyError(err), true);
        console.error(err);
      });
  }
  function setEditMsg(text, isErr){
    var m = document.getElementById("beMsg");
    if (m) { m.textContent = text; m.className = "be-msg" + (isErr ? " err" : ""); }
  }

  function saveEdit(){
    if (editSaving || !editSrc) return;
    var el = document.getElementById("bulkEdit");
    var title = $("#beTitle", el).value.trim();
    if (!title) { setEditMsg("Please give the photo a title.", true); $("#beTitle", el).focus(); return; }
    var category = $("#beCategory", el).value;
    var isEvents = category === "Events";
    var changes = {
      title: title,
      client: $("#beClient", el).value.trim() || "Studio",
      category: category,
      eventTypes: isEvents ? uniq(splitList($("#beEvents", el).value)) : [],
      caption: $("#beCaption", el).value.trim(),
      alt: $("#beAlt", el).value.trim() || title,
      imagePosition: $("#bePos", el).value || "Center",
      featured: $("#beFeatured", el).checked,
      showInAll: $("#beShowAll", el).checked
    };
    var src = editSrc, rep = editReplace, newSrc = null;
    editSaving = true;
    setBusy(el, true);
    setEditMsg("Saving… reading the latest version of the site", false);
    readRepoState()
      .then(function(state){
        var hit = null;
        state.content.photos.forEach(function(x){ if (x && x.src === src) hit = x; });
        if (!hit) throw new Error("This photo is no longer on the site (it may have been removed in the Content Editor). Close this and reopen the uploader to refresh the list.");
        Object.keys(changes).forEach(function(k){ hit[k] = changes[k]; });
        if (!rep) {
          setEditMsg("Saving… writing the change", false);
          return commitContent(state, [], "Edit photo details: " + (uploadName(src) || src) + " via bulk uploader");
        }
        /* new image file: uploaded under a NEW name (so nobody's browser keeps showing the old
           picture from its cache), then the old file and its small copies are removed */
        state.uploadNames.forEach(function(n){ knownUploadNames[n.toLowerCase()] = true; });
        var newName = uniqueFilename(rep.file.name, "__replace");
        setEditMsg("Saving… uploading the new image", false);
        return fileToBase64(rep.file)
          .then(function(b64){
            return ghFetch("/repos/" + REPO + "/git/blobs", { method: "POST", body: JSON.stringify({ content: b64, encoding: "base64" }) });
          })
          .then(function(blob){
            newSrc = "/images/uploads/" + newName;
            hit.src = newSrc;
            hit.ratio = rep.ratio;
            var entries = [{ path: "images/uploads/" + newName, mode: "100644", type: "blob", sha: blob.sha }].concat(removalEntries(state, src));
            setEditMsg("Saving… publishing", false);
            return commitContent(state, entries, "Replace photo: " + (uploadName(src) || src) + " -> " + newName + " via bulk uploader");
          });
      })
      .then(function(){
        existingPhotos.forEach(function(x){
          if (x.src !== src) return;
          Object.keys(changes).forEach(function(k){ x[k] = changes[k]; });
          if (newSrc) {
            x.src = newSrc; x.ratio = rep.ratio;
            x.__preview = rep.url; rep.kept = true;   /* shown from this copy until the site finishes building */
            x.__justAdded = true;
            knownUploadNames[uploadName(newSrc).toLowerCase()] = true;
          }
        });
        changes.eventTypes.forEach(function(et){ if (knownEventTypes.indexOf(et) === -1) knownEventTypes.push(et); });
        fillEventSuggestions();
        window.__bulkCommitted = true;   /* the Content Editor reloads when you return to it */
        editSaving = false;
        if (newSrc) { editReplace = null; editSrc = newSrc; src = newSrc; }
        renderExistingGrid();
        setEditMsg(newSrc ? "✓ Saved with the new image. The live site updates in a few minutes." : "✓ Saved. The live site updates in about a minute.", false);
        setTimeout(function(){ if (editSrc === src) closeEdit(); }, 1400);
      })
      .catch(function(err){
        editSaving = false;
        setBusy(el, false);
        setEditMsg("Not saved - the site is unchanged. " + friendlyError(err), true);
        console.error(err);
      });
  }

  $("#existingGrid").addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-edit-src]") : null;
    if (b) openEdit(b.getAttribute("data-edit-src"));
  });

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

  /* The website (and its photo-shrinking step) handles JPEG, PNG and WebP. Anything else the
     browser can open - HEIC from a Mac or iPhone, TIFF, AVIF - is turned into a high-quality JPEG
     here first, so it can never break the site. Very large ones are capped at 3600px on the long
     side (plenty for the site, and phones can't convert bigger ones). */
  var SUPPORTED_TYPE = /^image\/(jpeg|png|webp)$/i, SUPPORTED_EXT = /\.(jpe?g|png|webp)$/i;
  function convertToJpeg(file){
    return new Promise(function(resolve){
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function(){
        try {
          var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 3600 / Math.max(w, h));
          if (!w || !h) { URL.revokeObjectURL(url); return resolve(null); }
          var c = document.createElement("canvas");
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function(b){
            URL.revokeObjectURL(url);
            if (!b) return resolve(null);
            var name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
            try { resolve(new File([b], name, { type: "image/jpeg", lastModified: file.lastModified })); }
            catch (e) { b.name = name; resolve(b); }
          }, "image/jpeg", 0.92);
        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function addFiles(fileList){
    if (uploading) return;
    var all = Array.prototype.slice.call(fileList || []);
    var files = all.filter(function(f){ return SUPPORTED_TYPE.test(f.type) || (!f.type && SUPPORTED_EXT.test(f.name)); });
    var others = all.filter(function(f){ return files.indexOf(f) === -1 && (/^image\//.test(f.type) || /\.(heic|heif|tiff?|avif|bmp|gif)$/i.test(f.name)); });
    if (others.length) {
      Promise.all(others.map(convertToJpeg)).then(function(conv){
        var good = conv.filter(Boolean);
        var bad = others.filter(function(f, i){ return !conv[i]; }).map(function(f){ return f.name; });
        if (bad.length) alert("This browser couldn't open " + bad.length + " photo(s): " + bad.slice(0, 5).join(", ") + (bad.length > 5 ? "…" : "") +
          "\n\nPlease export them as JPEG and add them again. (iPhone: Settings > Camera > Formats > Most Compatible.)");
        if (good.length) addFiles(good);
      });
      if (!files.length) return;
    }
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
