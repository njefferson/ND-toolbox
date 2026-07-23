// Feelings module. Inside-out drill-down, a unified landing/node view, direct
// search, and the outside-in multi-select path. Renders into the shell's
// content root and shares the shell's announce channel.
import {
  meta, cores, getNode, childrenOf, glyphFor, pathTo, search, allNodes,
} from './loader.js';
import { route, navigate } from '../../shell/router.js';
import { el, focusView, place, MARK } from '../../shell/dom.js';

// This module lives under /feelings; go() navigates within it.
const BASE = '/feelings';
const go = (p = '') => navigate(BASE + p);
import { loadSettings, saveSettings } from '../../shell/services/settings.js';
import {
  ensureLoaded, getLogsSync, addLog, deleteLog, clearLogs, setLogs, newId,
} from './logs.js';
import { renderWheel } from './wheel.js';

const loggingOn = () => loadSettings().loggingEnabled;
const navMode = () => loadSettings().navMode;

// Columns / Wheel switch. Saves the choice and re-renders the current view.
function viewToggle(rerender) {
  const cur = navMode();
  const btn = (mode, label) => el('button', {
    class: `toggle-btn${cur === mode ? ' active' : ''}`, type: 'button',
    'aria-pressed': String(cur === mode),
    onclick: () => { const s = loadSettings(); s.navMode = mode; saveSettings(s); rerender(); },
  }, label);
  return el('div', { class: 'view-toggle', role: 'group', 'aria-label': 'How to browse' }, [
    btn('columns', 'List'), btn('wheel', 'Wheel'),
  ]);
}

function makeEntry(node, trail, note, selectedSet) {
  return {
    id: newId(),
    ts: new Date().toISOString(),
    nodeId: node.id,
    label: node.label,
    coreId: node.coreId,
    path: trail.map((p) => p.label),
    note: note || undefined,
    selectedSet: selectedSet || undefined,
    appVersion: __APP_VERSION__,
    datasetVersion: meta.datasetVersion,
  };
}

// Deepest ring the user sees. Simple mode (or wordDepth 2) stops at the
// secondary level: fewer, gentler words and a shorter path to a landing.
function maxDepth() {
  const s = loadSettings();
  if (s.simpleMode) return 1;
  return s.wordDepth === 2 ? 1 : 2;
}
const leafChildren = (id, node) => (node.depth < maxDepth() ? childrenOf(id) : []);

let root;
let announce = () => {};

// Outside-in selection persists while the app is open (cleared on demand).
const selection = new Set();

// Words visited this session, most-recent-first. In-memory ONLY — never written
// to storage, so it speeds up re-finding a word without becoming a record of
// anything (this is not a mood tracker). Cleared when the app closes. Cores are
// skipped; they're always one tap away from Home anyway.
const recent = [];
const RECENT_MAX = 6;
function rememberRecent(node) {
  if (!node || node.depth === 0) return;
  const at = recent.indexOf(node.id);
  if (at !== -1) recent.splice(at, 1);
  recent.unshift(node.id);
  if (recent.length > RECENT_MAX) recent.length = RECENT_MAX;
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
        if (first) go(`/n/${first.dataset.id}`);
      }
    },
  });

  const recentNodes = recent.map(getNode).filter(Boolean);

  place(root,
    el('h2', { class: 'section-title', tabindex: '-1', 'data-focus': '' }, 'Find a feeling'),
    el('div', { class: 'search-row' }, [input, results]),
    recentNodes.length
      ? el('section', { class: 'recent', 'aria-label': 'Words you looked at recently' }, [
          el('h2', { class: 'section-title' }, 'Recent'),
          el('div', { class: 'chips' }, recentNodes.map((n) => el('button', {
            class: 'chip', type: 'button', style: `--core: var(--core-${n.coreId})`,
            'aria-label': `${n.label}. ${n.definition}`,
            onclick: () => go(`/n/${n.id}`),
          }, n.label))),
        ])
      : null,
    el('div', { class: 'section-head' }, [
      el('h2', { class: 'section-title' }, 'Start from a core feeling'),
      viewToggle(home),
    ]),
    navMode() === 'wheel'
      ? renderWheel({
          center: { label: 'Feelings' },
          items: cores.map((c) => ({ id: c.id, label: c.label, coreId: c.id })),
          onSelect: (it) => go(`/n/${it.id}`),
        })
      : el('div', { class: 'core-grid', role: 'list' },
          cores.map((c) => el('div', { role: 'listitem' }, coreCard(c)))),
    el('button', {
      class: 'path-btn', type: 'button', onclick: () => go('/outside-in'),
    }, [
      el('span', { class: 'lead' }, 'Pick the words that fit'),
      el('span', { class: 'sub' }, 'Check every word that rings true, then trace inward.'),
    ]),
    loggingOn() ? el('button', {
      class: 'path-btn', type: 'button', onclick: () => go('/history'),
    }, [
      el('span', { class: 'lead' }, 'Your history'),
      el('span', { class: 'sub' }, 'Feelings you’ve saved on this device.'),
    ]) : null,
  );
  focusView(root);
}

function coreCard(core) {
  return el('button', {
    class: 'core-card', type: 'button', style: `--core: var(--core-${core.id})`,
    'aria-label': `${core.label}. ${core.definition}`,
    onclick: () => go(`/n/${core.id}`),
  }, [
    el('span', { class: 'glyph', 'aria-hidden': 'true' }, meta.glyphs[core.id] || '•'),
    el('span', { class: 'label' }, core.label),
  ]);
}

function renderResults(query, container) {
  const md = maxDepth();
  const matches = search(query).filter((n) => n.depth <= md);
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
      onclick: () => go(`/n/${n.id}`),
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
  rememberRecent(node);
  const trail = pathTo(id);
  const kids = leafChildren(id, node);
  const parent = node.parentId ? getNode(node.parentId) : null;

  // Wheel view handles nodes that still have children; leaves fall through to
  // the landing card below (a word's definition reads better as a card).
  if (navMode() === 'wheel' && kids.length) return wheelNodeView(node, trail, kids, parent);

  const neighbors = (node.neighbors || []).map(getNode).filter(Boolean);

  place(root,
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
            onclick: () => go(`/n/${nb.id}`),
          }, nb.label))),
        ])
      : null,

    node.guidance ? guidancePanel(node.guidance) : null,

    loggingOn() ? logSection(node, trail) : null,

    el('div', { class: 'landing-actions' }, [
      parent
        ? el('button', { class: 'ghost-btn', type: 'button', onclick: () => go(`/n/${parent.id}`) },
            `← Back to ${parent.label}`)
        : el('button', { class: 'ghost-btn', type: 'button', onclick: () => go('') }, '← All core feelings'),
    ]),
  );
  announce(`${node.label}. ${node.definition}`);
  focusView(root);
}

function wheelNodeView(node, trail, kids, parent) {
  place(root,
    breadcrumb(trail),
    el('div', { class: 'section-head' }, [
      el('h2', {
        class: 'landing-title', tabindex: '-1', 'data-focus': '',
        style: `--core: var(--core-${node.coreId})`,
      }, [el('span', { class: 'glyph', 'aria-hidden': 'true' }, glyphFor(node)), node.label]),
      viewToggle(() => nodeView({ id: node.id })),
    ]),
    el('p', { class: 'landing-def' }, node.definition),
    renderWheel({
      center: { label: node.label, coreId: node.coreId },
      items: kids.map((k) => ({ id: k.id, label: k.label, coreId: k.coreId })),
      onSelect: (it) => go(`/n/${it.id}`),
      onCenter: () => go(parent ? `/n/${parent.id}` : ''),
    }),
    node.guidance ? guidancePanel(node.guidance) : null,
    loggingOn() ? logSection(node, trail) : null,
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
      : el('button', { class: 'crumb', type: 'button', onclick: () => go(`/n/${n.id}`) }, n.label));
  });
  return nav;
}

function drillButton(child) {
  const hasKids = leafChildren(child.id, child).length > 0;
  return el('button', {
    class: 'path-btn', type: 'button', style: `--core: var(--core-${child.coreId})`,
    onclick: () => go(`/n/${child.id}`),
  }, [
    el('span', { class: 'lead' }, child.label),
    el('span', { class: 'sub' }, child.definition),
    hasKids ? el('span', { class: 'more', 'aria-hidden': 'true' }, '›') : null,
  ]);
}

function logSection(node, trail) {
  const note = el('textarea', {
    class: 'log-note', rows: '2', placeholder: 'Optional note…', 'aria-label': 'Optional note',
  });
  const btn = el('button', {
    class: 'primary-btn', type: 'button',
    onclick: async () => {
      await addLog(makeEntry(node, trail, note.value.trim()));
      note.value = '';
      announce(`Saved ${node.label} to your history.`);
      btn.textContent = 'Saved ✓';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Save to history'; btn.disabled = false; }, 1600);
    },
  }, 'Save to history');
  return el('section', { class: 'log-section', 'aria-label': 'Save to history' }, [
    el('h3', { class: 'section-title' }, 'History'),
    note,
    el('div', {}, btn),
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

  const scan = allNodes
    .filter((n) => n.depth === maxDepth())
    .sort((a, b) => a.label.localeCompare(b.label));
  const fieldset = el('fieldset', { class: 'wordgrid' }, [
    el('legend', { class: 'section-title' }, 'Specific feelings — check the ones that fit'),
    ...scan.map((n) => {
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

    place(resultBox,
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
            onclick: () => go(`/n/${w.id}`),
          }, w.label))),
        ]);
      })),
      loggingOn() ? el('button', {
        class: 'ghost-btn', type: 'button', style: 'margin-top:.5rem',
        onclick: async (e) => {
          await addLog({
            id: newId(), ts: new Date().toISOString(),
            nodeId: top.core.id, coreId: top.core.id, path: [top.core.label],
            label: rows.length === 1
              ? `${total} words → ${top.core.label}`
              : `${total} words → mostly ${top.core.label}`,
            selectedSet: chosen.map((n) => n.id),
            appVersion: __APP_VERSION__, datasetVersion: meta.datasetVersion,
          });
          announce('Saved to your history.');
          e.target.textContent = 'Saved ✓';
          e.target.disabled = true;
        },
      }, 'Save these to history') : null,
    );
    announce(rows.length === 1
      ? `All your words point to ${top.core.label}.`
      : `These point mostly to ${top.core.label}.`);
    resultBox.querySelector('[tabindex]')?.focus();
  }

  place(root,
    el('button', { class: 'crumb', type: 'button', onclick: () => go('') }, '‹ Feelings'),
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

// ---------------- History ----------------
async function history() {
  await ensureLoaded();
  const items = getLogsSync();
  place(root,
    el('button', { class: 'crumb', type: 'button', onclick: () => go('') }, '‹ Feelings'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'Your history'),
    el('p', { class: 'muted' }, loggingOn()
      ? 'Saved on this device only. Export a backup (Settings → Your data) to keep it safe.'
      : 'History is off. Turn it on in Settings to save feelings here.'),
    items.length
      ? el('div', { class: 'history' }, items.map(historyEntry))
      : el('p', { class: 'muted' }, 'No saved feelings yet.'),
    items.length
      ? el('button', {
          class: 'ghost-btn', type: 'button',
          onclick: async () => {
            if (window.confirm('Delete all saved history? This cannot be undone.')) {
              await clearLogs();
              history();
            }
          },
        }, 'Clear all history')
      : null,
  );
  announce('Your history.');
  focusView(root);
}

function historyEntry(e) {
  const when = new Date(e.ts).toLocaleString();
  return el('div', { class: 'history-entry', style: `--core: var(--core-${e.coreId || 'sad'})` }, [
    el('div', { class: 'history-head' }, [
      el('button', {
        class: 'history-label', type: 'button',
        onclick: () => e.nodeId && go(`/n/${e.nodeId}`),
      }, e.label),
      el('button', {
        class: 'bar-dismiss', type: 'button', 'aria-label': `Delete ${e.label}`,
        onclick: async () => { await deleteLog(e.id); history(); },
      }, '✕'),
    ]),
    el('div', { class: 'history-when muted' }, when),
    e.path?.length ? el('div', { class: 'muted' }, e.path.join(' › ')) : null,
    e.note ? el('p', { class: 'history-note' }, e.note) : null,
    e.selectedSet?.length
      ? el('div', { class: 'muted' }, `Words: ${e.selectedSet.map((id) => getNode(id)?.label || id).join(', ')}`)
      : null,
  ]);
}

export default {
  id: 'feelings',
  name: 'Feelings Wheel',
  title: 'Feelings',
  tagline: 'Find the word for what you feel.',
  basePath: BASE,
  mark: MARK,
  mount(ctx) {
    root = ctx.content;
    announce = ctx.announce;
    ensureLoaded(); // warm the logs cache so backup export is complete
    route(BASE, home);
    route(`${BASE}/outside-in`, outsideIn);
    route(`${BASE}/history`, history);
    route(`${BASE}/n/:id`, nodeView);
  },
  // Backup slice for this module: dataset version + the on-device history.
  serialize() {
    return { datasetVersion: meta.datasetVersion, logs: getLogsSync() };
  },
  deserialize(data) {
    if (data && Array.isArray(data.logs)) setLogs(data.logs);
  },
};
