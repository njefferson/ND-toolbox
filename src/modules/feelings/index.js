// Feelings module. Inside-out drill-down, a unified landing/node view, and
// direct search. Outside-in (multi-select) is the next build step and is a
// clearly-labeled stub for now.
import {
  meta, cores, getNode, childrenOf, glyphFor, pathTo, search,
} from './loader.js';
import { route, navigate, startRouter } from '../../shell/router.js';

// --- tiny DOM helper ---
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c?.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 32)"><circle r="30" fill="var(--surface-2)"/><g><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-joyful)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-powerful)" transform="rotate(60)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-peaceful)" transform="rotate(120)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-sad)" transform="rotate(180)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-mad)" transform="rotate(240)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-scared)" transform="rotate(300)"/></g><circle r="10" fill="var(--surface)"/></g></svg>`;

let root;
let status;
const announce = (msg) => { if (status) status.textContent = msg; };

function masthead() {
  return el('header', { class: 'masthead' }, [
    el('button', {
      class: 'mast-home', type: 'button', 'aria-label': 'Home',
      onclick: () => navigate('/'),
    }, el('span', { html: MARK })),
    el('h1', {}, 'Feelings'),
  ]);
}

// Focus the primary heading so screen readers land on the new view.
function focusHeading() {
  const h = root.querySelector('[data-focus]');
  if (h) h.focus();
}

// ---------------- Home ----------------
function home() {
  const results = el('div', { id: 'results', class: 'results', role: 'list' });
  const input = el('input', {
    id: 'q', type: 'search', autocomplete: 'off', 'aria-controls': 'results',
    placeholder: 'Type a feeling…', 'aria-label': 'Search for a feeling word',
    oninput: (e) => renderResults(e.target.value, results),
    onkeydown: (e) => {
      if (e.key === 'Enter') {
        const first = results.querySelector('[data-id]');
        if (first) navigate(`/n/${first.dataset.id}`);
      }
    },
  });

  root.replaceChildren(
    masthead(),
    el('h2', { class: 'section-title', tabindex: '-1', 'data-focus': '' }, 'Find a feeling'),
    el('div', { class: 'search-row' }, [input, results]),
    el('h2', { class: 'section-title' }, 'Start from a core feeling'),
    el('div', { class: 'core-grid', role: 'list' },
      cores.map((c) => el('div', { role: 'listitem' }, coreCard(c)))),
    el('button', {
      class: 'path-btn', type: 'button',
      onclick: () => announce('Outside-in — pick the words that fit — arrives in the next build step.'),
    }, [
      el('span', { class: 'lead' }, 'Pick the words that fit'),
      el('span', { class: 'sub' }, 'Check every word that rings true, then trace inward. (Coming next.)'),
    ]),
  );
  focusHeading();
}

function coreCard(core) {
  return el('button', {
    class: 'core-card', type: 'button', style: `--core: var(--core-${core.id})`,
    'aria-label': `${core.label}. ${core.definition}`,
    onclick: () => navigate(`/n/${core.id}`),
  }, [
    el('span', { class: 'glyph', 'aria-hidden': 'true' }, meta.glyphs[core.id] || '•'),
    el('span', { class: 'label' }, core.label),
  ]);
}

function renderResults(query, container) {
  const matches = search(query);
  container.replaceChildren();
  if (!query.trim()) { announce(''); return; }
  if (!matches.length) {
    container.append(el('p', { class: 'muted' }, `No match for "${query.trim()}".`));
    announce('No matches.');
    return;
  }
  for (const n of matches) {
    const trail = pathTo(n.id).slice(0, -1).map((p) => p.label).join(' › ');
    container.append(el('button', {
      class: 'result', type: 'button', role: 'listitem', dataset: { id: n.id },
      style: `--core: var(--core-${n.coreId})`,
      onclick: () => navigate(`/n/${n.id}`),
    }, [
      el('span', { class: 'result-label' }, n.label),
      trail ? el('span', { class: 'result-trail' }, trail) : null,
    ]));
  }
  announce(`${matches.length} ${matches.length === 1 ? 'match' : 'matches'}.`);
}

// ---------------- Node / landing view ----------------
function nodeView({ id }) {
  const node = getNode(id);
  if (!node) return home();
  const trail = pathTo(id);
  const kids = childrenOf(id);
  const parent = node.parentId ? getNode(node.parentId) : null;
  const neighbors = (node.neighbors || []).map(getNode).filter(Boolean);

  root.replaceChildren(
    masthead(),
    breadcrumb(trail),
    el('h2', {
      class: 'landing-title', tabindex: '-1', 'data-focus': '',
      style: `--core: var(--core-${node.coreId})`,
    }, [
      el('span', { class: 'glyph', 'aria-hidden': 'true' }, glyphFor(node)),
      node.label,
    ]),
    el('p', { class: 'landing-def' }, node.definition),

    kids.length
      ? el('section', { 'aria-label': `Words within ${node.label}` }, [
          el('h3', { class: 'section-title' }, node.depth === 0 ? 'Branches into' : 'Narrows into'),
          el('div', { class: 'paths' }, kids.map(drillButton)),
        ])
      : null,

    neighbors.length
      ? el('section', { 'aria-label': 'Nearby words' }, [
          el('h3', { class: 'section-title' }, 'Nearby words'),
          el('div', { class: 'chips' }, neighbors.map((nb) => el('button', {
            class: 'chip', type: 'button', style: `--core: var(--core-${nb.coreId})`,
            onclick: () => navigate(`/n/${nb.id}`),
          }, nb.label))),
        ])
      : null,

    node.guidance ? guidancePanel(node.guidance) : null,

    el('div', { class: 'landing-actions' }, [
      parent
        ? el('button', { class: 'ghost-btn', type: 'button', onclick: () => navigate(`/n/${parent.id}`) },
            `← Back to ${parent.label}`)
        : el('button', { class: 'ghost-btn', type: 'button', onclick: () => navigate('/') }, '← All core feelings'),
    ]),
  );
  announce(`${node.label}. ${node.definition}`);
  focusHeading();
}

function breadcrumb(trail) {
  const nav = el('nav', { class: 'breadcrumb', 'aria-label': 'Path' });
  trail.forEach((n, i) => {
    const last = i === trail.length - 1;
    if (i > 0) nav.append(el('span', { class: 'crumb-sep', 'aria-hidden': 'true' }, '›'));
    nav.append(last
      ? el('span', { class: 'crumb current', 'aria-current': 'page' }, n.label)
      : el('button', { class: 'crumb', type: 'button', onclick: () => navigate(`/n/${n.id}`) }, n.label));
  });
  return nav;
}

function drillButton(child) {
  const hasKids = childrenOf(child.id).length > 0;
  return el('button', {
    class: 'path-btn', type: 'button', style: `--core: var(--core-${child.coreId})`,
    onclick: () => navigate(`/n/${child.id}`),
  }, [
    el('span', { class: 'lead' }, child.label),
    el('span', { class: 'sub' }, child.definition),
    hasKids ? el('span', { class: 'more', 'aria-hidden': 'true' }, '›') : null,
  ]);
}

function guidancePanel(g) {
  return el('details', { class: 'guidance' }, [
    el('summary', {}, 'What this often points to · one option'),
    el('div', { class: 'guidance-body' }, [
      el('p', {}, g.pointsTo),
      g.oneOption ? el('p', { class: 'guidance-option' }, g.oneOption) : null,
      el('p', { class: 'muted guidance-note' },
        'A gentle note, not advice or a diagnosis. Take it or leave it.'),
    ]),
  ]);
}

export default {
  id: 'feelings',
  name: 'Feelings Wheel',
  icon: '🎡',
  mount(mountRoot) {
    root = el('main', { id: 'main', class: 'app-shell', tabindex: '-1' });
    status = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    status.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
    mountRoot.replaceChildren(root, status);

    route('/', home);
    route('/n/:id', nodeView);
    startRouter();
  },
};
