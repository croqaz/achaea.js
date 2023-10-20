import ee from '../events/index.ts';

export { sleep, CITIES, HOUSES, CLASSES, RACES } from './common.js';
export { VENOMS, RUNES, HERBS, MINERALS, MATERIALS } from './common.js';

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

export function logText(line: string) {
  // Write some text in the LOG file
  // This is useful for later debug
  // The text is NOT sent to the game and
  // you can't see it in the interface
  ee.emit('log:write', line);
}
