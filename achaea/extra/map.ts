import ee from '../events/index.ts';
import * as w from '../maps/walker.ts';
import * as m from '../maps/index.ts';
import { STATE } from '../core/state.ts';
import { htmlTable } from './table.ts';
import { displayText, sleep } from '../core/index.ts';
import { dbGet, dbSave, dbValues } from './leveldb.js';

export default function processMapAliases(
  firstWord: string,
  secondWord: string,
  otherWords: string,
  parts: string[],
): boolean {
  if (firstWord === '//go' && parts.length > 1) {
    /*
     * Auto mapper/ walking...
     * GO 1234 | START | PAUSE | STOP | NEXT | PREV
     */
    if (secondWord === 'stop' && STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
      displayText('<b>[Path]</b>: Stopping!');
      STATE.Misc.autoWalk.pause();
      STATE.Misc.autoWalk.walk = null;
      return true;
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
      /*
       * Try to parse exact directions
       * Eg: //go w 3e 10n 4se in d 2n
       */
      const dirs = w.parseDirections('', parts.slice(1));
      if (dirs && dirs.length) {
        setTimeout(async function () {
          for (const [d, repeat] of dirs) {
            let currRoom = STATE.Room.num.toString();
            if (repeat <= 1) {
              w.smartMove(d, currRoom);
              await sleep(0.5);
            } else {
              for (let i = 0; i < repeat; i++) {
                currRoom = STATE.Room.num.toString();
                w.smartMove(d, currRoom);
                await sleep(0.5);
              }
            }
          }
        }, 1);
      } else {
        ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Unknown GO command!</i>');
      }
    }
    return true;
    //
    // End of Go to ...
    //
  } else if (firstWord === '//explore' && parts.length > 1) {
    /*
     * Auto explore area...
     * EXPLORE AREA | START | PAUSE | STOP | NEXT | PREV
     */
    if (secondWord === 'stop' && STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
      displayText('<b>[Path]</b>: Stopping!');
      STATE.Misc.autoWalk.pause();
      STATE.Misc.autoWalk.walk = null;
      return true;
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
    } else if (secondWord === 'a' || secondWord === 'area') {
      setTimeout(async function () {
        const fromID = STATE.Room.num.toString();
        STATE.Misc.autoWalk = await w.autoWalker(fromID, null, {
          explore: true,
          type: 'local',
        });
        if (STATE.Misc.autoWalk && STATE.Misc.autoWalk.walk) {
          const len = STATE.Misc.autoWalk.walk.path.length;
          const m = `<b>[Path]</b>: Explore area is walk is <b>${len} rooms</b> long...`;
          displayText(m);
        }
      }, 1);
    } else {
      ee.emit('sys:text', '<i class="c-dim c-red"><b>[Path]</b>: Unknown EXPLORE command!</i>');
    }
    return true;
    //
    // End of Explore
    //
  } else if (firstWord === '//map') {
    //
    // No extra params for these map commands
    //
    if (secondWord === 'notes') {
      setTimeout(async () => {
        try {
          const arr = [];
          for await (const room of dbValues('room')) {
            if (room.note) {
              if (room.name.length > 30) room.name = room.name.slice(0, 30) + '…';
              delete room.desc;
              arr.push(room);
            }
          }
          if (arr.length)
            ee.emit(
              'sys:html',
              htmlTable(arr, (k, row) => {
                if (k === 'id' || k === 'name') return `<td data-send="//go ${row.id} g">${row[k]}</td>`;
                return `<td>${row[k] || '?'}</td>`;
              }),
            );
          else ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: No notes found!</i>');
        } catch {
          ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Cannot list notes!</i>');
        }
      }, 1);
      return true;
    }

    /*
     * Query MAP info in game
     */
    if (parts.length < 3) {
      ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Map command needs 3 or more args!</i>');
      return true;
    }

    /*
     * Map add/remove room note
     * Eg: //map note Gaia shrine
     */
    if (secondWord === 'note') {
      setTimeout(async () => {
        try {
          const dbRoom = await dbGet('room', STATE.Room.num);
          if (otherWords === 'rm' || otherWords === 'clear') {
            delete dbRoom.note;
            displayText(`[MAP] Room note removed.`);
          } else {
            dbRoom.note = otherWords;
            displayText(`[MAP] Room note saved.`);
          }
          await dbSave('room', dbRoom);
        } catch {
          ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Cannot save room note!</i>');
        }
      }, 1);
    } else if (secondWord === 'room') {
      /*
       * Map find room
       */
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
      else
        ee.emit(
          'sys:html',
          htmlTable(arr, (k, row) => {
            if (k === 'id' || k === 'name') return `<td data-send="//go ${row.id} g">${row[k]}</td>`;
            return `<td>${row[k] || '?'}</td>`;
          }),
        );
    } else if (secondWord === 'area') {
      /*
       * Map find area
       */
      const arr = m.findAreas(otherWords);
      if (!arr.length) ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Area not found!</i>');
      else ee.emit('sys:html', htmlTable(arr));
    } else if (secondWord === 'mid') {
      /*
       * Map find the middle of an area
       */
      const room = m.calcAreaMiddle(otherWords);
      const x = JSON.stringify(room, null, 2);
      displayText(`Middle of Area: ${x}`);
    } else {
      ee.emit('sys:text', '<i class="c-dim c-red"><b>[MAP]</b>: Unknown MAP command!</i>');
    }
    return true;
    //
    // End of Map command
    //
  }

  return false;
}
