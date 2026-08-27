/* ============================================================
   root+ analytics
   Loads GA4 / GTM / Meta Pixel / Clarity / TikTok — but ONLY the ones
   that have an ID in config.js. No ID = no script, no cookie, no
   third-party request. Nothing here runs on its own.

   Everywhere else in the site, track through one call:
       rpTrack("waitlist_submit", { product: "balance" })
   It fans out to whichever tools are switched on, and no-ops silently
   when none are. Loads after config.js, before main.js.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.ROOTPLUS || {};

  function inject(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
    return s;
  }

  /* ---------- Google Analytics 4 ---------- */
  if (cfg.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4Id, { anonymize_ip: true });
    inject("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id));
  }

  /* ---------- Google Tag Manager ---------- */
  if (cfg.gtmId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    inject("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(cfg.gtmId));
  }

  /* ---------- Meta (Facebook) Pixel ---------- */
  if (cfg.metaPixelId) {
    /* Standard Meta bootstrap, reformatted for readability. */
    if (!window.fbq) {
      var n = window.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      inject("https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq("init", cfg.metaPixelId);
    window.fbq("track", "PageView");
  }

  /* ---------- Microsoft Clarity (heatmaps + session replay) ---------- */
  if (cfg.clarityId) {
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    inject("https://www.clarity.ms/tag/" + encodeURIComponent(cfg.clarityId));
  }

  /* ---------- TikTok Pixel ---------- */
  if (cfg.tiktokPixelId) {
    var ttq = window.ttq = window.ttq || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function (obj, method) {
      obj[method] = function () { obj.push([method].concat(Array.prototype.slice.call(arguments, 0))); };
    };
    ttq.methods.forEach(function (m) { ttq.setAndDefer(ttq, m); });
    ttq.load = function (id) { ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._t = ttq._t || {}; ttq._t[id] = +new Date(); };
    ttq.load(cfg.tiktokPixelId);
    ttq.page();
    inject("https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + encodeURIComponent(cfg.tiktokPixelId) + "&lib=ttq");
  }

  /* ---------- First-party events, stored in our own Supabase ----------
     Works with no third-party tool connected at all. See
     supabase-events-setup.sql for the table and the ready-made queries.

     session_id is random per tab-session and is NOT a user id: it dies
     with the tab and is never linked to an email, so the table stays
     anonymous under PDPA. */
  var SID_KEY = "rootplus-sid";

  function sessionId() {
    try {
      var v = sessionStorage.getItem(SID_KEY);
      if (!v) {
        v = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
        sessionStorage.setItem(SID_KEY, v);
      }
      return v;
    } catch (e) {
      /* Private mode with storage blocked — still record the event, just
         without being able to stitch it to the rest of the visit. */
      return "nostore";
    }
  }

  var eventsOn = cfg.supabaseUrl && cfg.supabaseKey && cfg.trackToSupabase !== false;

  function sendToSupabase(event, params) {
    if (!eventsOn) return;
    var utm = window.rpAttribution;
    var body = {
      session_id: sessionId(),
      event: event,
      props: (params && Object.keys(params).length) ? params : null,
      path: location.pathname + location.search,
      lang: document.documentElement.getAttribute("lang") || "en",
      referrer: document.referrer || null,
      utm: (utm && Object.keys(utm).length) ? utm : null
    };
    /* keepalive so an event fired as the visitor leaves still lands.
       Fire-and-forget: analytics must never surface an error to a user,
       and a missing `events` table should not look like a broken page. */
    fetch(cfg.supabaseUrl + "/rest/v1/events", {
      method: "POST",
      keepalive: true,
      headers: {
        "apikey": cfg.supabaseKey,
        "Authorization": "Bearer " + cfg.supabaseKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(body)
    }).catch(function () {});
  }

  /* ---------- One tracking call for the whole site ---------- */
  /* Map our event names onto each platform's standard events so the
     numbers line up with the ad managers without extra config. */
  var META_EVENTS = {
    waitlist_submit: "Lead",
    signup_complete: "CompleteRegistration",
    signin_complete: "Login"
  };
  var TIKTOK_EVENTS = {
    waitlist_submit: "SubmitForm",
    signup_complete: "CompleteRegistration"
  };

  window.rpTrack = function (event, params) {
    params = params || {};
    try {
      if (window.gtag && cfg.ga4Id) window.gtag("event", event, params);
      if (window.dataLayer && cfg.gtmId) window.dataLayer.push(Object.assign({ event: event }, params));
      if (window.fbq && cfg.metaPixelId) {
        var fbName = META_EVENTS[event];
        if (fbName) window.fbq("track", fbName, params);
        else window.fbq("trackCustom", event, params);
      }
      if (window.ttq && cfg.tiktokPixelId) window.ttq.track(TIKTOK_EVENTS[event] || event, params);
      if (window.clarity && cfg.clarityId) window.clarity("event", event);
      sendToSupabase(event, params);
    } catch (e) { /* analytics must never break the page */ }

    /* Local visibility while no tool is connected yet — so you can still
       verify the funnel fires correctly from the browser console. */
    if (!cfg.ga4Id && !cfg.gtmId && !cfg.metaPixelId && !cfg.tiktokPixelId && window.console) {
      console.info("[rpTrack]", event, params);
    }
  };

  /* ---------- UTM capture (first touch, kept for the session) ---------- */
  /* Stored so a signup that happens three scrolls later still carries the
     campaign that brought the visitor in. sessionStorage = per visit. */
  window.rpAttribution = (function () {
    var KEY = "rootplus-utm";
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      var qs = new URLSearchParams(location.search);
      var fresh = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].forEach(function (k) {
        if (qs.get(k)) fresh[k] = qs.get(k);
      });
      if (Object.keys(fresh).length) {
        sessionStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      }
      return saved || {};
    } catch (e) { return {}; }
  })();

  /* ---------- Referral capture (first touch) ----------
     My Account → Refer hands members a link ending in ?ref=<their user id>.
     Hold it for the visit so the signup — which may happen several pages
     later — can credit the person who invited them.
     First touch wins: if they already arrived via someone's link, a later
     ?ref= in the same visit does not steal the credit. */
  window.rpReferralId = (function () {
    var KEY = "rootplus-ref";
    /* uuid only — the value goes to a uuid column, and this keeps junk
       from a mangled shared link out of the database. */
    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    try {
      var saved = sessionStorage.getItem(KEY);
      if (saved) return saved;
      var v = (new URLSearchParams(location.search).get("ref") || "").trim();
      if (UUID.test(v)) { sessionStorage.setItem(KEY, v); return v; }
      return null;
    } catch (e) { return null; }
  })();

  /* ---------- page_view ----------
     Without it there is no denominator: you can count signups but not what
     share of visitors they are. Deferred to DOMContentLoaded because the
     language toggle runs in main.js / product.js at the end of <body> —
     firing earlier would record every Thai visitor as "en". */
  function pageView() {
    window.rpTrack("page_view", { referred: !!window.rpReferralId });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pageView);
  } else {
    pageView();
  }
})();
