import chokidar from 'chokidar';
import { displayNote } from '../core/index.ts';

let customUserConfig = null;
// Watch for changes in this file and live reload
const fileWatcher = chokidar.watch('./custom/config.ts', {
  depth: 1,
  atomic: true,
  persistent: true,
});
fileWatcher.on('change', async () => {
  for (const m of Object.keys(require.cache)) {
    if (/custom\/config/.test(m)) {
      delete require.cache[m];
    }
  }
  try {
    // @ts-ignore: Types
    customUserConfig = require('../../custom/config.ts').default;
    displayNote('INFO: User config reloaded.');
  } catch (err) {
    customUserConfig = null;
    displayNote(`ERROR: Canot load user config! ${err}`);
  }
});

export const Config = {
  //
  // Hunting attack name
  // eg: Bop, Maul, Smite, etc
  ATTACK: null,
  //
  // auto-walk ignored areas
  IGNORED_AREAS: [
    '15', // Ring of portals
    '304', // On the clouds
  ],
  //
  // auto-walk ignored rooms
  IGNORED_ROOMS: [],
  //
  // auto-walk delay
  WALK_DELAY: 0.5,
  //
  // how often to ping
  PING_INTERVAL: 10_000,

  //
  // Ignore some minerals from extract
  EXCLUDE_MINERALS: [],
  //
  // Ignore some herbs from harvest
  // The kuzu vine of the jungles has thickening properties that make it a necessary ingredient in all salves.
  // The lady's slipper plant is used in various concoctions.
  EXCLUDE_HERBS: ['kuzu', 'slipper'],
  //
  // Ignore some gathering materials
  EXCLUDE_MATERIAL: ['fruit', 'vegetable'],
};
