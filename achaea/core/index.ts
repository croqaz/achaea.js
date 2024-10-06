import ee from '../events/index.ts';

export { CITIES, CLASSES, HOUSES, RACES } from './common.ts';
export { HERBS, MATERIALS, MINERALS, RUNES, VENOMS } from './common.ts';
export { dateDiff, isoDate, sleep } from './util.ts';
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

export function displayNote(line: string) {
  // Display text in the communication panel
  // The text is NOT sent to the game
  // and is NOT persisted in the LOGS
  ee.emit('game:gmcp', `Comm.Channel.Text {"channel": "notes", "talker": "Scribe", "text": "${line}"}`);
}
