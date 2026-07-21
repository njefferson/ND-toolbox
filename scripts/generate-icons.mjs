// Generate the PWA icon set: the six-segment feelings wheel as a clean medallion
// on the watercolor background. Uses headless Chrome's canvas to composite
// (the watercolor is a raster). Source is the committed social tile, so this is
// reproducible in-repo. Icons are committed PNGs; CI does not regenerate them.
//
// Run: npm run icons   (needs the bundled Chromium; override with CHROME=/path)
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');
const SRC = join(ROOT, 'public', 'social', 'og-tile.png');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const dataUrl = 'data:image/png;base64,' + readFileSync(SRC).toString('base64');
const port = 9410;
const proc = spawn(CHROME, ['--headless', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1200);
const t = (await (await fetch(`http://localhost:${port}/json`)).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise((r) => pend.set(i, r)); };
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
await send('Runtime.enable');
await send('Runtime.evaluate', { expression: `window.__src = ${JSON.stringify(dataUrl)}; true` });

const result = await send('Runtime.evaluate', {
  awaitPromise: true, returnByValue: true,
  expression: `(async () => {
    const img = new Image(); img.src = window.__src; await img.decode();
    const CORES = ['#E6C56B','#E0A56B','#8FBF9F','#7FA8C9','#C98A8A','#A99BC1'];
    const HUB = '#F5F1E8';
    function render(N) {
      const c = document.createElement('canvas'); c.width = N; c.height = N;
      const x = c.getContext('2d');
      // watercolor cover-crop (colourful right square of the tile)
      const s = Math.min(img.width, img.height);
      x.drawImage(img, img.width - s, img.height - s, s, s, 0, 0, N, N);
      const cx = N/2, cy = N/2;
      // soft cream medallion so the wheel reads off the watercolor
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, N*0.45);
      g.addColorStop(0, 'rgba(245,241,232,0.94)');
      g.addColorStop(0.78, 'rgba(245,241,232,0.94)');
      g.addColorStop(1, 'rgba(245,241,232,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, N*0.45, 0, Math.PI*2); x.fill();
      // six wedges
      const rOuter = N*0.34;
      for (let i = 0; i < 6; i++) {
        const a0 = (-Math.PI/2) + i*(Math.PI/3), a1 = a0 + Math.PI/3;
        x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, rOuter, a0, a1); x.closePath();
        x.fillStyle = CORES[i]; x.fill();
      }
      // hub
      x.beginPath(); x.arc(cx, cy, N*0.135, 0, Math.PI*2); x.fillStyle = HUB; x.fill();
      return c.toDataURL('image/png');
    }
    return { 'icon-192.png': render(192), 'icon-512.png': render(512),
             'maskable-512.png': render(512), 'apple-touch-icon.png': render(180) };
  })()`,
});

for (const [name, url] of Object.entries(result.result.value)) {
  writeFileSync(join(OUT, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
}
proc.kill();
process.exit(0);
