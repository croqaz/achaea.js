import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { dbSave } from './leveldb.ts';
import { logWrite } from '../logs/index.ts';
import { parseWares } from '../parsers.ts';
import { STATE } from '../core/state.ts';
import { isoDate } from '../core/util.ts';

export async function saveWares(text: string) {
  const dt = isoDate();
  let index = 0;
  const parsed = parseWares(text);
  if (!parsed || parsed.length === 0) return;
  for (const item of parsed) {
    item.roomID = STATE.Room.num;
    item.room = STATE.Room.name;
    item.area = STATE.Room.area;
    item.dt = dt;
    await dbSave('wares', item);
    index++;
  }
  ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> ${index} entries saved in WARES.</i>`);
}

export function waresTriggers(origText: string, normText: string) {
  const userInput = STATE.Custom.input.trim();

  // auto wares DB
  //
  if (
    STATE.Custom.waresDB &&
    (userInput === 'wares' || userInput === 'cart wares') &&
    (normText.includes('Proprietor:') || normText.includes('[File continued via MORE]'))
  ) {
    // try to find out the WARES proprietor, to enhance the wares DB
    if (p.isWaresHeader(origText)) {
      try {
        const { owner } = p.getWaresProprietor(origText);
        STATE.Room.owner = owner;
      } catch (err) {
        console.warn(`Cannot parse WARES proprietor! ${err}`);
      }
    }
    if (normText.includes('[Type MORE if you wish to continue reading.')) {
      ee.emit('user:text', 'more');
    } else {
      STATE.Custom.waresDB = false;
    }
    return saveWares(origText);
  }
}

// DON'T trigger this in TESTS!
if (process.env.NODE_ENV !== 'test') {
  ee.on('game:text', function () {
    try {
      waresTriggers.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] WARES trigger CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="ansi-dim ansi-red">${msg}</i>`);
      logWrite('\n' + msg + '\n');
    }
  });
}
