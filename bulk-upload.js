(function(){
  "use strict";
  var REPO = "Chandur-95/livingroomlabs";
  var API = window.__GH_API_BASE__ || "https://api.github.com";
  var token = null;
  var NICHES = [];
  var existingSrcNames = {}; // for collision-safe filenames
  var photos = []; // { id, file, title, category, eventTypes, client, caption, alt, showInAll, featured, ratio, previewUrl, filename, status }
  var seq = 0;

  function $(s,r){ return (r||document).querySelector(s); }
  function $all(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  /* ---------------- GitHub OAuth (reuses the same login your admin editor uses) ---------------- */
  function login(){
    var w = window.open("/api/auth", "lrl_login", "width=520,height=640");
    function onMsg(e){
      if (e.origin !== window.location.origin) return;
      var data = e.data;
      if (typeof data === "string" && data.indexOf("authorization:github:success:") === 0) {
        var payload = JSON.parse(data.slice("authorization:github:success:".length));
        token = payload.token;
        window.removeEventListener("message", onMsg);
        onLoggedIn();
      }
    }
    window.addEventListener("message", onMsg);
  }

  function onLoggedIn(){
    $("#authStatus").textContent = "Logged in";
    $("#authStatus").classList.add("ok");
    $("#btnLogin").textContent = "Logged in ✓";
    $("#btnLogin").disabled = true;
    $("#gate").style.display = "none";
    $("#app").style.display = "block";
    updateUploadButton();
  }

  $("#btnLogin").addEventListener("click", login);
  $("#btnLoginGate").addEventListener("click", login);

  /* ---------------- load niches + existing photo filenames (for the category dropdown + name collisions) ---------------- */
  fetch("/content.json").then(function(r){ return r.json(); }).then(function(d){
    NICHES = (d.niches || []).map(function(n){ return n.name || n; });
    var bulkCat = $("#bulkCategory");
    NICHES.forEach(function(n){
      var opt = document.createElement("option");
      opt.value = n; opt.textContent = n;
      bulkCat.appendChild(opt);
    });
    (d.photos || []).forEach(function(p){
      var m = /^\/images\/uploads\/([^\/?#]+)$/.exec(p.src || "");
      if (m) existingSrcNames[m[1].toLowerCase()] = true;
    });
  }).catch(function(err){ console.error("Could not load content.json", err); });

  /* ---------------- file selection ---------------- */
  var picker = $("#picker"), fileInput = $("#fileInput");
  $("#btnChoose").addEventListener("click", function(){ fileInput.click(); });
  fileInput.addEventListener("change", function(){ addFiles(fileInput.files); fileInput.value = ""; });
  picker.addEventListener("dragover", function(e){ e.preventDefault(); picker.classList.add("drag"); });
  picker.addEventListener("dragleave", function(){ picker.classList.remove("drag"); });
  picker.addEventListener("drop", function(e){
    e.preventDefault(); picker.classList.remove("drag");
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  function slugify(name){
    var base = name.replace(/\.[^.]+$/, "");
    var ext = (name.match(/\.[^.]+$/) || [".jpg"])[0].toLowerCase().replace(/[^a-z0-9.]/g, "");
    var slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
    return { slug: slug, ext: ext };
  }

  function uniqueFilename(name){
    var parts = slugify(name);
    var candidate = parts.slug + parts.ext;
    var n = 2;
    var taken = function(c){
      return existingSrcNames[c.toLowerCase()] || photos.some(function(p){ return p.filename === c; });
    };
    while (taken(candidate)) { candidate = parts.slug + "-" + n + parts.ext; n++; }
    return candidate;
  }

  function addFiles(fileList){
    var files = Array.prototype.filter.call(fileList, function(f){ return /^image\//.test(f.type); });
    if (files.length + photos.length > 80) {
      alert("That's more than 80 photos in this batch. Upload in a couple of smaller batches to keep each commit manageable.");
    }
    files.forEach(function(file){
      var id = "p" + (seq++);
      var previewUrl = URL.createObjectURL(file);
      var titleGuess = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
      var entry = {
        id: id, file: file, previewUrl: previewUrl,
        filename: uniqueFilename(file.name),
        title: titleGuess, category: NICHES[0] || "Food", eventTypes: [],
        client: "", caption: "", alt: "", showInAll: true, featured: true,
        ratio: "4/5", status: "pending"
      };
      photos.push(entry);
      /* measure the REAL image dimensions - this is what fixed the cropping bug on
         the capture.html carousel, so the same photos will always display correctly there too */
      var probe = new Image();
      probe.onload = function(){
        entry.ratio = simplifyRatio(probe.naturalWidth, probe.naturalHeight);
        var tag = document.querySelector('[data-ratio-tag="'+id+'"]');
        if (tag) tag.textContent = entry.ratio;
      };
      probe.src = previewUrl;
    });
    renderGrid();
    $("#toolbar").style.display = photos.length ? "flex" : "none";
    updateUploadButton();
  }

  function simplifyRatio(w, h){
    function gcd(a,b){ return b ? gcd(b, a % b) : a; }
    var g = gcd(w, h) || 1;
    return (w/g) + "/" + (h/g);
  }

  /* ---------------- render ---------------- */
  function renderGrid(){
    var grid = $("#grid");
    grid.innerHTML = "";
    photos.forEach(function(p){
      var card = document.createElement("div");
      card.className = "card" + (p.category === "Events" ? " is-events" : "");
      card.dataset.id = p.id;
      card.innerHTML =
        '<button class="card-remove" data-remove="'+p.id+'" aria-label="Remove">✕</button>' +
        '<span class="card-ratio-tag mono" data-ratio-tag="'+p.id+'">'+esc(p.ratio)+'</span>' +
        '<img class="card-img" src="'+p.previewUrl+'" alt="">' +
        '<div class="card-body">' +
          '<div><label>Title</label><input type="text" data-f="title" value="'+esc(p.title)+'"></div>' +
          '<div class="card-row">' +
            '<div><label>Category</label><select data-f="category">'+NICHES.map(function(n){ return '<option'+(n===p.category?' selected':'')+'>'+esc(n)+'</option>'; }).join('')+'</select></div>' +
            '<div><label>Shoot / Client</label><input type="text" data-f="client" value="'+esc(p.client)+'"></div>' +
          '</div>' +
          '<div class="event-field"><label>Event Type (comma-separated, e.g. Birthday, Housewarming)</label><input type="text" data-f="eventTypes" value="'+esc(p.eventTypes.join(", "))+'"></div>' +
          '<div><label>Caption</label><textarea data-f="caption">'+esc(p.caption)+'</textarea></div>' +
          '<div><label>Alt text (for Google &amp; screen readers)</label><input type="text" data-f="alt" value="'+esc(p.alt)+'"></div>' +
          '<div class="card-toggles">' +
            '<label><input type="checkbox" data-f="showInAll" '+(p.showInAll?'checked':'')+'> Show in All</label>' +
            '<label><input type="checkbox" data-f="featured" '+(p.featured?'checked':'')+'> Featured</label>' +
          '</div>' +
        '</div>' +
        '<div class="card-status done mono">✓ Uploaded</div>' +
        '<div class="card-status err mono" data-err="'+p.id+'"></div>';
      grid.appendChild(card);
    });
    $("#countLabel").textContent = photos.length + (photos.length === 1 ? " photo" : " photos");
    bindCardEvents();
  }

  function bindCardEvents(){
    $all("[data-remove]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-remove");
        var p = photos.find(function(x){ return x.id === id; });
        if (p) URL.revokeObjectURL(p.previewUrl);
        photos = photos.filter(function(x){ return x.id !== id; });
        renderGrid();
        $("#toolbar").style.display = photos.length ? "flex" : "none";
        updateUploadButton();
      });
    });
    $all(".card").forEach(function(card){
      var id = card.dataset.id;
      var p = photos.find(function(x){ return x.id === id; });
      if (!p) return;
      $all("[data-f]", card).forEach(function(field){
        var key = field.getAttribute("data-f");
        field.addEventListener("input", function(){
          if (key === "eventTypes") {
            p.eventTypes = field.value.split(",").map(function(s){ return s.trim(); }).filter(Boolean);
          } else if (field.type === "checkbox") {
            p[key] = field.checked;
          } else {
            p[key] = field.value;
          }
        });
        field.addEventListener("change", function(){
          if (key === "category") {
            card.classList.toggle("is-events", field.value === "Events");
          }
        });
      });
    });
  }

  $("#btnApplyBulk").addEventListener("click", function(){
    var cat = $("#bulkCategory").value;
    var client = $("#bulkClient").value;
    if (!cat && !client) return;
    photos.forEach(function(p){
      if (cat) p.category = cat;
      if (client) p.client = client;
    });
    renderGrid();
  });

  $("#btnClearAll").addEventListener("click", function(){
    if (!photos.length) return;
    if (!confirm("Remove all " + photos.length + " photos from this batch? Nothing has been uploaded yet, so this is safe.")) return;
    photos.forEach(function(p){ URL.revokeObjectURL(p.previewUrl); });
    photos = [];
    renderGrid();
    $("#toolbar").style.display = "none";
    updateUploadButton();
  });

  function updateUploadButton(){
    $("#btnUploadAll").disabled = !(token && photos.length > 0);
  }

  /* ---------------- GitHub commit: one atomic commit for every photo + content.json ---------------- */
  function ghFetch(path, opts){
    opts = opts || {};
    var headers = Object.assign({
      "Authorization": "token " + token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    }, opts.headers || {});
    return fetch(API + path, Object.assign({}, opts, { headers: headers })).then(function(res){
      if (!res.ok) {
        return res.text().then(function(t){
          throw new Error("GitHub " + path + " -> " + res.status + ": " + t.slice(0, 300));
        });
      }
      return res.json();
    });
  }

  function fileToBase64(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result.split(",")[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function utf8ToBase64(str){
    return btoa(unescape(encodeURIComponent(str)));
  }

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

  $("#btnUploadAll").addEventListener("click", function(){
    if (!token || !photos.length) return;
    if (!confirm("Commit " + photos.length + " photo(s) to livingroomlabs.in now? This goes straight to your live site (same as your usual photo editor).")) return;
    uploadAll();
  });

  function uploadAll(){
    $("#btnUploadAll").disabled = true;
    var total = photos.length;
    var done = 0;
    setProgress(2, "Reading current site data…");

    ghFetch("/repos/" + REPO + "/git/refs/heads/main")
      .then(function(ref){
        var latestCommitSha = ref.object.sha;
        return ghFetch("/repos/" + REPO + "/git/commits/" + latestCommitSha).then(function(commit){
          return { latestCommitSha: latestCommitSha, baseTreeSha: commit.tree.sha };
        });
      })
      .then(function(base){
        return ghFetch("/repos/" + REPO + "/contents/content.json?ref=main").then(function(file){
          var jsonStr = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
          base.content = JSON.parse(jsonStr);
          return base;
        });
      })
      .then(function(base){
        var treeEntries = [];
        var chain = Promise.resolve();
        photos.forEach(function(p, i){
          chain = chain.then(function(){
            setProgress(5 + Math.round((i / total) * 70), "Uploading photo " + (i + 1) + " of " + total + " (" + p.filename + ")…");
            return fileToBase64(p.file).then(function(b64){
              return ghFetch("/repos/" + REPO + "/git/blobs", {
                method: "POST",
                body: JSON.stringify({ content: b64, encoding: "base64" })
              });
            }).then(function(blob){
              treeEntries.push({ path: "images/uploads/" + p.filename, mode: "100644", type: "blob", sha: blob.sha });
              base.content.photos.push({
                title: p.title || p.filename,
                client: p.client || "Studio",
                category: p.category,
                eventTypes: p.category === "Events" ? p.eventTypes : [],
                showInAll: !!p.showInAll,
                caption: p.caption || "",
                alt: p.alt || "",
                ratio: p.ratio || "4/5",
                src: "/images/uploads/" + p.filename,
                imagePosition: "Center",
                featured: !!p.featured
              });
              p.status = "queued";
            }).catch(function(err){
              p.status = "error";
              var errEl = document.querySelector('[data-err="' + p.id + '"]');
              var card = document.querySelector('.card[data-id="' + p.id + '"]');
              if (errEl) errEl.textContent = "Failed: " + err.message;
              if (card) card.classList.add("error");
              throw err; /* stop the batch - nothing has been committed to main yet, so this is still safe */
            });
          });
        });
        return chain.then(function(){ return { base: base, treeEntries: treeEntries }; });
      })
      .then(function(res){
        setProgress(78, "Saving the updated photo list…");
        var jsonStr = JSON.stringify(res.base.content, null, 2);
        return ghFetch("/repos/" + REPO + "/git/blobs", {
          method: "POST",
          body: JSON.stringify({ content: utf8ToBase64(jsonStr), encoding: "base64" })
        }).then(function(blob){
          res.treeEntries.push({ path: "content.json", mode: "100644", type: "blob", sha: blob.sha });
          return res;
        });
      })
      .then(function(res){
        setProgress(85, "Building the commit…");
        return ghFetch("/repos/" + REPO + "/git/trees", {
          method: "POST",
          body: JSON.stringify({ base_tree: res.base.baseTreeSha, tree: res.treeEntries })
        }).then(function(tree){ return { base: res.base, tree: tree }; });
      })
      .then(function(res){
        return ghFetch("/repos/" + REPO + "/git/commits", {
          method: "POST",
          body: JSON.stringify({
            message: "Bulk upload: " + total + " photo(s) via bulk uploader",
            tree: res.tree.sha,
            parents: [res.base.latestCommitSha]
          })
        }).then(function(commit){ return commit; });
      })
      .then(function(commit){
        setProgress(95, "Publishing to livingroomlabs.in…");
        return ghFetch("/repos/" + REPO + "/git/refs/heads/main", {
          method: "PATCH",
          body: JSON.stringify({ sha: commit.sha })
        }).then(function(){ return commit; });
      })
      .then(function(commit){
        setProgress(100, "Done!");
        photos.forEach(function(p){ p.status = "uploaded"; });
        $all(".card").forEach(function(card){ card.classList.add("uploaded"); });
        showResult(true, "✓ " + total + " photo(s) committed (" + commit.sha.slice(0,7) + "). The site will update in about a minute - the automatic image workflow will generate thumbnails and viewer copies from these.");
        setTimeout(hideProgress, 1500);
      })
      .catch(function(err){
        hideProgress();
        showResult(false, "Upload stopped before anything was committed to your live site - nothing changed. " + err.message);
        $("#btnUploadAll").disabled = false;
        console.error(err);
      });
  }
})();
