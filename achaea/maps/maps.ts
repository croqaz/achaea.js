import fs from 'node:fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import * as T from './types.ts';
import { Config } from '../extra/config.ts';

export const EXITS = Object.freeze({
  north: 'n',
  south: 's',
  east: 'e',
  west: 'w',
  northeast: 'ne',
  northwest: 'nw',
  southeast: 'se',
  southwest: 'sw',
});

const __dirName = dirname(fileURLToPath(import.meta.url));
// @ts-ignore: Types
export const MAP: T.MapType = Object.freeze(
  JSON.parse(fs.readFileSync(__dirName + '/official-map.json')),
);

// Pre-populate map environments
// for faster later access
//
export const ENVS = Object.freeze(MAP.environments);
let __envs = Object.entries(ENVS).map(([k, v]) => [v.name.toLowerCase().replace(/[ ']/g, ''), k]);

export const MAP_ENVS: Record<string, string> = Object.freeze(Object.fromEntries(__envs));
Object.keys(__envs).forEach((k) => delete __envs[k]);
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
  // @ts-ignore: Types
  copy.environment = { id: parseInt(copy.environment), ...ENVS[copy.environment as string] };
  __areas[areaID].push(copy);
}
export const AREAS = Object.freeze(__areas);
__areas = null;

/*
 * A graph so simple that it's preposterous
 * Eg: vertices = { 1: {2: {dir: 'n', cost: 2}, 3: {dir: 'e', cost: 4}} }
 */
export function SimpleGraph() {
  // Adjacency lists with properties
  this.vertices = new Map() as Map<string, Map<string, T.GraphEdge>>;
  this.addAllEdges = function (name: string, edges: Map<string, T.GraphEdge>) {
    this.vertices.set(name, edges);
  };
}

/*
 * Generate a graph from a map, or an area.
 * It is used for the map walking algorithm.
 */
export function localGraph(map: T.MapType, opts = { level: null, costs: {} }) {
  const gr = new SimpleGraph();
  for (const [uid, room] of Object.entries(map.rooms)) {
    if (!room.exits) continue;
    // Ignore some areas?
    if (room.area && Config.IGNORED_AREAS.includes(room.area)) continue;
    // Ignore some rooms?
    if (Config.IGNORED_ROOMS.includes(uid)) continue;

    const edges = new Map();
    for (const exit of room.exits) {
      // Limit to a specific Z-level?
      if (typeof opts.level === 'number' && roomLevel(exit.target) !== opts.level) {
        continue;
      }
      const tgt = exit.target;
      const dir = exit.direction;
      // The cost/ slowness of moving to this specific exit
      const cost = opts.costs[tgt] ? opts.costs[tgt] : roomSlowness(tgt);
      edges.set(tgt, { dir, cost });
    }
    gr.addAllEdges(uid, edges);
  }
  return gr;
}

/*
 * Generate a sub-graph for an area.
 * It is used for the area exploring algorithm.
 */
export function subGraph(areaID: string, opts = { deny_rooms: [], deny_envs: [] }) {
  if (!MAP.areas[areaID] || !MAP.areas[areaID].name) {
    return null;
  }
  const gr = new SimpleGraph();
  for (const room of AREAS[areaID]) {
    if (!room.exits) continue;
    const uid = room.id.toString();
    // Ignore some rooms? (rooms are numbers)
    if (opts.deny_rooms && opts.deny_rooms.includes(uid)) continue;
    // Ignore some environment? (envs are numbers)
    if (opts.deny_envs && opts.deny_envs.includes((room.environment as T.MapEnv).id)) continue;

    const edges = new Map();
    for (const exit of room.exits) {
      const tgt = exit.target;
      const dir = exit.direction;
      const cost = roomSlowness(tgt);
      edges.set(tgt, { dir, cost });
    }
    gr.addAllEdges(uid, edges);
  }
  return gr;
}

// This is the big official graph
//
export const GRAPH = localGraph(MAP);

/*
 * Helper function.
 */
function roomLevel(uid: string): number {
  const room = MAP.rooms[uid];
  if (!room) return Infinity;
  if (!room.coord) return Infinity;
  // in the map, coords are numbers
  return room.coord.z;
}

/*
 * The default way to calculate how slow it is to walk into
 * a room, based on its environment.
 * This is used to calculate the fastest way to travel.
 * If a room is under water, it is slower to travel, so
 * it's best to avoid if possible.
 */
function roomSlowness(uid: string): number {
  const room = MAP.rooms[uid];
  // If the room is not on the map ???
  if (!room) return 4;
  // If the map didn't define an environment ???
  if (!room.environment) return 4;

  const env = room.environment;
  // Fastest rooms
  if (env === MAP_ENVS.path || env === MAP_ENVS.road || env === MAP_ENVS.urban || MAP_ENVS.beach) {
    return 1;
  }
  // They are not slow, but generally more dangerous
  if (env === MAP_ENVS.flames || env === MAP_ENVS.lava || env === MAP_ENVS.lavafields) return 3;
  // Water is considered slower
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
  return 1.5;
}
