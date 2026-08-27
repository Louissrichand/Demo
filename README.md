# Root+ Website

Landing page for the Root+ brand.

## Stack
- **Static site** — plain HTML / CSS / JS (no build step)
- **Source control** — Git + GitHub
- **Hosting** — GitHub Pages at https://louissrichand.github.io/Demo/ (auto-deploys ~1 min after push to `main`). Cloudflare Pages + custom domain is the eventual production plan.
- **Backend** — Supabase (accounts, profiles, founding list)

## Structure
```
.
├── index.html                    # main landing page
├── balance.html / goodnight.html / radiance.html   # product pages (own SEO + OG card)
├── product.html                  # redirect for legacy ?product= links
├── privacy.html                  # PDPA privacy policy (TH/EN)
├── profile.html                  # edit-profile page (auth required)
├── admin.html                    # local viewer for localStorage signups
├── 404.html                      # not-found page
├── robots.txt / sitemap.xml      # search engines
├── assets/
│   ├── css/styles.css
│   ├── img/
│   └── js/
│       ├── config.js             # <- the one file to edit for IDs / links / flags
│       ├── shell.js              # shared chrome: mobile menu, mega-menu a11y, config links
│       ├── analytics.js          # GA4 / GTM / Meta / Clarity / TikTok loader
│       ├── i18n.js               # Thai dictionary
│       ├── main.js               # page interactions + founding-list capture
│       ├── product.js            # product page content (data-product on <html>)
│       ├── auth.js               # Supabase Auth modal + account chip
│       └── profile.js
└── supabase-*.sql                # run these in Supabase -> SQL Editor
```

## Setup checklist

Everything configurable lives in **`assets/js/config.js`**. Nothing there is secret —
it ships to the browser. Never put a Supabase `service_role` key in it.

### 1. Database (run once each, in Supabase → SQL Editor)
| File | Creates |
|---|---|
| `supabase-waitlist-setup.sql` | `public.waitlist` — the founding-list form — done |
| `supabase-referral-setup.sql` | `referred_by` on `waitlist` + `profiles` — referral credit — done |
| `supabase-events-setup.sql` | `public.events` — first-party analytics — done |
| `supabase-auth-setup.sql` | `public.profiles` + auto-create trigger — done |
| `supabase-storage-setup.sql` | `avatars` storage bucket for profile photos **(not yet run)** |
| `supabase-setup.sql` | `public.members` — legacy anonymous lead form, superseded by accounts |

Until `supabase-events-setup.sql` is run, every `rpTrack` call still fires but its
insert 404s (harmless, caught, invisible to visitors) — so no funnel data is kept.


### 2. Analytics
Paste an ID into `config.js` and that tool switches on; leave it `""` and the
script never loads (no cookie, no third-party request):

```js
ga4Id: "G-XXXXXXXXXX",        // Google Analytics 4
metaPixelId: "1234567890",    // Meta / Facebook Pixel
clarityId: "abcdefghij",      // Microsoft Clarity — free heatmaps + replay
```

Events fired: `waitlist_submit`, `waitlist_duplicate`, `waitlist_error`, `view_product`,
`pdp_cta_click`, `referral_copy`, `referral_share`,
`notify_me_click`, `signup_complete`, `signin_complete`, `oauth_start`, `social_click`.
With no tool connected they log to the console, so the funnel stays verifiable.

### 3. Social links
Footer icons render only for networks with a URL in `config.social` — so the
footer can never show a dead link. Add the LINE OA URL as soon as it exists.

### 4. Social login
`config.oauth.google` / `.facebook` are `false`, so those buttons stay hidden.
Flip one to `true` only **after** enabling that provider in Supabase
(see `AUTH-SETUP.md`) — otherwise the button errors on click.

## Workflow
1. Edit files locally.
2. `git add . && git commit -m "message"`
3. `git push` → GitHub Pages republishes.

## Local preview
`./serve.ps1` → http://localhost:8087
(Opening `index.html` directly works too, but Supabase auth needs an http origin.)

## Open items before a real launch
- Fill the `[registered company name]` / address / DPO placeholders in `privacy.html`, then get legal review.
- Cross-check every health claim against `Root_Plus_Marketing_Claims_TCI_V3.xlsx` for Thai FDA compliance.
- Pricing is settled: **฿890 per 15-sachet box (~฿59/day)**, confirmed 2026-08-25 and consistent across every page, the Thai copy, the FAQ and the Product JSON-LD. The ฿1,790 / 30-sachet figure in `RootPlus_Marketing_Plan_2026.xlsx` is superseded.
- **root+ does not sell.** Every buy action leaves for the root+ page on srichand.com; `config.shopUrl` is the single switch (`"shop.html"` today, `"https://srichand.com/root-plus/"` on launch day). The `shop*.html` pages are a design spec for the team building that page — the cart is a mockup that takes no order.
- Canonical product pages are **`balance.html` / `goodnight.html`** (confirmed 2026-08-25). The `shop*.html` pages are a design preview of the shop Srichand will build at srichand.com and carry `noindex,follow`; they are not in `sitemap.xml`.
- Decide whether the 2-box / 3-box tiers on the shop pages should carry a discount — they are currently exact multiples (฿1,780 / ฿2,670), so the selector offers no reason to size up.
- Delete the test rows: `claude-e2e-test@srichand.co.th` in Auth → Users, and `source='test'` in `members`.
- Add a Terms of Service page.
