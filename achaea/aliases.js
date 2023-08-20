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
    // ...
    return true;
  }

  // more commands
  // flee
  // wander to random exit
}
