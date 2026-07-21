// Minimal hash router. Hash-based so it works from any static host and inside a
// standalone PWA without server rewrites. Routes are owned by modules.
const routes = new Map();
let notFound = () => {};

export function route(pattern, handler) {
  routes.set(pattern, handler);
}

export function setNotFound(handler) {
  notFound = handler;
}

function current() {
  return location.hash.replace(/^#/, '') || '/';
}

// Patterns support a single ':param' segment, e.g. '/feelings/core/:id'.
function match(path) {
  for (const [pattern, handler] of routes) {
    const pSeg = pattern.split('/');
    const aSeg = path.split('/');
    if (pSeg.length !== aSeg.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pSeg.length; i++) {
      if (pSeg[i].startsWith(':')) params[pSeg[i].slice(1)] = decodeURIComponent(aSeg[i]);
      else if (pSeg[i] !== aSeg[i]) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}

export function navigate(path) {
  location.hash = path;
}

export function startRouter() {
  const render = () => {
    const m = match(current());
    if (m) m.handler(m.params);
    else notFound();
  };
  window.addEventListener('hashchange', render);
  render();
}
