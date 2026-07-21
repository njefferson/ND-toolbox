// Shared DOM helpers used by the shell and by modules.

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c?.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

// The app mark: the six-segment feelings wheel, themed via CSS custom props.
export const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 32)"><circle r="30" fill="var(--surface-2)"/><g><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-joyful)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-powerful)" transform="rotate(60)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-peaceful)" transform="rotate(120)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-sad)" transform="rotate(180)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-mad)" transform="rotate(240)"/><path d="M0 0 L26 0 A26 26 0 0 1 13 22.5 Z" fill="var(--core-scared)" transform="rotate(300)"/></g><circle r="10" fill="var(--surface)"/></g></svg>`;

// Move focus to a view's primary heading so screen readers land on new content.
export function focusView(container) {
  container.querySelector('[data-focus]')?.focus();
}
