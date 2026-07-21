// Module registry — the suite seam. Each module is a self-contained tool that
// registers here. The shell mounts whichever modules are registered; a future
// interoception module slots in with zero changes to existing modules.
//
// Module contract:
//   {
//     id: string,                       // stable, unique, used as the store namespace
//     name: string,                     // human label
//     icon: string,                     // emoji or short glyph
//     mount(root, ctx): void|() => void // render into root; may return a cleanup fn
//     serialize?(): object              // slice for the backup envelope (added later)
//     deserialize?(data): void          // seed from a backup slice (added later)
//   }
const modules = new Map();

export function register(module) {
  if (!module?.id) throw new Error('module requires an id');
  if (modules.has(module.id)) throw new Error(`module already registered: ${module.id}`);
  modules.set(module.id, module);
}

export function getModule(id) {
  return modules.get(id);
}

export function listModules() {
  return [...modules.values()];
}
