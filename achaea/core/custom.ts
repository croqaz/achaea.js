/*
 * The custom/ folder: the user's own aliases, triggers and classes, live reloaded while playing.
 *
 * Every file is loaded with its dependencies first, and the loader remembers two things per file:
 * which other custom files it imports, and which event listeners it registered while loading.
 * When a file is saved, the file AND every custom file that imports it (directly or not) are reloaded,
 * dependencies first: the importers must be evaluated again to see the new code, or they keep
 * using the old module instance forever (editing custom/runeward.ts changed nothing for
 * custom/multicls.ts and custom/input.ts, which import it).
 * Before a reload, the listeners of every affected file are removed, so nothing runs twice.
 *
 * The watcher reports in the notes panel: INFO when reloaded, ERROR when the file cannot be loaded,
 * WARN when the number of listeners is not the same after the reload (a listener registered later,
 * eg: in a timer, is not tracked and leaks).
 */
import path from 'node:path';
import fs from 'node:fs';
import ee from '../events/index.ts';
import chokidar from 'chokidar';
import { fileURLToPath } from 'node:url';

const dirName = path.dirname(fileURLToPath(import.meta.url));
export const CUSTOM_DIR = path.resolve(dirName, '../../custom');

const CODE = /\.(ts|js)$/;
// The ways a custom file can register a listener; they are tracked while the file loads
const REGISTER = ['on', 'addListener', 'once', 'prependListener', 'prependOnceListener'] as const;

export type Level = 'info' | 'warn' | 'error';
export type Log = (level: Level, text: string) => void;

interface CustomModule {
  // Absolute path
  file: string;
  // The custom files it imports, absolute paths
  deps: Set<string>;
  // The listeners registered while loading
  listeners: [string, (...args: any[]) => void][];
  // What the file exported
  exports: Record<string, any>;
}

// The default log: the console before the game starts, the notes panel while playing
function noteLog(level: Level, text: string): void {
  if (level === 'info') console.log(text);
  else console.warn(text);
  // The note is JSON text: no quotes, no newlines
  const safe = text.replace(/["\\]/g, "'").replace(/\s+/g, ' ');
  ee.emit(
    'game:gmcp',
    `Comm.Channel.Text {"channel": "notes", "talker": "Scribe", "text": "${level.toUpperCase()}: ${safe}"}`,
  );
}

export class CustomLoader {
  readonly dir: string;
  readonly modules = new Map<string, CustomModule>();
  private readonly log: Log;
  private watcher: ReturnType<typeof chokidar.watch> | null = null;

  constructor(dir: string, log: Log = noteLog) {
    this.dir = path.resolve(dir);
    this.log = log;
  }

  // The loaded files, relative to the folder
  get files(): string[] {
    return [...this.modules.keys()].map((f) => this.rel(f)).sort();
  }

  // The exports of a loaded file, eg: get('input.ts').default
  get(file: string): Record<string, any> | undefined {
    return this.modules.get(this.abs(file))?.exports;
  }

  // Load every code file of the folder, dependencies first
  loadAll(): void {
    if (!fs.existsSync(this.dir)) return;
    for (const name of fs.readdirSync(this.dir).sort()) {
      if (CODE.test(name)) this.load(name);
    }
  }

  // Watch the folder: new files are loaded, saved files are reloaded, deleted files are unloaded
  watch(): this {
    if (this.watcher) return this;
    this.watcher = chokidar.watch(this.dir, { depth: 1 });
    this.watcher.on('all', (event: string, file: string) => {
      if (!CODE.test(file)) return;
      if (event === 'add') this.load(file);
      else if (event === 'change') this.reload(file);
      else if (event === 'unlink') this.unload(file);
    });
    return this;
  }

  async close(): Promise<void> {
    await this.watcher?.close();
    this.watcher = null;
  }

  // Load a file, and its custom dependencies first; true when loaded, or already loaded
  load(file: string): boolean {
    file = this.abs(file);
    if (this.modules.has(file)) return true;
    try {
      this.loadDeep(file, new Set());
      return true;
    } catch (err) {
      this.log('error', `Cannot load custom file: ${this.rel(file)}! ${err}`);
      return false;
    }
  }

  /*
   * Reload a file and everything that imports it, dependencies first.
   * Returns the files reloaded, relative to the folder; empty when the file was not loaded.
   */
  reload(file: string): string[] {
    file = this.abs(file);
    if (!this.modules.has(file)) {
      this.load(file);
      return [];
    }
    const chain = this.affected(file);
    const before = this.listenerCount();
    for (const f of chain) this.release(f);
    const done: string[] = [];
    for (const f of chain) {
      try {
        this.loadDeep(f, new Set());
        done.push(this.rel(f));
      } catch (err) {
        this.log('error', `Cannot load custom file: ${this.rel(f)}! ${err}`);
        break;
      }
    }
    if (done.length) {
      const others = done.length > 1 ? ` (and ${done.slice(1).join(', ')})` : '';
      this.log('info', `Custom file RE-loaded: ${done[0]}${others}.`);
    }
    const after = this.listenerCount();
    if (done.length === chain.length && after !== before) {
      this.log('warn', `The reload changed the listeners: ${before} before, ${after} now!`);
    }
    return done;
  }

  // Forget a deleted file; its listeners are removed
  unload(file: string): void {
    file = this.abs(file);
    if (!this.modules.has(file)) return;
    this.release(file);
    this.log('info', `Custom file UN-loaded: ${this.rel(file)}.`);
  }

  /*
   * The file and all the files that import it, directly or not, in load order:
   * every file comes after the files it imports.
   */
  affected(file: string): string[] {
    file = this.abs(file);
    const set = new Set<string>([file]);
    // Everything that imports something in the set, until nothing new is found
    let grew = true;
    while (grew) {
      grew = false;
      for (const mod of this.modules.values()) {
        if (set.has(mod.file)) continue;
        for (const dep of mod.deps) {
          if (set.has(dep)) {
            set.add(mod.file);
            grew = true;
            break;
          }
        }
      }
    }
    // Dependencies first
    const order: string[] = [];
    const seen = new Set<string>();
    const visit = (f: string) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const dep of this.modules.get(f)?.deps || []) {
        if (set.has(dep)) visit(dep);
      }
      order.push(f);
    };
    for (const f of set) visit(f);
    return order;
  }

  //
  // Internals
  //

  private abs(file: string): string {
    return path.isAbsolute(file) ? file : path.resolve(this.dir, file);
  }

  private rel(file: string): string {
    return path.relative(this.dir, file);
  }

  private listenerCount(): number {
    let n = 0;
    for (const name of ee.eventNames()) n += ee.listenerCount(name);
    return n;
  }

  /*
   * Evaluate a file after all its custom dependencies, each one tracked on its own:
   * a dependency evaluated inside the require of its importer would have its listeners
   * attributed to the importer, and lose them when the importer is reloaded.
   */
  private loadDeep(file: string, loading: Set<string>): void {
    if (this.modules.has(file) || loading.has(file)) return;
    loading.add(file);
    for (const dep of this.scanDeps(file)) this.loadDeep(dep, loading);
    this.require(file);
  }

  // The custom files imported by a file: scanned from the source, no evaluation
  private scanDeps(file: string): Set<string> {
    const deps = new Set<string>();
    const source = fs.readFileSync(file, 'utf8');
    const loader = file.endsWith('.js') ? 'js' : 'ts';
    for (const imp of new Bun.Transpiler({ loader }).scanImports(source)) {
      if (!imp.path.startsWith('.')) continue;
      let dep = path.resolve(path.dirname(file), imp.path);
      if (!CODE.test(dep)) {
        if (fs.existsSync(dep + '.ts')) dep += '.ts';
        else if (fs.existsSync(dep + '.js')) dep += '.js';
        else continue;
      }
      // Only the files of the custom folder are reloaded
      if (dep.startsWith(this.dir + path.sep) && fs.existsSync(dep)) {
        deps.add(dep);
      }
    }
    return deps;
  }

  // Evaluate a file, remembering the listeners it registers; throws when the file is broken
  private require(file: string): CustomModule {
    const listeners: CustomModule['listeners'] = [];
    const saved: Record<string, { own: boolean; fn: any }> = {};
    for (const name of REGISTER) {
      const fn = ee[name];
      saved[name] = { own: Object.hasOwn(ee, name), fn };
      ee[name] = function (event: string, listener: any, ...rest: any[]) {
        listeners.push([event, listener]);
        return fn.call(ee, event, listener, ...rest);
      };
    }
    try {
      const exports = require(file);
      const mod = { file, deps: this.scanDeps(file), listeners, exports };
      this.modules.set(file, mod);
      console.log('Custom file loaded:', this.rel(file));
      return mod;
    } finally {
      for (const name of REGISTER) {
        if (saved[name].own) ee[name] = saved[name].fn;
        else delete ee[name];
      }
    }
  }

  // Remove the listeners of a file and forget it, so the next require evaluates it again
  private release(file: string): void {
    const mod = this.modules.get(file);
    if (!mod) return;
    for (const [event, fn] of mod.listeners) ee.off(event, fn);
    // The file may clean up after itself
    if (typeof mod.exports?.cleanup === 'function') {
      try {
        mod.exports.cleanup();
      } catch (err) {
        this.log('warn', `Cleanup crashed in ${this.rel(file)}: ${err}`);
      }
    }
    // Exported functions used as listeners, registered later than the load
    for (const value of Object.values(mod.exports || {})) {
      if (typeof value !== 'function') continue;
      for (const event of ee.eventNames()) {
        if (ee.listeners(event).includes(value)) ee.off(event, value);
      }
    }
    delete require.cache[file];
    this.modules.delete(file);
  }
}

//
// The user's custom folder, watched while the game runs
//

export const customLoader = new CustomLoader(CUSTOM_DIR).watch();

export function customUserInput() {
  return customLoader.get('input.ts')?.default;
}

export function customUserOutput() {
  return customLoader.get('output.ts')?.default;
}
