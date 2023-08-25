import ee from '../events.js';
import { DB } from './leveldb.js';
import { STATE } from '../core/state.js';

export function extraProcessUserInput(text, parts) {
  /*
   * [EXTRA] proces user text input, eg: aliases, custom commands
   */

  // Special commands
  //
  if (text.startsWith('//')) {
    const cmd = text.replace(/^[/]+/, '');

    // Collect wares DB
    if (cmd === 'wares') {
      STATE.MUD.waresDB = true;
      ee.emit('user:text', 'wares');
    }
    // Collect whois DB
    else if (cmd === 'who') {
      STATE.MUD.whoisDB = true;
      ee.emit('user:text', 'qwho');
    }

    // DB Query in game
    // eg: db wares vial
    // eg: db whois Sarapis
    if (cmd.startsWith('db ')) {
      if (parts.length !== 3) {
        return console.error('DB query must specify 3 args');
      }
      const prefix = parts[1];
      const key = parts[2].toLowerCase();
      (async function dbList() {
        for await (const item of DB.values({ gte: `${prefix}-a`, lte: `${prefix}-z` })) {
          if (item.id.startsWith(key)) console.log(item);
        }
      })();
    }
    // end of special cmds
    return true;
  }
}
