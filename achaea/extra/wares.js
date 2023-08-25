import ee from '../events.js';
import * as p from '../parsers.js';
import { dbSave } from './leveldb.js';
import { parseWares } from '../parsers.js';
import { STATE, updateLocation } from '../core/state.js';

export async function saveWares(text) {
  const dt = new Date().toISOString().split('.')[0];
  let index = 0;
  for (const item of parseWares(text)) {
    item.roomNum = STATE.Location.num;
    item.room = STATE.Location.name;
    item.area = STATE.Location.area;
    item.dt = dt;
    await dbSave('wares', item);
    index++;
  }
  console.log('Wares DB saved', index);
}

export function waresTriggers(text) {
  const userInput = STATE.MUD.input.trim();

  // auto wares DB
  //
  if (
    STATE.MUD.waresDB &&
    userInput.startsWith('//') &&
    (text.includes('Proprietor:') || text.includes('[File continued via MORE]'))
  ) {
    // try to find out the WARES proprietor, to enhance the wares DB
    if (p.isWaresHeader(text)) {
      updateLocation(p.getWaresProprietor(text));
    }
    if (text.includes('[Type MORE if you wish to continue reading.')) {
      ee.emit('user:text', 'more');
    } else {
      STATE.MUD.waresDB = false;
    }
    return saveWares(text);
  }
}

ee.on('game:text', waresTriggers);
