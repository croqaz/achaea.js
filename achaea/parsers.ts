// deno-lint-ignore-file no-explicit-any
import * as T from './types.ts';
import { Config } from './config.ts';
import { STATE } from './core/state.ts';
import { CITIES, HERBS, MATERIALS, MINERALS } from './core/common.ts';

export function parseSurvey(text: string): Record<string, any> | null {
  if (!text.includes('You discern that you are in ')) return null;
  if (!text.includes('You are in the ')) return null;
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
  const influence = parts
    .at(-1)
    .trim()
    .split(' ')
    .slice(9)
    .join(' ')
    .replace(/[ .]*$/, '');
  return { area, environment, plane, influence };
}

export function validRoomInfo(text: string): Record<string, any> | null {
  /*
   * Validate room title, description and features.
   */
  if (text.includes('>You see exits leading<') && text.includes(' and ')) {
    return null;
  } else if (text.includes('>You see a single exit leading<')) {
    return null;
  }
  const parts = text.trim().split('\n');
  if (parts.length < 2 || parts.length > 3) return null;
  let title = parts.at(-2).replace(/\r$/, '');
  if (!title.includes('.</span><span')) return null;
  let description = parts.at(-1).trim();
  if (!(description.endsWith('.') || description.includes('.</span><span'))) return null;
  description = description.replaceAll('</span>', '').replace(/<span class="[a-zA-Z -]+">/g, '');

  const features = [];
  if (description.includes('The area is ablaze!')) {
    features.push('fire');
  }
  if (
    description.includes('A small wooden sign is here.') ||
    description.includes('A sign here suggests you READ SIGN!') ||
    description.includes('A small wooden sign is nailed crookedly to a post here.')
  ) {
    features.push('sign');
  }
  if (description.includes('Lying flat on the ground is a key-shaped sigil.')) features.push('key-sigil');
  if (
    description.includes('A runic totem is planted in the ground.') ||
    description.includes('A runic totem is planted solidly in the ground.')
  ) {
    features.push('totem');
  }
  if (description.includes('A sigil in the shape of a small, rectangular monolith is on the ground.')) {
    features.push('monolith');
  }
  if (description.includes('A furry little humgii sits here, a hungry expression in his wide eyes.')) {
    features.push('humgii');
  }
  if (description.includes('The entry to a mine looms here, its great arched doorway worked in grey stone.')) {
    features.push('mine');
  }
  if (description.includes('Vines have overtaken this location.')) features.push('vines');
  if (
    description.includes('A large beehive hangs down from the trees above.') ||
    description.includes('A mighty earth golem stands guard here.')
  ) {
    features.push('grove');
  }

  // Walls
  if (description.includes('A scorching wall of fire stands here, blocking passage to ')) {
    features.push('fireWall');
  }
  if (description.includes('An icewall is here, blocking passage to ')) {
    features.push('iceWall');
  }
  if (description.includes('A large wall of stone stands here, blocking passage to ')) {
    features.push('stoneWall');
  }
  if (description.includes('A large wall of thorns stands here, barring passage to ')) {
    features.push('thornWall');
  }

  // City influences
  if (description.includes('Crackling ozone heralds warp-touched mirage, their coming the advent of change.')) {
    features.push('Ashtan');
  } else if (description.includes('Bound in ice, draconic tracks scribe a glittering path across the earth.')) {
    features.push('Cyrene');
  } else if (
    description.includes(`Nature's fecundity floods the surrounds with the clamour of life in a chittering refrain.`)
  ) {
    features.push('Eleusis');
  } else if (description.includes('Lines of leaden shadow coil underfoot, turning earth to metal by alchemical writ.')) {
    features.push('Hashan');
  } else if (
    description.includes('Radiant light joins with calescent heat, suffusing the area with a harsh, blinding mien.')
  ) {
    features.push('Targossas');
  } else if (description.includes('A noxious, red-hued fog overwhelms the area with a thick, palpable vapour.')) {
    features.push('Mhaldor');
  }

  if (features.length) {
    title = title.replaceAll('</span>', '').replace(/<span class="[a-zA-Z -]+">/g, '');
    title = title.replace('. (', ' (').replace(/\.$/, '');
    return { title, description, features };
  }
  return null;
}

export function validWildMap(text: string): string[] | null {
  /*
   * Validate wilderness maps.
   */
  const parts = text.trim().split('\n');
  if (parts.length < 8) return null;
  const title = parts[0].replace(/\r$/, '');
  if (!(title.endsWith('.') || title.includes('.</span><span'))) return null;
  const re = /^[ #&%!?*';,.\/;@IMXYjnw\\|\+\-~^]+\r?$/;
  const map = [];
  const desc = [parts.shift()];
  if (
    title === 'You enter the subdivision.' ||
    title.startsWith('You begin to flap your wings powerfully,') ||
    title.endsWith('You land easily, back on the ground again.')
  ) {
    desc.push(parts.shift());
  }
  let len = 0;
  for (const line of parts) {
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

function parseWaresLine(line: string): T.DBWares {
  const parts = line.split(' ').filter((x) => !!x);
  const id = parts[0];
  const stock = parseInt(parts.at(-2));
  const price = parseInt(parts.at(-1));
  const name = parts.slice(1, -2).join(' ');
  return { id, stock, price, name, owner: '' };
}

export function parseElixList(text: string): Record<string, any>[] {
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
  const result = { id: null, fullname: name, city: '', class: '' };
  for (const line of lines) {
    const parts = line.split(' ').filter((x) => !!x);
    if (line.includes('years old, having been born')) {
      result.age = parseInt(parts.at(2));
      continue;
    }
    if (line.includes('is a member of the Ivory Mark.')) {
      result.mark = 'Ivory Mark';
      continue;
    } else if (line.includes('is a member of the Quisalis Mark.')) {
      result.mark = 'Quisalis Mark';
      continue;
    }
    if (line.includes('class.') && line.includes(' is a member of the ')) {
      result.class = parts.at(-2);
      continue;
    }
    if (line.includes('is a') && line.includes('in')) {
      const m = text.match(`[SHFah]e is a.+ in (${CITIES.join('|')})`);
      if (m) {
        result.city = m[1];
      }
    }
  }
  if (sexRace) {
    result.sex = sexRace[1];
    result.race = sexRace[2];
  }
  return result;
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
