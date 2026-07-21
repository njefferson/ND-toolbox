// Settings screen — shell-level, shared across modules. Wired to the settings
// service; changes save to the device and apply live (theme, motion, contrast,
// text size, density). Accessibility is the point of the app, so these are
// first-class, reachable from every screen via the masthead.
import { el, focusView } from '../dom.js';
import { route } from '../router.js';
import { loadSettings, saveSettings, applySettings } from '../services/settings.js';
import { exportBackup, parseBackup, applyBackup } from '../services/backup.js';
import { isPaused, setPaused, checkForUpdates, fetchPendingChanges } from '../services/updates.js';

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
      el('legend', {}, 'Simple mode'),
      toggle('Simple mode', 'Fewer words and bigger buttons — good for kids, or for overwhelming days.',
        s.simpleMode, (v) => patch({ simpleMode: v }, v ? 'Simple mode on.' : 'Simple mode off.')),
    ]),

    el('fieldset', { class: 'set-group' }, [
      el('legend', {}, 'History'),
      toggle('Save a history', 'Off by default. When on, you can save the feelings you name to a private history on this device.',
        s.loggingEnabled, (v) => { patch({ loggingEnabled: v }); renderSettings(ctx); }),
      s.loggingEnabled
        ? el('div', { class: 'set-options' }, [
            el('button', { class: 'ghost-btn', type: 'button', onclick: () => ctx.navigate('/history') }, 'View history'),
          ])
        : null,
    ]),

    el('fieldset', { class: 'set-group' }, [
      el('legend', {}, 'Motion & contrast'),
      toggle('Reduce motion', 'Turn off animations and transitions.',
        s.reducedMotion, (v) => patch({ reducedMotion: v })),
      toggle('High contrast', 'Stronger text and border contrast.',
        s.contrast === 'high', (v) => patch({ contrast: v ? 'high' : 'normal' })),
    ]),

    updatesSection(ctx),
    dataSection(ctx),
  );
  ctx.announce('Settings.');
  focusView(ctx.content);
}

// Updates — opt-in, with a clear "blocked" status, how to resume, and a preview
// of what an update would change.
function updatesSection(ctx) {
  const paused = isPaused();
  const pendingBox = el('div', { class: 'pending-box' });

  async function showPending() {
    pendingBox.replaceChildren(el('p', { class: 'muted' }, 'Checking…'));
    const changes = await fetchPendingChanges();
    if (!changes.length) {
      pendingBox.replaceChildren(el('p', { class: 'muted' }, 'You’re on the latest version — nothing to change.'));
      return;
    }
    pendingBox.replaceChildren(
      el('p', {}, 'An update would add:'),
      ...changes.map((rel) => el('div', { class: 'changelog-entry' }, [
        el('p', {}, [el('strong', {}, `v${rel.version} — ${rel.title}`)]),
        el('ul', { class: 'about-list' }, rel.notes.map((n) => el('li', {}, n))),
      ])),
    );
  }

  const children = [
    el('legend', {}, 'Updates'),
    toggle('Pause updates', 'Block all changes. The app stays exactly as it is now, and won’t update until you turn this back on.',
      paused, (v) => { setPaused(v); renderSettings(ctx); }),
  ];
  if (paused) {
    children.push(el('p', { class: 'status-blocked' },
      '● Updates are paused. Nothing will change. Turn the toggle above off to allow updates again.'));
  }
  children.push(el('div', { class: 'set-options' }, [
    paused ? null : el('button', {
      class: 'ghost-btn', type: 'button',
      onclick: async () => { ctx.announce('Checking for updates…'); await checkForUpdates(); showPending(); },
    }, 'Check for updates'),
    el('button', { class: 'ghost-btn', type: 'button', onclick: showPending }, 'See what an update would change'),
  ].filter(Boolean)));
  children.push(pendingBox);
  return el('fieldset', { class: 'set-group' }, children);
}

// "Your data" — immutable export / import (seed a fresh start).
function dataSection(ctx) {
  const fileInput = el('input', { type: 'file', accept: '.json,application/json', class: 'sr-only' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const envelope = parseBackup(await file.text());
      const when = envelope.exportedAt ? new Date(envelope.exportedAt).toLocaleString() : 'an unknown date';
      const ok = window.confirm(
        `Import this backup from ${when}?\n\nThis starts fresh from the backup and replaces your current settings and data on this device.`);
      if (!ok) return;
      applyBackup(envelope);
      ctx.announce('Backup imported. Starting fresh from it.');
      renderSettings(ctx); // reflect the restored settings
    } catch (e) {
      ctx.announce(`Import failed: ${e.message}`);
      window.alert(`Couldn’t import that file.\n\n${e.message}`);
    } finally {
      fileInput.value = '';
    }
  });

  return el('fieldset', { class: 'set-group' }, [
    el('legend', {}, 'Your data'),
    el('p', { class: 'muted', style: 'margin: 0.1rem 0 0.4rem' },
      'Everything stays on this device. Export a backup to keep it safe — on iPad, '
      + 'Share → Save to Files or iCloud Drive. Backups are never changed once saved; '
      + 'importing one starts fresh from that file.'),
    el('div', { class: 'set-options' }, [
      el('button', {
        class: 'primary-btn', type: 'button',
        onclick: () => { exportBackup(); ctx.announce('Backup file created.'); },
      }, 'Export backup'),
      el('button', { class: 'ghost-btn', type: 'button', onclick: () => fileInput.click() }, 'Import backup'),
      fileInput,
    ]),
  ]);
}

export function registerSettings(ctx) {
  route('/settings', () => renderSettings(ctx));
}
