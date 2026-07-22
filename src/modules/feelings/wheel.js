// Focused radial wheel: the current node in the hub, its children as coloured
// wedges around it. One ring at a time keeps labels legible on a phone and the
// interaction identical to the columns. Keyboard + screen-reader accessible;
// colours come from CSS vars so theming and monochrome apply automatically.
const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, kids = []) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) {
    if (c === null || c === undefined || c === false) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}

function wedgePath(cx, cy, rInner, rOuter, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(rOuter, a0);
  const [x1, y1] = p(rOuter, a1);
  const [x2, y2] = p(rInner, a1);
  const [x3, y3] = p(rInner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1} `
    + `L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}

// items: [{ id, label, coreId }] · onSelect(item) · center: { label, coreId? }
// onCenter (optional): makes the hub a "back" control.
export function renderWheel({ center, items, onSelect, onCenter }) {
  const VB = 400, cx = 200, cy = 200, rOuter = 192, rInner = 94;
  const N = items.length;
  const step = (2 * Math.PI) / N;
  const start = -Math.PI / 2;

  const svg = s('svg', {
    viewBox: `0 0 ${VB} ${VB}`, class: 'wheel', role: 'group',
    'aria-label': `${center.label} — wheel view`,
  });

  items.forEach((it, i) => {
    const a0 = start + i * step;
    const a1 = a0 + step;
    const am = (a0 + a1) / 2;
    const g = s('g', {
      class: 'wheel-seg', role: 'button', tabindex: '0', 'aria-label': it.label,
      onclick: () => onSelect(it),
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(it); } },
    });
    g.append(s('path', {
      d: wedgePath(cx, cy, rInner, rOuter, a0, a1),
      style: `fill: var(--core-${it.coreId})`, stroke: 'var(--bg)', 'stroke-width': '2.5',
    }));
    const rm = (rInner + rOuter) / 2;
    const lx = cx + rm * Math.cos(am);
    const ly = cy + rm * Math.sin(am);
    let deg = (am * 180) / Math.PI;
    if (deg > 90 && deg < 270) deg += 180; // keep left-side labels upright
    g.append(s('text', {
      x: lx, y: ly, class: 'wheel-label', 'text-anchor': 'middle', 'dominant-baseline': 'central',
      transform: `rotate(${deg} ${lx} ${ly})`,
    }, it.label));
    svg.append(g);
  });

  const hub = s('g', {
    class: 'wheel-center', role: onCenter ? 'button' : 'img',
    tabindex: onCenter ? '0' : null,
    'aria-label': onCenter ? `${center.label} — back` : center.label,
    onclick: onCenter || null,
    onkeydown: onCenter ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCenter(); } } : null,
  });
  hub.append(s('circle', { cx, cy, r: rInner - 6, class: 'wheel-hub' }));
  hub.append(s('text', {
    x: cx, y: cy, class: 'wheel-center-label', 'text-anchor': 'middle', 'dominant-baseline': 'central',
  }, center.label));
  svg.append(hub);

  return svg;
}
