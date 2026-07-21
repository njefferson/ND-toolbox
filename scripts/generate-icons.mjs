// Pure-Node PNG icon generator — no external image deps.
// Renders a calm 6-segment "feelings wheel" motif in the six core hues.
// Outputs the PWA icon set into public/icons/.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// Calm, desaturated core hues: joyful, powerful, peaceful, sad, mad, scared.
const CORES = ['#E6C56B', '#E0A56B', '#8FBF9F', '#7FA8C9', '#C98A8A', '#A99BC1'];
const HUB = '#F5F1E8';   // warm cream hub
const SLATE = '#2E3440'; // opaque backdrop for maskable / apple icons

const hex = (h) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
  a: 255,
});
const TWO_PI = Math.PI * 2;

function sample(x, y, size, opaqueBg) {
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.46, rInner = size * 0.17;
  const dx = x - cx, dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist <= rOuter && dist >= rInner) {
    let a = Math.atan2(dy, dx);
    if (a < 0) a += TWO_PI;
    return hex(CORES[Math.floor((a / TWO_PI) * 6) % 6]);
  }
  if (dist < rInner) return hex(HUB);
  return opaqueBg ? hex(SLATE) : { r: 0, g: 0, b: 0, a: 0 };
}

function render(size, opaqueBg) {
  const SS = 3; // supersample for smooth edges
  const buf = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    buf[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, size, opaqueBg);
          r += c.r * c.a; g += c.g * c.a; b += c.b * c.a; a += c.a;
        }
      const n = SS * SS;
      const av = a / n;
      buf[p++] = av ? Math.round(r / a) : 0;
      buf[p++] = av ? Math.round(g / a) : 0;
      buf[p++] = av ? Math.round(b / a) : 0;
      buf[p++] = Math.round(av);
    }
  }
  return buf;
}

// --- minimal PNG writer ---
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(td), 0);
  return Buffer.concat([len, td, crc]);
}

function png(size, opaqueBg) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const idat = deflateSync(render(size, opaqueBg), { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
];
for (const [name, size, opaque] of targets) {
  writeFileSync(join(OUT, name), png(size, opaque));
  console.log('wrote', name);
}
