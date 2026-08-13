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
    var dots = spot.querySelectorAll(".spot__dot");
    var count = track.children.length;
    var idx = 0;
    var timer = null;

    function show(n) {
      idx = (n + count) % count;
      track.style.transform = "translateX(-" + idx * 100 + "%)";
      dots.forEach(function (d, k) { d.classList.toggle("active", k === idx); });
    }
    function play() { stop(); timer = setInterval(function () { show(idx + 1); }, 3000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { show(k); play(); });
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
})();
