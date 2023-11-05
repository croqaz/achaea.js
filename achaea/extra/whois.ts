import * as T from '../types.ts';
import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { dateDiff, isoDate } from '../core/common.ts';
import { dbGet, dbSave } from './leveldb.ts';
import { parseQuickWho } from '../parsers.ts';
import { STATE } from '../core/state.ts';

export function mergeWhois(oldWhois: T.DBPlayer, newWhois: T.DBPlayer): T.DBPlayer {
  const data = { ...oldWhois, ...newWhois };
  delete data.name;
  // Maintain all the player classes
  if (oldWhois && newWhois && oldWhois.class && newWhois.class && oldWhois.class !== newWhois.class) {
    if (typeof oldWhois.class === 'string') oldWhois.class = [...oldWhois.class.split(',')];
    if (typeof newWhois.class === 'string') newWhois.class = [...newWhois.class.split(',')];
    oldWhois.class = oldWhois.class.map((x) => x.toLowerCase());
    newWhois.class = newWhois.class.map((x) => x.toLowerCase());
    data.class = oldWhois.class.concat(newWhois.class.filter((x) => oldWhois.class.indexOf(x) < 0));
  }
  return data;
}

export async function saveQuickWho(text: string) {
  /*
   * Save all players from quick-who
   */
  const names = parseQuickWho(text);
  if (!names || names.length === 0) {
    return ee.emit('sys:text', '<i class="ansi-red"><b>[DB]</b> Cannot parse text as QWHO!</i>');
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
        const msg = `Old whois data for "${name}": ${oldWhois.dt}. Refreshing...`;
        ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> ${msg}</i>`);
      }
    } catch {}
    const data = await fetchWhois(name);
    if (!data) continue;
    data.dt = dt;
    await dbSave('whois', mergeWhois(oldWhois, data));
    index++;
  }
  ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> ${index} entries saved in WHOIS.</i>`);
}

export async function saveWhois(user) {
  /*
   * Update, or Create one player
   */
  user.id = user.name.toLowerCase();
  user.dt = isoDate();
  let whois;
  try {
    const oldWhois = await dbGet('whois', user.id);
    whois = mergeWhois(oldWhois, user);
  } catch {
    const newWhois = await fetchWhois(user.id);
    whois = mergeWhois(user, newWhois);
  }
  await dbSave('whois', whois);
  ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> ${user.id} updated in WHOIS.</i>`);
}

export async function fetchWhois(name: string): Promise<T.DBPlayer> {
  try {
    const resp = await fetch(`https://api.achaea.com/characters/${name}.json`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const user = (await resp.json()) as T.DBPlayer;
    user.id = name;
    return user;
  } catch (err) {
    ee.emit('sys:text', `<i class="ansi-red"><b>[DB]</b> Fetch WHOIS failed for: ${name}!</i>`);
  }
}

export function whoisTriggers(text: string) {
  const userInput = STATE.Custom.input.trim();

  // try to parse Honours/ Whois, to enhance whois DB
  //
  if (
    (userInput.startsWith('honours ') || userInput.startsWith('whois ')) &&
    text.includes('is considered to be approximately')
  ) {
    const user = p.parseHonours(text);
    user.name = userInput.split(' ').filter((x) => !!x)[1];
    return saveWhois(user);
  }

  // auto whois DB
  //
  if (STATE.Custom.whoisDB && userInput.startsWith('qwho')) {
    STATE.Custom.whoisDB = false;
    return saveQuickWho(text);
  }
}

// DON'T trigger this in TESTS!
if (process.env.NODE_ENV !== 'test') {
  ee.on('game:text', function () {
    try {
      whoisTriggers.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] WHOIS trigger CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="ansi-dim ansi-red">${msg}</i>`);
      ee.emit('log:write', msg);
    }
  });
}
