# Feelings Wheel PWA — Plan

> First module of **ND Toolbox**, a local-first suite of neurodivergent
> "internal-state" tools. This document is the authoritative build plan.
> Status: approved. Primary target device: **iPad Safari**.

## 0. What we're building

A local-first, no-login PWA that helps a user find the **precise word** for a
feeling by drilling through the Feelings Wheel — supporting **inside-out**,
**outside-in**, and **search** — usable in under ten seconds, accessibility
first, with optional on-device logging. Built so a second module (interoception)
can slot into the same shell without rework.

**Non-goals:** not diagnostic/clinical, no accounts, no server, no analytics, no
notifications (deferred). Identification is the core; logging is secondary.

## 1. Taxonomy + data schema

**Willcox (1982) lineage — 6 core → 3 rings, ~130 curated landing words**, with
ring-3 collapsible in settings.

Cores: **Joyful · Powerful · Peaceful · Sad · Mad · Scared**.

Chosen over Ekman/Junto (threat-heavy; only negatives get granularity) because
this set gives real depth to *agency* and *calm*. Geneva Emotion Wheel rejected:
it is a rating instrument, not a word-finder. The word list is curated and cited
(Willcox / Roberts expansion); any gap-fill words are flagged in `provenance`.

Stored as versioned static JSON, never hardcoded in UI:

```jsonc
// node
{
  "id": "isolated",          // stable slug, never reused
  "label": "Isolated",
  "coreId": "sad",           // which of the 6 it rolls up to
  "parentId": "lonely",      // null for core nodes
  "depth": 2,                // 0=core, 1=ring2, 2=ring3 (landing)
  "aliases": ["alone", "cut off"],  // fuels search; never shown as the word
  "definition": "A short, plain-language sentence.",
  "neighbors": ["lonely", "abandoned", "distant"],
  "guidance": { "pointsTo": "…", "oneOption": "…" }, // optional, may be null
  "colorToken": "core.sad",  // token, not hex — theming/monochrome swap
  "provenance": "willcox-1982 | roberts-expansion"
}
// dataset
{ "datasetId": "...", "datasetVersion": 1, "coreOrder": ["joyful", "..."], "nodes": [] }
```

## 2. Screen flow

- **Home** — always-visible search; "Start from a core feeling," "Pick the words
  that fit," recent landing.
- **Inside-out** — 6 cores → ring-2 → ring-3 → Landing. Persistent breadcrumb,
  lossless back.
- **Outside-in** — multi-select list of specific words + a selected tray → "show
  me where these point" → core cluster summary (counts, never color-only) → drill
  to a landing or log the set. This is the alexithymia method; first-class.
- **Search** — typeahead over label + aliases → node with breadcrumb + neighbors.
- **Landing** — word · plain definition · path · neighbor chips · **collapsed**
  optional "points to / one option" panel (non-clinical, non-moralizing, never
  blocks) · actions: explore neighbors, back to core, log (if enabled).

## 3. Data model + immutable backup

- **Settings (included in backups):** theme(color|mono), reducedMotion, textScale,
  contrast, density, navMode(columns|wheel), wordDepth(2|3), loggingEnabled,
  datasetVersion.
- **Log entry (opt-in, off by default):**
  `{ id, ts, nodeId, label, path, note?, selectedSet?, appVersion, datasetVersion }`
  — outside-in selection *sets* captured when logged.
- **Storage:** IndexedDB (logs) + localStorage (settings), on-device only.
- **Backup/export envelope** — shared across the suite, immutable, timestamped
  filenames, never overwritten; **import = seed a fresh start, not merge**:

```jsonc
{
  "format": "nd-toolbox-backup",
  "schemaVersion": 1,
  "exportedAt": "<ISO>",
  "suite": { "version": 1 },
  "modules": { "feelings": { "datasetVersion": 1, "settings": {}, "logs": [] } }
}
```

## 4. iPad Safari reality (primary target)

- **No File System Access API on iOS** → Export hands a timestamped JSON to the
  iOS **share sheet** (save to Files → iCloud Drive); Import picks one back. This
  *is* the backup + cross-device move.
- **Add to Home Screen** reduces iOS storage eviction; Export is the real
  durability guarantee. Export is one tap and gently surfaced — never nags.
- Desktop-Chromium folder-pointer is a "someday" enhancement, not built now.

## 5. Architecture + suite seam

- **Shell:** routing, Settings/A11y/Theme providers, StorageService, immutable
  BackupService, **ModuleRegistry**.
- **Module contract:** `{ id, name, icon, mount(), dataSchema, storeSlice,
  serialize(), deserialize() }`; store namespaced per module; backup holds
  per-module slices.
- **Feelings module:** taxonomy loader, drill-down/path engine, views
  (Home/InsideOut/OutsideIn/Search/Landing), logging.
- **Seam:** build only Feelings; interoception later calls `registry.register(...)`
  and adds `modules.interoception` — zero changes to Feelings.

## 6. Accessibility checklist

- Reduced-motion (system `prefers-reduced-motion` + manual toggle).
- Calm monochrome mode; cores stay distinct by **label + icon/shape**, never
  color alone.
- Text-size scale; high-contrast option (AA/AAA verified); low-stimulation density.
- Full keyboard nav: roving tabindex, focus moves on drill, visible focus rings.
- Semantic HTML + ARIA; `aria-live` on landing + selection-tray changes.
- Targets ≥44px; respects OS font scaling; tested with VoiceOver (+ NVDA).

## 7. Stack + deploy

- **Vanilla JS + Vite**, static JSON dataset, `idb-keyval`, service worker via
  `vite-plugin-pwa` (build-time Workbox; no analytics, no third-party runtime).
  Touch-friendly SVG wheel for the optional view.
- **Cloudflare Pages:** GitHub repo → build `npm run build` → output `dist`, SPA
  fallback + PWA headers; dev page = branch/preview deploy.

## 8. Build sequence

1. Repo scaffold + Vite + PWA manifest/service worker + Cloudflare Pages preview.
2. Dataset JSON (curated ~130 words + definitions) + loader/schema validation.
3. Shell: providers, storage, immutable backup/export-import, module registry.
4. Feelings columns drill-down (inside-out) + landing + search.
5. Outside-in multi-select + cluster.
6. Accessibility pass + monochrome/reduced-motion/contrast/text-size.
7. Optional logging + history view.
8. Optional wheel view.
