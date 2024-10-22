import ee from '../events/index.ts';
import * as state from './state.ts';
import { STATE } from './state.ts';
import { queueCmd } from './queue.ts';
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
  if (text === 'greedy') {
    STATE.Misc.greed = !STATE.Misc.greed;
    if (STATE.Misc.greed) {
      return 'selfishness';
    } else {
      return 'generosity';
    }
  } //
  // Hacked "generosity" command, when greediness is enabled
  else if (STATE.Misc.greed && text === 'generosity') {
    STATE.Misc.greed = false;
    return text;
  } //
  // Hacked "give" command, when greediness is enabled
  else if (STATE.Misc.greed && parts[0] === 'give' && parts.length > 3) {
    STATE.Misc.greed = false;
    // generosity & selfishness require equilibrium
    queueCmd('eq', 'generosity');
    queueCmd('eq', text);
    queueCmd('eq', 'selfishness');
    setTimeout(() => {
      STATE.Misc.greed = true;
    }, 1000);
    return '';
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
    } else if (cmd === 'setup') {
      /*
       * Debug commands
       */
      ee.emit('user:text', 'config AdvancedCuring on');
      ee.emit('user:text', 'config AutoOpenDoors on');
      ee.emit('user:text', 'config CommandSeparator &&');
      ee.emit('user:text', 'config ScreenWidth 0');
      ee.emit('user:text', 'config XTERM256 off');
      return;
    } else if (cmd === 'me') {
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
    STATE.Misc.quitting = true;
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
