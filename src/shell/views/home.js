// Suite home — the toolbox. Lists the registered modules as cards. New modules
// appear here automatically just by registering; nothing else changes.
import { el, focusView, place } from '../dom.js';
import { route } from '../router.js';
import { listModules } from '../registry.js';

function moduleCard(ctx, mod) {
  return el('button', {
    class: 'module-card', type: 'button',
    onclick: () => ctx.navigate(mod.basePath),
    'aria-label': `${mod.title}. ${mod.tagline}`,
  }, [
    el('span', { class: 'module-icon', 'aria-hidden': 'true', ...(mod.mark ? { html: mod.mark } : {}) },
      mod.mark ? undefined : (mod.icon || '•')),
    el('span', { class: 'module-text' }, [
      el('span', { class: 'module-name' }, mod.title),
      el('span', { class: 'module-tagline' }, mod.tagline),
    ]),
  ]);
}

function renderHome(ctx) {
  const mods = listModules();
  place(ctx.content,
    el('h2', { class: 'suite-title', tabindex: '-1', 'data-focus': '' }, 'ND Toolbox'),
    el('p', { class: 'muted' }, 'A small set of quiet tools for checking in with yourself. Everything stays on your device.'),
    el('div', { class: 'module-grid' }, mods.map((m) => moduleCard(ctx, m))),
  );
  ctx.announce('ND Toolbox home.');
  focusView(ctx.content);
}

export function registerHome(ctx) {
  route('/', () => renderHome(ctx));
}
