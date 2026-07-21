import './styles/base.css';
import { loadSettings, applySettings } from './shell/services/settings.js';
import { register, getModule } from './shell/registry.js';
import feelings from './modules/feelings/index.js';

// 1. Apply device-local settings before first paint (theme, motion, text size…).
applySettings(loadSettings());

// 2. Register modules with the shell. Only Feelings today; the seam is ready for
//    a second module (interoception) to register here with no other changes.
register(feelings);

// 3. Mount the active module. (Multi-module switching UI arrives with module #2.)
getModule('feelings').mount(document.getElementById('app'));
