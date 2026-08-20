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

  /* Mobile menu */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  var close = document.getElementById("menuClose");

  function openMenu() {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openMenu);
  if (close) close.addEventListener("click", closeMenu);
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

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

  /* Ingredient spotlight — auto-rotate every 3s, pause on hover */
  var spot = document.getElementById("spotSlider");
  if (spot) {
    var track = spot.querySelector(".spot__track");
    var count = track.children.length;
    var idx = 0;
    var timer = null;

    function show(n) {
      idx = (n + count) % count;
      track.style.transform = "translateX(-" + idx * 100 + "%)";
    }
    function play() { stop(); timer = setInterval(function () { show(idx + 1); }, 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    spot.querySelectorAll(".spot__arrow").forEach(function (a) {
      a.addEventListener("click", function () {
        show(idx + parseInt(a.getAttribute("data-dir"), 10));
        play();
      });
    });
    spot.addEventListener("mouseenter", stop);
    spot.addEventListener("mouseleave", play);
    spot.addEventListener("focusin", stop);
    spot.addEventListener("focusout", play);

    show(0);
    play();
  }

  /* Waitlist form — demo only (no backend yet) */
  var form = document.getElementById("waitForm");
  var ok = document.getElementById("formOk");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email");
      var val = (email.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!valid) {
        ok.style.color = "#ffb4a1";
        ok.textContent = "Please enter a valid email address.";
        email.focus();
        return;
      }
      ok.style.color = "";
      ok.textContent = "You're on the list — welcome to the roots. 🌱";
      form.reset();
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

  /* Membership signup modal */
  var suModal = document.getElementById("signupModal");
  if (suModal) {
    var suForm = document.getElementById("signupForm");
    var suOk = document.getElementById("signupOk");
    var suLastFocus = null;

    function openSignup() {
      suLastFocus = document.activeElement;
      var mm = document.getElementById("mobileMenu");
      if (mm) { mm.classList.remove("open"); mm.setAttribute("aria-hidden", "true"); }
      suModal.hidden = false;
      document.body.style.overflow = "hidden";
      setTimeout(function () { var f = document.getElementById("su-name"); if (f) f.focus(); }, 40);
    }
    function closeSignup() {
      suModal.hidden = true;
      document.body.style.overflow = "";
      if (suLastFocus && suLastFocus.focus) suLastFocus.focus();
    }

    document.querySelectorAll("#signupOpen, #signupOpenM").forEach(function (b) {
      b.addEventListener("click", openSignup);
    });
    suModal.querySelectorAll("[data-close]").forEach(function (c) {
      c.addEventListener("click", closeSignup);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !suModal.hidden) closeSignup();
    });

    function mark(id, bad) {
      var el = document.getElementById(id);
      var field = el.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      return bad;
    }

    suForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("su-name");
      var surnameEl = document.getElementById("su-surname");
      var emailEl = document.getElementById("su-email");
      var phoneEl = document.getElementById("su-phone");
      var pdpaEl = document.getElementById("su-pdpa");

      var bad = false;
      bad = mark("su-name", nameEl.value.trim().length < 1) || bad;
      bad = mark("su-surname", surnameEl.value.trim().length < 1) || bad;
      bad = mark("su-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) || bad;
      bad = mark("su-phone", (phoneEl.value || "").replace(/\D/g, "").length < 9) || bad;
      bad = mark("su-pdpa", !pdpaEl.checked) || bad;

      if (bad) {
        var firstBad = suForm.querySelector(".field.invalid input, .field.invalid select");
        if (firstBad) firstBad.focus();
        return;
      }

      var interests = [].map.call(suForm.querySelectorAll('input[name="interest"]:checked'), function (i) { return i.value; });
      var record = {
        firstName: nameEl.value.trim(),
        lastName: surnameEl.value.trim(),
        email: emailEl.value.trim(),
        phone: phoneEl.value.trim(),
        dob: (document.getElementById("su-dob") || {}).value || "",
        gender: (document.getElementById("su-gender") || {}).value || "",
        interests: interests,
        marketing: !!(suForm.querySelector('input[name="marketing"]') || {}).checked,
        pdpa: true,
        ts: new Date().toISOString()
      };
      try {
        var arr = JSON.parse(localStorage.getItem("rootplus-members") || "[]");
        arr.push(record);
        localStorage.setItem("rootplus-members", JSON.stringify(arr));
      } catch (err) {}

      var lang = document.documentElement.getAttribute("lang") || "en";
      var msg = (window.I18N && window.I18N[lang] && window.I18N[lang]["signup.ok"]) || "Welcome to root+! Your membership is created. 🌱";
      suOk.textContent = msg;
      suForm.reset();
      suForm.querySelectorAll(".field.invalid").forEach(function (f) { f.classList.remove("invalid"); });
      setTimeout(closeSignup, 2400);
    });
  }
})();
