/*
 * Game text processor.
 * Can be used to highlight text, display meta-data, shrink or, mute game text.
 */
export function processDisplayText(text) {
  /*
   * This is raw text, from the game.
   */
  text = text.replaceAll('golden sovereigns', 'golden sovereigns 🪙');

  //
  text = text.replace('You must be standing first.', 'You must be standing first 🪑!');

  //
  text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');

  //
  process.stdout.write(text);
}
