/* ============================================================
   root+ — Product detail page (data-driven by ?product=)
   Pre-launch: CTA is the founding list, not a real cart.
   ============================================================ */
(function () {
  "use strict";
  var TH = (window.I18N && window.I18N.th) || {};
  function $(id) { return document.getElementById(id); }
  var L = "en";
  try { L = localStorage.getItem("rootplus-lang") || "en"; } catch (e) {}

  /* English source strings for the shared keys (Thai comes from i18n.js) */
  var EN = {
    "cardB.kicker": "Stomach & Gut Synbiotic",
    "cardB.desc": "The stomach-first synbiotic. Balances the microbiome with an immune & metabolic bonus.",
    "cardR.kicker": "Gut-Brain Daily Synbiotic",
    "cardR.desc": "Lighter gut, brighter mood. Psychobiotic strains on the gut-brain axis for everyday freshness.",
    "cardS.kicker": "Gut-Skin Beauty Synbiotic",
    "cardS.desc": "Glow from within. Gut-skin axis strains support clarity and radiance from the inside out.",
    "spotB.a1": "Pylopass® <span>L. reuteri DSM 17648 · 200mg</span>",
    "spotB.a1p": "Binds and clears H. pylori to help restore a balanced stomach environment.",
    "spotB.a2": "B. lactis Bl-04® <span>immune strain</span>",
    "spotB.a2p": "A well-studied probiotic strain that backs everyday immune resilience.",
    "spotB.a3": "TCI711 <span>metabolic support</span>",
    "spotB.a3p": "Proprietary multi-strain support (ProBio-Ark + prebiotic fiber) for metabolic health.",
    "spotR.a1": "Psychobiotic strains <span>L. plantarum / B. longum</span>",
    "spotR.a1p": "Gut-brain axis strains that support daily mood and freshness.",
    "spotR.a2": "Delight™ TS <span>Passiflora edulis seed extract</span>",
    "spotR.a2p": "Botanical support to help you feel lighter and brighter.",
    "spotR.a3": "Magnesium + GABA <span>calm support</span>",
    "spotR.a3p": "Backs a calm, balanced nervous system for everyday ease.",
    "spotS.a1": "TCK33 <span>HA producer</span>",
    "spotS.a1p": "Skin-axis strain supporting hyaluronic acid for hydration and bounce.",
    "spotS.a2": "TCK53 <span>sialic acid / EGF</span>",
    "spotS.a2p": "Supports skin-renewal factors for a brighter, smoother look.",
    "spotS.a3": "TCK77 <span>Antrodia cinnamomea</span>",
    "spotS.a3p": "Helps calm blemish-prone skin from within."
  };
  function tk(key) { return (L === "th" && TH[key] != null) ? TH[key] : (EN[key] != null ? EN[key] : ""); } // by i18n key
  function tx(pair) { return pair ? ((L === "th" && pair.th != null) ? pair.th : pair.en) : ""; } // {en,th}

  var HOWTO = {
    en: "Tear one 3g sachet and pour it straight onto your tongue — no water, no mixing. Once a day, any time. Prebiotic + probiotic + postbiotic in every sachet.",
    th: "ฉีกซอง 3 กรัม เทลงลิ้นได้เลย ไม่ต้องผสม ไม่ต้องใช้น้ำ วันละครั้ง เมื่อไรก็ได้ — มีทั้งพรีไบโอติก โพรไบโอติก และโพสต์ไบโอติกในทุกซอง"
  };
  var QUALITY = [
    { en: "30 billion CFU guaranteed through end of shelf life", th: "รับประกัน 30 พันล้าน CFU จนหมดอายุ" },
    { en: "Third-party tested with a Certificate of Analysis (COA)", th: "ตรวจสอบโดยแล็บอิสระ พร้อมใบ COA" },
    { en: "Clinically-studied doses, fully disclosed — no proprietary blends", th: "โดสระดับคลินิก เปิดเผยครบทุกตัว ไม่มีสูตรลับ" },
    { en: "Vegan & Non-GMO · 3g direct-to-mouth sachet", th: "วีแกน & ปลอด GMO · ซอง 3 กรัม ทานตรงเข้าปาก" }
  ];

  var PRODUCTS = {
    balance: {
      name: "Balance", image: "assets/img/product-balance.png", accent: "balance",
      kicker: "cardB.kicker", desc: "cardB.desc",
      chips: [{ t: "Pylopass®" }, { t: "B. lactis Bl-04®" }, { t: "TCI711" }, { k: "flavor.yogurt", en: "Yogurt" }],
      icons: [{ en: "Gut balance", th: "สมดุลลำไส้" }, { en: "Immune support", th: "เสริมภูมิ" }, { en: "Metabolic health", th: "เมตาบอลิก" }],
      who: { en: "For anyone who wants to fix digestion at the source — bloating, irregularity, or a gut that just feels 'off'. Balance starts in the stomach and rebuilds microbiome balance from there.", th: "สำหรับคนที่อยากแก้ปัญหาการย่อยที่ต้นเหตุ — ท้องอืด ขับถ่ายไม่ปกติ หรือรู้สึกลำไส้ไม่โอเค Balance เริ่มดูแลตั้งแต่กระเพาะ แล้วปรับสมดุลจุลินทรีย์จากตรงนั้น" },
      benefits: [{ en: "Balances the gut microbiome from the stomach up", th: "ปรับสมดุลจุลินทรีย์ตั้งแต่กระเพาะ" }, { en: "Everyday immune support", th: "เสริมภูมิคุ้มกันในทุกวัน" }, { en: "Supports metabolic health", th: "สนับสนุนสุขภาพการเผาผลาญ" }],
      actives: [["spotB.a1", "spotB.a1p"], ["spotB.a2", "spotB.a2p"], ["spotB.a3", "spotB.a3p"]],
      launch: { en: "Ships Q2 2027", th: "เริ่มส่งไตรมาส 2 ปี 2027" }
    },
    goodnight: {
      name: "Goodnight", image: "assets/img/product-refresh.png", accent: "refresh",
      kicker: "cardR.kicker", desc: "cardR.desc",
      chips: [{ k: "chip.psychobiotics", en: "Psychobiotics" }, { t: "Magnesium + GABA" }, { k: "chip.cfu", en: "30 Bn CFU" }, { k: "flavor.grape", en: "Grape" }],
      icons: [{ en: "Gut-brain axis", th: "แกนลำไส้-สมอง" }, { en: "Calm & mood", th: "ผ่อนคลาย & อารมณ์" }, { en: "Everyday freshness", th: "สดชื่นทุกวัน" }],
      who: { en: "For busy minds and restless guts — when stress, mood and digestion are all tangled together. Goodnight works along the gut-brain axis to help you feel lighter and brighter.", th: "สำหรับคนที่หัวไม่หยุดคิดและลำไส้ไม่นิ่ง — เมื่อความเครียด อารมณ์ และการย่อยพันกันไปหมด Goodnight ทำงานบนแกนลำไส้-สมอง ช่วยให้รู้สึกเบาสบายและสดใส" },
      benefits: [{ en: "Psychobiotic strains for the gut-brain axis", th: "ไซโคไบโอติกบนแกนลำไส้-สมอง" }, { en: "Supports a calm, balanced mood", th: "ช่วยให้อารมณ์สงบและสมดุล" }, { en: "Lighter gut, brighter days", th: "ลำไส้เบาสบาย วันสดใส" }],
      actives: [["spotR.a1", "spotR.a1p"], ["spotR.a2", "spotR.a2p"], ["spotR.a3", "spotR.a3p"]],
      launch: { en: "Ships Q2 2027", th: "เริ่มส่งไตรมาส 2 ปี 2027" }
    },
    radiance: {
      name: "Skin Radiance", image: "assets/img/product-radiance.png", accent: "radiance",
      kicker: "cardS.kicker", desc: "cardS.desc",
      chips: [{ t: "TCK33 · TCK53 · TCK77" }, { k: "chip.biotin", en: "+ Biotin" }, { k: "chip.cfu", en: "30 Bn CFU" }, { k: "flavor.mixedberry", en: "Mixed Berry" }],
      icons: [{ en: "Gut-skin axis", th: "แกนลำไส้-ผิว" }, { en: "Clarity & glow", th: "ใสกระจ่าง & ออร่า" }, { en: "+ Biotin", th: "+ ไบโอติน" }],
      who: { en: "For skin that reflects your gut — dullness, breakouts, or a complexion that needs support from within. Radiance works along the gut-skin axis for clarity and glow.", th: "สำหรับผิวที่สะท้อนสุขภาพลำไส้ — หมองคล้ำ เป็นสิวง่าย หรืออยากให้ผิวได้รับการดูแลจากข้างใน Radiance ทำงานบนแกนลำไส้-ผิว เพื่อความใสกระจ่างและเปล่งประกาย" },
      benefits: [{ en: "Gut-skin axis strains for a clearer complexion", th: "สายพันธุ์แกนลำไส้-ผิวเพื่อผิวใส" }, { en: "Supports hydration & radiance", th: "ช่วยผิวชุ่มชื้นและเปล่งประกาย" }, { en: "With added biotin", th: "เสริมไบโอติน" }],
      actives: [["spotS.a1", "spotS.a1p"], ["spotS.a2", "spotS.a2p"], ["spotS.a3", "spotS.a3p"]],
      launch: { en: "Ships Q4 2028", th: "เริ่มส่งไตรมาส 4 ปี 2028" }
    }
  };

  var ORDER = ["balance", "goodnight", "radiance"];

  /* Each product has its own static page so crawlers and the LINE/Facebook
     share bots — none of which run JavaScript — get a real title,
     description and preview image. The page says which product it is via
     a data-product attribute on <html>. */
  var PAGES = { balance: "balance.html", goodnight: "goodnight.html", radiance: "radiance.html" };

  function currentId() {
    /* The static page wins; ?product= is the fallback for legacy
       product.html?product=… links that may still be shared. */
    var id = (document.documentElement.getAttribute("data-product") || "").toLowerCase();
    if (!PRODUCTS[id]) {
      var m = location.search.match(/[?&]product=([a-z]+)/i);
      id = m ? m[1].toLowerCase() : "balance";
    }
    return PRODUCTS[id] ? id : "balance";
  }

  /* Carry the referral tag across page hops. shell.js rewrites the static
     links; these are built afterwards, so they need it applied here. */
  function withRef(url) {
    var ref = window.rpReferralId;
    return ref ? url + (url.indexOf("?") > -1 ? "&" : "?") + "ref=" + encodeURIComponent(ref) : url;
  }

  function chipText(c) { return c.k ? tk(c.k, c.en) : c.t; }

  function render() {
    var id = currentId(), p = PRODUCTS[id];
    /* A static product page already has a fuller, SEO-written title in its
       HTML — don't overwrite it. Only the legacy ?product= route needs one. */
    if (!document.documentElement.getAttribute("data-product")) {
      document.title = p.name + " | root+";
    }
    $("pdCrumb").textContent = p.name;
    $("pdName").textContent = p.name;
    var img = $("pdImage"); img.src = p.image; img.alt = "root+ " + p.name;
    $("pdStage").setAttribute("data-accent", p.accent);
    $("pdKicker").innerHTML = tk(p.kicker, "");
    $("pdDesc").innerHTML = tk(p.desc, "");
    $("pdLaunch").textContent = tx(p.launch);

    $("pdChips").innerHTML = p.chips.map(function (c) { return '<span class="chip">' + chipText(c) + "</span>"; }).join("");
    $("pdIcons").innerHTML = p.icons.map(function (ic) { return '<span class="pdp__icon">' + tx(ic) + "</span>"; }).join("");

    $("accWho").innerHTML = "<p>" + tx(p.who) + "</p>";
    $("accBenefits").innerHTML = p.benefits.map(function (b) { return "<li>" + tx(b) + "</li>"; }).join("");
    $("accActives").innerHTML = p.actives.map(function (a) {
      return '<div class="pdp__active"><p class="pdp__active-name">' + tk(a[0], "") + '</p><p class="pdp__active-note">' + tk(a[1], "") + "</p></div>";
    }).join("");
    $("accHow").innerHTML = "<p>" + tx(HOWTO) + "</p>";
    $("accQuality").innerHTML = QUALITY.map(function (q) { return "<li>" + tx(q) + "</li>"; }).join("");

    /* CTAs must carry the product, otherwise the founding-list signup
       records product: null and we lose the very thing this page proves
       they were interested in. */
    document.querySelectorAll("[data-cta-waitlist]").forEach(function (a) {
      a.setAttribute("href", withRef("index.html?product=" + id) + "#waitlist");
      if (!a.__ctaBound) {
        a.__ctaBound = true;
        a.addEventListener("click", function () {
          if (window.rpTrack) window.rpTrack("pdp_cta_click", { product: id });
        });
      }
    });

    // other products
    $("pdMore").innerHTML = ORDER.filter(function (x) { return x !== id; }).map(function (x) {
      var q = PRODUCTS[x];
      return '<a class="pdp__morecard" href="' + withRef(PAGES[x]) + '" data-accent="' + q.accent + '">' +
        '<span class="pdp__morecard-media"><img src="' + q.image + '" width="570" height="534" alt="root+ ' + q.name + '" loading="lazy" /></span>' +
        '<span class="pdp__morecard-body"><b>' + q.name + "</b><small>" + tk(q.kicker, "") + "</small></span></a>";
    }).join("");
  }

  /* language toggle (mirrors main.js) + re-render dynamic content */
  function applyLang(next) {
    L = next;
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
    render();
  }
  document.querySelectorAll(".lang__opt").forEach(function (o) {
    o.addEventListener("click", function () { applyLang(o.getAttribute("data-lang")); });
  });

  applyLang(L);

  /* One view event per page load (applyLang re-renders on every toggle,
     so this deliberately sits outside render()). */
  if (window.rpTrack) window.rpTrack("view_product", { product: currentId() });
})();
