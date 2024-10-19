import * as T from './types.ts';
import { STATE } from './core/state.ts';
import { Config } from './extra/config.ts';
import { CITIES, HERBS, MATERIALS, MINERALS } from './core/common.ts';

export function parseSurvey(text: string) {
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

export function validWildMap(text: string): string[] | null {
  /*
   * Validate wilderness maps.
   */
  const parts = text.trim().split('\n');
  if (parts.length < 8) return null;
  const title = parts[0].replace(/\r$/, '');
  if (!(title.endsWith('.') || parts[0].includes('.</span><span'))) return null;
  const re = /^[ #&%?*';,.\/;@MXYjnw\\|\+\-~^]+\r?$/;
  let map = [];
  let desc = [parts.shift()];
  if (
    title === 'You enter the subdivision.' ||
    title.startsWith('You begin to flap your wings powerfully,') ||
    title.endsWith('You land easily, back on the ground again.')
  ) {
    desc.push(parts.shift());
  }
  let len = 0;
  for (let line of parts) {
    // all map lines must have the same length,
    // and must have the correct ASCII letters
    const txt = line
      .replace(/\r$/, '')
      .replaceAll('</span>', '')
      .replace(/<span class="[a-zA-Z -]+">/g, '');
    if (len === 0 && txt.length < 60 && re.test(txt)) len = txt.length;
    if (txt.length === len && txt.length < 60 && re.test(txt)) map.push(line);
    else desc.push(line);
  }
  if (map.length >= 8 && desc.length > 0) return [map.join('\n'), desc.join('\n')];
  return null;
}

export function isWaresHeader(text: string): boolean {
  if (
    text.includes('Proprietor:') &&
    text.includes('(Item)------(Description)------------------------------(Stock)--(Price)')
  ) {
    return true;
  }
  return false;
}

export function getWaresProprietor(text: string) {
  const parts = text.split('\n');
  const owner = parts[0].slice(12, -1).replace(/[ .]*$/, '');
  return { owner };
}

export function parseWares(text: string): T.DBWares[] {
  text = text.trim();
  if (!(text.startsWith('Proprietor:') || text.startsWith('[File continued via MORE]'))) {
    console.error('Cannot parse text as WARES!');
    return [];
  }
  const parts = text.split('\n').filter((x) => !!x);
  const stateOwner = STATE.Room.owner;
  const lineOwner = parts[0].includes('File continued via MORE')
    ? parts[0].slice(12, -1).replace(/[ .]*$/, '')
    : null;
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

function parseWaresLine(line: string): T.DBWares {
  const parts = line.split(' ').filter((x) => !!x);
  const id = parts[0];
  const stock = parseInt(parts.at(-2));
  const price = parseInt(parts.at(-1));
  const name = parts.slice(1, -2).join(' ');
  return { id, stock, price, name, owner: '' };
}

export function parseElixList(text: string): any[] {
  const lines = text.split('\n').filter((x) => !!x);
  if (lines.length < 3 || !lines[1].includes('-------')) return [];
  const head1 = /Vial[ ]+Fluid[ ]+Sips[ ]+Months/;
  if (!head1.test(lines[0])) return [];

  const elixlist = [];
  for (const line of lines) {
    const m = line.match(/^([a-z0-9' -]+?)[ ]+(an? [a-z0-9 ]+?)[ ]+(\d+)/i);
    if (m && m[1] && m[2] && m[3]) {
      const fluid = m[2];
      let m2 = fluid.match(/^an? (?:elixir|salve) of ([a-z]+)/);
      let type = null;
      if (m2 && m2[1]) {
        type = m2[1];
      }
      if (!type) {
        m2 = fluid.match(/^an? ([a-z]+) salve/);
        if (m2 && m2[1]) {
          type = m2[1];
        }
      }
      elixlist.push({
        vial: m[1],
        fluid,
        type,
        sips: parseInt(m[3]),
      });
    }
  }
  return elixlist;
}

export function parseQuickWho(text: string): string[] {
  /*
   * Parse quick-who text
   */
  const lines = text.split('\n').filter((x) => !!x);
  const names = [];
  for (const line of lines) {
    for (let name of line.split(',')) {
      name = name.trim().replace(/[.]*$/g, '');
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

export function parseHonours(text: string): T.DBPlayer {
  /*
   * Parse honours/ whois text
   */
  const lines = text.split('\n').filter((x) => !!x);
  let name = lines[0].replace(/[\r .]*$/, '');
  const sexRace = name.match(/\(([a-z]+) ([ 'a-z]+?)\)/i);
  name = name.replace(/ \(.+?\)$/, '');
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
      const m = text.match(`[SHFah]e is a.+ in (${CITIES.join('|')})`);
      if (m) {
        city = m[1];
      }
    }
  }
  let sex = null;
  let race = null;
  if (sexRace) {
    sex = sexRace[1];
    race = sexRace[2];
  }
  return { id: null, fullname: name, age, city, class: clss, sex, race };
}

const EXTRACT_MINERALS = Object.keys(MINERALS).filter((x) => !Config.EXCLUDE_MINERALS.includes(x));
// Ignore some plants from config
const HARVEST_PLANTS = Object.keys(HERBS).filter((x) => !Config.EXCLUDE_HERBS.includes(x));
// Ignore some gathering materials
const GATHER_MATERIALS = Object.keys(MATERIALS).filter((x) => !Config.EXCLUDE_MATERIAL.includes(x));

export function parseMinerals(text: string) {
  if (!text.includes('You spot the following minerals here')) {
    return;
  }
  const regex = /^([a-z]+)[ ]+([a-z]+)$/i;
  const lines = text.split('\n').filter((x) => !!x);
  const goodies = { extract: [] };
  for (const line of lines) {
    const m = line.trim().match(regex);
    if (m) {
      const stuff = m[1].toLowerCase();
      // ignore quantity for now
      if (EXTRACT_MINERALS.includes(stuff)) goodies.extract.push(stuff);
      else {
        console.warn(`Unknown gatherable: ${stuff}! Not sure what to do with it!`);
      }
    }
  }
  return goodies;
}

export function parsePlants(text: string) {
  if (!text.includes('The following plants are growing in this room')) {
    return;
  }
  const regex = /^.+?\(([a-z]+)\)[ ]+([a-z]+)$/i;
  const lines = text.split('\n').filter((x) => !!x);
  const goodies = { gather: [], harvest: [] };
  for (const line of lines) {
    const m = line.trim().match(regex);
    if (m) {
      const plant = m[1];
      // ignore quantity for now
      if (HARVEST_PLANTS.includes(plant)) goodies.harvest.push(plant);
      else if (GATHER_MATERIALS.includes(plant)) goodies.gather.push(plant);
      else {
        console.warn(`Unknown gatherable: ${plant}! Not sure what to do with it!`);
      }
    }
  }
  return goodies;
}
