import './styles/base.css';
import { loadSettings, applySettings } from './shell/services/settings.js';
import { register, listModules } from './shell/registry.js';
import { createShell } from './shell/app.js';
import { registerHome } from './shell/views/home.js';
import { registerSettings } from './shell/views/settings.js';
import { registerAbout } from './shell/views/about.js';
import { startRouter } from './shell/router.js';
import { initUpdates } from './shell/services/updates.js';
import { initBars } from './shell/bars.js';
import feelings from './modules/feelings/index.js';
import interoception from './modules/interoception/index.js';

// 1. Apply device-local settings before first paint (theme, motion, text size…).
applySettings(loadSettings());

// 2. Build the shell chrome + content root. Modules and shell screens render
//    into ctx.content and share ctx.announce / ctx.navigate.
const ctx = createShell(document.getElementById('app'));

// 3. Register modules and shell-level screens (each registers its own routes).
register(feelings);
register(interoception);
registerHome(ctx);
registerSettings(ctx);
registerAbout(ctx);
for (const mod of listModules()) mod.mount(ctx);

// 4. Start routing once every route is registered.
startRouter();

// 5. Quiet notices (update available / what's new) and opt-in update wiring.
initBars(ctx);
initUpdates();
