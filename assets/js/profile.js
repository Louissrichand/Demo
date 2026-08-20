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
  var avatarUrl = "";   // "" = none/removed, string = current/new

  function renderAvatar(name) {
    var el = $("pfAvatar"); if (!el) return;
    if (avatarUrl) { el.innerHTML = '<img src="' + avatarUrl + '" alt="" referrerpolicy="no-referrer" />'; }
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
        showCard();
      });
    });
  }

  /* ---------- avatar upload ---------- */
  var photoBtn = $("pfPhotoBtn"), photoInput = $("pfPhoto"), photoRemove = $("pfPhotoRemove");
  if (photoBtn) photoBtn.addEventListener("click", function () { photoInput.click(); });
  if (photoRemove) photoRemove.addEventListener("click", function () {
    avatarUrl = "";
    renderAvatar($("pf-first").value + " " + $("pf-last").value);
    setMsg(t("pf.photo.removed", "Photo removed — click Save to apply."), "ok");
  });
  if (photoInput) photoInput.addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file || !sb || !user) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setMsg(t("pf.photo.type", "Please choose a JPG, PNG or WebP image."), "err"); return; }
    if (file.size > 1024 * 1024) { setMsg(t("pf.photo.big", "Image is too large (max 1 MB)."), "err"); return; }
    setMsg(t("pf.photo.uploading", "Uploading…"));
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = user.id + "/avatar_" + Date.now() + "." + ext;
    sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type }).then(function (up) {
      if (up.error) { setMsg(up.error.message, "err"); return; }
      var pub = sb.storage.from("avatars").getPublicUrl(path);
      avatarUrl = (pub.data && pub.data.publicUrl) || "";
      renderAvatar($("pf-first").value + " " + $("pf-last").value);
      setMsg(t("pf.photo.uploaded", "Photo uploaded — click Save to apply."), "ok");
    });
    photoInput.value = "";
  });

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
