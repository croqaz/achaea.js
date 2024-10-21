import ee from '../events/index.ts';

export const Config = {
  //
  // Hunting attack name
  // eg: Bop, Maul, Smite, etc
  ATTACK: null,
  // Auto-attack function
  AUTO_ATTACK: defaultAttack,
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
  // how often to date/ping
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

function defaultAttack() {
  /*
   * Basic action on new round
   * You should use this as a base to make your own
   */
  ee.emit('user:text', typeof Config.ATTACK === 'string' ? Config.ATTACK : 'kill');
}
