// Feelings module. Inside-out drill-down, a unified landing/node view, direct
// search, and the outside-in multi-select path. Renders into the shell's
// content root and shares the shell's announce channel.
import {
  meta, cores, getNode, childrenOf, glyphFor, pathTo, search, tertiary,
} from './loader.js';
import { route, navigate } from '../../shell/router.js';
import { el, focusView } from '../../shell/dom.js';

let root;
let announce = () => {};

// Outside-in selection persists while the app is open (cleared on demand).
const selection = new Set();

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
    el('h2', { class: 'section-title', tabindex: '-1', 'data-focus': '' }, 'Find a feeling'),
    el('div', { class: 'search-row' }, [input, results]),
    el('h2', { class: 'section-title' }, 'Start from a core feeling'),
    el('div', { class: 'core-grid', role: 'list' },
      cores.map((c) => el('div', { role: 'listitem' }, coreCard(c)))),
    el('button', {
      class: 'path-btn', type: 'button', onclick: () => navigate('/outside-in'),
    }, [
      el('span', { class: 'lead' }, 'Pick the words that fit'),
      el('span', { class: 'sub' }, 'Check every word that rings true, then trace inward.'),
    ]),
  );
  focusView(root);
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
  focusView(root);
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

// ---------------- Outside-in ----------------
// Scan the specific words, check the ones that resonate, then trace inward to
// see which core feeling(s) they cluster under. The standard alexithymia method.
function outsideIn() {
  const resultBox = el('div', { id: 'trace-result', 'aria-live': 'polite' });
  const countLabel = el('span', { class: 'tray-count' });
  const traceBtn = el('button', { class: 'primary-btn', type: 'button', onclick: () => trace() }, 'Trace inward →');
  const clearBtn = el('button', {
    class: 'ghost-btn', type: 'button',
    onclick: () => { selection.clear(); syncChecks(); resultBox.replaceChildren(); update(); },
  }, 'Clear');

  function update() {
    countLabel.textContent = selection.size ? `${selection.size} selected` : 'None selected yet';
    traceBtn.disabled = selection.size === 0;
    clearBtn.disabled = selection.size === 0;
  }

  const fieldset = el('fieldset', { class: 'wordgrid' }, [
    el('legend', { class: 'section-title' }, 'Specific feelings — check the ones that fit'),
    ...tertiary.map((n) => {
      const cb = el('input', { type: 'checkbox', value: n.id });
      cb.checked = selection.has(n.id);
      cb.addEventListener('change', () => {
        if (cb.checked) selection.add(n.id); else selection.delete(n.id);
        update();
      });
      return el('label', { class: 'check-item' }, [cb, el('span', {}, n.label)]);
    }),
  ]);

  function syncChecks() {
    fieldset.querySelectorAll('input[type=checkbox]').forEach((cb) => {
      cb.checked = selection.has(cb.value);
    });
  }

  function trace() {
    const chosen = [...selection].map(getNode).filter(Boolean);
    if (!chosen.length) return;
    const byCore = new Map();
    for (const n of chosen) {
      if (!byCore.has(n.coreId)) byCore.set(n.coreId, []);
      byCore.get(n.coreId).push(n);
    }
    const total = chosen.length;
    const rows = [...byCore.entries()]
      .map(([coreId, words]) => ({ core: getNode(coreId), words }))
      .sort((a, b) => b.words.length - a.words.length || a.core.label.localeCompare(b.core.label));
    const top = rows[0];

    resultBox.replaceChildren(
      el('h3', { class: 'section-title', tabindex: '-1' }, 'Where these point'),
      el('p', { class: 'cluster-lead' }, rows.length === 1
        ? `All ${total} point to ${top.core.label}.`
        : `Mostly ${top.core.label} — ${top.words.length} of your ${total} words.`),
      el('div', { class: 'clusters' }, rows.map((row) => {
        const pct = Math.round((row.words.length / total) * 100);
        return el('div', { class: 'cluster', style: `--core: var(--core-${row.core.id})` }, [
          el('div', { class: 'cluster-head' }, [
            el('span', { class: 'glyph', 'aria-hidden': 'true' }, meta.glyphs[row.core.id]),
            el('span', { class: 'cluster-name' }, row.core.label),
            el('span', { class: 'cluster-count' }, `${row.words.length} of ${total}`),
          ]),
          el('div', { class: 'cluster-bar', 'aria-hidden': 'true' },
            el('span', { style: `width:${pct}%` })),
          el('div', { class: 'chips' }, row.words.map((w) => el('button', {
            class: 'chip', type: 'button', style: `--core: var(--core-${w.coreId})`,
            onclick: () => navigate(`/n/${w.id}`),
          }, w.label))),
        ]);
      })),
    );
    announce(rows.length === 1
      ? `All your words point to ${top.core.label}.`
      : `These point mostly to ${top.core.label}.`);
    resultBox.querySelector('[tabindex]')?.focus();
  }

  root.replaceChildren(
    el('button', { class: 'crumb', type: 'button', onclick: () => navigate('/') }, '‹ Home'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'Pick the words that fit'),
    el('p', { class: 'muted' },
      'Check every word that rings true — no need to overthink it. Then trace inward to see where they point.'),
    fieldset,
    resultBox,
    el('div', { class: 'tray' }, [countLabel, clearBtn, traceBtn]),
  );
  update();
  focusView(root);
}

export default {
  id: 'feelings',
  name: 'Feelings Wheel',
  icon: '🎡',
  mount(ctx) {
    root = ctx.content;
    announce = ctx.announce;
    route('/', home);
    route('/outside-in', outsideIn);
    route('/n/:id', nodeView);
  },
  // Backup slice for this module. Logs are added when opt-in logging ships;
  // for now the slice records the dataset version so an import can detect drift.
  serialize() {
    return { datasetVersion: meta.datasetVersion, logs: [] };
  },
  deserialize() {
    // No module-owned data to restore yet (logging arrives in a later step).
  },
};
