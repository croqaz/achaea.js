import ee from '../events.js';
import * as state from './state.js';
import { STATE, listDenizens } from './state.js';
import { extraProcessUserInput } from '../extra/input.js';

export function processUserInput(text) {
  /*
   * [CORE] proces user text input, eg: aliases, custom commands
   * This function HAS TO BE SUPER FAST !!
   */
  console.time('proc-input');

  text = text.trim();
  const parts = text.split(' ').filter((x) => !!x);

  // Auto attack specific target
  //
  if (text.startsWith('qq ')) {
    // Attack specific target
    const tgt = parts.slice(1).join(' ');
    // Reset target. Useful after you flee!
    if (tgt === '-' || tgt === '0') {
      STATE.MUD.target = null;
      STATE.MUD.battle = false;
      return true;
    }
    if (tgt !== STATE.MUD.target) {
      STATE.MUD.target = tgt;
      ee.emit('user:text', `st ${tgt}`);
    }
    STATE.MUD.battle = true;
    // Alias set kk <...>
    ee.emit('user:text', `kk ${tgt}`);
    return true;
  } else if (text === 'qqa') {
    // Attack first denizen in the room
    const tgt = listDenizens()[0];
    if (tgt !== STATE.MUD.target) {
      STATE.MUD.target = tgt;
      ee.emit('user:text', `st ${tgt}`);
    }
    STATE.MUD.battle = true;
    // Alias set kk <...>
    ee.emit('user:text', `kk ${tgt}`);
    return true;
  } else if (text === 'qq' && STATE.MUD.target) {
    // Attack the last used target
    STATE.MUD.battle = true;
    ee.emit('user:text', `kk ${STATE.MUD.target}`);
    return true;
  } else if (text === 'qq') {
    // If there is no target, replace the QUIT cmd
    ee.emit('user:text', 'QL');
    return true;
  }

  // LL = look at all denizens
  else if (text === 'll') {
    for (const d of listDenizens()) {
      ee.emit('user:text', `LOOK ${d}`);
      return true;
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
      return true;
    }

    // Thief protection
    else if (cmd === 'greed') {
      STATE.MUD.greed = !STATE.MUD.greed;
      if (STATE.MUD.greed) {
        ee.emit('user:text', 'selfishness');
      } else {
        ee.emit('user:text', 'generosity');
      }
      return true;
    }

    // Debug commands
    else if (cmd === 'me') {
      const x = JSON.stringify(STATE.Myself, null, 2);
      ee.emit('sys:text', `ME: ${x}`);
      return true;
    } else if (cmd === 'room') {
      const x = JSON.stringify(STATE.RoomInfo, null, 2);
      ee.emit('sys:text', `ROOM: ${x}`);
      return true;
    } else if (cmd === 'state') {
      const x = JSON.stringify(STATE.MUD, null, 2);
      ee.emit('sys:text', `STATE: ${x}`);
      return true;
    }

    // Don't return here! Continue processing...
  }

  const extra = extraProcessUserInput(text, parts);

  console.timeEnd('proc-input');
  return extra;
}
