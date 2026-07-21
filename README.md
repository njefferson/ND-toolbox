# ND Toolbox — Feelings

A calm, **local-first PWA** that helps you find the precise word for what you
feel — by narrowing from a few core feelings out to a specific one, by checking
the words that ring true and tracing them back, or by searching. Built to be
quick and quiet: usually under ten seconds from opening it to a named feeling.

**Live:** https://nd-toolbox.pages.dev

This is the first module of a small suite of neurodivergent "internal-state"
tools. Not a diagnostic or clinical tool, and not a mood tracker — identifying
the feeling is the point; logging is optional and off by default.

## Principles

- **Local-first.** No account, no server, no analytics, no third-party runtime.
  All data stays on the device.
- **Immutable backups.** Export writes a timestamped file; nothing is ever
  overwritten. Import seeds a fresh start. App updates never touch user data.
- **Accessibility first.** Match-system / dark / calm-monochrome themes, text
  scaling, high contrast, reduced motion, low-stimulation layout, full keyboard
  and screen-reader support. Meaning is never carried by colour alone.

## Install (as an app)

- **iPad / iPhone (Safari):** Share → **Add to Home Screen**. Runs full-screen
  and works offline.
- **Android (Chrome):** ⋮ menu → **Install app**.
- **Desktop (Chrome / Edge):** install icon in the address bar, or ⋮ → **Install**.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
```

Regenerate generated assets when their sources change:

```bash
npm run icons                    # PWA icons  (scripts/generate-icons.mjs)
node scripts/build-dataset.mjs   # taxonomy    (scripts/build-dataset.mjs → wheel.json)
```

The feelings taxonomy is **data, not code** — edit `scripts/build-dataset.mjs`
(the single source of truth) and rebuild `src/modules/feelings/data/wheel.json`.

## Architecture

- **Vanilla JS + Vite.** No framework runtime. Offline via `vite-plugin-pwa`
  (Workbox precache) — a build-time tool, no third-party code at runtime.
- **Shell seam.** `src/shell` owns persistent chrome (masthead, About,
  Settings), the router, the settings service, and the immutable backup format.
  Modules register into a `ModuleRegistry` and render into a shared content
  root. A second module slots in with no changes to the first.
- **Feelings module.** `src/modules/feelings` — taxonomy loader + validation,
  drill-down / landing / search views, and the outside-in multi-select path.

See [`docs/PLAN.md`](docs/PLAN.md) for the full plan.

## Deployment (Cloudflare Pages)

Every push to the dev branch (and, later, `main`) triggers
`.github/workflows/deploy.yml`, which builds and deploys `dist/` to Cloudflare
Pages via `wrangler`.

**Required repository secrets:**

| Secret | What it is |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with the **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account id |

The Pages project (`nd-toolbox`) is auto-created on the first run, with its
**production branch** set to whichever branch first deployed — so the canonical
`nd-toolbox.pages.dev` URL serves it. To finish setup in the Cloudflare
dashboard:

1. **Custom domain** (optional): Pages → the project → *Custom domains* → add
   your domain and follow the DNS steps.
2. **Production branch** (when you adopt a real `main`): Pages → *Settings* →
   *Builds & deployments* → set the production branch to `main`.

No build configuration is needed in the dashboard — the GitHub Action builds
and uploads `dist/` directly.

## Design assets

**Social share tile** — drop a `1200×630` PNG at `public/social/og-tile.png`
(referenced by the Open Graph / Twitter tags in `index.html`). A prompt for
generating the icon background + social tile art lives in
[`docs/asset-prompt.md`](docs/asset-prompt.md).

## Privacy

Everything lives on your device. There is no account, no server, and no
analytics. A backup is a file you save yourself (on iOS, via the share sheet to
Files / iCloud). Nothing is ever sent anywhere.

## License

[MIT](LICENSE).
