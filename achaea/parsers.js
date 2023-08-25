import { STATE } from './core/state.js';
import { CITIES } from './core/common.js';

export function parseSurvey(text) {
  const parts = text.split('\n').filter((x) => !!x);
  let area = parts[0]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  if (area.startsWith('the ')) {
    area = area.slice(4);
  }
  const environment = parts[1]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  const plane = parts[2]
    .trim()
    .split(' ')
    .slice(4)
    .join(' ')
    .replace(/[ .]*$/, '');
  return { area, environment, plane };
}

export function isWaresHeader(text) {
  if (
    text.includes('Proprietor:') &&
    text.includes('(Item)------(Description)------------------------------(Stock)--(Price)')
  ) {
    return true;
  }
}

export function getWaresProprietor(text) {
  const parts = text.split('\n');
  const owner = parts[0].slice(12, -1).replace(/[ .]*$/, '');
  return { owner };
}

export function parseWares(text) {
  text = text.trim();
  if (!(text.startsWith('Proprietor:') || text.startsWith('[File continued via MORE]'))) {
    console.error('Cannot parse text as WARES!');
    return;
  }
  const parts = text.split('\n').filter((x) => !!x);
  const stateOwner = STATE.Location.owner;
  const lineOwner = parts[0].includes('File continued via MORE') ? parts[0].slice(12, -1).replace(/[ .]*$/, '') : null;
  const owner = stateOwner || lineOwner;
  const result = [];
  // id - description - stock - price
  const gpRe = /^[a-z]+\d+[ ][-a-z0-9;,() ]+\d+[ ]+\d+gp$/i;
  for (let line of parts) {
    line = line.trim();
    if (gpRe.test(line)) {
      const item = parseWaresLine(line);
      item.owner = owner;
      result.push(item);
    }
  }
  return result;
}

function parseWaresLine(line) {
  const parts = line.split(' ').filter((x) => !!x);
  const id = parts[0];
  const stock = parseInt(parts.at(-2));
  const price = parseInt(parts.at(-1));
  const descr = parts.slice(1, -2).join(' ');
  return { id, stock, price, descr };
}

export function parseQuickWho(text) {
  /*
   * Parse quick-who text
   */
  const lines = text.split('\n').filter((x) => !!x);
  const names = [];
  for (const line of lines) {
    for (let name of line.split(',')) {
      name = name.replace(/[\r .]*$/g, '');
      if (name.startsWith('and ')) {
        name = name.slice(4);
      }
      if (/^[A-Z][a-z]+$/.test(name)) {
        names.push(name);
      }
    }
  }
  return names;
}

export function parseHonours(text) {
  /*
   * Parse honours/ whois text
   */
  const lines = text.split('\n').filter((x) => !!x);
  const name = lines[0].replace(/[\r .]*$/, '');
  const sexRace = name.match(/\(([a-z]+) ([ 'a-z]+?)\)/i);
  let age = null;
  let city = '';
  let clss = '';
  for (const line of lines) {
    const parts = line.split(' ').filter((x) => !!x);
    if (line.includes('years old, having been born')) {
      age = parseInt(parts.at(2));
      continue;
    }
    if (line.includes(' is a member of the ')) {
      clss = parts.at(-2);
      continue;
    }
    if (line.includes('is a') && line.includes('in')) {
      const m = text.match(`[SHh]e is a.+ in (${CITIES.join('|')})`);
      if (m) {
        city = m[1];
      }
    }
  }
  return { fullname: name, age, city, class: clss, sex: sexRace[1], race: sexRace[2] };
}
