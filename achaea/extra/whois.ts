import * as T from '../types.ts';
import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { dateDiff, isoDate } from '../core/util.ts';
import { dbGet, dbSave } from './leveldb.ts';
import { parseQuickWho } from '../parsers.ts';
import { logWrite } from '../logs/index.ts';
import { STATE } from '../core/state.ts';

export function mergeWhois(oldWhois: T.DBPlayer, newWhois: T.DBPlayer): T.DBPlayer {
  const data = { ...oldWhois, ...newWhois };
  delete data.name;
  // Maintain all the player classes
  if (oldWhois && newWhois && oldWhois.class && newWhois.class && oldWhois.class !== newWhois.class) {
    if (typeof oldWhois.class === 'string') {
      oldWhois.class = oldWhois.class.toLowerCase();
      oldWhois.class = [...oldWhois.class.split(',')];
    }
    if (typeof newWhois.class === 'string') {
      newWhois.class = newWhois.class.toLowerCase();
      newWhois.class = [...newWhois.class.split(',')];
    }
    // class is an array
    data.class = [...new Set(oldWhois.class.concat(newWhois.class))];
  }
  // Maintain all the player races
  if (oldWhois && newWhois && oldWhois.race && newWhois.race && oldWhois.race !== newWhois.race) {
    if (typeof oldWhois.race === 'string') {
      oldWhois.race = oldWhois.race.toLowerCase();
      // @ts-ignore: Types
      oldWhois.race = [...oldWhois.race.split(',')];
    }
    if (typeof newWhois.race === 'string') {
      newWhois.race = newWhois.race.toLowerCase();
      // @ts-ignore: Types
      newWhois.race = [...newWhois.race.split(',')];
    }
    // race is a string
    data.race = [...new Set(oldWhois.race.concat(newWhois.race))].join(',');
  }
  return data;
}

export async function saveQuickWho(text: string) {
  /*
   * Save all players from quick-who
   */
  const names = parseQuickWho(text);
  if (!names || names.length === 0) {
    return ee.emit('sys:text', '<i class="c-red"><b>[DB]</b> Cannot parse text as QWHO!</i>');
  }
  const dt = isoDate();
  let index = 0;
  for (let name of names) {
    name = name.toLowerCase();
    // Check the name in whois DB and compare old date
    let oldWhois;
    try {
      oldWhois = await dbGet('whois', name);
      if (oldWhois && dateDiff(oldWhois.dt, dt) < 48) {
        continue;
      } else if (oldWhois) {
        const msg = `Old data for "${name}": ${oldWhois.dt}. Refreshing...`;
        ee.emit('sys:text', `<i class="c-darkGray"><b>[DB]</b> ${msg}</i>`);
      }
    } catch {
      /* -- */
    }
    const data = await fetchWhois(name);
    if (!data) continue;
    // @ts-ignore
    data.level = parseInt(data.level || '');
    if (Number.isNaN(data.level) || data.level < 10) continue;
    data.dt = dt;
    await dbSave('whois', mergeWhois(oldWhois, data));
    index++;
  }
  ee.emit('sys:text', `<i class="c-darkGray"><b>[DB]</b> ${index} entries saved in WHOIS.</i>`);
}

export async function saveWhois(user: T.DBPlayer) {
  /*
   * Update, or Create one player
   */
  user.id = user.name.toLowerCase();
  user.dt = isoDate();
  let whois: T.DBPlayer;
  try {
    const oldWhois = await dbGet('whois', user.id);
    whois = mergeWhois(oldWhois, user);
  } catch {
    const newWhois = await fetchWhois(user.id);
    whois = mergeWhois(user, newWhois);
  }
  // @ts-ignore
  whois.level = parseInt(whois.level || '');
  if (Number.isNaN(whois.level) || whois.level < 10) return;
  await dbSave('whois', whois);
  ee.emit('sys:text', `<i class="c-darkGray"><b>[DB]</b> ${user.id} updated in WHOIS.</i>`);
}

export async function fetchWhois(name: string): Promise<T.DBPlayer> {
  try {
    const resp = await fetch(`https://api.achaea.com/characters/${name}.json`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const user = (await resp.json()) as T.DBPlayer;
    user.id = name;
    return user;
  } catch {
    ee.emit('sys:text', `<i class="c-red"><b>[DB]</b> Cannot fetch WHOIS for: ${name}!</i>`);
  }
}

export async function fetchOnline(): Promise<string[]> {
  try {
    const resp = await fetch('https://api.achaea.com/characters.json', {
      headers: { 'Content-Type': 'application/json' },
    });
    const { count, characters } = await resp.json();
    // count is the actual number of players,
    // including hidden
    return characters.map((x) => x.name);
  } catch {
    ee.emit('sys:text', `<i class="c-red"><b>[DB]</b> Cannot fetch players list!</i>`);
    return [];
  }
}

export function whoisTriggers(origText: string, normText: string) {
  const userInput = STATE.Misc.input.trim();

  // try to parse Honours/ Whois, to enhance whois DB
  //
  if (
    (userInput.startsWith('honours ') || userInput.startsWith('whois ')) &&
    normText.includes('is considered to be approximately')
  ) {
    const user = p.parseHonours(origText);
    user.name = userInput.split(' ').filter((x) => !!x)[1];
    return saveWhois(user);
  }

  // auto whois DB
  //
  if (STATE.Misc.whoisDB && (userInput === 'bw' || userInput === 'qwho')) {
    STATE.Misc.whoisDB = false;
    return saveQuickWho(origText);
  }
}

// DON'T trigger this in TESTS!
if (process.env.NODE_ENV !== 'test') {
  ee.on('game:text', function () {
    try {
      whoisTriggers.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] WHOIS trigger CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="c-dim c-red">${msg}</i>`);
      logWrite('\n' + msg + '\n');
    }
  });
}
