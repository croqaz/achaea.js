/*
 * Global app config.
 */
export const Config = {
  //
  // Hunting attack name
  // eg: Bop, Maul, Smite, etc
  ATTACK: null,
  //
  // No. sips of a full vial
  FULL_VIAL: 190,
  //
  // auto-walk ignored areas
  IGNORED_AREAS: [
    '15', // Ring of portals
    '304', // On the clouds
  ],
  //
  // auto-walk ignored rooms
  IGNORED_ROOMS: [
    '1768', // Ashtan, Gateway to Arboretum of Enlightenment
    '5918', // Polyargos, Magma pit within a volcano (The dragon Yudhishthira)
    '22846', // Hthrak, Deep cavern within the magma (Jeramun, the Flame of the World)
  ],
  //
  // auto-walk delay
  WALK_DELAY: 0.5,
  //
  // replay: seconds to wait between actions
  REPLAY_DELAY: 1,
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
  //
  // Capture ALL the RAW telnet traffic in this file?
  // eg: bun main.ts --trace debug.log <NAME>
  TRACE: '',
  //
  // Fake game events, without telnet: the offline client
  // eg: NODE_ENV=test bun main.ts --fake 1 --telnet 0 <NAME>
  FAKE: false,
};
