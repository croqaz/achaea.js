import fs from 'node:fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import * as T from './types.ts';
import { dbGet } from '../extra/leveldb.js';

// @ts-ignore: Types
const dirName = dirname(fileURLToPath(import.meta.url));
// @ts-ignore: Types
export const MAP: T.MapType = Object.freeze(JSON.parse(fs.readFileSync(dirName + '/official-map.json')));

const ENVS: Record<string, T.MapEnv> = Object.freeze(MAP.environments);
let __envs = Object.entries(ENVS).map(([k, v]) => [v.name.toLowerCase().replace(/[ ']/g, ''), k]);
const MAP_ENVS: Record<string, string> = Object.freeze(Object.fromEntries(__envs));
__envs = null;

// Pre-populate a mapping of areas-rooms
// for faster later access
//
let __areas: Record<string, T.MapRoom[]> = {};
for (const [uid, room] of Object.entries(MAP.rooms)) {
  if (!room.area) continue;
  const areaID = room.area;
  if (!__areas[areaID]) {
    __areas[areaID] = [];
  }
  const copy = { id: 0, ...room };
  copy.id = parseInt(uid);
  // @ts-ignore
  copy.environment = { id: copy.environment, ...ENVS[copy.environment] };
  __areas[areaID].push(copy);
}
const AREAS = Object.freeze(__areas);
__areas = null;

// A graph so simple that it's preposterous
//

export function SimpleGraph() {
  this.vertices = {} as Record<string, Record<string, T.GraphEdge>>;
  this.addVertex = function (name: string, edges: Record<string, T.GraphEdge>) {
    this.vertices[name] = edges;
  };
}

/*
 * Generate a graph from a map, or an area.
 * It is used for the room walking algorithm.
 */
export function localGraph(area: T.MapType, opts = { level: null, costs: {} }) {
  const gr = new SimpleGraph();
  for (const [uid, room] of Object.entries(area.rooms)) {
    if (!room.exits) continue;
    // Ignore some rooms
    if (IGNORED_ROOMS.includes(uid)) continue;
    // Ignore some areas
    if (room.area && IGNORED_AREAS.includes(room.area)) continue;

    const edges = {};
    for (const exit of room.exits) {
      const tgt = exit.target;
      const dir = exit.direction;
      // Ignore non-matching levels
      if (typeof opts.level === 'number' && roomLevel(tgt) !== opts.level) {
        continue;
      }
      const cost = opts.costs[tgt] ? opts.costs[tgt] : roomSlowness(tgt);
      edges[tgt] = { dir, cost };
    }
    gr.addVertex(uid, edges);
  }
  return gr;
}

function roomLevel(uid: string): number {
  // Helper function
  const room = MAP.rooms[uid];
  if (!room) return 0;
  if (!room.coord) return 0;
  return room.coord.z;
}

const IGNORED_AREAS = [
  '15', // Ring of portals
  '304', // On the clouds
];
const IGNORED_ROOMS = [];

// This is the big official graph
//
export const GRAPH = localGraph(MAP);

function roomSlowness(uid: string): number {
  /*
   * The default way to calculate how slow it is to walk into
   * a room, based on its environment.
   * This is used to calculate the fastest way to travel.
   * If a room is under water, it is slower to travel, so
   * it's best to avoid it if possible.
   */
  const room = MAP.rooms[uid];
  // If the room is not on the map ???
  if (!room) return 4;
  // If the map didn't define an environment ???
  if (!room.environment) return 2;

  const env = room.environment;
  // Fastest rooms
  if (env === MAP_ENVS.path || env === MAP_ENVS.road || env === MAP_ENVS.urban || MAP_ENVS.beach) {
    return 1;
  }
  // They are not slow, but generally more dangerous
  if (env === MAP_ENVS.flames || env === MAP_ENVS.lava || env === MAP_ENVS.lavafields) return 3;
  // Water is slower
  if (
    env === MAP_ENVS.water ||
    env === MAP_ENVS.river ||
    env === MAP_ENVS.ocean ||
    env === MAP_ENVS.freshwater ||
    env === MAP_ENVS.oceanfloor ||
    env === MAP_ENVS.deepocean ||
    env === MAP_ENVS.deepoceanfloor
  ) {
    return 4;
  }
  return 1;
}

export async function getArea(uid: string, enhance = false): Promise<T.MapArea> {
  // Super important function, used for maps
  if (!MAP.areas[uid] || !MAP.areas[uid].name) {
    return null;
  }
  // console.time('get-area');
  const area = { ...MAP.areas[uid] };
  area.id = uid;
  area.rooms = {};
  const levels = new Set();
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
    // @ts-ignore
    room.area = { id: parseInt(room.area), ...MAP.areas[room.area] };
  }
  if (room.environment && ENVS[room.environment]) {
    // @ts-ignore
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

export function calcAreaMiddle(uid: string) {
  /*
   * Try to find the middle room of an area.
   */
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

export function findRooms(query: string): T.MapRoom[] {
  /*
   * Try to find a room by name.
   */
  query = query.toLowerCase();
  const results = [];
  for (const [uid, val] of Object.entries(MAP.rooms)) {
    if (val.title.toLowerCase().includes(query)) {
      const room = { id: uid, ...val };
      if (room.area && MAP.areas[room.area]) {
        room.areaID = room.area;
        room.area = MAP.areas[room.area].name;
      }
      if (room.environment && ENVS[room.environment]) {
        room.environment = ENVS[room.environment].name;
      }
      if (room.exits) delete room.exits;
      results.push(room);
    }
  }
  return results;
}

export function findAreas(query: string): T.MapArea[] {
  /*
   * Try to find an area by name.
   */
  query = query.toLowerCase();
  const results = [];
  for (const [uid, val] of Object.entries(MAP.areas)) {
    if (val.name.toLowerCase().includes(query)) {
      results.push({ id: uid, ...val });
    }
  }
  return results;
}
