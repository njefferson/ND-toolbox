// Update service. Opt-in by design:
//  - The service worker runs in "prompt" mode, so a new version is downloaded
//    but never activated until applyUpdate() is called (a user tap). Nothing
//    changes mid-session, ever.
//  - "Pause updates" blocks it entirely: we never surface the notice and never
//    apply, and we don't proactively check. (One platform caveat: a fully
//    closed-and-reopened PWA can let an already-downloaded update in; pausing
//    minimizes that by not checking, and What's New always announces a change.)
import { registerSW } from 'virtual:pwa-register';
import { loadSettings, saveSettings } from './settings.js';

let applyFn = null;
let registration = null;
let needRefresh = false;
const listeners = new Set();

export function isPaused() {
  return !!loadSettings().updatesPaused;
}

export function setPaused(value) {
  const s = loadSettings();
  s.updatesPaused = !!value;
  saveSettings(s);
  notify();
}

function state() {
  return { needRefresh: needRefresh && !isPaused(), paused: isPaused() };
}

function notify() {
  for (const cb of listeners) cb(state());
}

export function onUpdateState(cb) {
  listeners.add(cb);
  cb(state());
  return () => listeners.delete(cb);
}

export function initUpdates() {
  applyFn = registerSW({
    immediate: true,
    onNeedRefresh() { needRefresh = true; notify(); },
    onRegisteredSW(_url, reg) { registration = reg || null; },
  });
}

// Apply the waiting update: skipWaiting + reload. Only ever called on user tap.
export function applyUpdate() {
  if (applyFn) applyFn(true);
}

// Manual "check for updates" (used when updates aren't paused).
export async function checkForUpdates() {
  try { await registration?.update(); } catch { /* offline or no reg */ }
}

// What a pending update would change: the deployed changelog minus what we run.
export async function fetchPendingChanges() {
  try {
    const res = await fetch('/changelog.json', { cache: 'no-store' });
    if (!res.ok) return [];
    const all = await res.json();
    return all.filter((r) => cmpVersion(r.version, __APP_VERSION__) > 0);
  } catch {
    return [];
  }
}

function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
