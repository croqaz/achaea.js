import chalk from 'chalk';

import ee from '../events.js';
import { STATE, listDenizens } from './state.js';
import { extraProcessUserInput } from '../extra/input.js';

export function processUserInput(text) {
  /*
   * [CORE] proces user text input, eg: aliases, custom commands
   */
  text = text.trim();
  const parts = text.split(' ').filter((x) => !!x);

  // Auto attack specific target
  //
  if (text.startsWith('qq ')) {
    const tgt = parts.slice(1).join(' ');
    if (tgt !== STATE.MUD.target) {
      STATE.MUD.target = tgt;
      ee.emit('user:text', `st ${tgt}`);
    }
    STATE.MUD.battle = true;
    ee.emit('user:text', `kill ${tgt}`);
    return true;
  } else if (text === 'qqa') {
    // Attack first denizen in the room
    const tgt = listDenizens()[0];
    if (tgt !== STATE.MUD.target) {
      STATE.MUD.target = tgt;
      ee.emit('user:text', `st ${tgt}`);
    }
    STATE.MUD.battle = true;
    ee.emit('user:text', `kill ${tgt}`);
    return true;
  } else if (text === 'qq' && STATE.MUD.target) {
    STATE.MUD.battle = true;
    ee.emit('user:text', `kill ${STATE.MUD.target}`);
    return true;
  } else if (text === 'qq') {
    ee.emit('user:text', 'ql');
    return true;
  }

  // Special commands
  //
  if (text.startsWith('//')) {
    const cmd = text.replace(/^[/]+/, '');

    // PANIC
    if (cmd.startsWith('!') || cmd.startsWith('~')) {
      // TODO: create a copy of the default state and restore here
      STATE.MUD.rats = false;
      STATE.MUD.battle = false;
      STATE.MUD.target = null;
      STATE.MUD.waresDB = false;
      STATE.MUD.whoisDB = false;
      console.log('PANIC!');
    }

    // Debug commands
    else if (cmd === 'me') {
      const x = JSON.stringify(STATE.Myself, null, 2);
      console.log('ME:', chalk.whiteBright(x));
    } else if (cmd === 'where') {
      const x = JSON.stringify(STATE.Location, null, 2);
      console.log('WHERE:', chalk.whiteBright(x));
    } else if (cmd === 'state') {
      const x = JSON.stringify(STATE.MUD, null, 2);
      console.log('STATE:', chalk.whiteBright(x));
    }

    // Don't return here! Continue processing.
  }

  return extraProcessUserInput(text, parts);
}
