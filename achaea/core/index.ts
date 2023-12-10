import ee from '../events/index.ts';

export { CITIES, HOUSES, CLASSES, RACES } from './common.ts';
export { VENOMS, RUNES, HERBS, MINERALS, MATERIALS } from './common.ts';
export { sleep, isoDate, dateDiff } from './util.ts';
export { logWrite } from '../logs/index.ts';

export function userText(line: string) {
  // Send a user command to the game
  // It is written in the Achaea Telnet connection
  // and also persisted in the LOGS
  ee.emit('user:text', line);
}

export function displayText(line: string) {
  // Display some text in the interface
  // The text is NOT sent to the game
  // and is NOT persisted in the LOGS
  ee.emit('sys:text', line);
}
