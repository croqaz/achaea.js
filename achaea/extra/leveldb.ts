import asciiTable from 'as-table';
import { ClassicLevel } from 'classic-level';
import { dateDiff, isoDate } from '../core/util.ts';

import * as m from '../maps/index.js';

let DB = null;

export function setupDB(player) {
  DB = new ClassicLevel(`./DB_${player}`, { valueEncoding: 'json' });

  (async function dbCheck() {
    // sanity check & cleanup, on startup
    for await (const [key, value] of DB.iterator()) {
      if (!key) {
        // Each DB entry must have a "truthy" key
        console.error('DELETING null key:', key, value);
        await DB.del(key);
      } else if (!value.id) {
        // Each DB entry must have an ID
        console.error('DELETING entry without ID:', key, value);
        await DB.del(key);
      }
    }
    const s = await dbStats();
    console.log('DB loaded. Stats:', s);
  })();
}

export function dbIter(prefix, limit = Infinity) {
  if (prefix) return DB.iterator({ gte: `${prefix}-0`, lte: `${prefix}-zzz`, limit });
  else return DB.iterator();
}

export function dbKeys(prefix, limit = Infinity) {
  return DB.keys({ gte: `${prefix}-0`, lte: `${prefix}-zzz`, limit });
}

export function dbValues(prefix, limit = Infinity) {
  return DB.values({ gte: `${prefix}-0`, lte: `${prefix}-zzz`, limit });
}

export async function dbGet(prefix, id) {
  // Get DB item by ID
  return await DB.get(`${prefix}-${id}`);
}

export async function dbDel(id) {
  // Delete DB item by ID
  return await DB.del(id);
}

export async function dbSave(prefix, item) {
  // The item MUST have an ID
  if (!item.id) {
    return console.error('Cannot DB save! Item ID is null!', item);
  }
  return await DB.put(`${prefix}-${item.id}`, item);
}

export async function dbStats() {
  const dt = isoDate();
  const OLD = 30 * 24;
  const stats = {
    wares: 0,
    oldWares: 0,
    whois: 0,
    room: 0,
    item: 0,
    denizen: 0,
  };
  for (const prefix of Object.keys(stats)) {
    for await (const val of dbValues(prefix)) {
      stats[prefix]++;
      if (prefix === 'wares' && val.dt && dateDiff(val.dt, dt) > OLD) {
        stats.oldWares++;
      }
    }
  }
  return stats;
}

//
// Utility
//
export async function waresFind(key, table = true) {
  const arr = [];
  for await (const item of dbValues('wares')) {
    if (item.id.startsWith(key) || (item.name && item.name.toLowerCase().includes(key))) {
      const area = item.area;
      let room = item.room.replace(/ \(indoors\)$/, '');
      if (room.length > 20) room = room.slice(0, 20) + '…';
      if (item.id.length > 10) item.id = item.id.slice(0, 10) + '…';
      const g = item.name.match(/ group of ([0-9]+) /);
      if (g && g[1]) item.pp = parseInt(item.price) / parseInt(g[1]);
      else item.pp = parseInt(item.price);
      arr.push({
        dt: item.dt,
        id: item.id,
        name: item.name,
        pp: Math.round(item.pp),
        price: item.price,
        roomID: item.roomID,
        room: `${area}: ${room}`,
      });
    }
  }
  if (!arr.length) return '';
  arr.sort((a, b) => a.pp - b.pp);
  if (table) return asciiTable.configure({ delimiter: ' | ' })(arr);
  return arr;
}

export async function whoisFind(key, table = true) {
  const arr = [];
  for await (const who of dbValues('whois')) {
    if (who.id === key || who.fullname.toLowerCase().includes(key)) {
      delete who.player_kills;
      delete who.mob_kills;
      arr.push(who);
    }
  }
  if (!arr.length) return '';
  if (table) return asciiTable.configure({ delimiter: ' | ' })(arr);
  return arr;
}

export async function roomFind(key, table = true) {
  const arr = [];
  for await (const room of dbValues('room')) {
    if (
      room.id.toString() === key ||
      room.area.toLowerCase() === key ||
      room.name.toLowerCase().includes(key)
    ) {
      if (room.name.length > 30) room.name = room.name.slice(0, 30) + '…';
      delete room.desc;
      arr.push(room);
    }
  }
  if (!arr.length) return '';
  if (table) return asciiTable.configure({ delimiter: ' | ' })(arr);
  return arr;
}

export async function denizenFind(key, table = true) {
  const re = new RegExp(key, 'i');
  const arr = [];
  for await (const item of dbValues('denizen')) {
    if (re.test(item.name)) {
      delete item.attrib;
      item.room = (item.room || '').replace(/ \(indoors\)$/, '');
      if (item.room.length > 30) item.room = item.room.slice(0, 30) + '…';
      if (item.name.length > 30) item.name = item.name.slice(0, 30) + '…';
      arr.push(item);
    }
  }
  if (!arr.length) return '';
  if (table) return asciiTable.configure({ delimiter: ' | ' })(arr);
  return arr;
}

export async function roomItemFind(key, table = true) {
  const re = new RegExp(key, 'i');
  const arr = [];
  for await (const item of dbValues('item')) {
    if (re.test(item.name)) {
      delete item.attrib;
      item.room = (item.room || '').replace(/ \(indoors\)$/, '');
      if (item.room.length > 30) item.room = item.room.slice(0, 30) + '…';
      if (item.name.length > 30) item.name = item.name.slice(0, 30) + '…';
      arr.push(item);
    }
  }
  if (!arr.length) return '';
  if (table) return asciiTable.configure({ delimiter: ' | ' })(arr);
  return arr;
}

export async function delAreaRooms(areaID) {
  // DELETE all area rooms from DB ☠️
  const area = await m.getArea(areaID, false);
  for (const room of Object.values(area.rooms)) {
    try {
      await DB.del(`room-${room.id}`);
      console.log('DELETE', room.id, room.title);
    } catch {
      console.warn(`Room ${room.id} cannot be deleted from DB!`);
    }
  }
}
