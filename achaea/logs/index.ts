import fs from 'node:fs';
import { isoDate } from '../core/util.ts';

let log = null;

export function logSetup() {
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
  log = fs.createWriteStream('./logs/' + isoDate() + '.htm');
  log.write('<body><pre>');
}

export function logDestroy() {
  log.write('\n\n</pre></body>');
  log.destroy();
}

/*
 * Write some text in the LOG file
 * This is useful for later debug
 * The text is NOT sent to the game and
 * you can't see it in the interface
 */
export function logWrite(line: string) {
  if (!log) return;
  log.write(line);
}
