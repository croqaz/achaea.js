import ee from '../events/index.ts';
import * as state from './state.ts';
import { STATE } from './state.ts';
import extraProcessUserInput from '../extra/input.ts';

// let count = 1;

export default function processUserInput(text: string): string | void {
  /*
   * [CORE] proces user text input, eg: aliases, custom commands
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   */
  // console.time(`core-input-${count}`);

  text = text.trim();
  const parts = text.split(' ').filter((x) => !!x);

  // Thief protection
  //
  if (text === 'greed') {
    STATE.Custom.greed = !STATE.Custom.greed;
    if (STATE.Custom.greed) {
      return 'selfishness';
    } else {
      return 'generosity';
    }
  }

  // Special commands
  //
  if (text.startsWith('//')) {
    const cmd = text.replace(/^[/]+/, '');

    // PANIC
    if (cmd.startsWith('!') || cmd.startsWith('~')) {
      state.resetDefaultState();
      ee.emit('sys:text', '[SYS] PANIC!!');
      return;
    }

    // Debug commands
    else if (cmd === 'me') {
      const x = JSON.stringify(STATE.Me, null, 2);
      ee.emit('sys:text', `ME: ${x}`);
      return;
    } else if (cmd === 'room') {
      const x = JSON.stringify(STATE.Room, null, 2);
      ee.emit('sys:text', `ROOM: ${x}`);
      return;
    } else if (cmd === 'battle') {
      const x = JSON.stringify(STATE.Battle, null, 2);
      ee.emit('sys:text', `BATTLE: ${x}`);
      return;
    } else if (cmd === 'stats') {
      const x = JSON.stringify(STATE.Stats, null, 2);
      ee.emit('sys:text', `STATS: ${x}`);
      return;
    }

    // Don't return here! Continue processing...
  }

  // The user will quit
  if (text === 'quit') {
    STATE.Custom.quitting = true;
  }

  const extra = extraProcessUserInput(text, parts);

  // Intercept unprocessed special cmds
  if (extra && extra.startsWith('//')) return;

  // Input intentionally ignored
  if (extra === '') return;

  // console.timeEnd(`core-input-${count}`);
  // count++;

  return extra;
}
