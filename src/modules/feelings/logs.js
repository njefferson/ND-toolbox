// Feelings history — opt-in, on-device only. Stored in IndexedDB (idb-keyval)
// with an in-memory cache so the synchronous backup serializer can read it.
// Off by default; nothing is written unless the user enables history and saves.
import { get, set } from 'idb-keyval';

const KEY = 'nd-toolbox:feelings:logs';
let cache = null; // null = not loaded yet

export async function ensureLoaded() {
  if (cache === null) {
    try { cache = (await get(KEY)) || []; } catch { cache = []; }
  }
  return cache;
}

// Synchronous read for the backup serializer (cache is loaded on module mount).
export function getLogsSync() {
  return cache || [];
}

async function persist() {
  try { await set(KEY, cache); } catch { /* storage unavailable */ }
}

export async function addLog(entry) {
  await ensureLoaded();
  cache.unshift(entry); // newest first
  await persist();
}

export async function deleteLog(id) {
  await ensureLoaded();
  cache = cache.filter((l) => l.id !== id);
  await persist();
}

export async function clearLogs() {
  cache = [];
  await persist();
}

// Replace all logs — used when importing a backup (seed a fresh start).
export function setLogs(arr) {
  cache = Array.isArray(arr) ? arr : [];
  persist();
}

export function newId() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.round(Math.random() * 1e9)}`; }
}
