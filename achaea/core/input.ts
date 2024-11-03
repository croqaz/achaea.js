import * as R from 'remeda';
import ee from '../events/index.ts';
import * as state from './state.ts';
import { STATE } from './state.ts';
import { Config } from '../config.ts';
import { queueCmd } from './queue.ts';
import { customUserInput } from './custom.ts';

// optionally, import extras
let extraProcessUserInput: typeof module;
if (Config.EXTRA) extraProcessUserInput = await import('../extra/input.ts');

// let count = 1;

export default function processUserInput(text: string): string | void {
  /*
   * [CORE] proces user text input, eg: aliases, custom commands
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   */
  // console.time(`core-input-${count}`);

  const parts = text.split(' ').filter((x) => !!x);
  const firstWord = parts[0].toLowerCase();
  const secondWord = parts[1] ? parts[1].toLowerCase() : '';
  const otherWords = parts[2] ? parts.slice(2).join(' ') : '';

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
    return;
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
    return 'quit';
  }

  // Optional: run extra input processing
  if (extraProcessUserInput) {
    const extraText = extraProcessUserInput.default({
      text,
      parts,
      firstWord,
      secondWord,
      otherWords,
    });
    if (extraText !== text) return extraText;
  }

  // Optional: run custom input processing
  {
    const customFunc = customUserInput();
    if (customFunc) {
      try {
        const customText = customFunc({
          text,
          parts,
          firstWord,
          secondWord,
          otherWords,
        });
        if (customText !== text) return customText;
      } catch (err) {
        console.error("Can't process custom user input:", err);
      }
    }
  }

  if (text.startsWith('//')) {
    ee.emit('sys:text', `<i class="c-dim c-red"><b>[SYS]</b>: Invalid sys command!</i>`);
    return;
  }

  return text;
}
