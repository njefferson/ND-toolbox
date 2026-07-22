# ND Toolbox

A calm, **local-first PWA** — a small suite of quiet neurodivergent
"internal-state" tools for checking in with yourself. Today it has two:

- **Feelings** — find the precise word for what you feel, by narrowing from a
  few core feelings, by checking the words that ring true and tracing them back,
  or by searching.
- **Body check-in** (interoception) — notice what your body is telling you
  (hunger, thirst, tiredness, tension, overstimulation…) and what it might need.

**Live:** https://nd-toolbox.pages.dev

Not diagnostic or clinical tools, and not mood trackers — noticing is the point;
logging is optional and off by default. Tools share one shell (settings,
accessibility, immutable backup), so a new tool slots in without rework.

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

## Branches & deployment (Cloudflare Pages)

Branch model:

| Branch | Deploys to |
| --- | --- |
| `main` | **production** — https://nd-toolbox.pages.dev |
| `staging` | **preview** — https://staging.nd-toolbox.pages.dev |

Development happens on `staging`; promote to `main` when ready. Each push
triggers `.github/workflows/deploy.yml`, which builds and deploys `dist/` to
Cloudflare Pages via `wrangler`. The workflow also ensures the project's
production branch is `main`.

**Required repository secrets:**

| Secret | What it is |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with the **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account id |

**Optional:** add a custom domain in the Cloudflare dashboard (Pages → the
project → *Custom domains*). No build configuration is needed there — the
GitHub Action builds and uploads `dist/` directly.

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

[PolyForm Noncommercial 1.0.0](LICENSE) — noncommercial use is permitted; the
author retains commercial rights. (Relicensed off MIT in 2026-07; copies already
released under MIT stay MIT for those copies.)
