import asciiTable from 'as-table';

import ee from '../events/index.ts';
import * as db from './leveldb.js';
import * as m from '../maps/index.ts';
import * as w from '../maps/walker.ts';
import { STATE, listDenizens } from '../core/state.ts';

let customProcessUserInput;
try {
  // @ts-ignore: Types
  customProcessUserInput = (await import('../../custom/input.ts')).default;
  // console.log('Custom user input function loaded!');
} catch {
  // console.error('Custom user input function not found');
}

export default function extraProcessUserInput(text: string, parts: string[]): string | void {
  /*
   * [EXTRA] proces user text input, eg: aliases, custom commands
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   */
  const firstWord = parts[0].toLowerCase();
  const secondWord = parts[1] ? parts[1].toLowerCase() : '';
  const query = parts[2] ? parts.slice(2).join(' ') : '';

  // WWW = writhe forever
  // WXX = writhe stop
  // You begin to writhe helplessly, throwing your body off balance
  if (text === 'www') {
    STATE.Custom.writhe = true;
    return 'WRITHE';
  } else if (text === 'wwx' || text === 'wxx') {
    STATE.Custom.writhe = false;
    return;
  }

  // Collect wares DB
  if (firstWord === 'wares' || (firstWord === 'cart' && secondWord === 'wares')) {
    STATE.Custom.waresDB = true;
    return text;
  }
  // Collect whois DB
  else if (firstWord === 'qwho') {
    STATE.Custom.whoisDB = true;
    return text;
  }

  // LL = look at all denizens
  // LA = look at all players
  else if (text === 'll') {
    for (const d of listDenizens()) {
      ee.emit('user:text', `LOOK ${d}`);
    }
    return;
  } else if (text === 'la') {
    for (const p of STATE.Room.players) {
      ee.emit('user:text', `LOOK ${p.name}`);
    }
    return;
  }

  // Special commands
  //
  if (text.startsWith('//')) {
    const fullCmd = text.toLowerCase().replace(/^[/]+/, '');

    //
    // Stress an object, eg: in quests
    if (firstWord === '//stress' && parts.length === 2) {
      // Maybe also LIGHT object ?
      const thing = secondWord;
      ee.emit('user:text', `TOUCH ${thing}`);
      ee.emit('user:text', `PUSH ${thing}`);
      ee.emit('user:text', `PULL ${thing}`);
      ee.emit('user:text', `TWIST ${thing}`);
      ee.emit('user:text', `TURN ${thing}`);
      ee.emit('user:text', `SHAKE ${thing}`);
      ee.emit('user:text', `RING ${thing}`);
      ee.emit('user:text', `OPEN ${thing}`);
    }
    //
    // Say all kinds of questy things to an NPC
    else if (firstWord === '//quest' && parts.length === 2) {
      const npc = secondWord;
      ee.emit('user:text', `GREET ${npc}`);
      // ee.emit('user:text', `SAY TO ${npc} errand`);
      ee.emit('user:text', `SAY TO ${npc} quest`);
      ee.emit('user:text', `SAY TO ${npc} job`);
    }
    //
    // Auto mapper/ walking...
    // GOTO 1234 | STOP | START | NEXT | PREV
    //
    else if (firstWord === '//goto') {
      if (secondWord === 'next' || secondWord === 'prev') {
        const walk = STATE.Custom.autoWalk ? STATE.Custom.autoWalk.walk : null;
        if (walk) {
          const n = walk[secondWord]();
          if (n && n.dir) {
            ee.emit('user:text', n.dir);
          } else {
            ee.emit('sys:text', '<b>[Path]</b>: Direction not defined!');
          }
        } else {
          ee.emit('sys:text', '<b>[Path]</b>: Walk not defined!');
        }
      } else if (secondWord === 'stop' || secondWord === 'start') {
        const walk = STATE.Custom.autoWalk ? STATE.Custom.autoWalk.walk : null;
        if (walk) {
          ee.emit('sys:text', `<b>[Path]</b>: Walk ${secondWord}!`);
          STATE.Custom.autoWalk[secondWord]();
        } else {
          ee.emit('sys:text', '<b>[Path]</b>: Walk not defined!');
        }
      } // JS hack to check if param is numeric
      else if (+secondWord) {
        setTimeout(async function () {
          const fromID = STATE.Room.num.toString();
          STATE.Custom.autoWalk = await w.autoWalker(fromID, secondWord, { type: query });
          if (STATE.Custom.autoWalk && STATE.Custom.autoWalk.walk) {
            const len = STATE.Custom.autoWalk.walk.path.length;
            const m = `<b>[Path]</b>: Walk from: ${fromID} to: ${secondWord} is <b>${len} rooms</b> distance.`;
            ee.emit('sys:text', m);
          }
        }, 1);
      } else {
        console.error('[SYS] Unknown GOTO command');
      }
      return;
    }
    //
    // Query MAP info in game
    else if (firstWord === '//map') {
      if (parts.length < 3) {
        console.error('MAP query must specify 3 args');
        return;
      }
      if (secondWord === 'room') {
        const arr = m.findRooms(query).map((x) => {
          let name = x.title;
          if (name.length > 30) name = name.slice(0, 30) + '…';
          if (x.area.length > 24) x.area = x.area.slice(0, 24) + '…';
          return {
            id: x.id,
            name,
            areaID: x.areaID,
            area: x.area,
            env: x.environment,
          };
        });
        if (!arr.length) ee.emit('sys:text', '---');
        else ee.emit('sys:text', asciiTable.configure({ delimiter: ' | ' })(arr));
      } else if (secondWord === 'area') {
        const arr = m.findAreas(query);
        if (!arr.length) ee.emit('sys:text', '---');
        else ee.emit('sys:text', asciiTable.configure({ delimiter: ' | ' })(arr));
      } else if (secondWord === 'mid') {
        const room = m.calcAreaMiddle(query);
        const x = JSON.stringify(room, null, 2);
        ee.emit('sys:text', `Middle of Area: ${x}`);
      } else {
        console.error('[SYS] Unknown MAP command');
      }
      return;
    }
    //
    // Query DB in game
    else if (firstWord === '//find') {
      if (parts.length < 3) {
        ee.emit('sys:text', '<b>FIND</b> query must specify 3+ args');
        return;
      }
      const lower = query.toLowerCase();
      // eg: DB find wares vial
      if (secondWord === 'wares') {
        db.waresFind(lower).then((x) => ee.emit('sys:text', x + '\n---\n'));
      } // eg: DB find whois Sarapis
      else if (secondWord === 'whois') {
        db.whoisFind(lower).then((x) => ee.emit('sys:text', x + '\n---\n'));
      } // eg: DB find room parade
      else if (secondWord === 'room') {
        db.roomFind(lower).then((x) => ee.emit('sys:text', x + '\n---\n'));
      } // eg: DB find npc Seasone
      else if (secondWord === 'npc') {
        db.denizenFind(lower).then((x) => ee.emit('sys:text', x + '\n---\n'));
      } // eg: DB find item umbrella
      else if (secondWord === 'item') {
        db.roomItemFind(lower).then((x) => ee.emit('sys:text', x + '\n---\n'));
      }
      return;
    }
    //
    // DELETE FROM DB ☠️
    else if (firstWord === '//dbx') {
      if (secondWord === 'area') {
        if (STATE.Room.room) {
          const areaID = STATE.Room.room.area;
          ee.emit('sys:text', `DELETE all area rooms: "#${areaID}-${STATE.Room.area}" from DB !!`);
          db.delAreaRooms(areaID);
        } else {
          ee.emit('sys:text', "[DBX] Current room doesn't have an area ID!");
        }
      }
      return;
    }

    // TODO :: more commands
    // flee
    // wander to random exit

    // end of special cmds; don't return here !!
    // the user can also implement custom // cmds
  }

  // Run custom function
  if (customProcessUserInput) {
    text = customProcessUserInput(text, parts);
  }

  return text;
  // -- the end
}
