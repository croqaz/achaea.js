import chalk from 'chalk';

import ee from './events.js';
import { STATE } from './states.js';

export function processAliases(text) {
  /*
   * Proces user text input, eg: aliases, custom commands
   */
  text = text.trim();
  const parts = text.split(' ').filter((x) => !!x);

  // Auto target & attack
  if (text.startsWith('qq ')) {
    const tgt = parts.slice(1).join(' ');
    if (tgt !== STATE.MUD.target) {
      STATE.MUD.target = tgt;
      ee.emit('user:text', `st ${tgt}`);
    }
    STATE.MUD.battle = true;
    ee.emit('user:text', `kill ${tgt}`);
    return true;
  }

  // Special commands
  if (text.startsWith('//')) {
    const cmd = text.replace(/^[\/]+/, '');

    // debug commands
    if (cmd === 'me') {
      const x = JSON.stringify(STATE.Myself, null, 2);
      console.log('ME:', chalk.whiteBright(x));
    } else if (cmd === 'where') {
      const x = JSON.stringify(STATE.Location, null, 2);
      console.log('WHERE:', chalk.whiteBright(x));
    } else if (cmd === 'state') {
      const x = JSON.stringify(STATE.MUD, null, 2);
      console.log('STATE:', chalk.whiteBright(x));
    } else {
      console.log(chalk.red(`Unknown command: #${cmd}`));
    }

    return true;
  }

  // more commands
  // flee
  // wander to random exit
}
