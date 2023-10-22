import Heap from 'qheap';

import * as T from './types.ts';
import * as m from './index.ts';
import { STATE } from '../core/state.ts';
import { userText, displayText, sleep } from '../core/index.ts';

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
  in: 'out',
  out: 'in',
});

// NEEDS TO HANDLE
// on the clouds / duanathar
// "Now now, don't be so hasty!"
// "You slip and fall on the ice as you try to leave ??
// Some fast river washing you away
// Special exits, need to twist/push/pull, or Say something
// You sweep your trained eye across your surroundings, searching for hidden exits.
// You spot a hidden exit to the in.
//
const INTERVAL = 250;
const WALK_DELAY = 0.5;
//
// This is a high level auto-walker
//
export async function autoWalker(
  fromID: string,
  toID: string,
  { type = null, autoStart = true, interval = INTERVAL, walkDelay = WALK_DELAY } = {},
) {
  let walk = await walkFromTo(fromID, toID, type);
  if (!walk) return displayText('<b>[Path]</b>: No path was found!');

  const MAX_TIME = 5000 / INTERVAL; // 5 seconds
  let intID = null;
  let timer = 0;

  const move = async () => {
    if (!walk) {
      return stop();
    }
    if (!walk.curr().next) {
      displayText('<b>[Path]</b>: You have arrived!');
      return stop();
    }
    timer++;

    // If we are in the room the walker is expecting, move again
    //
    const currentRoom = STATE.Room.num.toString();
    if (currentRoom === walk.curr().uid) {
      const nextRoom = walk.next();
      if (nextRoom && nextRoom.dir) {
        timer = 0;
        await sleep(walkDelay);
        return userText(nextRoom.dir);
      } else {
        displayText('<b>[Path]</b>: Cannot move!!');
        return stop();
      }
    }
    // If we cannot move for a long time, abandon
    //
    if (timer >= MAX_TIME) {
      displayText("<b>[Path]</b>: Couldn't move! Walk aborted!");
      return stop();
    }
  };

  // Is auto-move running ?
  const moving = () => !!intID;

  const stop = () => {
    if (intID) clearInterval(intID);
    intID = null;
    timer = MAX_TIME;
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
      userText(nextRoom.dir);
      start();
    } else {
      displayText('<b>[Path]</b>: Cannot move! No path!');
      walk = null;
    }
  }

  // next, prev & path are found inside "walk"
  return { walk, start, stop, moving };
}

export async function walkFromTo(fromID: string, targetID: string, type: string) {
  // Local area graph
  const room = m.MAP.rooms[fromID];
  if (!room) return null;
  const area = await m.getArea(room.area, false);
  if (!area) return null;
  // If walk type is Global, use the big graph
  // Else, use a small graph of the local area
  const gr = type === 'global' ? m.GRAPH : m.localGraph(area);
  let path = null;
  try {
    path = walkDirections(gr, fromID, targetID);
  } catch (err) {
    console.warn('Error in auto-walk:', err);
    return null;
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

export function walkDirections(graph, start: string, finish: string) {
  let index = 1;
  const directions = [];
  const walk = walkRooms(graph, start, finish);
  let prev = null;
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
        found = { uid, next: EXITS[dir] || dir, prev };
        break;
      }
    }
    directions.push(found);
    prev = found.next;
    index++;
  }
  return directions;
}

export function walkRooms(graph, start: string, finish: string) {
  // Adapted Dijkstra algorithm
  // https://github.com/mburst/dijkstras-algorithm
  // By Max Burstein (mburst)
  const distances = {};
  const previous = {};
  const nodes = new Heap({ compar: (a, b) => a.cost - b.cost });
  const vertices = graph.vertices as Record<string, T.GraphEdge>;

  for (const vertex of Object.keys(vertices)) {
    if (vertex === start) {
      distances[vertex] = 0;
      nodes.enqueue({ cost: 0, key: vertex });
    } else {
      distances[vertex] = Infinity;
      nodes.enqueue({ cost: Infinity, key: vertex });
    }
  }

  let path = [];

  while (nodes.length > 0) {
    let smallest = nodes.dequeue().key;

    if (smallest === finish) {
      path = [];

      while (previous[smallest]) {
        path.push(smallest);
        smallest = previous[smallest];
      }

      break;
    }

    // All remaining vertices are inaccessible from source
    if (!smallest || distances[smallest] === Infinity) {
      continue;
    }

    // Look at all the nodes that this vertex is attached to
    for (const [neighbor, props] of Object.entries(vertices[smallest])) {
      // Alternative path distance
      const alt = distances[smallest] + props.cost;
      // If there is a new shortest path update our priority queue (relax)
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = smallest;
        nodes.enqueue({ cost: alt, key: neighbor });
      }
    }
  } // --while

  return path.concat([start]).reverse();
}
