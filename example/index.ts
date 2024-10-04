/*
 * Entry file for custom logic.
 */
import { STATE } from '../achaea/core/state.ts';
import { Config } from '../achaea/extra/config.ts';

import './triggers.ts';

// Setup my config
//

// For example, update some default config values ...
Config.EXCLUDE_HERBS = ['kuzu', 'slipper', 'weed'];
Config.EXCLUDE_MATERIAL = ['fruit', 'vegetable', 'grain', 'sugarcane', 'cacao', 'nut', 'lumic'];

// Another example, setup some Custom values
// You can update these values later from custom aliases and triggers
STATE.Custom.whatever1 = 0;
STATE.Custom.whatever2 = '';
