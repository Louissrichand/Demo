/* ============================================================
   root+ — Shop preview
   Powers shop.html and the two commerce product pages. This is a
   PREVIEW of the buying experience Srichand's dev team will build at
   srichand.com/root-plus/ — the cart lives in localStorage and there is
   no payment step. Nothing here talks to Supabase.

   Loads after config.js, analytics.js, shell.js and i18n.js.
   Every block is null-safe, so each page runs only the parts it has.
   ============================================================ */
(function () {
  "use strict";

  var LAUNCH = Date.UTC(2027, 2, 20, 0, 0, 0) - 7 * 3600 * 1000; /* 20 Mar 2027, 00:00 ICT */
  var FREE_SHIPPING = 599;
  var STORE_KEY = "rootplus-demo-cart";

  var L = "en";
  try { L = localStorage.getItem("rootplus-lang") || "en"; } catch (e) {}

  /* ---------- Copy that JS writes (markup copy uses data-i18n) ---------- */
  var S = {
    added:      { en: "Added to cart", th: "เพิ่มลงตะกร้าแล้ว" },
    removed:    { en: "Removed from cart", th: "นำออกจากตะกร้าแล้ว" },
    couponSaved:{ en: "Coupon saved — it applies at checkout", th: "เก็บคูปองแล้ว ใช้ได้ตอนชำระเงิน" },
    couponTaken:{ en: "Saved ✓", th: "เก็บแล้ว ✓" },
    empty:      { en: "Your cart is empty.", th: "ยังไม่มีสินค้าในตะกร้า" },
    box:        { en: "box", th: "กล่อง" },
    boxes:      { en: "boxes", th: "กล่อง" },
    remove:     { en: "Remove", th: "นำออก" },
    freeYes:    { en: "Free shipping unlocked 🎉", th: "ได้ส่งฟรีแล้ว 🎉" },
    freeNo:     { en: "Add ฿{n} more for free shipping", th: "ซื้อเพิ่มอีก ฿{n} เพื่อรับส่งฟรี" },
    days:       { en: "d", th: "วัน" },
    preorder:   { en: "Pre-order · ships 20 Mar 2027", th: "พรีออเดอร์ · ส่ง 20 มี.ค. 2027" },
    demoBuy:    { en: "This is a design preview — no real order is placed.", th: "หน้านี้เป็นตัวอย่างการออกแบบ ยังไม่มีการสั่งซื้อจริง" }
  };
  function t(key) { var p = S[key]; return p ? (L === "th" ? p.th : p.en) : ""; }

  /* ---------- Catalogue ----------
     Box price is the confirmed ฿890. Multi-box rows are plain multiples:
     the real bundle discount is not decided yet, so nothing here invents
     one — the page says so next to the selector. */
  var BOX = 890;
  var PRODUCTS = {
    balance: {
      id: "balance",
      name: "Balance",
      accent: "balance",
      image: "assets/img/product-balance.png",
      page: "shop-balance.html",
      kicker: { en: "Gut Health Synbiotic", th: "ซินไบโอติกเพื่อสุขภาพลำไส้" },
      flavour: { en: "Yogurt Pineapple", th: "รสโยเกิร์ตสับปะรด" }
    },
    goodnight: {
      id: "goodnight",
      name: "Goodnight",
      accent: "refresh",
      image: "assets/img/product-refresh.png",
      page: "shop-goodnight.html",
      kicker: { en: "Sleep & Mood Synbiotic", th: "ซินไบโอติกเพื่อการนอนและอารมณ์" },
      flavour: { en: "Mixed Berry", th: "รสมิกซ์เบอร์รี" }
    }
  };
  var VARIANTS = [
    { id: "1box", boxes: 1, price: BOX },
    { id: "2box", boxes: 2, price: BOX * 2 },
    { id: "3box", boxes: 3, price: BOX * 3 }
  ];
  function variantById(id) {
    for (var i = 0; i < VARIANTS.length; i++) if (VARIANTS[i].id === id) return VARIANTS[i];
    return VARIANTS[0];
  }
  function variantLabel(v) {
    return v.boxes + " " + (v.boxes === 1 ? t("box") : t("boxes")) + " · " + (v.boxes * 15) + (L === "th" ? " ซอง" : " sachets");
  }
  function baht(n) { return "฿" + n.toLocaleString("en-US"); }

  /* ---------- Cart state ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY) || "[]") || []; } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function cartCount() {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function cartTotal() {
    return cart.reduce(function (n, l) { return n + l.qty * variantById(l.variant).price; }, 0);
  }
  function addToCart(productId, variantId, qty) {
    var p = PRODUCTS[productId];
    if (!p) return;
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].product === productId && cart[i].variant === variantId) { found = cart[i]; break; }
    }
    if (found) found.qty += qty; else cart.push({ product: productId, variant: variantId, qty: qty });
    saveCart();
    renderCart();
    openCart();
    toast(t("added") + " · " + p.name);
    if (window.rpTrack) {
      window.rpTrack("demo_add_to_cart", { product: productId, variant: variantId, qty: qty });
    }
  }
  function removeLine(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
    toast(t("removed"));
  }
  function setLineQty(index, delta) {
    var line = cart[index];
    if (!line) return;
    line.qty += delta;
    if (line.qty < 1) { removeLine(index); return; }
    saveCart();
    renderCart();
  }

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById("shopToast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-up");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-up"); }, 2800);
  }

  /* ---------- Cart drawer ---------- */
  var drawer = document.getElementById("cartDrawer");
  var scrim = document.getElementById("cartScrim");
  var cartBody = document.getElementById("cartBody");
  var cartFoot = document.getElementById("cartFoot");

  function openCart() {
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) scrim.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function renderCart() {
    /* header badge — every page has one */
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = cartCount();
    });
    if (!cartBody || !cartFoot) return;

    if (!cart.length) {
      cartBody.innerHTML = '<p class="cart__empty">' + t("empty") + "</p>";
      cartFoot.hidden = true;
      return;
    }
    cartFoot.hidden = false;

    var html = "";
    cart.forEach(function (line, i) {
      var p = PRODUCTS[line.product];
      var v = variantById(line.variant);
      if (!p) return;
      html +=
        '<div class="cartline">' +
          '<span class="cartline__img" data-accent="' + p.accent + '"><img src="' + p.image + '" alt="" width="68" height="68" /></span>' +
          '<div class="cartline__main">' +
            '<span class="cartline__name">root+ ' + p.name + "</span>" +
            '<span class="cartline__var">' + variantLabel(v) + "</span>" +
            '<div class="cartline__row">' +
              '<span class="qty qty--sm">' +
                '<button type="button" data-line="' + i + '" data-line-step="-1" aria-label="-">−</button>' +
                "<output>" + line.qty + "</output>" +
                '<button type="button" data-line="' + i + '" data-line-step="1" aria-label="+">+</button>' +
              "</span>" +
              '<span class="cartline__price">' + baht(v.price * line.qty) + "</span>" +
            "</div>" +
            '<button type="button" class="cartline__del" data-line="' + i + '" data-line-remove>' + t("remove") + "</button>" +
          "</div>" +
        "</div>";
    });
    cartBody.innerHTML = html;

    var total = cartTotal();
    var gap = FREE_SHIPPING - total;
    var ship = gap > 0
      ? t("freeNo").replace("{n}", gap.toLocaleString("en-US"))
      : t("freeYes");
    var totalLabel = L === "th" ? "ยอดรวม" : "Total";
    cartFoot.innerHTML =
      '<p class="cart__ship">' + ship + "</p>" +
      '<div class="cart__row cart__row--total"><span>' + totalLabel + "</span><b>" + baht(total) + "</b></div>" +
      '<button class="btn btn--primary btn--block" type="button" data-checkout>' +
        (L === "th" ? "ไปหน้าชำระเงิน" : "Go to checkout") +
      "</button>" +
      '<p class="cart__note">' + t("demoBuy") + "</p>";
  }

  /* ---------- Countdown to launch day ----------
     A real, truthful countdown — not a fake sale timer. It shows the dev
     exactly where the promo timer component sits on the page. */
  function renderCountdown() {
    var els = document.querySelectorAll("[data-countdown]");
    if (!els.length) return;
    var left = Math.max(0, LAUNCH - Date.now());
    var d = Math.floor(left / 86400000);
    var h = Math.floor((left % 86400000) / 3600000);
    var m = Math.floor((left % 3600000) / 60000);
    var s = Math.floor((left % 60000) / 1000);
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    var text = d + t("days") + " " + pad(h) + ":" + pad(m) + ":" + pad(s);
    els.forEach(function (el) { el.textContent = text; });
  }

  /* ---------- Delegated interactions ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("button, a");
    if (!btn) return;

    /* open / close cart */
    if (btn.hasAttribute("data-cart-open")) { e.preventDefault(); openCart(); return; }
    if (btn.hasAttribute("data-cart-close")) { closeCart(); return; }
    if (btn.hasAttribute("data-checkout")) {
      toast(t("demoBuy"));
      return;
    }

    /* cart line controls */
    if (btn.hasAttribute("data-line-step")) {
      setLineQty(parseInt(btn.getAttribute("data-line"), 10), parseInt(btn.getAttribute("data-line-step"), 10));
      return;
    }
    if (btn.hasAttribute("data-line-remove")) {
      removeLine(parseInt(btn.getAttribute("data-line"), 10));
      return;
    }

    /* quantity stepper on a card or the product page */
    if (btn.hasAttribute("data-step")) {
      var out = btn.parentElement.querySelector("output");
      if (!out) return;
      var n = parseInt(out.textContent, 10) + parseInt(btn.getAttribute("data-step"), 10);
      out.textContent = Math.max(1, Math.min(20, n));
      return;
    }

    /* add to cart */
    if (btn.hasAttribute("data-add")) {
      var scope = btn.closest("[data-product-scope]");
      var pid = btn.getAttribute("data-add");
      var qtyEl = scope ? scope.querySelector("[data-qty] output") : null;
      var varEl = scope ? scope.querySelector(".varbtn.is-on") : null;
      addToCart(
        pid,
        varEl ? varEl.getAttribute("data-variant") : "1box",
        qtyEl ? parseInt(qtyEl.textContent, 10) : 1
      );
      return;
    }

    /* variant picker */
    if (btn.hasAttribute("data-variant")) {
      btn.parentElement.querySelectorAll("[data-variant]").forEach(function (v) { v.classList.remove("is-on"); });
      btn.classList.add("is-on");
      updatePrice();
      return;
    }

    /* gallery thumbnails */
    if (btn.hasAttribute("data-thumb")) {
      var strip = btn.parentElement;
      strip.querySelectorAll("[data-thumb]").forEach(function (v) { v.classList.remove("is-on"); });
      btn.classList.add("is-on");
      var main = document.getElementById("cpdpImage");
      var src = btn.querySelector("img");
      if (main && src) main.src = src.getAttribute("src");
      return;
    }

    /* category chips */
    if (btn.hasAttribute("data-cat")) {
      btn.parentElement.querySelectorAll("[data-cat]").forEach(function (c) { c.classList.remove("is-active"); });
      btn.classList.add("is-active");
      filterGrid(btn.getAttribute("data-cat"));
      return;
    }

    /* coupon */
    if (btn.hasAttribute("data-coupon")) {
      if (btn.classList.contains("is-taken")) return;
      btn.classList.add("is-taken");
      btn.textContent = t("couponTaken");
      toast(t("couponSaved"));
      return;
    }

    /* wishlist */
    if (btn.hasAttribute("data-wish")) {
      btn.classList.toggle("is-on");
      btn.textContent = btn.classList.contains("is-on") ? "♥" : "♡";
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) closeCart();
  });

  /* ---------- Category filter (shop.html) ---------- */
  function filterGrid(cat) {
    document.querySelectorAll("[data-tags]").forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "").split(" ");
      card.hidden = !(cat === "all" || tags.indexOf(cat) > -1);
    });
  }

  /* ---------- Product-page price, tied to the variant picker ---------- */
  function updatePrice() {
    var on = document.querySelector(".varbtn.is-on");
    var priceEl = document.getElementById("cpdpPrice");
    var perEl = document.getElementById("cpdpPer");
    if (!on || !priceEl) return;
    var v = variantById(on.getAttribute("data-variant"));
    priceEl.textContent = baht(v.price);
    if (perEl) {
      var perDay = Math.round(v.price / (v.boxes * 15));
      perEl.textContent = (v.boxes * 15) + (L === "th" ? " ซอง · ~฿" : " sachets · ~฿") + perDay + (L === "th" ? "/วัน" : "/day");
    }
  }

  /* ---------- Language ----------
     Same contract as main.js: the English copy in the markup is the
     source, the Thai comes from i18n.js. main.js isn't loaded on these
     pages (it's full of index-only behaviour), so the pass lives here. */
  var TH = (window.I18N && window.I18N.th) || {};
  var i18nEls = document.querySelectorAll("[data-i18n]");
  i18nEls.forEach(function (el) { el.__i18nEN = el.innerHTML; });

  function applyLang(lang) {
    L = lang === "th" ? "th" : "en";
    document.documentElement.setAttribute("lang", L);
    document.body.classList.toggle("lang-th", L === "th");
    i18nEls.forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      el.innerHTML = (L === "th" && TH[k] != null) ? TH[k] : el.__i18nEN;
    });
    document.querySelectorAll(".lang__opt").forEach(function (o) {
      o.classList.toggle("is-active", o.getAttribute("data-lang") === L);
    });
    try { localStorage.setItem("rootplus-lang", L); } catch (e) {}
    renderCart();
    renderCountdown();
    renderVariantLabels();
    updatePrice();
  }

  document.querySelectorAll(".lang__opt").forEach(function (o) {
    o.addEventListener("click", function () { applyLang(o.getAttribute("data-lang")); });
  });

  function renderVariantLabels() {
    document.querySelectorAll("[data-variant]").forEach(function (b) {
      var v = variantById(b.getAttribute("data-variant"));
      var nameEl = b.querySelector("b");
      var subEl = b.querySelector("small");
      if (nameEl) nameEl.textContent = variantLabel(v);
      if (subEl) subEl.textContent = baht(v.price);
    });
  }

  /* ---------- Boot ---------- */
  applyLang(L);              /* also runs the first renderCart / countdown / prices */
  setInterval(renderCountdown, 1000);
})();
