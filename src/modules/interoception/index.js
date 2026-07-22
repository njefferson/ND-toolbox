// Interoception check-in. Scan a set of body signals, note where each one is,
// then see what your body might be asking for. Calm, opt-in, on-device — same
// ethos and shared shell (settings, backup, accessibility) as Feelings.
import dataset from './data/signals.json';
import { route, navigate } from '../../shell/router.js';
import { el, focusView, place } from '../../shell/dom.js';
import { loadSettings } from '../../shell/services/settings.js';
import {
  ensureLoaded, getLogsSync, addLog, deleteLog, clearLogs, setLogs, newId,
} from './logs.js';

const BASE = '/io';
const go = (p = '') => navigate(BASE + p);
const loggingOn = () => loadSettings().loggingEnabled;

const signals = dataset.signals;
const signalById = new Map(signals.map((s) => [s.id, s]));
const stateOf = (sig, value) => sig.states.find((st) => st.value === value);

// A calm "attention turning inward" mark for the suite card.
export const IO_MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 32)" fill="none" stroke="var(--accent)" stroke-width="3"><circle r="5.5" fill="var(--accent)" stroke="none"/><circle r="13" opacity="0.55"/><circle r="21" opacity="0.28"/></g></svg>`;

let root;
let announce = () => {};

// Current answers persist while the app is open (cleared on "start over").
const answers = {};

// ---------------- Check-in ----------------
function home() {
  const resultBox = el('div', { id: 'io-result', 'aria-live': 'polite' });

  const cards = signals.map((sig) => {
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': sig.question });
    sig.states.forEach((st) => {
      const b = el('button', {
        class: `seg-btn${answers[sig.id] === st.value ? ' active' : ''}`,
        type: 'button', 'aria-pressed': String(answers[sig.id] === st.value),
        onclick: () => {
          answers[sig.id] = st.value;
          seg.querySelectorAll('.seg-btn').forEach((x, i) => {
            const on = sig.states[i].value === st.value;
            x.classList.toggle('active', on);
            x.setAttribute('aria-pressed', String(on));
          });
        },
      }, st.label);
      seg.append(b);
    });
    return el('section', { class: 'signal' }, [
      el('h3', { class: 'signal-q' }, sig.question),
      seg,
    ]);
  });

  place(root,
    el('button', { class: 'crumb', type: 'button', onclick: () => navigate('/') }, '‹ Toolbox'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'Body check-in'),
    el('p', { class: 'muted' },
      'Notice where each one is right now — there are no wrong answers, and you can skip any. Then see what your body might be asking for.'),
    el('div', { class: 'signals' }, cards),
    resultBox,
    el('div', { class: 'landing-actions' }, [
      el('button', { class: 'primary-btn', type: 'button', onclick: () => summarize(resultBox) }, 'What might my body need?'),
      el('button', { class: 'ghost-btn', type: 'button', onclick: () => { for (const k of Object.keys(answers)) delete answers[k]; home(); } }, 'Start over'),
    ]),
    loggingOn() ? el('button', {
      class: 'path-btn', type: 'button', style: 'margin-top:.6rem', onclick: () => go('/history'),
    }, [
      el('span', { class: 'lead' }, 'Your check-in history'),
      el('span', { class: 'sub' }, 'Check-ins you’ve saved on this device.'),
    ]) : null,
  );
  focusView(root);
}

function summarize(resultBox) {
  const noted = Object.entries(answers)
    .map(([id, value]) => ({ sig: signalById.get(id), st: stateOf(signalById.get(id), value) }))
    .filter((x) => x.sig && x.st);
  const needs = noted.filter((x) => x.st.need);

  place(resultBox,
    el('h3', { class: 'section-title', tabindex: '-1' }, 'What your body might be asking for'),
    needs.length
      ? el('div', { class: 'needs' }, needs.map((n) => el('div', { class: 'need-item' }, [
          el('span', { class: 'need-label' }, n.sig.label),
          el('span', { class: 'need-suggestion' }, n.st.suggestion),
        ])))
      : el('p', {}, noted.length
          ? 'Nothing is shouting for attention right now — nice.'
          : 'Nothing marked yet. Tap a state on any signal above, then check again.'),
    needs.length
      ? el('p', { class: 'muted guidance-note' }, 'Gentle suggestions, not instructions. Take what helps.')
      : null,
    (loggingOn() && noted.length)
      ? el('button', {
          class: 'ghost-btn', type: 'button', style: 'margin-top:.5rem',
          onclick: async (e) => {
            await addLog({
              id: newId(), ts: new Date().toISOString(),
              answers: { ...answers }, needs: needs.map((n) => n.sig.id),
              appVersion: __APP_VERSION__, datasetVersion: dataset.datasetVersion,
            });
            announce('Check-in saved to your history.');
            e.target.textContent = 'Saved ✓';
            e.target.disabled = true;
          },
        }, 'Save this check-in')
      : null,
  );
  announce(needs.length
    ? `Your body might want: ${needs.map((n) => n.sig.label.toLowerCase()).join(', ')}.`
    : 'Nothing is asking for attention right now.');
  resultBox.querySelector('[tabindex]')?.focus();
}

// ---------------- History ----------------
async function history() {
  await ensureLoaded();
  const items = getLogsSync();
  place(root,
    el('button', { class: 'crumb', type: 'button', onclick: () => go('') }, '‹ Body check-in'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'Check-in history'),
    el('p', { class: 'muted' }, loggingOn()
      ? 'Saved on this device only. Export a backup (Settings → Your data) to keep it safe.'
      : 'History is off. Turn it on in Settings to save check-ins here.'),
    items.length
      ? el('div', { class: 'history' }, items.map(historyEntry))
      : el('p', { class: 'muted' }, 'No saved check-ins yet.'),
    items.length
      ? el('button', {
          class: 'ghost-btn', type: 'button',
          onclick: async () => {
            if (window.confirm('Delete all saved check-ins? This cannot be undone.')) {
              await clearLogs();
              history();
            }
          },
        }, 'Clear all history')
      : null,
  );
  announce('Check-in history.');
  focusView(root);
}

function historyEntry(e) {
  const when = new Date(e.ts).toLocaleString();
  const needLabels = (e.needs || []).map((id) => signalById.get(id)?.label).filter(Boolean);
  return el('div', { class: 'history-entry' }, [
    el('div', { class: 'history-head' }, [
      el('span', { class: 'history-label' }, needLabels.length ? needLabels.join(' · ') : 'All clear'),
      el('button', {
        class: 'bar-dismiss', type: 'button', 'aria-label': 'Delete check-in',
        onclick: async () => { await deleteLog(e.id); history(); },
      }, '✕'),
    ]),
    el('div', { class: 'history-when muted' }, when),
  ]);
}

export default {
  id: 'interoception',
  name: 'Interoception check-in',
  title: 'Body check-in',
  tagline: 'Notice what your body is telling you.',
  basePath: BASE,
  mark: IO_MARK,
  mount(ctx) {
    root = ctx.content;
    announce = ctx.announce;
    ensureLoaded();
    route(BASE, home);
    route(`${BASE}/history`, history);
  },
  serialize() {
    return { datasetVersion: dataset.datasetVersion, logs: getLogsSync() };
  },
  deserialize(data) {
    if (data && Array.isArray(data.logs)) setLogs(data.logs);
  },
};
