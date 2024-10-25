// deno-lint-ignore-file
import * as map from './map.js';

window.AREA = { rooms: {} };
window.ROOM = { id: 0, level: 0, items: [], players: [] };

await map.fetchMap({ room: { area: 57 } });
map.drawMap();
