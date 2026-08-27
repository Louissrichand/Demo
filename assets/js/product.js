/* ============================================================
   root+ — Product detail page (data-driven by ?product=)
   Pre-launch: CTA is the founding list, not a real cart.
   Product facts align with the CLAIMS Probiotic Presentation (BOD 05/2026).
   ============================================================ */
(function () {
  "use strict";
  var TH = (window.I18N && window.I18N.th) || {};
  function $(id) { return document.getElementById(id); }
  var L = "en";
  try { L = localStorage.getItem("rootplus-lang") || "en"; } catch (e) {}

  /* English source strings for the shared keys (Thai comes from i18n.js) */
  var EN = {
    "cardB.kicker": "Gut Health Synbiotic",
    "cardB.desc": "The gut-health synbiotic — 6 clinically-studied strains at 31 billion CFU that restore gut balance, reinforce the gut barrier, and support everyday immunity and metabolism.",
    "cardR.kicker": "Sleep & Mood Synbiotic",
    "cardR.desc": "Better sleep starts in the gut. Psychobiotics, patented Delight TS™ and magnesium work along the gut-brain axis for calmer mood and deeper rest — 21 billion CFU.",
    "spotB.a1": "TCI604 <span>B. animalis subsp. lactis · full dose</span>",
    "spotB.a1p": "A gut-balance strain that supports a calmer gut-inflammation response and a healthier barrier.",
    "spotB.a2": "TCI803 <span>Weizmannia coagulans · full dose</span>",
    "spotB.a2p": "Helps keep H. pylori in balance (−43%, C-13 breath test) for everyday stomach comfort.",
    "spotB.a3": "TCI-711 <span>Weizmannia coagulans · full dose</span>",
    "spotB.a3p": "Backs the gut barrier and short-chain fatty-acid production along the gut-metabolic axis.",
    "spotR.a1": "TCI973 <span>Psychobiotics · full dose</span>",
    "spotR.a1p": "A gut-mood-sleep strain that lowers the stress index (−27.9%) and supports calming anandamide & serotonin pathways.",
    "spotR.a2": "Delight TS™ <span>Passionflower + FOS + inulin</span>",
    "spotR.a2p": "Patented prebiotic (Gold Medal, 2024 Seoul International Invention Fair) — helps you fall asleep faster and lengthen REM sleep.",
    "spotR.a3": "Magnesium <span>100 mg</span>",
    "spotR.a3p": "Supports GABA-driven relaxation and a calm nervous system for restful sleep."
  };
  function tk(key) { return (L === "th" && TH[key] != null) ? TH[key] : (EN[key] != null ? EN[key] : ""); } // by i18n key
  function tx(pair) { return pair ? ((L === "th" && pair.th != null) ? pair.th : pair.en) : ""; } // {en,th}

  var HOWTO = {
    en: "Tear one 3g sachet and pour it straight onto your tongue — no water, no mixing. Once a day, any time. Prebiotic + probiotic + postbiotic in every sachet.",
    th: "ฉีกซอง 3 กรัม เทลงลิ้นได้เลย ไม่ต้องผสม ไม่ต้องใช้น้ำ วันละครั้ง เมื่อไรก็ได้ — มีทั้งพรีไบโอติก โพรไบโอติก และโพสต์ไบโอติกในทุกซอง"
  };
  var QUALITY = [
    { en: "Clinically-studied strains at full, disclosed doses — no proprietary blends", th: "สายพันธุ์ที่มีงานวิจัยรองรับ ให้เต็มโดส เปิดเผยครบทุกตัว ไม่มีสูตรลับ" },
    { en: "CFU count guaranteed through end of shelf life", th: "รับประกันปริมาณ CFU จนหมดอายุ" },
    { en: "Third-party tested with a Certificate of Analysis (COA)", th: "ตรวจสอบโดยแล็บอิสระ พร้อมใบ COA" },
    { en: "Vegan & Non-GMO · 3g direct-to-mouth sachet", th: "วีแกน & ปลอด GMO · ซอง 3 กรัม ทานตรงเข้าปาก" }
  ];

  var PRODUCTS = {
    balance: {
      name: "Balance", image: "assets/img/product-balance.png", accent: "balance",
      kicker: "cardB.kicker", desc: "cardB.desc",
      chips: [{ t: "6 strains · 31B CFU" }, { t: "+ Inulin / FOS" }, { k: "flavor.yogurt", en: "Yogurt" }],
      icons: [{ en: "Gut balance", th: "สมดุลลำไส้" }, { en: "Gut barrier", th: "เกราะลำไส้" }, { en: "Immunity & metabolism", th: "ภูมิ & เผาผลาญ" }],
      who: { en: "For anyone who wants to fix digestion at the source — bloating, irregularity, stomach discomfort, or a gut that just feels 'off'. Balance starts in the stomach and rebuilds microbiome balance from there.", th: "สำหรับคนที่อยากแก้ปัญหาการย่อยที่ต้นเหตุ — ท้องอืด ขับถ่ายไม่ปกติ ไม่สบายท้อง หรือรู้สึกลำไส้ไม่โอเค Balance เริ่มดูแลตั้งแต่กระเพาะ แล้วปรับสมดุลจุลินทรีย์จากตรงนั้น" },
      benefits: [
        { en: "Restores gut balance with 6 clinically-studied strains (31B CFU)", th: "ปรับสมดุลลำไส้ด้วย 6 สายพันธุ์ที่มีงานวิจัยรองรับ (31 พันล้าน CFU)" },
        { en: "Reinforces the gut barrier — tight-junction & mucus support", th: "เสริมเกราะลำไส้ — ดูแล tight junction และเมือกเคลือบลำไส้" },
        { en: "Helps keep H. pylori in check for stomach comfort", th: "ช่วยคุมสมดุล H. pylori เพื่อความสบายกระเพาะ" },
        { en: "Everyday immune support", th: "เสริมภูมิคุ้มกันในทุกวัน" },
        { en: "Supports metabolic balance along the gut-liver axis", th: "สนับสนุนสมดุลการเผาผลาญบนแกนลำไส้-ตับ" }
      ],
      actives: [["spotB.a1", "spotB.a1p"], ["spotB.a2", "spotB.a2p"], ["spotB.a3", "spotB.a3p"]],
      launch: { en: "Ships Q2 2027", th: "เริ่มส่งไตรมาส 2 ปี 2027" }
    },
    goodnight: {
      name: "Goodnight", image: "assets/img/product-refresh.png", accent: "refresh",
      kicker: "cardR.kicker", desc: "cardR.desc",
      chips: [{ t: "Psychobiotics · 21B CFU" }, { t: "Delight TS™" }, { t: "+ Magnesium" }, { k: "flavor.grape", en: "Grape" }],
      icons: [{ en: "Gut-brain axis", th: "แกนลำไส้-สมอง" }, { en: "Calm & mood", th: "ผ่อนคลาย & อารมณ์" }, { en: "Deeper sleep", th: "หลับลึกขึ้น" }],
      who: { en: "For busy minds and restless nights — when stress, mood and sleep are all tangled together. Goodnight works along the gut-brain axis to help you unwind and rest more deeply.", th: "สำหรับคนที่หัวไม่หยุดคิดและนอนไม่ค่อยหลับ — เมื่อความเครียด อารมณ์ และการนอนพันกันไปหมด Goodnight ทำงานบนแกนลำไส้-สมอง ช่วยให้ผ่อนคลายและหลับลึกขึ้น" },
      benefits: [
        { en: "Calmer mood — lower stress and restlessness", th: "อารมณ์สงบขึ้น — ลดความเครียดและความกระวนกระวาย" },
        { en: "Fall asleep faster and lengthen REM sleep", th: "หลับเร็วขึ้นและเพิ่มช่วงหลับฝัน (REM)" },
        { en: "Supports serotonin & melatonin along the gut-brain axis", th: "สนับสนุนเซโรโทนินและเมลาโทนินบนแกนลำไส้-สมอง" },
        { en: "Magnesium for everyday relaxation", th: "แมกนีเซียมเพื่อการผ่อนคลายในทุกวัน" },
        { en: "21B CFU psychobiotics with patented Delight TS™", th: "ไซโคไบโอติก 21 พันล้าน CFU พร้อม Delight TS™ ที่จดสิทธิบัตร" }
      ],
      actives: [["spotR.a1", "spotR.a1p"], ["spotR.a2", "spotR.a2p"], ["spotR.a3", "spotR.a3p"]],
      launch: { en: "Ships Q2 2027", th: "เริ่มส่งไตรมาส 2 ปี 2027" }
    }
  };

  var ORDER = ["balance", "goodnight"];

  /* Each product has its own static page so crawlers and the LINE/Facebook
     share bots — none of which run JavaScript — get a real title,
     description and preview image. The page says which product it is via
     a data-product attribute on <html>. */
  var PAGES = { balance: "balance.html", goodnight: "goodnight.html" };

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
