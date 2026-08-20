/* ============================================================
   root+ runtime config
   The one file to edit when IDs / links / feature flags change.
   Everything here is PUBLIC (it ships to the browser) — never put a
   Supabase service_role key or any private secret in this file.
   ============================================================ */
window.ROOTPLUS = {

  /* --- Supabase (accounts + founding list) ---------------------
     Get these from Supabase → Project Settings → API.
     The anon key is safe to expose — it's protected by the
     insert-only Row Level Security policies in the *.sql files.
     Leave blank to fall back to localStorage-only demo mode.      */
  supabaseUrl: "https://vumqbxlorsemfvrxxkmj.supabase.co",   // ROOT+ CRM
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bXFieGxvcnNlbWZ2cnh4a21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMDM2ODYsImV4cCI6MjEwMjc3OTY4Nn0.o3SiOSdC_6LPl9HAMCClF0CsaVd7TmXOHnlV-zY25yk",    // anon public key

  /* --- Analytics ----------------------------------------------
     Paste an ID to switch a tool on; leave "" and it never loads.
     ga4Id         Google Analytics 4    "G-XXXXXXXXXX"
     gtmId         Google Tag Manager    "GTM-XXXXXXX"  (use instead of ga4Id if you prefer GTM)
     metaPixelId   Meta / Facebook Pixel "1234567890123456"
     clarityId     Microsoft Clarity     "abcdefghij"   (free heatmaps + session replay)
     tiktokPixelId TikTok Pixel          "CXXXXXXXXXXXXXXXXXXX"                */
  ga4Id: "",
  gtmId: "",
  metaPixelId: "",
  clarityId: "",
  tiktokPixelId: "",

  /* --- Social / contact ---------------------------------------
     Only the ones with a URL are rendered. Blank = icon hidden,
     so there are never dead "#" links in the footer.              */
  social: {
    instagram: "",                       // e.g. "https://www.instagram.com/rootplus.th/"
    facebook: "",                        // e.g. "https://www.facebook.com/rootplus.th"
    tiktok: "",                          // e.g. "https://www.tiktok.com/@rootplus.th"
    line: "",                            // e.g. "https://lin.ee/xxxxxxx"  (LINE OA)
    youtube: ""
  },
  contactEmail: "itd@srichand.co.th",    // change to a brand address before launch
  locationUrl: "",                       // Google Maps link; blank = plain text, not a link

  /* --- Feature flags ------------------------------------------
     Turn a social login on only AFTER you've enabled that provider
     in Supabase → Authentication → Providers. Buttons for disabled
     providers are hidden, so nobody clicks something that errors.  */
  oauth: {
    google: false,                       // set true after AUTH-SETUP.md step 4
    facebook: false                      // set true after AUTH-SETUP.md step 5
  },

  /* Show the "Shop the range" link to srichand.com in the header.
     root+ isn't on sale yet, so this sends people to the parent
     brand — false keeps visitors focused on the founding list.    */
  showShopLink: false
};
