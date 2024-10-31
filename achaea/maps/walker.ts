import Heap from 'qheap';

import * as m from './maps.ts';
import * as mi from './index.ts';
import * as ex from './explore.ts';
import * as T from './types.ts';
import { Config } from '../config.ts';
import { STATE } from '../core/state.ts';
import { displayText, sleep, userText } from '../core/index.ts';

// Reversed exits
export const REV_EXITS = Object.freeze({
  n: 's',
  s: 'n',
  e: 'w',
  w: 'e',
  ne: 'sw',
  nw: 'se',
  se: 'nw',
  sw: 'ne',
  //
  north: 's',
  south: 'n',
  east: 'w',
  west: 'e',
  northeast: 'sw',
  northwest: 'se',
  southeast: 'nw',
  southwest: 'ne',
  //
  up: 'd',
  down: 'u',
  in: 'out',
  out: 'in',
});

export function parseDirections(line: string, parts: string[]) {
  const re = new RegExp('^[1-9]{0,2}(?:ne|nw|se|sw|in|out|n|s|e|w|u|d)');
  if (!parts) parts = line.split(' ').filter((x) => !!x);
  const dirs = [];
  for (const p of parts) {
    const m = p.match(re);
    if (!m) return null;
    let dir = m[0];
    const repeat = parseInt(dir);
    dir = dir.replace(/^\d+/, '');
    if (isNaN(repeat) || repeat === 1) dirs.push([dir, 0]);
    else dirs.push([dir, repeat]);
  }
  return dirs;
}

export function smartMove(dir: string, currID: string, nextID?: string): string {
  /*
   * The function that decides the "move command".
   * This is exported, so I can test it.
   *
   * TODO: Based on the Room, it needs to handle
   * jump over stone/ ice walls
   * special actions, need to twist/push/pull, or say something
   */

  // When the player can walk on water,
  // short-circuit, no need for extra checks
  if (STATE.Me.waterWalk) {
    return dir;
  }

  const room = m.MAP.rooms[currID];
  if (!room?.environment) {
    return dir;
  }
  if (!nextID) {
    const nextExit = room.exits.find((x) => m.EXITS[x.direction] === dir);
    if (nextExit?.target) {
      nextID = nextExit.target;
    }
  }
  const nextRoom = m.MAP.rooms[nextID];
  if (!nextRoom?.environment) {
    return dir;
  }
  // Swim, if we have to
  if (
    nextRoom.environment === m.MAP_ENVS.water ||
    nextRoom.environment === m.MAP_ENVS.river ||
    nextRoom.environment === m.MAP_ENVS.freshwater ||
    room.environment === m.MAP_ENVS.water ||
    room.environment === m.MAP_ENVS.river ||
    room.environment === m.MAP_ENVS.freshwater
  ) {
    return `SWIM ${dir}`;
  }

  return dir;
}

//
// TODO: NEEDS TO HANDLE
// on the clouds / duanathar
// "Now now, don't be so hasty!"
// Sticky strands of webbing prevent you from moving.
// You slip and fall on the ice as you try to leave ??
// You stumble through the fog, attempting to find a way out.
// Some crazy fast river washing you away
// You sweep your trained eye across your surroundings, searching for hidden exits.
// You spot a hidden exit to the in.
//
const INTERVAL = 250;
const MAX_WAIT_TIME = 5000; // 5 seconds
//
// Public, external, high level auto-walker
//
export async function autoWalker(
  fromID: string,
  toID: string,
  { autoStart = true, type = '', explore = false, interval = INTERVAL, walkDelay = Config.WALK_DELAY } = {},
) {
  let walk = await innerWalker(fromID, toID, type, explore);
  if (!walk) return displayText('<i class="c-dim c-red"><b>[Path]</b>: No path was found!</i>');

  let intID: ReturnType<typeof setTimeout> | null = null;
  let timer = 0;

  const move = async () => {
    if (!walk) {
      walk = null;
      return pause();
    }
    if (!walk.curr().next) {
      setTimeout(() => {
        // Make sure to delete the Walker instance
        displayText('<b>[Path]</b>: You have arrived!');
        walk = null;
      }, INTERVAL * 2);
      return pause();
    }
    timer += INTERVAL;

    // If we are in the room the walker is expecting, move again
    //
    const currRoom = STATE.Room.num.toString();
    if (currRoom === walk.curr().uid) {
      const nextRoom = walk.next();
      if (nextRoom && nextRoom.dir) {
        timer = 0;
        await sleep(walkDelay);
        // "smart" logic to decide how to move into next room
        const move = smartMove(nextRoom.dir, currRoom, nextRoom.uid);
        return userText(move);
      } else {
        displayText('<i class="c-dim c-red"><b>[Path]</b>: Cannot move!</i>');
        return pause();
      }
    }

    // If we cannot move for a long time, abandon
    //
    if (timer >= MAX_WAIT_TIME) {
      displayText('<i class="c-dim c-red"><b>[Path]</b>: I\'m stuck! Walk aborted!</i>');
      return pause();
    }
  };

  // Is auto-move running ?
  const moving = () => !!intID;

  const pause = () => {
    if (intID) clearInterval(intID);
    intID = null;
    timer = MAX_WAIT_TIME;
  };

  const start = () => {
    if (intID) return;
    intID = setInterval(move, interval);
    timer = 0;
  };

  if (autoStart) {
    // Take the first step ...
    const nextRoom = walk.next();
    if (nextRoom && nextRoom.dir) {
      // "smart" logic to decide how to move into next room
      const move = smartMove(nextRoom.dir, STATE.Room.num.toString(), nextRoom.uid);
      userText(move);
      start();
    } else {
      displayText('<i class="c-dim c-red"><b>[Path]</b>: Cannot move! No path to destination!</i>');
      walk = null;
    }
  }

  // next, prev & path are found inside "walk"
  return { walk, start, pause, moving };
}

/*
 * Internal auto-walker, used in tests.
 * This can be used to walk from point to point,
 * or to explore the area starting from a point.
 */
export async function innerWalker(
  fromID: string,
  targetID: string,
  type: string = '',
  explore: boolean = false,
) {
  // Local area graph
  const room = m.MAP.rooms[fromID];
  if (!room) return null;
  const area = await mi.getArea(room.area, false);
  if (!area) return null;
  // If walk type is Global, use the big graph
  // Else, use a small graph of the local area
  const gr = type === 'g' || type === 'global' ? m.GRAPH : m.localGraph(area);
  let path = null;
  if (explore) {
    try {
      path = ex.exploreDirections(gr, fromID);
    } catch (err) {
      console.warn('Explore-walker error:', err);
      return null;
    }
  } else {
    try {
      path = walkDirections(gr, fromID, targetID);
    } catch (err) {
      console.warn('Inner-walker error:', err);
      return null;
    }
  }
  if (!path || !path.length) return null;

  let index = 0;
  // Current room ID
  const curr = () => {
    return path[index];
  };
  // Next room
  const next = () => {
    if (index === path.length - 1) return;
    index++;
    const { uid, prev } = path[index];
    return { uid, dir: prev };
  };
  // Previous room
  const prev = () => {
    if (index < 1) return;
    index--;
    const { uid, next } = path[index];
    return { uid, dir: REV_EXITS[next] || next };
  };
  return { path, curr, next, prev };
}

/*
 * Helper to convert walk IDs to map directions.
 */
export function walkDirections(graph, start: string, finish: string) {
  let index = 1;
  let prev = null;
  const directions = [];
  const walk = walkRooms(graph, start, finish);
  for (const uid of walk) {
    const nextID = walk[index];
    // Auto walking over
    if (!nextID) {
      directions.push({ uid, next: null, prev });
      break;
    }
    let found = null;
    const thisRoom = m.MAP.rooms[uid];
    for (const exit of thisRoom.exits) {
      const dir = exit.direction;
      if (exit.target === nextID) {
        found = { uid, next: m.EXITS[dir] || dir, prev };
        break;
      }
    }
    directions.push(found);
    prev = found.next;
    index++;
  }
  return directions;
}

/*
 * Adapted Dijkstra algorithm
 * Original author: Max Burstein (mburst)
 * https://github.com/mburst/dijkstras-algorithm
 */
export function walkRooms(graph, start: string, finish: string) {
  const distances = new Map();
  const previous = new Map();
  const nodes = new Heap({ compar: (a, b) => a.cost - b.cost });
  const vertices = graph.vertices as Map<string, Map<string, T.GraphEdge>>;

  for (const vertex of vertices.keys()) {
    if (vertex === start) {
      distances.set(vertex, 0);
      nodes.enqueue({ cost: 0, key: vertex });
    } else {
      distances.set(vertex, Infinity);
      nodes.enqueue({ cost: Infinity, key: vertex });
    }
  }

  let path = [];

  while (nodes.length > 0) {
    let smallest = nodes.dequeue().key;

    if (smallest === finish) {
      path = [];
      while (previous.get(smallest)) {
        path.push(smallest);
        smallest = previous.get(smallest);
      }
      break;
    }

    // All remaining vertices are inaccessible from source
    if (!smallest || distances.get(smallest) === Infinity) {
      continue;
    }

    // Look at all the nodes that this vertex is attached to
    for (const [neighbor, props] of vertices.get(smallest).entries()) {
      // Alternative path distance
      const alt = distances.get(smallest) + (props.cost || 1);
      // If there is a new shortest path update our priority queue (relax)
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, smallest);
        nodes.enqueue({ cost: alt, key: neighbor });
      }
    }
  } // --while

  previous.clear();
  distances.clear();
  return path.concat([start]).reverse();
}
