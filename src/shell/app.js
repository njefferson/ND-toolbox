// The app shell: persistent chrome (masthead with Home + Settings) plus the
// content root that modules and shell-level screens render into. This is the
// seam — a second module renders into the same content root and shares this
// chrome, the settings screen, and the announce channel.
import { el, MARK } from './dom.js';
import { navigate } from './router.js';

export function createShell(mountEl) {
  const content = el('main', { id: 'main', class: 'app-shell', tabindex: '-1' });
  const status = el('div', { role: 'status', 'aria-live': 'polite', class: 'sr-only' });

  const masthead = el('header', { class: 'masthead' }, [
    el('button', { class: 'mast-home', type: 'button', 'aria-label': 'Home', onclick: () => navigate('/') },
      el('span', { html: MARK })),
    el('span', { class: 'mast-title' }, 'Feelings'),
    el('button', {
      class: 'mast-icon', type: 'button', 'aria-label': 'About',
      onclick: () => navigate('/about'),
    }, el('span', { 'aria-hidden': 'true' }, 'ⓘ')),
    el('button', {
      class: 'mast-icon', type: 'button', 'aria-label': 'Settings',
      onclick: () => navigate('/settings'),
    }, el('span', { 'aria-hidden': 'true' }, '⚙')),
  ]);

  // Quiet notices (update available / what's new) live here — above content,
  // never modal, shown only on Home.
  const bars = el('div', { class: 'bars', role: 'region', 'aria-label': 'Notices' });

  // Discreet version stamp, present on every screen so it lands in screenshots.
  const footer = el('footer', { class: 'app-footer' }, `v${__APP_VERSION__} · ${__BUILD_ID__}`);

  mountEl.replaceChildren(masthead, bars, content, footer, status);

  return {
    content,
    bars,
    announce: (msg) => { status.textContent = msg; },
    navigate,
  };
}
