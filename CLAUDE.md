# CLAUDE.md — ND Toolbox

> **Inherits the [Universal App Doctrine](https://github.com/njefferson/noahjefferson/blob/main/DOCTRINE.md)**
> (canonical copy: `DOCTRINE.md` in the noahjefferson hub repo). It is the single
> source of truth for the rules shared across all of Noah's apps: product values,
> taste, accessibility, honesty, verification, release discipline & taxonomy,
> licensing (PolyForm Noncommercial), privacy, the permanent **AskUserQuestion
> ban** (§0), and the **repo-metadata confirm rule** (§10). **Where anything
> below overlaps the Doctrine, the Doctrine wins.** This file keeps only what is
> specific to this repo.

## What this repo is
A calm, **local-first PWA** suite of neurodivergent "internal-state" tools. The
first module is the **Feelings Wheel** — narrow from a few core feelings out to a
precise word, quickly and quietly. Live at **nd-toolbox.pages.dev**.

## SENSITIVE DOMAIN — read before touching anything
This app helps people name emotional states. That raises the bar on two doctrine
rules:
- **It is NOT a diagnostic, clinical, or medical tool, and NOT a mood tracker.**
  Never let copy, framing, or a new feature drift toward diagnosis or treatment.
  Identifying the feeling is the point; logging is optional and OFF by default.
- **Emotional data never leaves the device.** No account, no server, no
  analytics, no third-party runtime. Export writes an immutable, timestamped
  backup; import seeds a fresh start; app updates never touch user data. Any
  change that would send state off-device is a hard stop — surface it, don't ship it.
- Accessibility here is not optional polish: the audience includes people who
  need low-stimulation layout, reduced motion, high contrast, text scaling, and
  full keyboard / screen-reader support. Meaning is never carried by colour alone
  (Doctrine §4).

## Stack (differs from the map/photo apps)
- **Vanilla JS + Vite** (a real build step), offline via `vite-plugin-pwa`
  (Workbox precache) — build-time only, no third-party code at runtime.
  `npm run dev` / `npm run build` / `npm run preview`.
- **Shell seam:** `src/shell` owns persistent chrome (masthead, About, Settings),
  the router, the settings service, and the immutable backup format. Modules
  register into a `ModuleRegistry` and render into a shared content root — a
  second module slots in without changing the first.
- **Feelings module:** `src/modules/feelings` — taxonomy loader + validation,
  drill-down / landing / search views, outside-in multi-select.
- The feelings taxonomy is **data, not code** — edit `scripts/build-dataset.mjs`
  (the single source) and rebuild `src/modules/feelings/data/wheel.json`.
- Regenerate assets when sources change: `npm run icons`, `node scripts/build-dataset.mjs`.

## Branches & releases
`staging` and `main` (Doctrine §7). Product changes land on `staging` for Noah's
on-device pass, then merge to `main` on his explicit go. `main` deploys to
production; docs-only changes may skip the gate. Follow the Doctrine's release
taxonomy and `version.capability.iteration` numbering; the SW cache stamp stays
in sync with the release.

## Licensing
PolyForm Noncommercial 1.0.0 (`LICENSE`), like the sibling apps — nobody sells
Noah's work. (Relicensed off MIT 2026-07; MIT copies already released stay MIT
for those copies.)
