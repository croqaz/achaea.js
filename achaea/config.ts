/*
 * Global app config.
 */
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
  // Ignore some herbs from harvest (feel free to change this)
  // The kuzu vine of the jungles has thickening properties that make it a necessary ingredient in all salves.
  // The lady's slipper plant is used in various concoctions.
  EXCLUDE_HERBS: ['kuzu', 'slipper'],
  //
  // Ignore some gathering materials (feel free to change this)
  EXCLUDE_MATERIAL: ['fruit', 'vegetable'],

  //
  // Enable loading extra features?
  // eg: extra input, output, triggers
  EXTRA: true,
  //
  // Enable auto-login?
  LOGIN: true,
  //
  // Achaea telnet instance
  ACHAEA: 'achaea.com',
};
