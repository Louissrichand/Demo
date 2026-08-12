# Root+ Website

Landing page for the Root+ brand.

## Stack
- **Static site** — plain HTML / CSS / JS (no build step)
- **Source control** — Git + GitHub
- **Hosting** — Cloudflare Pages (auto-deploy on push to `main`)
- **Domain** — managed via Cloudflare

## Structure
```
.
├── index.html          # main landing page
├── assets/
│   ├── css/styles.css  # styles
│   └── js/main.js      # scripts
├── .gitignore
└── README.md
```

## Workflow
1. Edit files locally.
2. `git add . && git commit -m "message"`
3. `git push` → Cloudflare Pages auto-publishes.

## Local preview
Just open `index.html` in a browser — no server needed.
