// Runtime accessibility audit (Doctrine §4: "Run the a11y audit — axe-core +
// custom checks, both themes — before any UI ship.").
//
// The static contrast gate (check-contrast.mjs) proves the color tokens; this
// proves the rendered DOM: roles, names, labels, live regions, heading order,
// duplicate ids, and reflow. It serves the built app, drives headless Chromium
// (pre-installed; playwright-core carries no browser of its own), injects
// axe-core on each route in each theme, and exits non-zero on any serious or
// critical violation so CI blocks the merge.
//
// Requires a build first: `npm run build` (CI does this before calling us).
// Run locally: `npm run a11y:audit`.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(ROOT, 'dist');
const AXE = join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');

if (!existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

// Resolve a Chromium binary that works in both environments:
//  - this runner ships one under /opt/pw-browsers (PLAYWRIGHT_BROWSERS_PATH),
//  - CI installs one via `npx playwright install chromium` (default cache),
//    which playwright-core's own executablePath() then resolves.
// CHROME_PATH overrides everything for unusual setups. If none resolve on disk,
// we launch without an explicit path and let playwright-core try its default.
function resolveChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const known = [
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  ];
  for (const p of known) if (existsSync(p)) return p;
  try {
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch { /* playwright-core has no registered browser; fall through */ }
  return null;
}
const chromePath = resolveChrome();

// ---------------------------------------------------------------------------
// Minimal static server for dist/. The app is hash-routed, so every route loads
// "/" and carries its path in the fragment — no SPA fallback needed.
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.map': 'application/json', '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    if (rel === '/' || rel === '\\') rel = '/index.html';
    let file = join(DIST, rel);
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) file = join(DIST, 'index.html'); // hash-route fallback
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(500); res.end('server error');
  }
});

const port = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const origin = `http://127.0.0.1:${port}`;

// ---------------------------------------------------------------------------
// Routes × themes to sweep. Themes seed the shell's settings before boot so
// applySettings() picks them up exactly as on a real device.
// ---------------------------------------------------------------------------
const ROUTES = [
  { path: '/', name: 'Suite home' },
  { path: '/feelings', name: 'Feelings home + search' },
  { path: '/feelings/n/joyful', name: 'Core node (drill-down)' },
  { path: '/feelings/n/content', name: 'Ring-2 node' },
  { path: '/feelings/n/satisfied', name: 'Landing (leaf word)' },
  { path: '/feelings/outside-in', name: 'Outside-in word grid' },
  { path: '/feelings/history', name: 'History (logging on)', logging: true },
  { path: '/io', name: 'Interoception check-in' },
  { path: '/settings', name: 'Settings', logging: true },
  { path: '/about', name: 'About' },
];
const THEMES = [
  { label: 'light', settings: { theme: 'light' } },
  { label: 'dark', settings: { theme: 'dark' } },
  { label: 'mono', settings: { theme: 'mono' } },
  { label: 'high-contrast', settings: { theme: 'light', contrast: 'high' } },
];

const SETTINGS_KEY = 'nd-toolbox:settings:v1';
const axeSource = await readFile(AXE, 'utf8');

// Fail the gate on these impact levels; report the rest as advisory.
const FAIL_ON = new Set(['serious', 'critical']);

const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});
const failures = [];
const advisories = [];
let checks = 0;

try {
  for (const theme of THEMES) {
    for (const r of ROUTES) {
      const seed = { ...theme.settings };
      if (r.logging) seed.loggingEnabled = true;
      // 320 CSS px is the WCAG 1.4.10 reflow width — the strictest realistic case.
      const context = await browser.newContext({ viewport: { width: 320, height: 720 } });
      const page = await context.newPage();
      // Seed settings before the app boots so the theme/logging apply on first paint.
      await page.addInitScript(([key, value]) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
      }, [SETTINGS_KEY, seed]);

      await page.goto(`${origin}/#${r.path}`, { waitUntil: 'load' });
      // Wait for the view's focus heading to render (every screen sets one).
      await page.waitForSelector('[data-focus], main', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(150); // let async loaders (logs/dataset) settle

      await page.evaluate(axeSource);
      const results = await page.evaluate(async () => {
        // WCAG 2.1 A/AA rule tags; page has one app root so scope is the document.
        return await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
      });
      checks++;

      for (const v of results.violations) {
        const rec = {
          theme: theme.label, route: r.name, path: r.path,
          id: v.id, impact: v.impact, help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        };
        if (FAIL_ON.has(v.impact)) failures.push(rec); else advisories.push(rec);
      }

      // Custom checks — the app's own accessibility promises, which axe can't
      // judge: focus must land on the new view's heading after navigation, a live
      // region must exist to announce it, and the layout must not overflow
      // horizontally (reflow — Doctrine §4, WCAG 1.4.10) for text-scaling users.
      const problems = await page.evaluate(() => {
        const out = [];
        const foci = document.querySelectorAll('[data-focus]');
        if (foci.length !== 1) out.push(`expected exactly one [data-focus] heading, found ${foci.length}`);
        const active = document.activeElement;
        if (!active || !active.hasAttribute('data-focus')) {
          out.push(`focus did not land on the view heading (active element: ${active?.tagName?.toLowerCase() || 'none'})`);
        }
        if (!document.querySelector('[role="status"][aria-live]')) out.push('no aria-live status region present');
        const de = document.documentElement;
        if (de.scrollWidth > de.clientWidth + 1) {
          out.push(`horizontal overflow: content ${de.scrollWidth}px wide in a ${de.clientWidth}px viewport`);
        }
        return out;
      });
      for (const p of problems) {
        failures.push({ theme: theme.label, route: r.name, path: r.path, id: 'custom', impact: 'custom', help: p, nodes: [r.path] });
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const fmt = (r) => `    ✗ [${r.impact}] ${r.route} · ${r.theme} — ${r.id}: ${r.help}\n`
  + `        e.g. ${r.nodes[0] || '(node)'}`;

if (advisories.length) {
  console.log(`\n  Advisory (moderate/minor — not gated, ${advisories.length}):`);
  for (const r of advisories) console.log(fmt(r));
}
console.log('');
if (failures.length) {
  console.error(`  Serious/critical violations (${failures.length}):`);
  for (const r of failures) console.error(fmt(r));
  console.error(`\nFAIL — axe found ${failures.length} serious/critical issue(s) across ${checks} route×theme checks.`);
  process.exit(1);
}
console.log(`PASS — axe + custom checks clean across ${checks} route×theme checks`
  + ` (focus, live region, reflow @320px)${advisories.length ? `; ${advisories.length} advisory item(s) above` : ''}.`);
