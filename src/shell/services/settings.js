// Device-local settings. Stored in localStorage (small, synchronous, survives
// reloads). Included in backups per the plan. App updates never clear this.
const KEY = 'nd-toolbox:settings:v1';

export const DEFAULT_SETTINGS = {
  theme: 'auto', // auto | light | dark | mono
  reducedMotion: false, // manual toggle (system preference also honored)
  contrast: 'normal', // normal | high
  density: 'comfortable', // comfortable | low-stim
  textScale: 1, // 0.9 .. 1.6
  navMode: 'columns', // columns | wheel
  wordDepth: 3, // 2 | 3
  simpleMode: false, // fewer words, bigger targets (kids / overwhelming days)
  updatesPaused: false, // block updates entirely until turned back on
  loggingEnabled: false,
  datasetVersion: 1,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage may be unavailable in private mode; app still works in-session */
  }
}

// Reflect settings onto the document root so CSS can respond.
export function applySettings(settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.contrast = settings.contrast;
  root.dataset.density = settings.density;
  root.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  root.dataset.simple = settings.simpleMode ? 'on' : 'off';
  root.style.setProperty('--text-scale', String(settings.textScale));
}
