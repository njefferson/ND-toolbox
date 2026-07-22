// Interoception history — opt-in, on-device only. Same pattern as the feelings
// log store (IndexedDB via idb-keyval + an in-memory cache for the synchronous
// backup serializer), keyed separately so each module owns its own history.
import { get, set } from 'idb-keyval';

const KEY = 'nd-toolbox:interoception:logs';
let cache = null;

export async function ensureLoaded() {
  if (cache === null) {
    try { cache = (await get(KEY)) || []; } catch { cache = []; }
  }
  return cache;
}

export function getLogsSync() {
  return cache || [];
}

async function persist() {
  try { await set(KEY, cache); } catch { /* storage unavailable */ }
}

export async function addLog(entry) {
  await ensureLoaded();
  cache.unshift(entry);
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

export function setLogs(arr) {
  cache = Array.isArray(arr) ? arr : [];
  persist();
}

export function newId() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.round(Math.random() * 1e9)}`; }
}
