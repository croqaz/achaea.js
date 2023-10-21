const ANSI_CODE = '\x1B[[][0-9]+m';

export default function extraProcessDisplayText(text: string): string {
  /*
   * Game text processor.
   * Used to highlight or replace text, display meta-data...
   * This is raw ANSI text, from the game.
   * It is only used for display in the GUI,
   * it is not used for triggers.
   */

  //
  // Visual things
  //

  // Make Loki venom super mega visible
  text = text.replace(
    'You are confused as to the effects of the venom.',
    'You are confused ⁉️ as to the effects of the venom ☣️🤢💀 !!!',
  );

  if (text.includes('magical shield')) {
    text = text.replace(
      'A nearly invisible magical shield forms around ',
      'A nearly invisible 👻 magical shield 🛡️ forms around ',
    );
  }
  if (text.includes('aura of rebounding')) {
    text = text.replace(
      'You suddenly perceive the vague outline of an aura of rebounding around ',
      'You suddenly perceive the vague outline 👻 of an aura of rebounding 🛡️ around ',
    );
  }

  if (text.includes('the corpse')) {
    text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');
  }

  //
  // Gag spammy text
  //
  // ...

  // Return the changed text to be displayed in the GUI
  return text;
}
