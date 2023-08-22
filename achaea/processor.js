/*
 * Game text processor.
 * Can be used to highlight text, display meta-data, shrink or, mute game text.
 */
export function preProcessText(text) {
  // This is raw text, from the game
  // The output is only used for live display
  // It is NOT used for logging or triggers
  //
  text = text.replaceAll('golden sovereigns', 'golden sovereigns 🪙');

  //
  text = text.replace('You must be standing first.', 'You must be standing first 🪑.');

  //
  text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');

  return text;
}
