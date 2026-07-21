// Dataset loader: validates the taxonomy and builds lookup + search indexes.
// The dataset is data, not code — this module is the only thing that knows its
// shape, so the word list can be edited or swapped without touching the views.
import dataset from './data/wheel.json';

function validate(ds) {
  const errors = [];
  const ids = new Set();
  for (const n of ds.nodes) {
    if (ids.has(n.id)) errors.push(`duplicate id: ${n.id}`);
    ids.add(n.id);
    if (![0, 1, 2].includes(n.depth)) errors.push(`bad depth on ${n.id}`);
    if (n.depth === 0 && n.parentId !== null) errors.push(`core ${n.id} has a parent`);
    if (n.depth > 0 && !n.parentId) errors.push(`non-core ${n.id} has no parent`);
  }
  for (const n of ds.nodes) {
    if (n.parentId && !ids.has(n.parentId)) errors.push(`${n.id} -> missing parent ${n.parentId}`);
    for (const nb of n.neighbors || []) {
      if (!ids.has(nb)) errors.push(`${n.id} -> missing neighbor ${nb}`);
    }
  }
  for (const id of ds.coreOrder) {
    if (!ids.has(id)) errors.push(`coreOrder references missing node ${id}`);
  }
  if (errors.length) throw new Error(`Invalid feelings dataset:\n - ${errors.join('\n - ')}`);
}

validate(dataset);

const byId = new Map(dataset.nodes.map((n) => [n.id, n]));
const childrenByParent = new Map();
for (const n of dataset.nodes) {
  if (!n.parentId) continue;
  if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, []);
  childrenByParent.get(n.parentId).push(n);
}

export const meta = {
  datasetId: dataset.datasetId,
  datasetVersion: dataset.datasetVersion,
  source: dataset.source,
  glyphs: dataset.glyphs,
};

export const cores = dataset.coreOrder.map((id) => byId.get(id));

export const getNode = (id) => byId.get(id);
export const childrenOf = (id) => childrenByParent.get(id) || [];
export const glyphFor = (node) => dataset.glyphs[node.coreId] || '•';

// Root-to-node path (core → ... → node), used for breadcrumbs.
export function pathTo(id) {
  const out = [];
  let cur = byId.get(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : null;
  }
  return out;
}

// Case-insensitive search over label + aliases. Ranks exact > prefix >
// word-boundary > substring, and prefers more specific (deeper) words so a
// direct search lands you on a precise leaf rather than a category.
export function search(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const n of dataset.nodes) {
    const hay = [n.label, ...(n.aliases || [])].map((s) => s.toLowerCase());
    let best = Infinity;
    for (const h of hay) {
      if (h === q) best = Math.min(best, 0);
      else if (h.startsWith(q)) best = Math.min(best, 1);
      else if (new RegExp(`\\b${escapeRe(q)}`).test(h)) best = Math.min(best, 2);
      else if (h.includes(q)) best = Math.min(best, 3);
    }
    if (best < Infinity) scored.push({ node: n, rank: best });
  }
  scored.sort((a, b) => a.rank - b.rank || b.node.depth - a.node.depth || a.node.label.localeCompare(b.node.label));
  return scored.slice(0, limit).map((s) => s.node);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
