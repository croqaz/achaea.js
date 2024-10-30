import * as R from 'remeda';
import ee from '../events/index.ts';
import * as state from './state.ts';
import { STATE } from './state.ts';
import { Config } from '../config.ts';
import { queueCmd } from './queue.ts';

// optionally, import extras
let extraProcessUserInput = null;
if (Config.EXTRA) extraProcessUserInput = await import('../extra/input.ts');

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
    } else if (cmd.startsWith('state.')) {
      const s = R.capitalize(cmd.split('.', 2).pop()!);
      const j = JSON.stringify(STATE[s], null, 2);
      ee.emit('sys:text', `STATE.${s}: ${j}`);
      return;
    }

    // Don't return here! Continue processing...
  }

  // The user will quit
  if (text === 'quit') {
    STATE.Misc.quitting = true;
  }

  if (extraProcessUserInput) {
    const extra = extraProcessUserInput.default(text, parts);

    // console.timeEnd(`core-input-${count}`);
    // count++;

    // Intercept unprocessed special cmds
    if (extra && extra.startsWith('//')) return;

    // Input intentionally ignored
    if (extra === '') return;

    return extra;
  } else {
    return text;
  }
}
