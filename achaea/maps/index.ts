import * as T from './types.ts';
import * as m from './maps.ts';
import { dbGet } from '../extra/leveldb.js';

export const MAP = m.MAP;
export const ENVS = m.ENVS;
export const AREAS = m.AREAS;

/*
 * Super important function, used for maps.
 */
export async function getArea(uid: string, enhance = false): Promise<T.MapArea> {
  if (!MAP.areas[uid] || !MAP.areas[uid].name) {
    return null;
  }
  // console.time('get-area');
  const area = { ...MAP.areas[uid] };
  area.id = uid;
  area.rooms = {};
  const levels: Set<number> = new Set();
  for (const x of AREAS[uid]) {
    const room = { ...x };
    // The Room from DB, to check if it's visited
    if (enhance) {
      try {
        const dbRoom = await dbGet('room', x.id);
        room.visited = true;
        room.features = dbRoom.features;
      } catch {
        // console.error('Cannot DB get', ID);
      }
    }
    area.rooms[x.id] = room;
    levels.add(room.coord.z || 0);
  }
  // @ts-ignore
  area.levels = [...levels].sort((a, b) => a - b);
  // console.timeEnd('get-area');
  return area;
}

export async function getRoom(uid: string, enhance = false): Promise<T.MapRoom> {
  // A function mostly for debug
  const room = { ...MAP.rooms[uid] };
  if (!room || !room.title) {
    return null;
  }
  if (room.area && MAP.areas[room.area]) {
    // @ts-ignore: Types
    room.area = { id: parseInt(room.area), ...MAP.areas[room.area] };
  }
  if (room.environment && ENVS[room.environment as string]) {
    // @ts-ignore: Types
    room.environment = { id: parseInt(room.environment), ...ENVS[room.environment] };
  }
  // The Room from DB, to check if it's visited
  if (enhance) {
    try {
      const dbRoom = await dbGet('room', uid);
      room.visited = true;
      room.features = dbRoom.features;
    } catch {
      // console.error('Cannot DB get', uid);
    }
  }
  return room;
}

export function findEnv(eid: string, limit = 0) {
  if (!ENVS[eid] || !ENVS[eid].name) {
    return null;
  }
  const rooms = [] as T.MapRoom[];
  for (const [rid, room] of Object.entries(MAP.rooms)) {
    if (room.environment !== eid) continue;
    if (!room.area) continue;
    const copy = { ...room };
    copy.id = parseInt(rid);
    delete copy.coord;
    delete copy.exits;
    rooms.push(copy);
  }
  let areas = {} as any;
  for (const room of rooms) {
    if (!room.area) continue;
    const areaID = room.area;
    if (!areas[areaID]) {
      areas[areaID] = [];
    }
    areas[areaID].push(room);
  }
  areas = Object.entries(areas).map(([id, rooms]) => {
    // @ts-ignore: Types
    return { id, name: MAP.areas[id].name, size: rooms.length, rooms };
  });
  areas.sort((a, b) => b.rooms.length - a.rooms.length);
  if (limit > 0) return areas.slice(0, limit);
  return areas;
}

/*
 * Try to find the middle room of an area.
 */
export function calcAreaMiddle(uid: string) {
  if (!MAP.areas[uid] || !MAP.areas[uid].name) {
    return null;
  }
  const roomWeight = ({ x, y, z }, e) => {
    if (!x && !y && !z) return -5;
    return Math.abs(x) + Math.abs(y) + 5 * Math.abs(z) - e;
  };
  const rooms = [];
  for (const [id, room] of Object.entries(MAP.rooms)) {
    if (room.area === uid) {
      // Prefer the rooms with more exits
      const e = room.exits ? room.exits.length : 1;
      rooms.push({ W: roomWeight(room.coord, e), id, name: room.title, coord: room.coord });
      // 0,0,0 is the lowest value, so just break the cycle now
      if (room.coord.x === 0 && room.coord.y === 0 && room.coord.z === 0) {
        break;
      }
    }
  }
  const found = rooms.sort((a, b) => a.W - b.W)[0];
  delete found.W;
  return { area: MAP.areas[uid].name, ...found };
}

/*
 * Try to find rooms by name, or by ID.
 * Only used by the //map room command.
 */
export function findRooms(query: string): T.MapRoom[] {
  let roomID = '';
  if (+query) roomID = query;
  else query = query.toLowerCase();
  const results = [];
  for (const [uid, val] of Object.entries(MAP.rooms)) {
    if ((roomID && roomID === uid) || val.title.toLowerCase().includes(query)) {
      const room = { id: uid, ...val };
      if (room.area && MAP.areas[room.area]) {
        room.areaID = room.area;
        room.area = MAP.areas[room.area].name;
      }
      if (room.environment && ENVS[room.environment as string]) {
        room.environment = ENVS[room.environment as string].name;
      }
      if (room.exits) delete room.exits;
      results.push(room);
    }
  }
  return results;
}

/*
 * Try to find areas by name, or by ID.
 * Only used by the //map area command.
 */
export function findAreas(query: string): T.MapArea[] {
  let areaID = '';
  if (+query) areaID = query;
  else query = query.toLowerCase();
  const results = [];
  for (const [uid, val] of Object.entries(MAP.areas)) {
    if ((areaID && areaID === uid) || val.name.toLowerCase().includes(query)) {
      results.push({ id: uid, ...val });
    }
  }
  return results;
}
