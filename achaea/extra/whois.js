import ee from '../events.js';
import * as p from '../parsers.js';
import { dateDiff, isoDate } from '../core/common.js';
import { dbGet, dbSave } from './leveldb.js';
import { parseQuickWho } from '../parsers.js';
import { STATE } from '../core/state.js';

export async function saveQuickWho(text) {
  /*
   * Save all players from quick-who
   */
  const names = parseQuickWho(text);
  if (names.length === 0) {
    console.error('Cannot parse text as QWHO!');
    return;
  }
  const dt = isoDate();
  let index = 0;
  for (let name of names) {
    name = name.toLowerCase();
    // Check the name in whois DB and compare old date
    try {
      const oldWhois = await dbGet('whois', name);
      if (oldWhois && dateDiff(oldWhois.dt, dt) < 48) {
        continue;
      } else if (oldWhois) {
        console.log(`Old whois data for "${name}": ${oldWhois.dt}. Refreshing...`);
      }
    } catch {
      // console.error('Cannot DB get', name);
    }
    const data = await fetchWhois(name);
    if (!data) continue;
    data.dt = dt;
    await dbSave('whois', data);
    index++;
  }
  console.log('Whois DB saved:', index);
}

export async function saveWhois(user) {
  /*
   * Update, or Create one player
   */
  user.id = user.name.toLowerCase();
  let oldWhois;
  try {
    oldWhois = await dbGet('whois', user.id);
    console.log('DB get player');
  } catch {
    oldWhois = await fetchWhois(user.id);
    console.log('Fetch player');
  }
  user.dt = isoDate();
  await dbSave('whois', { ...oldWhois, ...user });
  console.log('Whois DB updated:', user.id);
}

export async function fetchWhois(name) {
  try {
    const resp = await fetch(`https://api.achaea.com/characters/${name}.json`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const user = await resp.json();
    user.id = name;
    delete user.name;
    return user;
  } catch (err) {
    console.error('Fetch WHOIS failed for:', name);
  }
}

export function whoisTriggers(text) {
  const userInput = STATE.MUD.input.trim();

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
  if (STATE.MUD.whoisDB && userInput.startsWith('//')) {
    STATE.MUD.whoisDB = false;
    return saveQuickWho(text);
  }
}

ee.on('game:text', whoisTriggers);
