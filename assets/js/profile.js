/* ============================================================
   root+ — Edit Profile page (Supabase Auth + Storage)
   Loads the signed-in user's profile, lets them edit fields and
   upload an avatar, then saves to the profiles table + auth metadata.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.ROOTPLUS || {};
  var sb = (window.supabase && cfg.supabaseUrl && cfg.supabaseKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey)
    : null;

  function $(id) { return document.getElementById(id); }
  function lang() { return document.documentElement.getAttribute("lang") || "en"; }
  function t(key, en) {
    var L = lang();
    if (L === "th" && window.I18N && window.I18N.th && window.I18N.th[key] != null) return window.I18N.th[key];
    return en;
  }
  function initials(name, email) {
    var s = (name || "").trim();
    if (s) { var p = s.split(/\s+/); return ((p[0][0] || "") + (p[1] ? p[1][0] : "")).toUpperCase(); }
    return ((email || "?")[0] || "?").toUpperCase();
  }

  /* ---------- language toggle (mirrors main.js) ---------- */
  var TH = (window.I18N && window.I18N.th) || {};
  function applyLang(L) {
    document.documentElement.setAttribute("lang", L);
    document.body.classList.toggle("lang-th", L === "th");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (el.__en == null) el.__en = el.innerHTML;
      el.innerHTML = (L === "th" && TH[k] != null) ? TH[k] : el.__en;
    });
    document.querySelectorAll(".lang__opt").forEach(function (o) {
      o.classList.toggle("is-active", o.getAttribute("data-lang") === L);
    });
    try { localStorage.setItem("rootplus-lang", L); } catch (e) {}
  }
  document.querySelectorAll(".lang__opt").forEach(function (o) {
    o.addEventListener("click", function () { applyLang(o.getAttribute("data-lang")); });
  });
  var savedLang = "en";
  try { savedLang = localStorage.getItem("rootplus-lang") || "en"; } catch (e) {}
  applyLang(savedLang);

  function setMsg(text, kind) {
    var m = $("pfMsg"); if (!m) return;
    m.textContent = text || "";
    m.className = "modal__ok" + (kind ? " modal__ok--" + kind : "");
  }

  /* ---------- state ---------- */
  var user = null;
  var avatarUrl = "";    // persisted value ("" = none/removed, else a public URL)
  var previewSrc = null; // local (data:) preview shown before/instead of upload

  function renderAvatar(name) {
    var el = $("pfAvatar"); if (!el) return;
    var src = previewSrc || avatarUrl;
    if (src) { el.innerHTML = '<img src="' + src + '" alt="" referrerpolicy="no-referrer" />'; }
    else { el.textContent = initials(name, user && user.email); }
  }

  function showGuard() { $("authGuard").hidden = false; $("profileCard").hidden = true; }
  function showCard() { $("authGuard").hidden = true; $("profileCard").hidden = false; }

  /* ---------- load ---------- */
  function boot() {
    if (!sb) { showGuard(); return; }
    sb.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (!session) { showGuard(); return; }
      user = session.user;
      var meta = user.user_metadata || {};
      sb.from("profiles").select("*").eq("id", user.id).maybeSingle().then(function (r) {
        var p = r.data || {};
        $("pf-first").value = p.first_name || meta.first_name || "";
        $("pf-last").value = p.last_name || meta.last_name || "";
        $("pf-email").value = user.email || "";
        $("pf-phone").value = p.phone || "";
        $("pf-dob").value = p.dob || "";
        $("pf-gender").value = p.gender || "";
        var ints = p.interests || [];
        document.querySelectorAll('input[name="pf-interest"]').forEach(function (c) {
          c.checked = ints.indexOf(c.value) !== -1;
        });
        $("pf-marketing").checked = !!p.marketing;
        avatarUrl = p.avatar_url || meta.avatar_url || meta.picture || "";
        renderAvatar((p.full_name || meta.full_name || ""));
        populateAccount(p);
        showCard();
      });
    });
  }

  /* ---------- account tabs ---------- */
  var tabs = document.querySelectorAll(".acct-tab");
  var panels = { profile: $("panel-profile"), membership: $("panel-membership"), refer: $("panel-refer") };
  tabs.forEach(function (tb) {
    tb.addEventListener("click", function () {
      var name = tb.getAttribute("data-tab");
      tabs.forEach(function (x) { x.classList.toggle("is-active", x === tb); });
      Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].hidden = (k !== name); });
    });
  });

  /* ---------- greeting / membership / referral ---------- */
  function fmtDate(iso) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString(lang() === "th" ? "th-TH" : "en-GB", { year: "numeric", month: "short", day: "numeric" }); }
    catch (e) { return String(iso).slice(0, 10); }
  }
  var INT_LABEL = { gut: "signup.int.gut", sleep: "signup.int.sleep", skin: "signup.int.skin" };
  var INT_EN = { gut: "Gut health", sleep: "Sleep & mood", skin: "Skin & beauty" };
  function populateAccount(p) {
    var meta = user.user_metadata || {};
    var first = p.first_name || meta.first_name || (user.email || "").split("@")[0];
    if ($("acctGreet")) $("acctGreet").textContent = first;
    if ($("mbSince")) $("mbSince").textContent = fmtDate(p.created_at || user.created_at);
    if ($("mbEmail")) $("mbEmail").textContent = user.email || "—";
    var ints = (p.interests || []).map(function (v) { return INT_LABEL[v] ? t(INT_LABEL[v], INT_EN[v] || v) : v; });
    if ($("mbInterests")) $("mbInterests").textContent = ints.length ? ints.join(", ") : "—";
    var base = location.href.split("profile.html")[0];
    var link = base + "?ref=" + user.id;
    if ($("referLink")) $("referLink").value = link;
    var e = encodeURIComponent, txt = t("acct.rf.sharetext", "Join me on the root+ founding list 🌱");
    if ($("shareEmail")) $("shareEmail").href = "mailto:?subject=" + e("root+") + "&body=" + e(txt + " " + link);
    if ($("shareFb")) $("shareFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + e(link);
    if ($("shareLine")) $("shareLine").href = "https://social-plugins.line.me/lineit/share?url=" + e(link);
    if ($("shareX")) $("shareX").href = "https://twitter.com/intent/tweet?url=" + e(link) + "&text=" + e(txt);
    var del = $("pfDelete");
    if (del) del.href = "mailto:itd@srichand.co.th?subject=" + e("PDPA: Delete my account") + "&body=" + e("Please delete my root+ account and personal data.\nAccount email: " + (user.email || "") + "\nUser ID: " + user.id);
    var provider = (user.app_metadata && user.app_metadata.provider) || "email";
    if (provider !== "email" && $("pwRow")) $("pwRow").hidden = true;
  }

  /* ---------- referral copy ---------- */
  var referCopy = $("referCopy");
  if (referCopy) referCopy.addEventListener("click", function () {
    var el = $("referLink"); if (!el) return;
    el.select();
    var done = function () { var m = $("referMsg"); if (m) { m.textContent = t("acct.rf.copied", "Link copied! ✓"); m.className = "refer-note refer-note--ok"; } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(done, done);
    else { try { document.execCommand("copy"); } catch (x) {} done(); }
  });

  /* ---------- change password ---------- */
  function pwMsg(txt, kind) { var m = $("pwMsg"); if (m) { m.textContent = txt || ""; m.className = "modal__ok" + (kind ? " modal__ok--" + kind : ""); } }
  var pwBtn = $("pfPwBtn");
  if (pwBtn) pwBtn.addEventListener("click", function () {
    if (!sb) return;
    var v = $("pf-newpw").value || "";
    if (v.length < 6) { pwMsg(t("auth.err.pwshort", "Password must be at least 6 characters."), "err"); return; }
    pwMsg(t("acct.pw.saving", "Updating…"));
    sb.auth.updateUser({ password: v }).then(function (res) {
      if (res.error) { pwMsg(res.error.message, "err"); return; }
      $("pf-newpw").value = "";
      pwMsg(t("acct.pw.ok", "Password updated ✓"), "ok");
    });
  });

  /* ---------- download my data (PDPA) ---------- */
  var dl = $("pfDownload");
  if (dl) dl.addEventListener("click", function () {
    if (!sb || !user) return;
    sb.from("profiles").select("*").eq("id", user.id).maybeSingle().then(function (r) {
      var data = { account: { id: user.id, email: user.email, created_at: user.created_at, provider: (user.app_metadata && user.app_metadata.provider) }, profile: r.data || {} };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "rootplus-my-data.json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    });
  });

  /* ---------- avatar upload ---------- */
  var photoBtn = $("pfPhotoBtn"), photoInput = $("pfPhoto"), photoRemove = $("pfPhotoRemove");
  if (photoBtn) photoBtn.addEventListener("click", function () { photoInput.click(); });
  if (photoRemove) photoRemove.addEventListener("click", function () {
    avatarUrl = ""; previewSrc = null;
    renderAvatar($("pf-first").value + " " + $("pf-last").value);
    setMsg(t("pf.photo.removed", "Photo removed — click Save to apply."), "ok");
  });
  /* ---- pick -> crop (square/circle) -> upload ---- */
  var FRAME = 260, OUT = 400;
  var cropModal = $("cropModal"), cropStage = $("cropStage"), cropImg = $("cropImg"), cropZoom = $("cropZoom");
  var natW = 0, natH = 0, scale = 1, tx = 0, ty = 0;

  function friendlyErr(m) {
    if (/Bucket not found/i.test(m)) return t("pf.photo.nobucket", "Photo uploads aren't switched on yet — please try again later.");
    if (/maximum|too large|Payload too large|exceeded/i.test(m)) return t("pf.photo.big", "Image is too large (max 1 MB).");
    return m;
  }
  function uploadAvatar(blob) {
    if (!sb || !user) return;
    setMsg(t("pf.photo.uploading", "Uploading…"));
    var path = user.id + "/avatar_" + Date.now() + ".jpg";
    /* unique filename each time -> plain insert (upsert needs a SELECT policy we don't grant, which trips RLS) */
    sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" }).then(function (up) {
      if (up.error) { setMsg(friendlyErr(up.error.message), "err"); return; }
      var pub = sb.storage.from("avatars").getPublicUrl(path);
      avatarUrl = (pub.data && pub.data.publicUrl) || "";
      previewSrc = null;
      renderAvatar($("pf-first").value + " " + $("pf-last").value);
      setMsg(t("pf.photo.uploaded", "Photo uploaded — click Save to apply."), "ok");
    });
  }

  if (photoInput) photoInput.addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    photoInput.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setMsg(t("pf.photo.type", "Please choose a JPG, PNG or WebP image."), "err"); return; }
    if (file.size > 10 * 1024 * 1024) { setMsg(t("pf.photo.big2", "Image is too large (max 10 MB)."), "err"); return; }
    var reader = new FileReader();
    reader.onload = function (ev) { if (cropImg) openCropper(ev.target.result); };
    reader.readAsDataURL(file);
  });

  function applyTransform() {
    cropImg.style.width = (natW * scale) + "px";
    cropImg.style.height = (natH * scale) + "px";
    cropImg.style.transform = "translate(" + tx + "px," + ty + "px)";
  }
  function clampXY() {
    tx = Math.min(0, Math.max(FRAME - natW * scale, tx));
    ty = Math.min(0, Math.max(FRAME - natH * scale, ty));
  }
  function setZoom(z, keepCenter) {
    var base = Math.max(FRAME / natW, FRAME / natH), old = scale;
    var cx = (FRAME / 2 - tx) / old, cy = (FRAME / 2 - ty) / old;
    scale = base * z;
    if (keepCenter) { tx = FRAME / 2 - cx * scale; ty = FRAME / 2 - cy * scale; }
    clampXY(); applyTransform();
  }
  function openCropper(dataUrl) {
    cropImg.onload = function () {
      natW = cropImg.naturalWidth; natH = cropImg.naturalHeight;
      scale = Math.max(FRAME / natW, FRAME / natH);
      tx = (FRAME - natW * scale) / 2; ty = (FRAME - natH * scale) / 2;
      if (cropZoom) cropZoom.value = 1;
      clampXY(); applyTransform();
      cropModal.hidden = false; document.body.style.overflow = "hidden";
    };
    cropImg.src = dataUrl;
  }
  function closeCropper() { if (cropModal) cropModal.hidden = true; document.body.style.overflow = ""; }

  if (cropZoom) cropZoom.addEventListener("input", function () { setZoom(parseFloat(cropZoom.value) || 1, true); });
  if (cropStage) {
    var drag = false, lx = 0, ly = 0;
    cropStage.addEventListener("pointerdown", function (e) { drag = true; lx = e.clientX; ly = e.clientY; try { cropStage.setPointerCapture(e.pointerId); } catch (x) {} });
    cropStage.addEventListener("pointermove", function (e) { if (!drag) return; tx += e.clientX - lx; ty += e.clientY - ly; lx = e.clientX; ly = e.clientY; clampXY(); applyTransform(); });
    cropStage.addEventListener("pointerup", function () { drag = false; });
    cropStage.addEventListener("pointercancel", function () { drag = false; });
  }
  var cropUse = $("cropUse");
  if (cropUse) cropUse.addEventListener("click", function () {
    var canvas = document.createElement("canvas");
    canvas.width = OUT; canvas.height = OUT;
    var s = FRAME / scale;
    canvas.getContext("2d").drawImage(cropImg, -tx / scale, -ty / scale, s, s, 0, 0, OUT, OUT);
    previewSrc = canvas.toDataURL("image/jpeg", 0.9);
    renderAvatar($("pf-first").value + " " + $("pf-last").value);
    closeCropper();
    canvas.toBlob(function (blob) { if (blob) uploadAvatar(blob); }, "image/jpeg", 0.9);
  });
  document.querySelectorAll("[data-cropclose]").forEach(function (c) { c.addEventListener("click", closeCropper); });

  /* ---------- save ---------- */
  function mark(id, bad) { var el = $(id); if (!el) return bad; var f = el.closest(".field"); if (f) f.classList.toggle("invalid", bad); return bad; }
  var form = $("profileForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!sb || !user) return;
    var first = $("pf-first").value.trim(), last = $("pf-last").value.trim(), phone = $("pf-phone").value.trim();
    var bad = false;
    bad = mark("pf-first", first.length < 1) || bad;
    bad = mark("pf-last", last.length < 1) || bad;
    bad = mark("pf-phone", phone.replace(/\D/g, "").length < 9) || bad;
    if (bad) return;
    var interests = [].map.call(document.querySelectorAll('input[name="pf-interest"]:checked'), function (i) { return i.value; });
    var fullName = (first + " " + last).trim();
    var row = {
      id: user.id, first_name: first, last_name: last, full_name: fullName,
      phone: phone, dob: $("pf-dob").value || null, gender: $("pf-gender").value || null,
      interests: interests, marketing: $("pf-marketing").checked,
      avatar_url: avatarUrl || null, updated_at: new Date().toISOString()
    };
    setMsg(t("pf.saving", "Saving…"));
    sb.from("profiles").upsert(row, { onConflict: "id" }).then(function (res) {
      if (res.error) { setMsg(res.error.message, "err"); return; }
      // sync name + avatar into auth metadata so the header chip updates
      sb.auth.updateUser({ data: { full_name: fullName, first_name: first, last_name: last, avatar_url: avatarUrl || null } })
        .then(function () { setMsg(t("pf.saved", "Saved! ✓"), "ok"); });
    });
  });

  boot();
})();
