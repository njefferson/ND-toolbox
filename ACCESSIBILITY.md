# ACCESSIBILITY.md — ND Toolbox

The append-only accessibility register for this repo (Doctrine §4, §12). Accessibility
is a **hard gate** here, not polish: the audience includes people who need
low-stimulation layout, reduced motion, high contrast, text scaling, and full
keyboard / screen-reader support.

**Rules for this file (Doctrine §4):**
- Append only. Rows are never silently deleted or rewritten; a fixed finding keeps
  its original release number and gains a "fixed in" note.
- Every new or changed visual encoding STATES its non-hue channel before it ships.
- Contrast is **computed, never eyeballed**. New foreground/background pairs are
  added to the gate in the SAME commit that introduces them.
- Separate what was VERIFIED from what still NEEDS NOAH'S HANDS (Doctrine §5).

---

## The contrast gate (computed)

`scripts/check-contrast.mjs` mirrors the color tokens in `src/styles/theme.css`,
resolves each theme's cascade the way the browser would, and checks every
meaning-bearing foreground/background pair against WCAG 2.1 minima
(text 4.5:1 · large/non-text 3.0:1). It **exits non-zero on any failure**, so it
blocks both the build (`npm run build` runs it first) and CI
(`.github/workflows/a11y.yml`, on every push and PR).

Run it directly: `npm run a11y:contrast`

It covers six resolved themes — light, dark, calm-monochrome, and each of those
combined with high-contrast — across 11 pairs each (66 checks): body/muted/link
text on page, card, and hover surfaces; the inverse button label (`--bg` on
`--accent`); the focus ring; and the active-component border. It also carries a
**drift guard**: if `theme.css` declares a color token the gate never resolved,
the gate fails, forcing new pairs into the same commit.

### Non-hue encodings (meaning must survive grayscale — Doctrine §4)
The six `--core-*` hues are **decorative**. Meaning is always carried by a second
channel, so a grayscale render loses nothing:
- Core feelings — carried by **label + glyph** (and, in monochrome, hues collapse
  to a single grey by design; shape + label carry all).
- Cluster proportions (outside-in) — carried by an **explicit count** ("3 of 5")
  alongside the bar, and by the bar's **length**, never its hue.
- Card identity — carried by the **word/label and its position**, with the core
  hue only a decorative left border.
- Active/selected controls — carried by **`aria-pressed` / `:checked` state, a
  border-width change, and text weight**, not hue alone.

---

## Register

Format: `[release] — area — finding — status`. Append new rows at the top.

- **[0.2.0] — Contrast gate — All 66 computed pairs meet WCAG AA across all six
  themes. — VERIFIED (computed).** Tightest margin is the light-theme accent used
  as link text and as the button fill: `#3E6E97` ↔ `#F5F1E8` = **4.80:1** (AA is
  4.5). It passes, but has little headroom — any future darkening of the light
  background or lightening of the accent must re-run the gate. Dark, mono, and all
  high-contrast variants have generous margins (7:1–21:1).
- **[0.2.0] — Radial wheel labels — segment labels are `#23262B` text with a
  white text-stroke halo (`paint-order: stroke`) over decorative core-hue
  segments. — VERIFIED (design), NOT auto-gated.** The halo makes the automated
  ratio misleading (it is not a flat fg/bg pair), so this is intentionally excluded
  from the computed gate and recorded here instead. The wheel is an *optional*
  view; the List view is the default and is fully gated.
- **[0.2.0] — Keyboard & focus — Tab reaches every control; real `<button>` /
  `<dialog>`-free semantic markup; `:focus-visible` ring (3px `--focus`, never
  removed); headings take focus on navigation so screen readers land on new
  content; targets ≥44px (`--tap`), ≥52px in Simple mode. — VERIFIED (code
  review), NEEDS NOAH'S HANDS for VoiceOver feel on a real iPad.**
- **[0.2.0] — Motion & zoom — reduced motion honored via system
  `prefers-reduced-motion` AND an in-app toggle; page zoom never locked (no
  `user-scalable=no` / `maximum-scale`); OS font scaling respected via
  `--text-scale` + `text-size-adjust`. — VERIFIED (code review).**

---

## Known gaps / roadmap

- **Runtime audit not yet automated.** The Doctrine's ideal is axe-core + custom
  checks driven over the built pages in both themes. Only the *static* contrast
  gate is automated today; the DOM-level audit (roles, names, live regions,
  reflow at 320px) is still a manual review. Wiring axe-core over a headless
  Chromium render of the built app is the next accessibility increment.
- **Screen-reader passes need real hardware.** VoiceOver (iPad/iPhone) and NVDA
  cannot be verified from the runner (Doctrine §5) — these stay on Noah's device.
