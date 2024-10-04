import chokidar from 'chokidar';

import ee from '../events/index.ts';
import * as db from './leveldb.js';
import * as m from '../maps/index.ts';
import * as w from '../maps/walker.ts';
import * as comm from '../core/common.ts';
import { htmlTable } from './table.ts';
import { listDenizens, stateStopBattle, STATE } from '../core/state.ts';

let customProcessUserInput;
try {
  // @ts-ignore: Types
  customProcessUserInput = require('../../custom/input.ts').default;
  // console.log('Custom user input function loaded!');

  // Watch for changes in this file and live reload
  const fileWatcher = chokidar.watch('./custom/input.ts', {
    depth: 1,
    persistent: true,
    ignoreInitial: true,
  });
  fileWatcher.on('change', async () => {
    console.log('Custom user input CHANGED!');
    for (const m of Object.keys(require.cache)) {
      if (/custom\/input/.test(m)) {
        delete require.cache[m];
      }
    }
    customProcessUserInput = require('../../custom/input.ts').default;
  });
} catch (err) {
  console.error('Error loading user input function!', err);
}

export default function extraProcessUserInput(text: string, parts: string[]): string | void {
  /*
   * [EXTRA] proces user text input, eg: aliases, custom commands
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   */
  const firstWord = parts[0].toLowerCase();
  const secondWord = parts[1] ? parts[1].toLowerCase() : '';
  const otherWords = parts[2] ? parts.slice(2).join(' ') : '';

  // Stop command to stop attacking, stop auto-walking
  // ... and possibly other stops in the future
  if (text === 'stop') {
    let send = true; // send the actual command?
    if (STATE.Battle.active || STATE.Battle.combat) {
      send = false;
      stateStopBattle();
    }
    if (STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
      send = false;
      STATE.Misc.autoWalk.pause();
      STATE.Misc.autoWalk.walk = null;
    }
    STATE.Misc.writhe = false;
    return send ? 'stop' : '';
  }

  // WWW = writhe forever
  // WXX = writhe stop
  // You begin to writhe helplessly, throwing your body off balance
  if (text === 'www') {
    STATE.Misc.writhe = true;
    return 'WRITHE';
  } else if (text === 'wwx' || text === 'wxx') {
    STATE.Misc.writhe = false;
    return '';
  }

  // Fill all vials that are not yet full
  //
  if (text === 'filla') {
    STATE.Misc.filla = true;
    return 'ELIXLIST';
  }

  /*
   * Get X things from rift and give them to Y
   * Example: og 10 myrrh Romeo
   */
  if (firstWord === 'og' && secondWord && parts[2] && parts[3]) {
    const quantity = secondWord;
    const riftItem = parts[2];
    const somebody = parts[3];
    return `OUTR ${quantity} ${riftItem} && GIVE ${quantity} ${riftItem} TO ${somebody}`;
  }

  // Collect wares DB
  //
  if (firstWord === 'wares' || (firstWord === 'cart' && secondWord === 'wares')) {
    STATE.Misc.waresDB = true;
    return text;
  } //
  // Collect whois DB
  else if (firstWord === 'bw' || firstWord === 'qwho') {
    STATE.Misc.whoisDB = true;
    return text;
  } else if (text === 'll') {
    /*
     * LL = look at all denizens
     * LA = look at all players
     */
    for (const d of listDenizens()) {
      ee.emit('user:text', `LOOK ${d}`);
    }
    return '';
  } else if (text === 'la') {
    for (const p of STATE.Room.players) {
      ee.emit('user:text', `LOOK ${p.name}`);
    }
    return '';
  }

  if (text === 'whim') {
    return 'WHISTLE MOUNT';
  }

  // Special commands
  //
  if (text.startsWith('//')) {
    const fullCmd = text.toLowerCase().replace(/^[/]+/, '');

    /*
     * Stress an object, eg: in quests
     */
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
    } else if (firstWord === '//quest' && parts.length === 2) {
      /*
       * Say all kinds of questy things to an NPC
       */
      const npc = secondWord;
      ee.emit('user:text', `GREET ${npc}`);
      // ee.emit('user:text', `SAY TO ${npc} errand`);
      ee.emit('user:text', `SAY TO ${npc} quest`);
      ee.emit('user:text', `SAY TO ${npc} job`);
    } else if (firstWord === '//goto') {
      /*
       * Auto mapper/ walking...
       * GOTO 1234 | START | PAUSE | STOP | NEXT | PREV
       */
      if (secondWord === 'stop' && STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
        ee.emit('sys:text', `<b>[Path]</b>: Stopping!`);
        STATE.Misc.autoWalk.pause();
        STATE.Misc.autoWalk.walk = null;
        return;
      }

      if (secondWord === 'next' || secondWord === 'prev') {
        const walk = STATE.Misc.autoWalk ? STATE.Misc.autoWalk.walk : null;
        if (walk) {
          const n = walk[secondWord]();
          if (n && n.dir) {
            ee.emit('user:text', n.dir);
          } else {
            ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Direction not defined!</i>');
          }
        } else {
          ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Walk not defined!</i>');
        }
      } else if (secondWord === 'pause' || secondWord === 'start') {
        const walk = STATE.Misc.autoWalk ? STATE.Misc.autoWalk.walk : null;
        if (walk) {
          ee.emit('sys:text', `<b>[Path]</b>: Walk ${secondWord}!`);
          STATE.Misc.autoWalk[secondWord]();
        } else {
          ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Walk not defined!</i>');
        }
      } //
      // JS hack to check if param is numeric
      else if (+secondWord) {
        setTimeout(async function () {
          const fromID = STATE.Room.num.toString();
          STATE.Misc.autoWalk = await w.autoWalker(fromID, secondWord, {
            type: otherWords,
          });
          if (STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
            const len = STATE.Misc.autoWalk.walk.path.length;
            const m = `<b>[Path]</b>: Walk from: ${fromID} to: ${secondWord} is <b>${len} rooms</b> distance.`;
            ee.emit('sys:text', m);
          }
        }, 1);
      } else {
        ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Unknown GOTO command!</i>');
      }
      return;
      // End of GoTo
    } else if (firstWord === '//map') {
      /*
       * Query MAP info in game
       */
      if (parts.length < 3) {
        ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Query must specify 3 args!</i>');
        return;
      }
      // Map find room
      if (secondWord === 'room') {
        const arr = m.findRooms(otherWords).map((x) => {
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
        if (!arr.length) ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Room not found!</i>');
        else ee.emit('sys:html', htmlTable(arr));
      } //
      // Map find area
      else if (secondWord === 'area') {
        const arr = m.findAreas(otherWords);
        if (!arr.length) ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Area not found!</i>');
        else ee.emit('sys:html', htmlTable(arr));
      } //
      // Map find the middle of an area
      else if (secondWord === 'mid') {
        const room = m.calcAreaMiddle(otherWords);
        const x = JSON.stringify(room, null, 2);
        ee.emit('sys:text', `Middle of Area: ${x}`);
      } else {
        ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Unknown MAP command!</i>');
      }
      return;
      // End of Map command
    } else if (firstWord === '//find') {
      /*
       * Query DB in game
       */
      if (parts.length < 3) {
        ee.emit('sys:text', '<b>FIND</b> query must specify 3+ args');
        return;
      }
      const lower = otherWords.toLowerCase();
      const toTable = (arr) => {
        if (!arr.length) {
          ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Nothing found!</i>');
        } else ee.emit('sys:html', htmlTable(arr));
      };
      //
      // eg: DB find herb pear
      if (secondWord === 'herb' || secondWord === 'plant') {
        const r = comm.findHerb(lower);
        ee.emit('sys:text', JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find mineral aurum
      else if (secondWord === 'mineral') {
        const r = comm.findMineral(lower);
        ee.emit('sys:text', JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find venom curare
      else if (secondWord === 'venom' || secondWord === 'poison') {
        const r = comm.findVenom(lower);
        ee.emit('sys:text', JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find rune fehu
      else if (secondWord === 'rune') {
        const r = comm.findRune(lower);
        ee.emit('sys:text', JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find room parade
      else if (secondWord === 'room') {
        db.roomFind(lower, false).then(toTable);
      } //
      // eg: DB find wares vial
      else if (secondWord === 'wares') {
        db.waresFind(lower).then(toTable);
      } //
      // eg: DB find whois Sarapis
      else if (secondWord === 'whois') {
        db.whoisFind(lower).then(toTable);
      } //
      // eg: DB find npc Seasone
      else if (secondWord === 'npc' || secondWord === 'deniz') {
        db.denizenFind(lower).then(toTable);
      } //
      // eg: DB find item umbrella
      else if (secondWord === 'item') {
        db.roomItemFind(lower).then(toTable);
      }
      return;
    } else if (firstWord === '//dbx') {
      /*
       * DELETE FROM DB ☠️
       */
      if (secondWord === 'area') {
        if (STATE.Room.room) {
          const areaID = STATE.Room.room.area;
          db.delAreaRooms(areaID);
          ee.emit('sys:text', `DELETED all area rooms: "#${areaID}-${STATE.Room.area}" from DB !!`);
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
    text = customProcessUserInput({
      text,
      parts,
      firstWord,
      secondWord,
      otherWords,
    });
  }

  return text;
  // -- the end
}
