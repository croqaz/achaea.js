import * as T from '../types.ts';
import ee from '../events/index.ts';
import { dbSave } from './leveldb.ts';
import { STATE } from '../core/state.ts';
import { isoDate } from '../core/util.ts';
import { logWrite } from '../logs/index.ts';

async function onRoomInfoUpdate(data: Record<string, string>) {
  if (!data.num || !data.name) return;

  const dt = isoDate();
  const room = {
    id: data.num,
    name: data.name,
    desc: data.desc,
    area: data.area, // GMCP area name, eg: Ashtan
    env: data.environment.toLowerCase(),
    dt,
  } as T.DBRoom;
  if (data.details && data.details.length) {
    room.features = data.details;
  }

  await dbSave('room', room);
}

async function onRoomItemsUpdate(data) {
  if (!data || data.length === 0) return;

  const room = STATE.Room;
  const dt = isoDate();

  for (const item of data) {
    item.id = parseInt(item.id);
    const prop = item.attrib || '';
    // Save denizens
    // Ignore dead corpses
    if (prop && prop.includes('m') && !prop.includes('d')) {
      await dbSave('denizen', { roomID: room.num, room: room.name, ...item, dt });
    }
    //
    // Save some items
    else {
      // Ignore normal city items
      if (item.icon === 'rune') continue;
      if (item.name === 'a sewer grate') continue;
      await dbSave('item', { roomID: room.num, room: room.name, ...item, dt });
    }
  }
}

// DON'T trigger this in TESTS!
if (process.env.NODE_ENV !== 'test') {
  ee.on('room:update', function () {
    try {
      onRoomInfoUpdate.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] ROOM INFO update CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="ansi-dim ansi-red">${msg}</i>`);
      logWrite('\n' + msg + '\n');
    }
  });

  ee.on('items:update', function () {
    try {
      onRoomItemsUpdate.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] ROOM ITEMS update CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="ansi-dim ansi-red">${msg}</i>`);
      logWrite('\n' + msg + '\n');
    }
  });
}
