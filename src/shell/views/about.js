// About screen — reached from the ⓘ in the masthead. Explains what the app is,
// why it exists, how to install it, and what's new. All of this lives here
// permanently, so any "what's new" note elsewhere can always point back here.
import { el, focusView } from '../dom.js';
import { route } from '../router.js';
import { CHANGELOG } from '../changelog.js';

function section(title, paragraphs) {
  return el('section', { class: 'prose' }, [
    el('h3', { class: 'section-title' }, title),
    ...paragraphs.map((p) => el('p', {}, p)),
  ]);
}

function list(title, items) {
  return el('section', { class: 'prose' }, [
    el('h3', { class: 'section-title' }, title),
    el('ul', { class: 'about-list' }, items.map((i) => el('li', {}, i))),
  ]);
}

function whatsNew() {
  return el('section', { class: 'prose' }, [
    el('h3', { class: 'section-title' }, 'What’s new'),
    ...CHANGELOG.map((rel) => el('div', { class: 'changelog-entry' }, [
      el('p', {}, [el('strong', {}, `v${rel.version} — ${rel.title}`)]),
      el('ul', { class: 'about-list' }, rel.notes.map((n) => el('li', {}, n))),
    ])),
  ]);
}

function renderAbout(ctx) {
  ctx.content.replaceChildren(
    el('button', { class: 'crumb', type: 'button', onclick: () => ctx.navigate('/') }, '‹ Home'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'About'),

    section('What this is', [
      'Feelings helps you find the precise word for what you feel — by narrowing from a few core feelings out to a specific one, by checking the words that ring true and tracing them back, or by searching.',
      'It’s built to be quick and quiet: usually under ten seconds from opening it to a named feeling.',
    ]),
    section('Why it exists', [
      'Naming a feeling is hard for a lot of neurodivergent people. Recognising “yes, that word fits” is often easier than producing the word from nothing — and having the right word can lower the volume on a feeling and make it easier to know what you need.',
      'This is not a diagnostic or clinical tool, and it isn’t a mood tracker. Identifying the feeling is the point. Logging is optional and off by default.',
    ]),
    list('Install it (works offline after)', [
      'iPad / iPhone (Safari): tap the Share button, then “Add to Home Screen.” Open it from the new icon — it runs full-screen and works with no connection.',
      'Android (Chrome): tap the ⋮ menu, then “Install app” or “Add to Home Screen.”',
      'Computer (Chrome / Edge): click the install icon in the address bar, or ⋮ menu → “Install.”',
      'Tip: export a backup now and then (Settings → Your data) so your history is safe even if the device clears storage.',
    ]),
    whatsNew(),

    el('p', { class: 'muted' }, 'Your data never leaves this device. No account, no server, no tracking.'),
    el('p', { class: 'muted' }, `Version ${__APP_VERSION__} · ${__BUILD_ID__}`),
  );
  ctx.announce('About.');
  focusView(ctx.content);
}

export function registerAbout(ctx) {
  route('/about', () => renderAbout(ctx));
}
