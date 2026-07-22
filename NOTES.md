# NOTES.md — ND Toolbox (source of truth)

Read this first, every session (Doctrine §12). This is the repo's running memory:
thesis, settled decisions, project facts, and the roadmap. `CLAUDE.md` holds
repo-specific behavior and points at the Doctrine; this file holds *state*.

## Thesis
A calm, **local-first PWA suite** of neurodivergent "internal-state" tools. Help
a person name what's going on inside — quickly, quietly, on their own device.
Live at **nd-toolbox.pages.dev**. Primary device: **iPad Safari**.

**What it is NOT** (sensitive domain — Doctrine §9, `CLAUDE.md`): not diagnostic,
clinical, or medical; not a mood tracker. Identifying the state is the point;
logging is optional and OFF by default. Emotional data never leaves the device —
no account, no server, no analytics, no third-party runtime.

## Modules (shipped)
- **Feelings** (`/feelings`) — Willcox-lineage feelings wheel. Inside-out
  drill-down, unified landing/node view, typeahead search, and the outside-in
  multi-select ("pick the words that fit → trace inward"), plus optional wheel
  view. Taxonomy is **data, not code** — single source is
  `scripts/build-dataset.mjs`, built to `src/modules/feelings/data/wheel.json`.
- **Interoception** (`/io`) — body check-in. Scan a set of body signals, mark
  where each is, see what the body might be asking for. Same shell, same ethos.

## Architecture (settled)
- **Vanilla JS + Vite**, PWA via `vite-plugin-pwa` (build-time Workbox precache;
  no third-party runtime). `npm run dev|build|preview`.
- **Shell seam** (`src/shell`) owns persistent chrome (masthead, About,
  Settings), the hash router, the settings service, and the immutable backup
  format. Modules `register()` into a `ModuleRegistry` and render into one shared
  content root — a second module slots in with zero changes to the first (proven
  by Interoception).
- **Module contract:** `{ id, title, tagline, basePath, mark/icon, mount(ctx),
  serialize?(), deserialize?() }`. Store is namespaced per module; the backup
  envelope holds per-module slices.
- **Storage:** settings in localStorage (shell-global); module logs in IndexedDB
  via `idb-keyval`. On-device only.
- **Backup envelope** (`nd-toolbox-backup`, schemaVersion 1): immutable,
  timestamped filename, never overwritten; **import = seed a fresh start, not
  merge**. App updates never touch user data.

## Accessibility (hard gate — Doctrine §4)
- Computed contrast gate: `scripts/check-contrast.mjs` (`npm run a11y:contrast`),
  wired into `npm run build` and CI (`.github/workflows/a11y.yml`, every push +
  PR). 66 fg/bg pairs across 6 themes; exits non-zero on any failure; has a drift
  guard for new theme tokens. See `ACCESSIBILITY.md` (the append-only register).
- Findings + non-hue encodings + the "needs Noah's hands" items all live in
  `ACCESSIBILITY.md`. Tightest current margin: light-theme accent at 4.80:1.

## Branches & releases (Doctrine §7)
- `staging` and `main` only. Product changes land on `staging` for Noah's
  on-device pass, then merge to `main` on his explicit "promote". `main` deploys
  to production; `staging` to a preview URL. Docs-only + tooling changes may skip
  the staging gate.
- Numbering `version.capability.iteration`; SW cache stamp + changelog top entry
  move together. Current app version: **0.2.0**.
- Note: the web-task harness keeps designating a `claude/*` branch. Per Doctrine
  §11 the standing policy is staging/main; when a session is pinned to a `claude/*`
  branch by its task config, treat what lands there as a **staging candidate
  awaiting Noah's on-device pass** — it is never production until Noah promotes it.

## Project facts / decisions log
- **2026-07 — Licensing:** relicensed MIT → PolyForm Noncommercial 1.0.0. MIT
  copies already released stay MIT for those copies.
- **2026-07 — Suite shape:** shell + registry landed; Interoception added as the
  second module (v0.2.0), validating the seam.
- **2026-07 — Contrast gate + registers:** added the computed contrast CI gate,
  `ACCESSIBILITY.md`, and this `NOTES.md`. Tooling/docs — skips the staging gate.

## Roadmap / open loops
- **Runtime a11y audit:** automate axe-core + custom checks over the built pages
  in both themes (roles, names, live regions, reflow at 320px). Only the static
  contrast gate is automated today — this is the next accessibility increment.
- **Screen-reader passes:** VoiceOver (iPad/iPhone) + NVDA — needs Noah's hardware.
- **Repo metadata** (Doctrine §10, manual): description / website / topics /
  social-preview are GitHub-UI steps the session token cannot set. When touched,
  list exact values and have Noah confirm each.
