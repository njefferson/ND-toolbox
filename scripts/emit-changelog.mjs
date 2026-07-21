// Emit public/changelog.json from the changelog source. The deployed file lets
// a running (older) app show what a pending update would change, before the
// user chooses to apply it.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CHANGELOG } from '../src/shell/changelog.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'changelog.json'), JSON.stringify(CHANGELOG));
console.log(`wrote public/changelog.json (${CHANGELOG.length} entries)`);
