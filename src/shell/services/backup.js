// Backup service — the immutable export/import format shared across the suite.
//
// Rules (from the plan):
//  - All user data lives on-device. A backup is a single self-describing JSON
//    file the user saves themselves (on iOS: the share sheet → Files/iCloud).
//  - Backups are immutable: a new export is a new timestamped file, never an
//    overwrite of an old one.
//  - Import = seed a fresh start (replace), not merge.
//  - App updates never touch user data; only the user's own import does.
//
// Envelope shape:
//   {
//     format: "nd-toolbox-backup",
//     schemaVersion: 1,
//     exportedAt: <ISO>,
//     suite: { version: 1, settings: {…} },     // settings are shell-global
//     modules: { feelings: { … } }              // per-module data slices
//   }
import { loadSettings, saveSettings, applySettings, DEFAULT_SETTINGS } from './settings.js';
import { listModules } from '../registry.js';

export const BACKUP_FORMAT = 'nd-toolbox-backup';
export const BACKUP_SCHEMA = 1;

export function buildBackup() {
  const modules = {};
  for (const m of listModules()) {
    modules[m.id] = typeof m.serialize === 'function' ? m.serialize() : {};
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    suite: { version: 1, settings: loadSettings() },
    modules,
  };
}

export function backupFilename(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
    + `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
  return `nd-toolbox-backup-${stamp}.json`;
}

// Trigger a download. On iOS Safari an <a download> click routes through the
// share sheet, letting the user save into Files → iCloud Drive.
export function exportBackup() {
  const envelope = buildBackup();
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return envelope;
}

export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  if (!data || data.format !== BACKUP_FORMAT) {
    throw new Error('That doesn’t look like an ND Toolbox backup.');
  }
  if (typeof data.schemaVersion !== 'number' || data.schemaVersion > BACKUP_SCHEMA) {
    throw new Error('This backup is from a newer version of the app.');
  }
  return data;
}

// Seed a fresh start from a backup: replace settings, hand each module its slice.
export function applyBackup(envelope) {
  const settings = { ...DEFAULT_SETTINGS, ...(envelope.suite?.settings || {}) };
  saveSettings(settings);
  applySettings(settings);
  for (const m of listModules()) {
    if (typeof m.deserialize === 'function' && envelope.modules?.[m.id]) {
      m.deserialize(envelope.modules[m.id]);
    }
  }
}
