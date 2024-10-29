import chokidar from 'chokidar';
import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { STATE } from '../core/state.ts';
import { displayNote } from '../core/index.ts';

let customProcessDisplayText = null;
try {
  // @ts-ignore: Types
  customProcessDisplayText = require('../../custom/output.ts').default;
} catch {
  /* -- */
}
// Watch for changes in this file and live reload
const fileWatcher = chokidar.watch('./custom/output.ts', {
  depth: 1,
});
fileWatcher.on('change', () => {
  for (const m of Object.keys(require.cache)) {
    if (/custom\/output/.test(m)) {
      delete require.cache[m];
    }
  }
  try {
    // @ts-ignore: Types
    customProcessDisplayText = require('../../custom/output.ts').default;
    displayNote('INFO: User output function reloaded.');
  } catch (err) {
    customProcessDisplayText = null;
    displayNote(`ERROR: Canot load user output function! ${err}`);
  }
});

export default function extraProcessDisplayText(html: string, text: string): string {
  /*
   * Game text processor.
   * Used to highlight or replace text, display meta-data...
   * This is HTML output, straight from the game.
   * The output is used for display and the logs,
   * it is not used for triggers.
   */

  {
    // Check for wilderness map first
    const mapDescrip = p.validWildMap(html);
    if (mapDescrip && mapDescrip.length == 2) {
      const [map, desc] = mapDescrip;
      // Send wilderness map
      ee.emit('wild:map', map);
      return desc;
    }
  }

  //
  // Visual things
  //

  // Make Hypnotise snap super visible... event if it's late
  html = html.replace(
    /(\w+) snaps (his|her|faes) fingers in front of you\./,
    '$1 snaps $2 fingers 🤞 in front of you 🤢💀 !!!',
  );

  // Make Loki venom super mega visible
  html = html.replace(
    'You are confused as to the effects of the venom.',
    'You are confused ⁉️ as to the effects of the venom 🤢💀 !!!',
  );

  // Prism tattoo
  html = html.replace(
    'A beam of prismatic light suddenly shoots into the room.',
    'A beam of 🌈 PRISMATIC light ✨ suddenly shoots into the room !!',
  );

  // Make shield auras more visible
  if (html.includes('magical shield')) {
    html = html.replace(
      'A nearly invisible magical shield forms around ',
      'A nearly invisible 👻 magical shield 🛡️ forms around ',
    );
  }
  if (html.includes('aura of rebounding')) {
    html = html.replace(
      'You suddenly perceive the vague outline of an aura of rebounding around ',
      'You suddenly perceive the vague outline 👻 of an aura of rebounding 🛡️ around ',
    );
  }
  if (html.includes('prismatic barrier')) {
    html = html.replace(
      ' strums a few notes on a Lasallian lyre, and a prismatic barrier forms around ',
      ' strums a few notes on a Lasallian lyre 🎵 and a prismatic barrier 🛡️ forms around ',
    );
  }

  // This can break some shop items ..
  if (html.includes('sovereign')) {
    html = html.replace(/[ \n\r]+golden[ \n\r]+sovereigns?/g, ' golden sovereigns 🪙');
    html = html.replace(/[ \n\r]+pile of sovereigns/g, ' pile of sovereigns 🪙');
  }

  if (html.includes('the corpse')) {
    html = html.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');
  }

  // Track balance/ equilibrium times
  //
  const dt = new Date();
  if (html.includes('You have recovered balance on all limbs.')) {
    if (STATE.Stats.bal) {
      const diff = (dt.getTime() - STATE.Stats.bal.getTime()) / 1000;
      // Ignore big time diffs; Normal times vary.
      if (diff < 10) {
        html = html.replace(
          'recovered balance on all limbs.',
          `recovered balance on all limbs. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.bal = dt;
  }
  if (html.includes('You have recovered equilibrium.')) {
    if (STATE.Stats.eq) {
      const diff = (dt.getTime() - STATE.Stats.eq.getTime()) / 1000;
      // Ignore big time diffs; Normal times vary.
      if (diff < 10) {
        html = html.replace('recovered equilibrium.', `recovered equilibrium. (${diff.toFixed(2)}s)`);
      }
    }
    STATE.Stats.eq = dt;
  }
  if (html.includes('You may eat another plant or mineral.')) {
    if (STATE.Stats.eat) {
      const diff = (dt.getTime() - STATE.Stats.eat.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1.5-ish sec?
      if (diff < 10) {
        html = html.replace('another plant or mineral.', `another plant or mineral. (${diff.toFixed(2)}s)`);
      }
    }
    STATE.Stats.eat = dt;
  }
  if (html.includes('You may drink another health or mana elixir.')) {
    if (STATE.Stats.drink) {
      const diff = (dt.getTime() - STATE.Stats.drink.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 4-ish sec?
      if (diff < 15) {
        html = html.replace(
          'another health or mana elixir.',
          `another health or mana elixir. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.drink = dt;
  }
  if (html.includes('You may apply another salve to yourself.')) {
    if (STATE.Stats.apply) {
      const diff = (dt.getTime() - STATE.Stats.apply.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1-ish sec?
      if (diff < 10) {
        html = html.replace(
          'apply another salve to yourself.',
          `apply another salve to yourself. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.apply = dt;
  }
  if (html.includes('Your lungs have recovered enough to smoke another mineral or plant.')) {
    if (STATE.Stats.smoke) {
      const diff = (dt.getTime() - STATE.Stats.smoke.getTime()) / 1000;
      // Ignore big time diffs; Normal time should be 1.5-ish sec?
      if (diff < 10) {
        html = html.replace(
          'enough to smoke another mineral or plant.',
          `enough to smoke another mineral or plant. (${diff.toFixed(2)}s)`,
        );
      }
    }
    STATE.Stats.smoke = dt;
  }

  //
  // Gag spammy output
  // If you return nothing, the output will be ignored
  //

  // Run custom function
  if (customProcessDisplayText) {
    html = customProcessDisplayText(html, text);
  }

  // Return the changed HTML to be displayed in the GUI
  return html;
}
