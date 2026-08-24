/* ============================================================
   root+ authentication (Supabase Auth: Google + email/password)
   Owns the auth modal, session state, and the header account chip.
   Loads after config.js, i18n.js, main.js and the supabase-js CDN.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.ROOTPLUS || {};
  var sb = (window.supabase && cfg.supabaseUrl && cfg.supabaseKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey)
    : null;
  window.sbClient = sb;

  var PENDING_KEY = "rootplus-pending-profile";

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function lang() { return document.documentElement.getAttribute("lang") || "en"; }
  function t(key, en) {
    var L = lang();
    if (L === "th" && window.I18N && window.I18N.th && window.I18N.th[key] != null) return window.I18N.th[key];
    return en;
  }
  function initials(name, email) {
    var s = (name || "").trim();
    if (s) {
      var p = s.split(/\s+/);
      return ((p[0][0] || "") + (p[1] ? p[1][0] : "")).toUpperCase();
    }
    return ((email || "?")[0] || "?").toUpperCase();
  }
  function redirectTo() { return location.origin + location.pathname; }

  /* ---------- modal open / close / tabs ----------
     Pages like the product detail pages carry the header and the account
     chip but not the sign-in modal. Run in chip-only mode there: session
     state and the header chip still work, everything modal-related is
     skipped. Jump to the boot block at the bottom. */
  var modal = $("signupModal");
  var msg = modal ? $("authMsg") : null;
  if (!modal) { bootAuth(); return; }
  var lastFocus = null;

  function setMsg(text, kind) {
    if (!msg) return;
    msg.textContent = text || "";
    msg.className = "modal__ok" + (kind ? " modal__ok--" + kind : "");
  }

  function openModal(tab) {
    lastFocus = document.activeElement;
    var mm = $("mobileMenu");
    if (mm) { mm.classList.remove("open"); mm.setAttribute("aria-hidden", "true"); }
    document.body.style.overflow = "hidden";
    modal.hidden = false;
    switchTab(tab || "signin");
    setMsg("");
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function switchTab(tab) {
    var isSignup = tab === "signup";
    var pS = $("paneSignin"), pU = $("paneSignup");
    var tS = $("tabSignin"), tU = $("tabSignup");
    if (pS) pS.hidden = isSignup;
    if (pU) pU.hidden = !isSignup;
    if (tS) tS.classList.toggle("is-active", !isSignup);
    if (tU) tU.classList.toggle("is-active", isSignup);
    setMsg("");
    setTimeout(function () {
      var f = isSignup ? $("su-name") : $("si-email");
      if (f) f.focus();
    }, 40);
  }

  document.querySelectorAll("#signupOpen, #signupOpenM").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.getAttribute("data-tab") || "signin"); });
  });
  modal.querySelectorAll("[data-close]").forEach(function (c) { c.addEventListener("click", closeModal); });
  /* Escape closes; Tab stays inside. Without the trap, focus walks out
     behind the backdrop and keyboard users get lost on the page below. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function visibleFocusable() {
    return [].filter.call(modal.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null && !el.closest("[hidden]");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key !== "Tab") return;

    var f = visibleFocusable();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];

    if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
  var tS = $("tabSignin"), tU = $("tabSignup");
  if (tS) tS.addEventListener("click", function () { switchTab("signin"); });
  if (tU) tU.addEventListener("click", function () { switchTab("signup"); });
  document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); switchTab(a.getAttribute("data-goto-tab")); });
  });

  /* ---------- field validation helpers ---------- */
  function mark(id, bad) {
    var el = $(id); if (!el) return bad;
    var field = el.closest(".field");
    if (field) field.classList.toggle("invalid", bad);
    return bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim()); }

  /* ---------- guard: Supabase not available ---------- */
  function requireSb() {
    if (sb) return true;
    setMsg(t("auth.unavailable", "Sign-in isn't available in this preview. Open the live site."), "err");
    return false;
  }

  /* ---------- error message mapping ---------- */
  function mapErr(error) {
    var m = (error && error.message) || "";
    if (/Invalid login credentials/i.test(m)) return t("auth.err.creds", "Incorrect email or password.");
    if (/already registered|already been registered|User already/i.test(m)) return t("auth.err.exists", "This email already has an account. Try signing in.");
    if (/Email not confirmed/i.test(m)) return t("auth.err.unconfirmed", "Please confirm your email first — check your inbox.");
    if (/Password should be at least/i.test(m)) return t("auth.err.pwshort", "Password must be at least 6 characters.");
    if (/rate limit|too many/i.test(m)) return t("auth.err.rate", "Too many attempts — please wait a moment and try again.");
    return m || t("auth.err.generic", "Something went wrong. Please try again.");
  }

  /* ---------- pending profile (extra fields collected at signup) ---------- */
  function savePending(obj) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(obj)); } catch (e) {} }
  function readPending() { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (e) { return null; } }
  function clearPending() { try { localStorage.removeItem(PENDING_KEY); } catch (e) {} }

  function syncProfile(session) {
    if (!sb || !session || !session.user) return;
    var u = session.user;
    var meta = u.user_metadata || {};
    var row = { id: u.id, updated_at: new Date().toISOString() };
    if (meta.full_name || meta.name) row.full_name = meta.full_name || meta.name;
    if (meta.avatar_url || meta.picture) row.avatar_url = meta.avatar_url || meta.picture;
    var pend = readPending();
    if (pend) {
      if (pend.firstName) row.first_name = pend.firstName;
      if (pend.lastName) row.last_name = pend.lastName;
      if (pend.firstName || pend.lastName) row.full_name = ((pend.firstName || "") + " " + (pend.lastName || "")).trim();
      row.phone = pend.phone || null;
      row.dob = pend.dob || null;
      row.gender = pend.gender || null;
      row.interests = pend.interests || [];
      row.marketing = !!pend.marketing;
      row.pdpa_consent = true;
      if (pend.referredBy) row.referred_by = pend.referredBy;
    }
    sb.from("profiles").upsert(row, { onConflict: "id" }).then(function (res) {
      if (!res.error) clearPending();
    });
  }

  /* ---------- Social OAuth (Google, Facebook) ----------
     A provider's button only renders once it's switched on in config.js —
     which should happen only after it's actually enabled in Supabase
     (AUTH-SETUP.md steps 4-5). Otherwise the button errors on click. */
  (function gateOauth() {
    var flags = cfg.oauth || {};
    var live = 0;
    document.querySelectorAll(".js-oauth").forEach(function (btn) {
      var on = !!flags[btn.getAttribute("data-provider")];
      btn.hidden = !on;
      if (on) live++;
    });
    if (!live) {
      /* Nothing to show — drop the "or" divider and the OAuth footnote too. */
      var div = modal.querySelector(".authdiv");
      var note = modal.querySelector(".oauth-note");
      if (div) div.hidden = true;
      if (note) note.hidden = true;
    }
  })();

  document.querySelectorAll(".js-oauth").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!requireSb()) return;
      var provider = btn.getAttribute("data-provider") || "google";
      setMsg(t("auth.redirecting", "Redirecting…"));
      if (window.rpTrack) window.rpTrack("oauth_start", { provider: provider });
      sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: redirectTo() } })
        .then(function (res) { if (res.error) setMsg(mapErr(res.error), "err"); });
    });
  });

  /* ---------- Sign in (email/password) ---------- */
  var signinForm = $("signinForm");
  if (signinForm) {
    signinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!requireSb()) return;
      var email = $("si-email"), pw = $("si-password");
      var bad = false;
      bad = mark("si-email", !validEmail(email.value)) || bad;
      bad = mark("si-password", (pw.value || "").length < 1) || bad;
      if (bad) return;
      setMsg(t("auth.signingin", "Signing in…"));
      sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value })
        .then(function (res) {
          if (res.error) { setMsg(mapErr(res.error), "err"); return; }
          /* onAuthStateChange handles UI + close */
        });
    });
  }

  /* ---------- Forgot password ---------- */
  var forgot = $("forgotLink");
  if (forgot) {
    forgot.addEventListener("click", function (e) {
      e.preventDefault();
      if (!requireSb()) return;
      var email = $("si-email");
      if (!validEmail(email.value)) { mark("si-email", true); setMsg(t("auth.err.emailfirst", "Enter your email above first."), "err"); return; }
      sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: redirectTo() })
        .then(function () { setMsg(t("auth.reset.sent", "Password reset link sent — check your email."), "ok"); });
    });
  }

  /* ---------- Sign up (email/password) ---------- */
  var signupForm = $("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!requireSb()) return;
      var name = $("su-name"), surname = $("su-surname"), email = $("su-email"),
          phone = $("su-phone"), pw = $("su-password"), pdpa = $("su-pdpa");
      var bad = false;
      bad = mark("su-name", name.value.trim().length < 1) || bad;
      bad = mark("su-surname", surname.value.trim().length < 1) || bad;
      bad = mark("su-email", !validEmail(email.value)) || bad;
      bad = mark("su-phone", (phone.value || "").replace(/\D/g, "").length < 9) || bad;
      bad = mark("su-password", (pw.value || "").length < 6) || bad;
      bad = mark("su-pdpa", !pdpa.checked) || bad;
      if (bad) {
        var firstBad = signupForm.querySelector(".field.invalid input, .field.invalid select");
        if (firstBad) firstBad.focus();
        return;
      }
      var interests = [].map.call(signupForm.querySelectorAll('input[name="interest"]:checked'), function (i) { return i.value; });
      savePending({
        firstName: name.value.trim(), lastName: surname.value.trim(),
        phone: phone.value.trim(),
        dob: ($("su-dob") || {}).value || "",
        gender: ($("su-gender") || {}).value || "",
        interests: interests,
        marketing: !!(signupForm.querySelector('input[name="marketing"]') || {}).checked,
        referredBy: window.rpReferralId || null
      });
      setMsg(t("auth.creating", "Creating your account…"));
      sb.auth.signUp({
        email: email.value.trim(),
        password: pw.value,
        options: {
          emailRedirectTo: redirectTo(),
          data: {
            full_name: (name.value.trim() + " " + surname.value.trim()).trim(),
            first_name: name.value.trim(),
            last_name: surname.value.trim()
          }
        }
      }).then(function (res) {
        if (res.error) { setMsg(mapErr(res.error), "err"); return; }
        if (window.rpTrack) window.rpTrack("signup_complete", { provider: "email", interests: interests.join(",") });
        if (res.data && res.data.session) {
          /* email confirmation is OFF → logged in now; onAuthStateChange closes it */
          syncProfile(res.data.session);
        } else {
          /* email confirmation is ON → must verify via email */
          setMsg(t("auth.confirm", "Almost there! Check your email to confirm your account, then sign in."), "ok");
          signupForm.reset();
          signupForm.querySelectorAll(".field.invalid").forEach(function (f) { f.classList.remove("invalid"); });
        }
      });
    });
  }

  /* ---------- header account chip ----------
     Assigned in bootAuth() so chip-only pages (no modal) can set them up
     before the rest of this file runs. */
  var chip = null;
  var openBtns = [];

  function renderAuth(session) {
    var user = session && session.user;
    // header desktop button
    openBtns.forEach(function (b) { b.hidden = !!user; });
    if (!chip) return;
    if (!user) { chip.hidden = true; chip.classList.remove("is-open"); return; }
    chip.hidden = false;
    var meta = user.user_metadata || {};
    var name = meta.full_name || meta.name || (user.email || "").split("@")[0];
    var avatar = meta.avatar_url || meta.picture || "";
    var av = $("acctAvatar"), nm = $("acctName"), em = $("acctEmail");
    if (nm) nm.textContent = (name || "").trim().split(/\s+/)[0] || name;
    if (em) em.textContent = user.email || "";
    if (av) {
      if (avatar) { av.innerHTML = '<img src="' + avatar + '" alt="" referrerpolicy="no-referrer" />'; }
      else { av.textContent = initials(name, user.email); }
    }
  }

  bootAuth();

  /* ---------- boot: account chip + current session + changes ----------
     Declared (not assigned) so the chip-only early return at the top of
     this file can call it before the modal code has run. */
  function bootAuth() {
    chip = $("accountChip");
    openBtns = [].slice.call(document.querySelectorAll("#signupOpen, #signupOpenM"));

    if (chip) {
      var toggle = $("acctToggle");
      if (toggle) toggle.addEventListener("click", function (e) { e.stopPropagation(); chip.classList.toggle("is-open"); });
      document.addEventListener("click", function (e) { if (!chip.contains(e.target)) chip.classList.remove("is-open"); });
      var signOut = $("signOutBtn");
      if (signOut) signOut.addEventListener("click", function () {
        if (!sb) return;
        sb.auth.signOut().then(function () { chip.classList.remove("is-open"); renderAuth(null); });
      });
    }

    if (!sb) { renderAuth(null); return; }

    sb.auth.getSession().then(function (res) { renderAuth(res.data.session); });
    sb.auth.onAuthStateChange(function (event, session) {
      renderAuth(session);
      if (event === "SIGNED_IN") {
        syncProfile(session);
        /* Only a sign-in that happened in the modal is a conversion —
           a restored session on page load isn't. */
        if (modal && !modal.hidden) {
          var provider = (session.user.app_metadata || {}).provider || "email";
          if (window.rpTrack) window.rpTrack("signin_complete", { provider: provider });
          setMsg("");
          closeModal();
        }
      }
      if (event === "PASSWORD_RECOVERY" && modal) { openModal("signin"); }
    });
  }
})();
