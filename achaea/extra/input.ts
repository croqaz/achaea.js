import chokidar from 'chokidar';

import ee from '../events/index.ts';
import * as db from './leveldb.js';
import * as comm from '../core/common.ts';
import { millInks } from './mill.ts';
import { htmlTable } from './table.ts';
import processMapAliases from './map.ts';

import { displayNote, displayText } from '../core/index.ts';
import { listDenizens, STATE, stateStopBattle } from '../core/state.ts';

let customProcessUserInput;
try {
  // @ts-ignore: Types
  customProcessUserInput = require('../../custom/input.ts').default;

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
  console.warn('Cannot load user input function!', err);
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
      STATE.Battle.auto = false;
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
    } else if (fullCmd === 'gold') {
      /*
       * Gold pickup toggle
       */
      STATE.Misc.gold = !STATE.Misc.gold;
      ee.emit('sys:text', `<b>[Gold]</b>: Pickup is ${STATE.Misc.gold ? 'on' : 'off'}.`);
      return;
    } else if (firstWord === '//note') {
      displayNote(parts.slice(1).join(' '));
      return;
    } else if (firstWord === '//remind') {
      const re = /^[0-9]{1,3}[smh]?$/;
      if (!re.test(secondWord)) {
        ee.emit('sys:text', `<i class="c-dim c-red">Invalid delay number! Examples: 30s, or 5m, or 3h.</i>`);
        return;
      }
      let delay = parseInt(secondWord) * 1000;
      if (secondWord.endsWith('m')) delay = parseInt(secondWord) * 60 * 1000;
      else if (secondWord.endsWith('h')) delay = parseInt(secondWord) * 3600 * 1000;
      setTimeout(() => {
        displayNote(otherWords);
      }, delay);
    } else if (fullCmd === 'ea') {
      /*
       * Extract all minerals
       * ea = extract all (Transmutation skill)
       */
      STATE.Misc.getMinerals = true;
      return 'MINERALS';
    } else if (fullCmd === 'ha' || fullCmd === 'ga' || fullCmd === 'gh') {
      /*
       * Harvest plants
       * Gather materials & butcher for reagents
       */
      STATE.Misc.getPlants = true;
      return 'PLANTS';
    } else if (fullCmd === 'ggg') {
      /*
       * Harvest & gather & extract
       * ha = harvest all (Harvesting skill)
       * ga = gather all (Gathering skill)
       */
      STATE.Misc.getPlants = true;
      STATE.Misc.getMinerals = true;
      return 'PLANTS && MINERALS';
    } else if (firstWord === '//mill') {
      /*
       * Mill inks
       */
      const nr = parseInt(otherWords) || 5;
      if (nr <= 0) {
        ee.emit('sys:text', `<i class="c-dim c-red"><b>[Mill]</b>: "${nr}" is not a valid number!</i>`);
        return;
      }
      return millInks(nr, secondWord);
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
        displayText(JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find mineral aurum
      else if (secondWord === 'mineral') {
        const r = comm.findMineral(lower);
        displayText(JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find venom curare
      else if (secondWord === 'venom' || secondWord === 'poison') {
        const r = comm.findVenom(lower);
        displayText(JSON.stringify(r, null, 2) + '\n---\n');
      } //
      // eg: DB find rune fehu
      else if (secondWord === 'rune') {
        const r = comm.findRune(lower);
        displayText(JSON.stringify(r, null, 2) + '\n---\n');
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

    // If map aliases are found...
    //
    if (processMapAliases(firstWord, secondWord, otherWords, parts)) return;

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
