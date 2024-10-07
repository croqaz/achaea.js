import fs from 'node:fs';
import path from 'node:path';
import { appendFile } from 'node:fs';
import { isoDate } from '../core/util.ts';

let log: number = 0;

export function logSetup() {
  if (!fs.existsSync('./logs/')) {
    fs.mkdirSync('./logs/');
  }
  const logName = isoDate().replace(/:/g, '-') + '.htm';
  log = fs.openSync(path.join('./logs/', logName), 'w');
  fs.appendFileSync(log, '<body><pre>');
}

export function logDestroy() {
  fs.appendFileSync(log, '\n\n</pre></body>\n');
  fs.closeSync(log);
}

/*
 * Write some text in the LOG file
 * This is useful for later debug
 * The text is NOT sent to the game and
 * you can't see it in the interface
 */
export function logWrite(line: string) {
  if (!log) return;
  appendFile(log, line, (err: any) => {
    if (err) console.error('Cannot write to log!');
  });
}
