/* ============================================================
   root+ landing page — interactions
   ============================================================ */
(function () {
  "use strict";

  /* Footer year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* Sticky header: transparent over hero, solid once scrolled past it */
  var header = document.getElementById("header");
  var hero = document.getElementById("hero");

  function onScroll() {
    var threshold = hero ? hero.offsetHeight - 90 : 120;
    if (window.scrollY > threshold) {
      header.classList.add("header--solid");
      header.classList.remove("header--over");
    } else {
      header.classList.add("header--over");
      header.classList.remove("header--solid");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu, mega-menu a11y and the config-driven links live in
     shell.js, so the product pages get identical behaviour. */

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* FAQ: keep it an accordion (close others when one opens) */
  var items = document.querySelectorAll(".faq__item");
  items.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ============================================================
     Ingredient spotlight carousel
     Auto-rotates, but: stops for prefers-reduced-motion, exposes a real
     pause/play control (WCAG 2.2.2 — moving content must be stoppable),
     and shows dots so people can see there are three slides at all.
     ============================================================ */
  var spot = document.getElementById("spotSlider");
  if (spot) {
    var track = spot.querySelector(".spot__track");
    var slides = track.children;
    var count = slides.length;
    var idx = 0;
    var timer = null;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paused = reduceMotion;

    var dotsWrap = document.getElementById("spotDots");
    var playBtn = document.getElementById("spotPlay");

    /* Dots — built from the slide count so they can't drift out of sync. */
    var dots = [];
    if (dotsWrap) {
      for (var i = 0; i < count; i++) {
        (function (n) {
          var d = document.createElement("button");
          d.type = "button";
          d.className = "spot__dot";
          d.setAttribute("aria-label", "Slide " + (n + 1) + " of " + count);
          d.addEventListener("click", function () { show(n); restart(); });
          dotsWrap.appendChild(d);
          dots.push(d);
        })(i);
      }
    }

    function show(n) {
      idx = (n + count) % count;
      track.style.transform = "translateX(-" + idx * 100 + "%)";
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      });
      /* Keep hidden slides out of the tab order and off screen readers. */
      for (var s = 0; s < count; s++) {
        slides[s].setAttribute("aria-hidden", s === idx ? "false" : "true");
        slides[s].querySelectorAll("a,button,input").forEach(function (el) {
          if (s === idx) el.removeAttribute("tabindex"); else el.setAttribute("tabindex", "-1");
        });
      }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function play() { stop(); if (!paused) timer = setInterval(function () { show(idx + 1); }, 5000); }
    function restart() { if (!paused) play(); }

    function setPaused(v) {
      paused = v;
      if (playBtn) {
        playBtn.setAttribute("aria-pressed", v ? "true" : "false");
        playBtn.setAttribute("aria-label", v ? "Play slideshow" : "Pause slideshow");
        playBtn.classList.toggle("is-paused", v);
      }
      if (v) stop(); else play();
    }
    if (playBtn) playBtn.addEventListener("click", function () { setPaused(!paused); });

    spot.querySelectorAll(".spot__arrow").forEach(function (a) {
      a.addEventListener("click", function () {
        show(idx + parseInt(a.getAttribute("data-dir"), 10));
        restart();
      });
    });

    /* Hover / keyboard focus suspends rotation without changing the
       user's explicit pause choice. */
    spot.addEventListener("mouseenter", stop);
    spot.addEventListener("mouseleave", restart);
    spot.addEventListener("focusin", stop);
    spot.addEventListener("focusout", restart);

    /* Arrow keys when the carousel has focus. */
    spot.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { show(idx + 1); restart(); }
      if (e.key === "ArrowLeft") { show(idx - 1); restart(); }
    });

    show(0);
    setPaused(paused);
  }

  /* ============================================================
     Founding list — real capture
     Writes to the Supabase `waitlist` table (see supabase-waitlist-setup.sql)
     and always keeps a localStorage backup. Carries the product the visitor
     clicked "Notify me" on, plus language and UTM attribution.
     ============================================================ */

  function tr(key, en) {
    var L = document.documentElement.getAttribute("lang") || "en";
    if (L === "th" && window.I18N && window.I18N.th && window.I18N.th[key] != null) return window.I18N.th[key];
    return en;
  }

  var PRODUCT_LABELS = { balance: "Balance", goodnight: "Goodnight", radiance: "Skin Radiance" };

  /* Which product sent them here — set by the "Notify me" buttons. */
  var pickedProduct = null;
  var waitProductInput = document.getElementById("waitProduct");
  var waitChip = document.getElementById("waitChip");

  function setProduct(key) {
    pickedProduct = key || null;
    if (waitProductInput) waitProductInput.value = pickedProduct || "";
    if (!waitChip) return;
    if (pickedProduct) {
      waitChip.querySelector(".waitchip__label").textContent = tr("wait.interested", "You're joining for");
      waitChip.querySelector(".waitchip__name").textContent = PRODUCT_LABELS[pickedProduct] || pickedProduct;
      waitChip.hidden = false;
    } else {
      waitChip.hidden = true;
    }
  }

  /* "Notify me" on a product card → remember the product, show it on the
     form, and record the intent even if they never finish the form. */
  document.querySelectorAll("[data-product]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = btn.getAttribute("data-product");
      setProduct(p);
      if (window.rpTrack) window.rpTrack("notify_me_click", { product: p });
      var em = document.getElementById("email");
      /* Focus the field once the smooth scroll has landed. */
      if (em) setTimeout(function () { em.focus({ preventScroll: true }); }, 700);
    });
  });

  /* Deep link support: ?product=balance#waitlist — usable straight from an ad. */
  try {
    var qp = (new URLSearchParams(location.search).get("product") || "").toLowerCase();
    if (PRODUCT_LABELS[qp]) setProduct(qp);
  } catch (e) {}

  var form = document.getElementById("waitForm");
  var ok = document.getElementById("formOk");

  function saveLocalBackup(row) {
    try {
      var list = JSON.parse(localStorage.getItem("rootplus-waitlist") || "[]");
      list.push(row);
      localStorage.setItem("rootplus-waitlist", JSON.stringify(list));
    } catch (e) {}
  }

  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var sending = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;

      var email = document.getElementById("email");
      var val = (email.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        ok.className = "form__ok form__ok--err";
        ok.textContent = tr("wait.invalid", "Please enter a valid email address.");
        email.focus();
        return;
      }

      var cfg = window.ROOTPLUS || {};
      var row = {
        email: val,
        product: pickedProduct,
        lang: document.documentElement.getAttribute("lang") || "en",
        source: "landing",
        referrer: document.referrer || null,
        referred_by: window.rpReferralId || null,
        utm: (window.rpAttribution && Object.keys(window.rpAttribution).length) ? window.rpAttribution : null
      };

      saveLocalBackup({ at: new Date().toISOString(), email: row.email, product: row.product, lang: row.lang });

      var submitLabel = submitBtn ? submitBtn.textContent : "";
      function done(message, kind) {
        sending = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
        ok.className = "form__ok" + (kind === "err" ? " form__ok--err" : "");
        ok.textContent = message;
      }
      function succeed(key, en, event) {
        done(tr(key, en));
        form.reset();
        setProduct(null);
        if (window.rpTrack) window.rpTrack(event, { product: row.product, referred: !!row.referred_by });
      }

      /* No backend configured → keep the local copy only. */
      if (!cfg.supabaseUrl || !cfg.supabaseKey) {
        succeed("wait.ok", "You're on the list — welcome to the roots. 🌱", "waitlist_submit");
        return;
      }

      sending = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = tr("wait.sending", "Joining…"); }
      ok.className = "form__ok";
      ok.textContent = "";

      fetch(cfg.supabaseUrl + "/rest/v1/waitlist", {
        method: "POST",
        headers: {
          "apikey": cfg.supabaseKey,
          "Authorization": "Bearer " + cfg.supabaseKey,
          "Content-Type": "application/json",
          /* return=minimal is required: the anon key has INSERT but no SELECT. */
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(row)
      }).then(function (res) {
        /* 409 = the unique email index fired. They already joined; not an error. */
        if (res.status === 409) {
          succeed("wait.already", "You're already on the founding list — see you at launch. 🌱", "waitlist_duplicate");
          return;
        }
        if (!res.ok) return res.text().then(function (t) { throw new Error(res.status + " " + t); });
        succeed("wait.ok", "You're on the list — welcome to the roots. 🌱", "waitlist_submit");
      }).catch(function (err) {
        console.error("[waitlist] insert failed:", err);
        done(tr("wait.err", "Something went wrong on our side. Please try again, or email ") +
             (cfg.contactEmail || "itd@srichand.co.th"), "err");
        if (window.rpTrack) window.rpTrack("waitlist_error", { product: row.product });
      });
    });
  }

  /* Tiny toast helper */
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 300);
    }, 3000);
  }

  /* Language switch (EN / TH) — full content translation */
  var langOpts = document.querySelectorAll(".lang__opt");
  if (langOpts.length) {
    var TH = (window.I18N && window.I18N.th) || {};
    var i18nEls = document.querySelectorAll("[data-i18n]");
    i18nEls.forEach(function (el) { el.__i18nEN = el.innerHTML; });
    var savedLang = "en";
    try { savedLang = localStorage.getItem("rootplus-lang") || "en"; } catch (e) {}
    applyLang(savedLang);
    langOpts.forEach(function (o) {
      o.addEventListener("click", function () { applyLang(o.getAttribute("data-lang")); });
    });
    function applyLang(lang) {
      document.documentElement.setAttribute("lang", lang);
      document.body.classList.toggle("lang-th", lang === "th");
      i18nEls.forEach(function (el) {
        var k = el.getAttribute("data-i18n");
        el.innerHTML = (lang === "th" && TH[k] != null) ? TH[k] : el.__i18nEN;
      });
      langOpts.forEach(function (o) { o.classList.toggle("is-active", o.getAttribute("data-lang") === lang); });
      var si = document.getElementById("searchInput");
      if (si) si.placeholder = (lang === "th" && TH["search.placeholder"]) ? TH["search.placeholder"] : "Search root+…";
      try { localStorage.setItem("rootplus-lang", lang); } catch (e) {}
    }
  }

  /* Search overlay — in-page search */
  var searchToggle = document.getElementById("searchToggle");
  var overlay = document.getElementById("searchOverlay");
  if (searchToggle && overlay) {
    var input = document.getElementById("searchInput");
    var results = document.getElementById("searchResults");
    var closeBtn = document.getElementById("searchClose");
    var index = [];

    searchToggle.addEventListener("click", openSearch);
    closeBtn.addEventListener("click", closeSearch);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeSearch(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) closeSearch(); });
    input.addEventListener("input", function () { renderResults(input.value.trim()); });

    function openSearch() { index = buildSearchIndex(); overlay.hidden = false; input.value = ""; renderResults(""); setTimeout(function () { input.focus(); }, 40); }
    function closeSearch() { overlay.hidden = true; }

    function buildSearchIndex() {
      var items = [];
      document.querySelectorAll("main section[id]").forEach(function (sec) {
        var h = sec.querySelector(".h2");
        var ey = sec.querySelector(".eyebrow");
        if (h) items.push({ title: h.textContent.trim(), sub: ey ? ey.textContent.trim() : "Section", el: sec });
      });
      document.querySelectorAll(".pcard").forEach(function (c) {
        var n = c.querySelector(".pcard__name");
        var d = c.querySelector(".pcard__desc");
        if (n) items.push({ title: n.textContent.trim(), sub: "Product · " + (d ? d.textContent.trim() : ""), el: document.getElementById("collection") });
      });
      document.querySelectorAll(".faq__item").forEach(function (it) {
        var q = it.querySelector(".faq__q");
        if (q) items.push({ title: q.textContent.trim(), sub: "FAQ", el: it, faq: it });
      });
      return items;
    }

    function renderResults(q) {
      results.innerHTML = "";
      var ql = q.toLowerCase();
      var matches = ql
        ? index.filter(function (i) { return (i.title + " " + i.sub).toLowerCase().indexOf(ql) > -1; })
        : index.slice(0, 6);
      if (!matches.length) {
        results.innerHTML = '<p class="search__empty">No results for “' + escapeHtml(q) + '”.</p>';
        return;
      }
      matches.slice(0, 8).forEach(function (m) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "search__result";
        b.innerHTML = "<b>" + escapeHtml(m.title) + "</b><span>" + escapeHtml(m.sub) + "</span>";
        b.addEventListener("click", function () { goToResult(m); });
        results.appendChild(b);
      });
    }

    function goToResult(m) {
      closeSearch();
      if (m.faq) { m.faq.open = true; }
      var y = m.el.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
      m.el.classList.add("search-flash");
      setTimeout(function () { m.el.classList.remove("search-flash"); }, 1600);
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }
  }

  /* Membership signup + sign-in modal is owned by auth.js (Supabase Auth). */
})();
