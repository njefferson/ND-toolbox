// Feelings module. Step-1 scope: data-driven home + a minimal core preview so
// the drill-down is demonstrably reading from the dataset, not hardcoded.
// Full inside-out / outside-in / search / landing arrive in later build steps.
import dataset from './data/seed.json';
import { route, navigate, startRouter } from '../../shell/router.js';

const byId = new Map(dataset.nodes.map((n) => [n.id, n]));
const childrenOf = (id) => dataset.nodes.filter((n) => n.parentId === id);
const cores = dataset.coreOrder.map((id) => byId.get(id));

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) node.append(c?.nodeType ? c : document.createTextNode(String(c)));
  return node;
}

const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 32)"><circle r="30" fill="var(--surface-2)"/><g><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-joyful)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-powerful)" transform="rotate(60)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-peaceful)" transform="rotate(120)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-sad)" transform="rotate(180)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-mad)" transform="rotate(240)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-scared)" transform="rotate(300)"/></g><circle r="10" fill="var(--surface)"/></g></svg>`;

let root;
let status;

function announce(msg) {
  if (status) status.textContent = msg;
}

function masthead() {
  return el('header', { class: 'masthead' }, [
    el('span', { html: MARK }),
    el('h1', {}, 'Feelings'),
  ]);
}

function coreCard(core) {
  return el(
    'button',
    {
      class: 'core-card',
      type: 'button',
      style: `--core: var(--core-${core.id})`,
      'aria-label': `${core.label}. ${core.definition}`,
      onclick: () => navigate(`/feelings/core/${core.id}`),
    },
    [
      el('span', { class: 'glyph', 'aria-hidden': 'true' }, dataset.glyphs[core.id] || '•'),
      el('span', { class: 'label' }, core.label),
    ]
  );
}

function home() {
  root.replaceChildren(
    masthead(),
    el('div', { class: 'search-row' }, [
      el('label', { for: 'q', class: 'section-title' }, 'Search a word'),
      el('input', {
        id: 'q',
        type: 'search',
        placeholder: 'Type a feeling…',
        'aria-describedby': 'q-hint',
        onkeydown: (e) => { if (e.key === 'Enter') announce('Direct search arrives in a later build step.'); },
      }),
      el('p', { id: 'q-hint', class: 'muted' }, 'Or choose a path below.'),
    ]),
    el('h2', { class: 'section-title' }, 'Start from a core feeling'),
    el('div', { class: 'core-grid', role: 'list' },
      cores.map((c) => el('div', { role: 'listitem' }, coreCard(c)))),
    el('div', { class: 'paths' }, [
      el('button', { class: 'path-btn', type: 'button',
        onclick: () => announce('Outside-in (pick the words that fit) arrives in a later build step.') }, [
        el('span', { class: 'lead' }, 'Pick the words that fit'),
        el('span', { class: 'sub' }, 'Check every word that rings true, then trace inward.'),
      ]),
    ])
  );
}

function corePreview({ id }) {
  const core = byId.get(id);
  if (!core) return home();
  const kids = childrenOf(id);
  root.replaceChildren(
    masthead(),
    el('button', { class: 'path-btn', type: 'button', onclick: () => navigate('/') }, '← Back'),
    el('h2', { style: `border-left:8px solid var(--core-${id});padding-left:.6rem` }, core.label),
    el('p', { class: 'muted' }, core.definition),
    el('h3', { class: 'section-title' }, kids.length ? 'Narrows into' : 'More words land here in step 2'),
    el('div', { class: 'paths' },
      kids.map((k) => el('div', { class: 'path-btn' }, [
        el('span', { class: 'lead' }, k.label),
        el('span', { class: 'sub' }, k.definition),
      ]))),
    (() => { announce(`${core.label}: ${core.definition}`); return document.createComment('x'); })()
  );
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
    route('/feelings/core/:id', corePreview);
    startRouter();
  },
};
