import fs from 'node:fs';
import path from 'node:path';
import { appendFile } from 'node:fs';
import { isoDate } from '../core/util.ts';

let log: number = 0;
let syncWrites = false;

/*
 * Open the log file; by default ./logs/<date>.htm, written asynchronously.
 * A replay (scripts/debug2log.ts) gives its own file name and sync=true,
 * so the lines land in the file in the exact order they are written.
 */
export function logSetup(fname = '', sync = false): string {
  if (!fname) {
    if (!fs.existsSync('./logs/')) {
      fs.mkdirSync('./logs/');
    }
    const logName = isoDate().replace(/:/g, '-') + '.htm';
    fname = path.join('./logs/', logName);
  }
  syncWrites = sync;
  log = fs.openSync(fname, 'w');
  fs.appendFileSync(log, '<body><pre>');
  return fname;
}

export function logDestroy() {
  if (!log) return;
  fs.appendFileSync(log, '\n\n</pre></body>\n');
  fs.closeSync(log);
  log = 0;
}

/*
 * Write some text in the LOG file
 * This is useful for later debug
 * The text is NOT sent to the game and
 * you can't see it in the interface
 */
export function logWrite(line: string) {
  if (!log) return;
  if (syncWrites) {
    fs.appendFileSync(log, line);
    return;
  }
  appendFile(log, line, (err: any) => {
    if (err) console.error('Cannot write to log!');
  });
}
