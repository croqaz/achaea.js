import fs from 'node:fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const dirName = dirname(fileURLToPath(import.meta.url));
export const MAP = JSON.parse(fs.readFileSync(dirName + '/map.json'));

export function getRoom(uid) {
  const room = MAP.rooms[uid];
  if (!room || !room.title) {
    return null;
  }
  if (room.area && MAP.areas[room.area]) {
    room.area = { id: room.area, ...MAP.areas[room.area] };
  }
  if (room.environment && MAP.environments[room.environment]) {
    room.environment = { id: room.environment, ...MAP.environments[room.environment] };
  }
  return room;
}

export function findArea(str) {
  /*
   * Try to find an area by name.
   */
  return objectIncludesMatch(str, MAP.areas);
}

export function findEnvironment(str) {
  /*
   * Try to find an environment by name.
   */
  return objectIncludesMatch(str, MAP.environments);
}

function objectIncludesMatch(str, thing) {
  /*
   * Try to find an area by name.
   */
  str = str.toLowerCase();
  const results = [];
  for (const [uid, val] of Object.entries(thing)) {
    if (val.name.toLowerCase().includes(str)) {
      results.push({ id: uid, ...val });
    }
  }
  return results;
}
