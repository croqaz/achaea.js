// deno-lint-ignore-file no-explicit-any
import chokidar from 'chokidar';
import ee from '../events/index.ts';
import { debounce } from './util.ts';

const eventTree: Record<string, number> = {};

const fileWatcher = chokidar.watch('./custom/', { depth: 1 });

/*
 * Watch for changes in Custom folder and live reload.
 */
fileWatcher.on('all', (event: string, path: string) => {
  if (event === 'add') {
    try {
      require('../../' + path);
      console.log('Custom file loaded:', path);
      syncEventTree();
    } catch (err) {
      console.warn(`Cannot load custom file: ${path}! ${err}`);
    }
  } else if (event === 'change') {
    const re = new RegExp(`/${path}$`);
    for (const m of Object.keys(require.cache)) {
      if (re.test(m)) {
        const custMod = require('../../' + path);
        // take #1 - call the cleanup function
        if (custMod.cleanup) {
          custMod.cleanup();
        }
        // take #2 - unregister all exposed functions
        for (const exported of Object.keys(custMod)) {
          if (typeof custMod[exported] !== 'function') continue;
          unRegister(custMod[exported]);
        }
        delete require.cache[m];
      }
    }
    try {
      require('../../' + path);
      ee.emit(
        'game:gmcp',
        `Comm.Channel.Text {"channel": "notes", "talker": "Scribe",
        "text": "INFO: Custom file RE-loaded: ${path}."}`,
      );
      checkEventTree(path);
    } catch (err) {
      ee.emit(
        'game:gmcp',
        `Comm.Channel.Text {"channel": "notes", "talker": "Scribe",
        "text": "ERROR: Cannot load custom file: ${path}! ${err}"}`,
      );
    }
  }
});

export function customUserInput() {
  try {
    const mod = require('../../custom/input.ts');
    return mod.default;
  } catch {
    /* -- */
  }
}

export function customUserOutput() {
  try {
    const mod = require('../../custom/output.ts');
    return mod.default;
  } catch {
    /* -- */
  }
}

function unRegister(fn: any) {
  // @ts-ignore: Types
  for (let [name, obj] of Object.entries(ee.events)) {
    if (!obj) continue;
    if (!Array.isArray(obj)) obj = [obj];
    for (const ev of obj as any[]) {
      if (fn === ev.fn) {
        // console.log('UN-registered event:', name, ev.fn);
        ee.off(name, ev.fn);
        // don't break
      }
    }
  }
}

function __syncEventTree() {
  // @ts-ignore: Types
  for (const name of ee.eventNames()) {
    eventTree[name.toString()] = ee.listenerCount(name) || 0;
  }
}

export const syncEventTree = debounce(__syncEventTree, 2500, false);

function __checkEventTree(path: string) {
  // @ts-ignore: Types
  const eventNames = new Set([...Object.keys(eventTree), ...ee.eventNames()]);
  for (const n of eventNames) {
    const count = ee.listenerCount(n) || 0;
    if (eventTree[n] !== count) {
      ee.emit(
        'game:gmcp',
        `Comm.Channel.Text {"channel": "notes", "talker": "Scribe",
          "text": "WARN: Event '${n}' in file '${path}' had ${
            eventTree[n] || 0
          } hooks, now it has ${count} !!"}`,
      );
      eventTree[n] = count;
    }
  }
}

export const checkEventTree = debounce(__checkEventTree, 1000, false);
