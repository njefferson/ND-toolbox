// Settings screen — shell-level, shared across modules. Wired to the settings
// service; changes save to the device and apply live (theme, motion, contrast,
// text size, density). Accessibility is the point of the app, so these are
// first-class, reachable from every screen via the masthead.
import { el, focusView } from '../dom.js';
import { route } from '../router.js';
import { loadSettings, saveSettings, applySettings } from '../services/settings.js';

function radioGroup(legend, name, options, current, onSelect) {
  return el('fieldset', { class: 'set-group' }, [
    el('legend', {}, legend),
    el('div', { class: 'set-options' }, options.map((o) => {
      const input = el('input', { type: 'radio', name, value: String(o.value) });
      if (String(o.value) === String(current)) input.checked = true;
      input.addEventListener('change', () => { if (input.checked) onSelect(o.value); });
      return el('label', { class: 'set-radio' }, [input, el('span', {}, o.label)]);
    })),
  ]);
}

function toggle(label, hint, checked, onChange) {
  const input = el('input', { type: 'checkbox' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', { class: 'set-toggle' }, [
    input,
    el('span', { class: 'set-toggle-text' }, [
      el('span', { class: 'set-toggle-label' }, label),
      hint ? el('span', { class: 'set-toggle-hint' }, hint) : null,
    ]),
  ]);
}

function renderSettings(ctx) {
  const s = loadSettings();
  const patch = (change, msg) => {
    Object.assign(s, change);
    saveSettings(s);
    applySettings(s);
    if (msg) ctx.announce(msg);
  };

  ctx.content.replaceChildren(
    el('button', { class: 'crumb', type: 'button', onclick: () => ctx.navigate('/') }, '‹ Home'),
    el('h2', { class: 'landing-title', tabindex: '-1', 'data-focus': '' }, 'Settings'),
    el('p', { class: 'muted' }, 'Saved on this device. Changes apply right away.'),

    radioGroup('Appearance', 'theme', [
      { value: 'auto', label: 'Match system' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'mono', label: 'Calm monochrome' },
    ], s.theme, (v) => patch({ theme: v }, `Appearance set to ${v}.`)),

    radioGroup('Text size', 'textScale', [
      { value: 0.9, label: 'Small' },
      { value: 1, label: 'Default' },
      { value: 1.2, label: 'Large' },
      { value: 1.4, label: 'Larger' },
    ], s.textScale, (v) => patch({ textScale: v }, 'Text size updated.')),

    radioGroup('Layout', 'density', [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'low-stim', label: 'Low-stimulation' },
    ], s.density, (v) => patch({ density: v }, 'Layout updated.')),

    el('fieldset', { class: 'set-group' }, [
      el('legend', {}, 'Motion & contrast'),
      toggle('Reduce motion', 'Turn off animations and transitions.',
        s.reducedMotion, (v) => patch({ reducedMotion: v })),
      toggle('High contrast', 'Stronger text and border contrast.',
        s.contrast === 'high', (v) => patch({ contrast: v ? 'high' : 'normal' })),
    ]),
  );
  ctx.announce('Settings.');
  focusView(ctx.content);
}

export function registerSettings(ctx) {
  route('/settings', () => renderSettings(ctx));
}
