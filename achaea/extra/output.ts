let customProcessDisplayText;
try {
  // @ts-ignore: Types
  customProcessDisplayText = (await import('../../custom/output.ts')).default;
  // console.log('Custom user output function loaded!');
} catch {
  // console.error('Custom user output function not found');
}

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

  // Make Hypnotise snap super visible... event if it's late
  text = text.replace(
    /(\w+) snaps (his|her|faes) fingers in front of you\./,
    '$1 snaps $2 fingers 🤞 in front of you 🤢💀 !!!',
  );

  // Make Loki venom super mega visible
  text = text.replace(
    'You are confused as to the effects of the venom.',
    'You are confused ⁉️ as to the effects of the venom 🤢💀 !!!',
  );

  text = text.replace(
    'A beam of prismatic light suddenly shoots into the room.',
    'A beam of PRISMATIC light ✨ suddenly shoots into the room !!',
  );

  // Make shield auras more visible
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
  if (text.includes('prismatic barrier')) {
    text = text.replace(
      ' strums a few notes on a Lasallian lyre, and a prismatic barrier forms around ',
      ' strums a few notes on a Lasallian lyre 🎵 and a prismatic barrier 🛡️ forms around ',
    );
  }

  if (text.includes('sovereign')) {
    text = text.replace(/[ \n\r]+golden[ \n\r]+sovereigns?/g, ' golden sovereigns 🪙');
    text = text.replace(/[ \n\r]+pile of sovereigns/g, ' pile of sovereigns 🪙');
  }

  if (text.includes('the corpse')) {
    text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');
  }

  //
  // Gag spammy text
  //
  // ...

  // Run custom function
  if (customProcessDisplayText) {
    text = customProcessDisplayText(text);
  }

  // Return the changed text to be displayed in the GUI
  return text;
}
