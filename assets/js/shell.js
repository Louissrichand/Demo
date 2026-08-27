/* ============================================================
   root+ page shell
   The chrome every page shares: mobile menu, mega-menu a11y, and the
   links that come from config.js. Lives here rather than in main.js so
   the product pages get identical behaviour without duplicating it.

   Loads after config.js, before main.js / product.js / profile.js.
   Every block is null-safe — a page that lacks the markup just skips it.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.ROOTPLUS || {};

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  var closeBtn = document.getElementById("menuClose");

  if (toggle && menu) {
    var openMenu = function () {
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };
    var closeMenu = function () {
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    toggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) closeMenu();
    });
  }

  /* ---------- Mega menu ----------
     CSS opens it on :hover and :focus-within, so it already works with a
     keyboard. What was missing is telling assistive tech that the trigger
     owns a menu, and letting Escape close it. */
  document.querySelectorAll(".nav-drop").forEach(function (drop) {
    var trigger = drop.querySelector(".nav-drop__trigger");
    if (!trigger) return;
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");

    var sync = function (open) { trigger.setAttribute("aria-expanded", open ? "true" : "false"); };
    drop.addEventListener("mouseenter", function () { sync(true); });
    drop.addEventListener("mouseleave", function () { sync(false); });
    drop.addEventListener("focusin", function () { sync(true); });
    drop.addEventListener("focusout", function () {
      if (!drop.contains(document.activeElement)) sync(false);
    });
    drop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { trigger.focus(); sync(false); }
    });
  });

  /* ---------- Config-driven links ----------
     A social icon, the shop link and the location render only when they
     actually point somewhere — no dead "#" links. */
  var social = cfg.social || {};
  var socialWrap = document.querySelector(".footer__social");
  if (socialWrap) {
    var live = 0;
    socialWrap.querySelectorAll("[data-social]").forEach(function (a) {
      var url = social[a.getAttribute("data-social")];
      if (url) {
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.hidden = false;
        live++;
        a.addEventListener("click", function () {
          if (window.rpTrack) window.rpTrack("social_click", { network: a.getAttribute("data-social") });
        });
      } else {
        a.hidden = true;
      }
    });
    socialWrap.hidden = live === 0;
  }

  document.querySelectorAll("[data-contact-email]").forEach(function (a) {
    var mail = cfg.contactEmail || "itd@srichand.co.th";
    a.href = "mailto:" + mail;
    a.textContent = mail;
  });

  var loc = document.getElementById("footLocation");
  if (loc && cfg.locationUrl) {
    var link = document.createElement("a");
    link.href = cfg.locationUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("data-i18n", loc.getAttribute("data-i18n") || "");
    link.textContent = loc.textContent;
    loc.replaceWith(link);
  }

  /* "Shop now" — points at the local shop preview today, and at
     srichand.com/root-plus/ once Srichand's dev team ships that page.
     One config line switches it; an external URL opens in a new tab,
     a local one stays in this one. */
  var shop = document.getElementById("shopLink");
  if (shop) {
    shop.hidden = !cfg.showShopLink;
    var shopUrl = cfg.shopUrl || "shop.html";
    if (shopUrl) {
      shop.href = shopUrl;
      if (/^https?:/i.test(shopUrl)) {
        shop.target = "_blank";
        shop.rel = "noopener noreferrer";
      } else {
        shop.removeAttribute("target");
        shop.removeAttribute("rel");
      }
    }
  }

  /* ---------- Keep the referral tag on internal links ----------
     Someone landing on a ?ref= link may click through to a product page
     before joining. Without this the referral is lost on the first hop. */
  var ref = window.rpReferralId;
  if (ref) {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || /^(#|mailto:|tel:|https?:|\/\/)/i.test(href)) return;  /* relative links only */
      if (/[?&]ref=/.test(href)) return;

      /* Split the fragment off first — "index.html#waitlist" must become
         "index.html?ref=x#waitlist", not "index.html#waitlist?ref=x". */
      var hash = "";
      var hashAt = href.indexOf("#");
      if (hashAt > -1) { hash = href.slice(hashAt); href = href.slice(0, hashAt); }

      a.setAttribute("href",
        href + (href.indexOf("?") > -1 ? "&" : "?") + "ref=" + encodeURIComponent(ref) + hash);
    });
  }
})();
