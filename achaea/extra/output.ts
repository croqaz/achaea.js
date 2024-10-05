import chokidar from 'chokidar';
import { STATE } from '../core/state.ts';

let customProcessDisplayText;
try {
  // @ts-ignore: Types
  customProcessDisplayText = require('../../custom/output.ts').default;

  // Watch for changes in this file and live reload
  const fileWatcher = chokidar.watch('./custom/output.ts', {
    depth: 1,
    persistent: true,
    ignoreInitial: true,
  });
  fileWatcher.on('change', async () => {
    console.log('Custom user output CHANGED!');
    for (const m of Object.keys(require.cache)) {
      if (/custom\/output/.test(m)) {
        delete require.cache[m];
      }
    }
    customProcessDisplayText = require('../../custom/output.ts').default;
  });
} catch (err) {
  console.error('Error loading user output function!', err);
}

export default function extraProcessDisplayText(text: string): string {
  /*
   * Game text processor.
   * Used to highlight or replace text, display meta-data...
   * This is HTML text, from the game.
   * The output is used for display and the logs,
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

  // Prism tattoo
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

  // This can break some shop items ..
  if (text.includes('sovereign')) {
    text = text.replace(/[ \n\r]+golden[ \n\r]+sovereigns?/g, ' golden sovereigns 🪙');
    text = text.replace(/[ \n\r]+pile of sovereigns/g, ' pile of sovereigns 🪙');
  }

  if (text.includes('the corpse')) {
    text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');
  }

  // Track balance/ equilibrium times
  //
  const dt = new Date();
  if (text.includes('You have recovered balance on all limbs.')) {
    if (STATE.Stats.bal) {
      const diff = (dt.getTime() - STATE.Stats.bal.getTime()) / 1000;
      // Ignore big time diffs; Normal times vary.
      if (diff < 10) {
        text = text.replace(
          'recovered balance on all limbs.',
          `recovered balance on all limbs. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.bal = dt;
  }
  if (text.includes('You have recovered equilibrium.')) {
    if (STATE.Stats.eq) {
      const diff = (dt.getTime() - STATE.Stats.eq.getTime()) / 1000;
      // Ignore big time diffs; Normal times vary.
      if (diff < 10) {
        text = text.replace('recovered equilibrium.', `recovered equilibrium. (${diff.toFixed(2)}s)`);
      }
    }
    STATE.Stats.eq = dt;
  }
  if (text.includes('You may eat another plant or mineral.')) {
    if (STATE.Stats.eat) {
      const diff = (dt.getTime() - STATE.Stats.eat.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1.5-ish sec?
      if (diff < 10) {
        text = text.replace('another plant or mineral.', `another plant or mineral. (${diff.toFixed(2)}s)`);
      }
    }
    STATE.Stats.eat = dt;
  }
  if (text.includes('You may drink another health or mana elixir.')) {
    if (STATE.Stats.drink) {
      const diff = (dt.getTime() - STATE.Stats.drink.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 4-ish sec?
      if (diff < 15) {
        text = text.replace(
          'another health or mana elixir.',
          `another health or mana elixir. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.drink = dt;
  }
  if (text.includes('You may apply another salve to yourself.')) {
    if (STATE.Stats.apply) {
      const diff = (dt.getTime() - STATE.Stats.apply.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1-ish sec?
      if (diff < 10) {
        text = text.replace(
          'apply another salve to yourself.',
          `apply another salve to yourself. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.apply = dt;
  }
  if (text.includes('Your lungs have recovered enough to smoke another mineral or plant.')) {
    if (STATE.Stats.smoke) {
      const diff = (dt.getTime() - STATE.Stats.smoke.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1.5-ish sec?
      if (diff < 10) {
        text = text.replace(
          'enough to smoke another mineral or plant.',
          `enough to smoke another mineral or plant. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.smoke = dt;
  }

  //
  // Gag spammy text
  // If you return nothing, the text will be ignored
  //

  // Run custom function
  if (customProcessDisplayText) {
    text = customProcessDisplayText(text);
  }

  // Return the changed text to be displayed in the GUI
  return text;
}
