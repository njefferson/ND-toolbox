// Computed contrast gate (Doctrine §4: "Contrast is COMPUTED, never eyeballed:
// a CI gate that exits non-zero on any failure. New fg/bg pairs are added to the
// gate in the SAME commit.").
//
// This resolves every theme's token cascade the way the browser would, then
// checks each meaning-bearing foreground/background pair against WCAG 2.1
// contrast minima. It exits non-zero on any failure so CI blocks the merge.
//
// Hues are decorative here (label + icon + shape carry meaning — Doctrine §4),
// so the six --core-* colors are NOT gated as text. Anything that carries
// meaning as text, or as a focus indicator, IS.
//
// SOURCE OF TRUTH: the values below mirror src/styles/theme.css. If a token
// changes there, change it here in the SAME commit (Doctrine §4). A drift check
// at the bottom fails loudly if theme.css gains a token this file never resolved.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME_CSS = join(HERE, '..', 'src', 'styles', 'theme.css');

// ---------------------------------------------------------------------------
// WCAG relative luminance + contrast ratio (WCAG 2.1, sRGB).
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}
function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) =>
    (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------------------
// Token palettes, resolved per mode exactly as the CSS cascade would.
// Base is light (:root); each mode is base + that mode's overrides.
// ---------------------------------------------------------------------------
const BASE = {
  bg: '#F5F1E8', surface: '#FFFFFF', 'surface-2': '#EFEADD',
  ink: '#23262B', 'ink-soft': '#55595F', line: '#D9D2C4',
  accent: '#3E6E97', focus: '#1B65C4',
};
const merge = (...objs) => Object.assign({}, ...objs);

const PALETTES = {
  'light': BASE,
  'dark': merge(BASE, {
    bg: '#23262B', surface: '#2C3037', 'surface-2': '#333841',
    ink: '#ECEEF1', 'ink-soft': '#AEB4BD', line: '#3C424B',
    accent: '#8FB6DC', focus: '#8FB6DC',
  }),
  'mono': merge(BASE, {
    bg: '#F3F3F3', surface: '#FFFFFF', 'surface-2': '#E8E8E8',
    ink: '#1C1C1C', 'ink-soft': '#55595F', line: '#CFCFCF',
    accent: '#333333', focus: '#000000',
  }),
  // data-contrast='high' (light-based selector) overrides these tokens; accent
  // and surface-2 are deliberately left as their base values.
  'light + high-contrast': merge(BASE, {
    ink: '#000000', 'ink-soft': '#1a1a1a', line: '#000000',
    surface: '#FFFFFF', bg: '#FFFFFF', focus: '#0033CC',
  }),
  // Dark base, then the dark high-contrast overlay (pure-black surfaces).
  'dark + high-contrast': merge(BASE, {
    'surface-2': '#333841', accent: '#8FB6DC',
    ink: '#FFFFFF', 'ink-soft': '#EDEDED', line: '#FFFFFF',
    surface: '#000000', bg: '#000000', focus: '#7FB0FF',
  }),
  // mono + high-contrast: the light high-contrast selector still matches, so it
  // overlays the mono tokens (surfaces go pure, accent stays mono grey).
  'mono + high-contrast': merge(BASE, {
    'surface-2': '#E8E8E8', accent: '#333333',
    ink: '#000000', 'ink-soft': '#1a1a1a', line: '#000000',
    surface: '#FFFFFF', bg: '#FFFFFF', focus: '#0033CC',
  }),
};

// ---------------------------------------------------------------------------
// The pairs. `min` is the WCAG threshold; `kind` documents why.
//   text      → 4.5:1 (WCAG 1.4.3, normal-size body text)
//   large     → 3.0:1 (WCAG 1.4.3, >=18pt / >=14pt bold — used sparingly)
//   nonText   → 3.0:1 (WCAG 1.4.11, focus rings & active component borders)
// fg/bg are token names resolved within each palette above.
// ---------------------------------------------------------------------------
const TEXT = 4.5;
const LARGE = 3.0;
const NONTEXT = 3.0;

const PAIRS = [
  // Body + card text.
  { fg: 'ink', bg: 'bg', min: TEXT, note: 'body text on page' },
  { fg: 'ink', bg: 'surface', min: TEXT, note: 'text on cards / inputs / buttons' },
  { fg: 'ink', bg: 'surface-2', min: TEXT, note: 'text on hover / selected surface' },
  // Muted / secondary text (definitions, hints, taglines, footer, breadcrumb sep).
  { fg: 'ink-soft', bg: 'bg', min: TEXT, note: 'muted text on page' },
  { fg: 'ink-soft', bg: 'surface', min: TEXT, note: 'muted text on cards' },
  { fg: 'ink-soft', bg: 'surface-2', min: TEXT, note: 'muted text on hover / selected surface' },
  // Accent as link text (breadcrumb crumbs are underlined accent-colored links).
  { fg: 'accent', bg: 'bg', min: TEXT, note: 'accent link text (breadcrumbs) on page' },
  // Inverse: primary/bar/toggle/seg active buttons paint --bg text on --accent.
  { fg: 'bg', bg: 'accent', min: TEXT, note: 'button label (--bg) on --accent fill' },
  // Focus ring must be visible against the surfaces it draws on (non-text UI).
  { fg: 'focus', bg: 'bg', min: NONTEXT, note: 'focus ring on page' },
  { fg: 'focus', bg: 'surface', min: NONTEXT, note: 'focus ring on cards' },
  // Active-component border (checked radios/checkboxes, active toggles).
  { fg: 'accent', bg: 'surface', min: NONTEXT, note: 'active component border on cards' },
];

// ---------------------------------------------------------------------------
// Run the gate.
// ---------------------------------------------------------------------------
const failures = [];
const rows = [];
for (const [mode, palette] of Object.entries(PALETTES)) {
  for (const p of PAIRS) {
    const fg = palette[p.fg];
    const bg = palette[p.bg];
    const ratio = contrast(fg, bg);
    const pass = ratio >= p.min;
    if (!pass) failures.push({ mode, ...p, fg, bg, ratio });
    rows.push({ mode, pair: `${p.fg} on ${p.bg}`, ratio: ratio.toFixed(2), min: p.min.toFixed(1), pass, note: p.note });
  }
}

// Report.
let curMode = null;
for (const r of rows) {
  if (r.mode !== curMode) { curMode = r.mode; console.log(`\n  ${curMode}`); }
  const mark = r.pass ? '✓' : '✗';
  console.log(`    ${mark} ${r.pair.padEnd(24)} ${r.ratio.padStart(6)} : 1  (min ${r.min})  ${r.note}`);
}

// ---------------------------------------------------------------------------
// Drift guard: if theme.css declares a color token this gate never resolved,
// fail — the pair set is probably stale (Doctrine §4: same-commit rule).
// ---------------------------------------------------------------------------
const css = readFileSync(THEME_CSS, 'utf8');
const declared = new Set([...css.matchAll(/--([a-z0-9-]+):\s*#[0-9A-Fa-f]{3,6}/g)].map((m) => m[1]));
const KNOWN = new Set([
  'bg', 'surface', 'surface-2', 'ink', 'ink-soft', 'line', 'accent', 'focus',
  'core-joyful', 'core-powerful', 'core-peaceful', 'core-sad', 'core-mad', 'core-scared',
]);
const unknown = [...declared].filter((t) => !KNOWN.has(t));
if (unknown.length) {
  console.log(`\n  ⚠ theme.css declares color token(s) the gate doesn't know: ${unknown.join(', ')}`);
  console.log('    Add them to KNOWN (and gate any new text/UI pairs) in this same commit.');
  failures.push({ drift: true });
}

console.log('');
if (failures.length) {
  console.error(`FAIL — ${failures.length} contrast issue(s). Fix the tokens or the gate before merging.`);
  process.exit(1);
}
console.log(`PASS — ${rows.length} pairs across ${Object.keys(PALETTES).length} themes meet WCAG minima.`);
