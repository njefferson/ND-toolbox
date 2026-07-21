// Quiet notice bars: "update available" and "what's new". Never modal, never
// mid-task — only on Home, dismissible, reduced-motion-safe (CSS handles that).
import { el } from './dom.js';
import { onUpdateState, applyUpdate } from './services/updates.js';

const SEEN_KEY = 'nd-toolbox:lastSeenVersion';

export function initBars(ctx) {
  const slot = ctx.bars;
  let updateReady = false;

  // "What's new": show once after the running version changes from last seen.
  // Never on first run (we just record the version silently).
  let seen;
  try { seen = localStorage.getItem(SEEN_KEY); } catch { seen = null; }
  let showWhatsNew = !!seen && seen !== __APP_VERSION__;
  if (!seen) rememberVersion();

  onUpdateState(({ needRefresh }) => { updateReady = needRefresh; render(); });
  window.addEventListener('hashchange', render);
  render();

  function onHome() {
    return (location.hash.replace(/^#/, '') || '/') === '/';
  }

  function rememberVersion() {
    try { localStorage.setItem(SEEN_KEY, __APP_VERSION__); } catch { /* private mode */ }
  }

  function render() {
    slot.replaceChildren();
    if (!onHome()) return;
    if (showWhatsNew) slot.append(whatsNewBar());
    else if (updateReady) slot.append(updateBar());
  }

  function bar(text, actions, onDismiss) {
    return el('div', { class: 'bar', role: 'status' }, [
      el('span', { class: 'bar-text' }, text),
      el('span', { class: 'bar-actions' }, [
        ...actions,
        el('button', {
          class: 'bar-dismiss', type: 'button', 'aria-label': 'Dismiss', onclick: onDismiss,
        }, '✕'),
      ]),
    ]);
  }

  function updateBar() {
    return bar('A new version is ready.', [
      el('button', { class: 'bar-btn', type: 'button', onclick: () => applyUpdate() }, 'Update now'),
    ], () => { updateReady = false; render(); });
  }

  function whatsNewBar() {
    return bar(`Updated to v${__APP_VERSION__}.`, [
      el('button', {
        class: 'bar-btn', type: 'button',
        onclick: () => { rememberVersion(); showWhatsNew = false; ctx.navigate('/about'); },
      }, 'See what’s new'),
    ], () => { rememberVersion(); showWhatsNew = false; render(); });
  }
}
